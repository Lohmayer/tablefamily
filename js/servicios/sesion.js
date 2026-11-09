import { obtenerUsuario, verificarCredenciales } from './usuarios.js';

const CLAVE_SESION = 'tablefamily.mock.sesion';
export function obtenerSesion() {
    const id = sessionStorage.getItem(CLAVE_SESION);
    return id ? obtenerUsuario(id) : null;
}

export async function iniciarSesion(usuario, clave) {
    const cuenta = await verificarCredenciales(usuario, clave);
    const anterior = sessionStorage.getItem(CLAVE_SESION);
    sessionStorage.setItem(CLAVE_SESION, cuenta.id);
    try {
        if (cuenta.rol === 'cliente') {
            const { fusionarCarritoInvitado } = await import('./carrito.js');
            fusionarCarritoInvitado();
        }
    } catch (error) {
        if (anterior) sessionStorage.setItem(CLAVE_SESION, anterior);
        else sessionStorage.removeItem(CLAVE_SESION);
        throw error;
    }
    document.dispatchEvent(new CustomEvent('sesion:cambio'));
    return cuenta;
}

export function cerrarSesion() {
    sessionStorage.removeItem(CLAVE_SESION);
    document.dispatchEvent(new CustomEvent('sesion:cambio'));
}

export function guardarMiPerfil(datos) {
    return import('./usuarios.js').then(({ actualizarPerfil }) => {
        const cuenta = obtenerSesion();
        if (!cuenta) throw new Error('Inicia sesión para modificar tu perfil.');
        const actualizada = actualizarPerfil(cuenta.id, datos);
        document.dispatchEvent(new CustomEvent('sesion:cambio'));
        return actualizada;
    });
}
