import { leerDatos, guardarDatos } from './almacenamiento.js';
import { obtenerSesion } from './sesion.js';
import { construirResumen } from './carrito.js';
import { validarCompra } from '../validaciones/compra.js';

function exigirCliente() {
    const usuario = obtenerSesion();
    if (!usuario || usuario.rol !== 'cliente') throw new Error('Inicia sesión con una cuenta de cliente para comprar.');
    return usuario;
}

export async function confirmarCompra(datos, cotizacion, solicitudId) {
    const usuarioId = exigirCliente().id;
    const errores = validarCompra(datos);
    if (Object.keys(errores).length) throw new Error(Object.values(errores)[0]);
    if (typeof solicitudId !== 'string' || !solicitudId.trim()) throw new Error('Vuelve a abrir la confirmación de compra.');
    const confirmar = () => {
        const usuario = exigirCliente();
        if (usuario.id !== usuarioId) throw new Error('La sesión cambió. Revisa tu carrito nuevamente.');
        const base = leerDatos();
        // Evita generar dos pedidos si se repite el envío de la misma confirmación.
        const anterior = base.pedidos.find(p => p.usuarioId === usuarioId && p.solicitudId === solicitudId);
        if (anterior) return structuredClone(anterior);
        const resumen = construirResumen(base, usuario.id);
        if (!resumen.valido) throw new Error('Revisa tu carrito: hay juegos agotados, retirados o cantidades no disponibles.');
        if (resumen.cotizacion !== cotizacion) throw new Error('Los precios o las cantidades cambiaron. Revisa el carrito y confirma nuevamente.');
        const id = crypto.randomUUID();
        const fecha = new Date().toISOString();
        const pedido = {
            id, codigo: 'TF-' + id.slice(0, 8).toUpperCase(), solicitudId, usuarioId,
            fecha, estado: 'Confirmado (simulado)',
            cliente: { nombre: usuario.nombre, correo: usuario.correo },
            entrega: datos.entrega, direccion: datos.entrega === 'despacho' ? datos.direccion.trim() : '',
            metodoPago: datos.metodoPago,
            lineas: resumen.lineas.map(({ error, stock, ...linea }) => linea),
            total: resumen.total, totalNormal: resumen.totalNormal, ahorro: resumen.ahorro
        };
        for (const linea of resumen.lineas) {
            base.productos.find(p => p.id === linea.productoId).stock -= linea.cantidad;
        }
        base.pedidos.push(pedido);
        base.carritos[usuario.id] = [];
        // Una única escritura guarda pedido, stock y carrito vaciado.
        guardarDatos(base);
        for (const nombre of ['productos:cambio', 'carrito:cambio', 'pedidos:cambio']) document.dispatchEvent(new CustomEvent(nombre));
        return structuredClone(pedido);
    };
    // Serializa confirmaciones entre pestañas cuando el navegador dispone de Web Locks.
    if (globalThis.navigator?.locks?.request) return navigator.locks.request('tablefamily-confirmar-compra', async () => confirmar());
    return confirmar();
}

export function listarMisPedidos() {
    const usuario = exigirCliente();
    return leerDatos().pedidos.filter(p => p.usuarioId === usuario.id).sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export function listarPedidosAdministracion() {
    if (obtenerSesion()?.rol !== 'administrador') throw new Error('Esta consulta corresponde al administrador.');
    return leerDatos().pedidos.toSorted((a, b) => b.fecha.localeCompare(a.fecha));
}
