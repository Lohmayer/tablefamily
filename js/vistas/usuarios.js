import { obtenerSesion } from '../servicios/sesion.js';
import { listarCuentas, editarCliente, cambiarEstadoCliente } from '../servicios/administracion-usuarios.js';
import { validarPerfil } from '../validaciones/formularios.js';
import { mostrarErrores, datosFormulario } from './formularios.js';

const tabla = document.getElementById('tabla-usuarios');
const form = document.getElementById('form-usuario-admin');
let editando = null;
let pendiente = null;
let ultimoBoton = null;
function aviso(texto, error = false) {
    const salida = document.getElementById('resultado-usuarios');
    salida.textContent = texto;
    salida.classList.toggle('text-danger', error);
}
export function mostrarUsuarios() {
    if (!tabla) return;
    tabla.replaceChildren();
    if (obtenerSesion()?.rol !== 'administrador') return;
    const cuentas = listarCuentas();
    document.getElementById('total-usuarios').textContent = cuentas.length;
    for (const cuenta of cuentas) {
        const fila = document.createElement('tr');
        fila.dataset.usuarioId = cuenta.id;
        for (const valor of [cuenta.nombre, cuenta.usuario, cuenta.correo, cuenta.rol, cuenta.activo ? 'Activo' : 'Inactivo']) {
            const td = document.createElement('td');
            td.textContent = valor;
            fila.append(td);
        }
        const acciones = document.createElement('td');
        if (cuenta.rol === 'cliente') {
            const grupo = document.createElement('div');
            grupo.className = 'acciones-producto';
            for (const [accion, texto] of [['editarCliente', 'Editar'], ['estadoCliente', cuenta.activo ? 'Desactivar' : 'Activar']]) {
                const boton = document.createElement('button');
                boton.type = 'button';
                boton.className = 'btn btn-sm acceso-limpiar';
                boton.dataset[accion] = cuenta.id;
                boton.textContent = texto;
                boton.setAttribute('aria-label', texto + ' ' + cuenta.usuario);
                grupo.append(boton);
            }
            acciones.append(grupo);
        } else acciones.textContent = 'Administrador';
        fila.append(acciones);
        tabla.append(fila);
    }
}
function validarEditor() {
    const errores = validarPerfil(datosFormulario(form));
    mostrarErrores(form, errores);
    return errores;
}
if (tabla && form) {
    document.addEventListener('usuarios:cambio', mostrarUsuarios);
    tabla.addEventListener('click', evento => {
        const boton = evento.target.closest('[data-editar-cliente], [data-estado-cliente]');
        if (!boton) return;
        try {
            const id = boton.dataset.editarCliente ?? boton.dataset.estadoCliente;
            const cuenta = listarCuentas().find(u => u.id === id && u.rol === 'cliente');
            if (!cuenta) throw new Error('La cuenta ya no está disponible.');
            ultimoBoton = { id, accion: boton.dataset.editarCliente ? 'editarCliente' : 'estadoCliente' };
            aviso('');
            if (boton.dataset.editarCliente) {
                form.reset();
                limpiarEstadoEditor();
                editando = id;
                for (const campo of ['nombre', 'usuario', 'correo', 'nacimiento', 'direccion']) form.elements.namedItem(campo).value = cuenta[campo] ?? '';
                bootstrap.Modal.getOrCreateInstance(document.getElementById('modal-usuario')).show();
            } else {
                pendiente = { id, activo: !cuenta.activo };
                document.getElementById('mensaje-estado-cliente').textContent = cuenta.activo
                    ? `¿Desactivar la cuenta de ${cuenta.usuario}? No podrá iniciar sesión. Sus datos y compras se conservarán.`
                    : `¿Activar la cuenta de ${cuenta.usuario} para permitirle iniciar sesión nuevamente?`;
                document.getElementById('error-estado-cliente').textContent = '';
                bootstrap.Modal.getOrCreateInstance(document.getElementById('modal-estado-cliente')).show();
            }
        } catch (error) { aviso(error.message, true); }
    });
    function limpiarEstadoEditor() {
        // El editor tiene su propia salida; comparte solo la representación de errores.
        delete form.dataset.validado;
        form.querySelectorAll('input').forEach(c => {
            c.classList.remove('is-valid', 'is-invalid');
            c.removeAttribute('aria-invalid');
        });
        form.querySelectorAll('.invalid-feedback').forEach(c => c.textContent = '');
        document.getElementById('resultado-cliente').textContent = '';
    }
    form.addEventListener('submit', evento => {
        evento.preventDefault();
        form.dataset.validado = 'true';
        if (Object.keys(validarEditor()).length) {
            document.getElementById('resultado-cliente').textContent = 'Revisa los campos indicados.';
            form.querySelector('.is-invalid')?.focus();
            return;
        }
        const boton = form.querySelector('[type="submit"]');
        if (boton.disabled || !editando) return;
        boton.disabled = true;
        try {
            const cuenta = editarCliente(editando, datosFormulario(form));
            aviso(`Los datos de ${cuenta.usuario} se guardaron correctamente.`);
            bootstrap.Modal.getInstance(document.getElementById('modal-usuario')).hide();
        } catch (error) { document.getElementById('resultado-cliente').textContent = error.message; }
        finally { boton.disabled = false; }
    });
    for (const tipo of ['input', 'change']) form.addEventListener(tipo, () => {
        document.getElementById('resultado-cliente').textContent = '';
        if (form.dataset.validado) validarEditor();
    });
    document.getElementById('confirmar-estado-cliente').addEventListener('click', () => {
        if (!pendiente) return;
        try {
            const cuenta = cambiarEstadoCliente(pendiente.id, pendiente.activo);
            aviso(`La cuenta de ${cuenta.usuario} quedó ${cuenta.activo ? 'activa' : 'inactiva'}.`);
            pendiente = null;
            bootstrap.Modal.getInstance(document.getElementById('modal-estado-cliente')).hide();
        } catch (error) { document.getElementById('error-estado-cliente').textContent = error.message; }
    });
    for (const id of ['modal-usuario', 'modal-estado-cliente']) {
        const modal = document.getElementById(id);
        modal.addEventListener('hide.bs.modal', () => {
            if (modal.contains(document.activeElement)) document.activeElement.blur();
        });
        modal.addEventListener('hidden.bs.modal', () => {
            editando = null;
            pendiente = null;
            if (ultimoBoton) [...tabla.querySelectorAll('button')].find(b => b.dataset[ultimoBoton.accion] === ultimoBoton.id)?.focus();
        });
    }
    document.getElementById('modal-usuario').addEventListener('shown.bs.modal', () => form.elements.namedItem('nombre').focus());
    document.addEventListener('sesion:cambio', () => {
        if (obtenerSesion()?.rol === 'administrador') return;
        editando = null;
        pendiente = null;
        aviso('');
        for (const id of ['modal-usuario', 'modal-estado-cliente']) bootstrap.Modal.getInstance(document.getElementById(id))?.hide();
    });
}
