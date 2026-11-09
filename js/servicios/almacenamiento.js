import { VERSION_DATOS, PRODUCTOS_INICIALES, USUARIOS_INICIALES } from '../datos/datos-iniciales.js';

const CLAVE = `tablefamily.mock.v${VERSION_DATOS}`;

export function leerDatos() {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado) {
        const datos = JSON.parse(guardado);
        if (!Array.isArray(datos.usuarios) || !Array.isArray(datos.productos)) {
            throw new Error('Los datos de la demostración tienen un formato inválido.');
        }
        // Compatibilidad con los bloques anteriores: conserva cuentas y productos existentes.
        if (datos.pedidos === undefined) datos.pedidos = [];
        if (datos.carritos === undefined) datos.carritos = {};
        if (!Array.isArray(datos.pedidos) || !datos.carritos ||
            typeof datos.carritos !== 'object' || Array.isArray(datos.carritos)) {
            throw new Error('Los pedidos o carritos guardados tienen un formato inválido.');
        }
        return datos;
    }
    const iniciales = structuredClone({ usuarios: USUARIOS_INICIALES, productos: PRODUCTOS_INICIALES, pedidos: [], carritos: {} });
    guardarDatos(iniciales);
    return iniciales;
}

export function guardarDatos(datos) {
    try {
        localStorage.setItem(CLAVE, JSON.stringify(datos));
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            throw new Error('No queda espacio local para guardar. Prueba con una foto más pequeña. Los datos anteriores se conservan.');
        }
        throw error;
    }
}
