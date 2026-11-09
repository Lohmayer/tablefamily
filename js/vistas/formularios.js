import { validarRegistro, validarPerfil, validarCampo, requisitosClave } from '../validaciones/formularios.js';

export function datosFormulario(formulario) {
    return Object.fromEntries(new FormData(formulario));
}
export function erroresFormulario(formulario) {
    const datos = datosFormulario(formulario);
    if (formulario.id === 'form-registro') return validarRegistro(datos);
    if (formulario.id === 'form-perfil') return validarPerfil(datos);
    const errores = {};
    formulario.querySelectorAll('[required]').forEach(campo => {
        // En login, el servicio comprueba las credenciales después de validar campos vacíos.
        const error = campo.type === 'password'
            ? (!campo.value.trim() ? 'Este campo es obligatorio.' : '')
            : validarCampo(campo.name, campo.value, datos);
        if (error) errores[campo.name] = error;
    });
    return errores;
}
export function mostrarErrores(formulario, errores) {
    formulario.querySelectorAll('[required]').forEach(campo => {
        const error = errores[campo.name] ?? '';
        campo.classList.toggle('is-invalid', Boolean(error));
        // Completar el login no demuestra que la cuenta o la contraseña sean correctas.
        campo.classList.toggle('is-valid', !error && formulario.id !== 'form-login');
        campo.setAttribute('aria-invalid', String(Boolean(error)));
        const salida = document.getElementById('error-' + campo.id);
        if (salida) salida.textContent = error;
    });
}
export function actualizarEstadoRegistro() {
    const form = document.getElementById('form-registro');
    if (!form) return;
    const datos = datosFormulario(form);
    const reglas = requisitosClave(datos.clave);
    for (const [nombre, cumple] of Object.entries(reglas)) {
        const regla = document.getElementById('regla-' + nombre);
        if (!regla) continue;
        regla.classList.toggle('cumplida', cumple);
        regla.querySelector('.regla-icono').textContent = cumple ? '✓' : '○';
    }
    const confirmar = document.getElementById('ayuda-confirmacion');
    const coincide = Boolean(datos.clave) && datos.clave === datos.confirmacion;
    confirmar.classList.toggle('cumplida', coincide);
    confirmar.querySelector('.regla-icono').textContent = coincide ? '✓' : '○';
    form.querySelector('[type="submit"]').disabled =
        Object.keys(validarRegistro(datos)).length > 0 || form.dataset.enviando === 'true';
}
export function limpiarEstado(formulario) {
    delete formulario.dataset.validado;
    formulario.querySelectorAll('input').forEach(campo => {
        campo.classList.remove('is-valid', 'is-invalid');
        campo.removeAttribute('aria-invalid');
    });
    formulario.querySelectorAll('.invalid-feedback').forEach(e => e.textContent = '');
    formulario.querySelector('.acceso-resultado').textContent = '';
    formulario.querySelector('.acceso-resultado').classList.remove('text-danger');
}
