import { obtenerSesion, guardarMiPerfil } from '../servicios/sesion.js';
import { datosFormulario, erroresFormulario, mostrarErrores } from './formularios.js';

const form = document.getElementById('form-perfil');
function rellenarPerfil(usuario) {
    if (!form || !usuario) return;
    for (const campo of ['nombre', 'usuario', 'correo', 'nacimiento', 'direccion']) {
        form.elements.namedItem(campo).value = usuario[campo] ?? '';
    }
}
function mostrarPerfil() {
    if (!form) return;
    const usuario = obtenerSesion();
    document.getElementById('acceso-requerido').hidden = Boolean(usuario);
    document.getElementById('contenido-perfil').hidden = !usuario;
    if (!usuario) return;
    document.getElementById('saludo-perfil').textContent = `Bienvenido, ${usuario.nombre}. Aquí puedes actualizar tu perfil.`;
    rellenarPerfil(usuario);
}
if (form) {
    mostrarPerfil();
    document.addEventListener('sesion:cambio', mostrarPerfil);
    form.addEventListener('submit', async evento => {
        evento.preventDefault();
        const errores = erroresFormulario(form);
        mostrarErrores(form, errores);
        const salida = form.querySelector('.acceso-resultado');
        if (Object.keys(errores).length) {
            salida.textContent = 'Revisa los campos indicados.';
            form.querySelector('.is-invalid')?.focus();
            return;
        }
        const boton = form.querySelector('[type="submit"]');
        boton.disabled = true;
        try {
            await guardarMiPerfil(datosFormulario(form));
            salida.textContent = 'Tu perfil se actualizó correctamente.';
        } catch (error) {
            salida.textContent = error.message;
        } finally { boton.disabled = false; }
    });
    form.addEventListener('reset', () => {
        form.querySelectorAll('input').forEach(campo => {
            campo.classList.remove('is-invalid', 'is-valid');
            campo.removeAttribute('aria-invalid');
        });
        form.querySelectorAll('.invalid-feedback').forEach(e => e.textContent = '');
        form.querySelector('.acceso-resultado').textContent = '';
        requestAnimationFrame(() => rellenarPerfil(obtenerSesion()));
    });
}
