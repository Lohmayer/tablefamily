/* Vista de acceso: los datos y las reglas viven en servicios/ y validaciones/. */
import { iniciarSesion } from './servicios/sesion.js';
import { registrarUsuario } from './servicios/usuarios.js';
import { datosFormulario, erroresFormulario, mostrarErrores, actualizarEstadoRegistro, limpiarEstado } from './vistas/formularios.js';

const raiz = new URL('../', import.meta.url);
function cambiarVista(vista) {
    const modal = document.getElementById('modal-acceso');
    if (!modal) return;
    for (const nombre of ['login', 'registro', 'recuperacion']) {
        modal.querySelector('#form-' + nombre).hidden = nombre !== vista;
    }
    modal.querySelector('#titulo-acceso').textContent = {
        login: 'Iniciar sesión', registro: 'Abrir cuenta', recuperacion: 'Recuperar contraseña'
    }[vista];
    modal.querySelectorAll('[data-vista-acceso]').forEach(boton => {
        const activo = boton.dataset.vistaAcceso === vista;
        boton.classList.toggle('seleccionada', activo);
        if (boton.hasAttribute('aria-pressed')) boton.setAttribute('aria-pressed', String(activo));
    });
    modal.querySelector('.modal-body').scrollTop = 0;
    actualizarEstadoRegistro();
    bootstrap.Modal.getInstance(modal)?.handleUpdate();
}
function prepararModal() {
    const modal = document.getElementById('modal-acceso');
    if (!modal) return;
    actualizarEstadoRegistro();
    if (modal.dataset.preparado) return;
    modal.dataset.preparado = 'true';
    modal.addEventListener('shown.bs.modal', () => {
        modal.querySelector('form:not([hidden]) input')?.focus();
        actualizarEstadoRegistro();
    });
    modal.addEventListener('hidden.bs.modal', () => {
        modal.querySelectorAll('form').forEach(form => form.reset());
        document.querySelector('[data-abrir-acceso]:not([hidden])')?.focus();
    });
}
document.addEventListener('componentes:listos', prepararModal);
prepararModal();
document.addEventListener('click', evento => {
    if (evento.target.closest('[data-abrir-acceso]')) {
        prepararModal();
        cambiarVista('login');
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modal-acceso')).show();
        return;
    }
    const opcion = evento.target.closest('[data-vista-acceso]');
    if (opcion) cambiarVista(opcion.dataset.vistaAcceso);
    const demo = evento.target.closest('[data-cuenta-demo]');
    if (demo) {
        document.getElementById('login-usuario').value = demo.dataset.cuentaDemo;
        document.getElementById('login-clave').value = demo.dataset.cuentaDemo === 'admin' ? 'Admin123' : 'Cliente123';
    }
});
document.addEventListener('submit', async evento => {
    const form = evento.target;
    if (!form.matches('#form-login, #form-registro, #form-recuperacion')) return;
    evento.preventDefault();
    if (form.dataset.enviando === 'true') return;
    form.dataset.validado = 'true';
    const errores = erroresFormulario(form);
    mostrarErrores(form, errores);
    const salida = form.querySelector('.acceso-resultado');
    salida.classList.remove('text-danger');
    if (Object.keys(errores).length) {
        salida.textContent = 'Completa correctamente los campos indicados.';
        form.querySelector('.is-invalid')?.focus();
        actualizarEstadoRegistro();
        return;
    }
    const boton = form.querySelector('[type="submit"]');
    form.dataset.enviando = 'true';
    boton.disabled = true;
    try {
        const datos = datosFormulario(form);
        if (form.id === 'form-login') {
            const cuenta = await iniciarSesion(datos.usuario, datos.clave);
            bootstrap.Modal.getInstance(document.getElementById('modal-acceso'))?.hide();
            const destinoCliente = { carrito: 'paginas/carrito.html', compras: 'paginas/compras.html' }[document.body.dataset.pagina] ?? 'paginas/perfil.html';
            location.assign(new URL(cuenta.rol === 'administrador' ? 'paginas/administracion.html' : destinoCliente, raiz));
        } else if (form.id === 'form-registro') {
            const cuenta = await registrarUsuario(datos);
            form.reset();
            cambiarVista('login');
            document.getElementById('login-usuario').value = cuenta.usuario;
            document.querySelector('#form-login .acceso-resultado').textContent = 'Cuenta de demostración creada. Ya puedes iniciar sesión con tu contraseña.';
        } else {
            salida.textContent = 'Solicitud de recuperación validada. En una aplicación real recibirías las instrucciones si el correo está registrado. Esta demostración no envía correos.';
        }
    } catch (error) {
        salida.classList.add('text-danger');
        salida.textContent = error.message;
    } finally {
        delete form.dataset.enviando;
        boton.disabled = false;
        actualizarEstadoRegistro();
    }
});
function procesarCambio(evento) {
    const campo = evento.target;
    if (!campo.matches('.form-acceso input')) return;
    const form = campo.form;
    form.querySelector('.acceso-resultado').textContent = '';
    form.querySelector('.acceso-resultado').classList.remove('text-danger');
    if (form.id === 'form-registro') actualizarEstadoRegistro();
    if (form.dataset.validado) mostrarErrores(form, erroresFormulario(form));
}
document.addEventListener('input', procesarCambio);
document.addEventListener('change', procesarCambio);
document.addEventListener('reset', evento => {
    const form = evento.target;
    if (!form.matches('.form-acceso')) return;
    limpiarEstado(form);
    if (form.id === 'form-registro') form.querySelector('[type="submit"]').disabled = true;
    requestAnimationFrame(actualizarEstadoRegistro);
});
