import { leerDatos, guardarDatos } from './almacenamiento.js';
import { obtenerSesion } from './sesion.js';
import { precioVenta } from './productos.js';

export function propietarioCarrito() {
    const usuario = obtenerSesion();
    if (usuario?.rol === 'administrador') throw new Error('Para comprar utiliza una cuenta de cliente.');
    return usuario?.id ?? 'invitado';
}

function lineasGuardadas(base, propietario) {
    const lineas = Object.hasOwn(base.carritos, propietario) ? base.carritos[propietario] : [];
    if (!Array.isArray(lineas)) throw new Error('El carrito guardado tiene un formato inválido.');
    return lineas;
}

export function construirResumen(base, propietario) {
    const lineas = lineasGuardadas(base, propietario).map(linea => {
        const producto = base.productos.find(p => p.id === linea.productoId);
        let error = '';
        if (!producto?.activo) error = 'Este juego ya no está publicado. Quítalo del carrito para continuar.';
        else if (!Number.isSafeInteger(linea.cantidad) || linea.cantidad < 1) error = 'La cantidad no es válida.';
        else if (producto.stock < linea.cantidad) error = producto.stock === 0
            ? 'Este juego se agotó. Quítalo del carrito para continuar.'
            : `Solo quedan ${producto.stock} unidades. Ajusta la cantidad.`;
        const cantidadValida = Number.isSafeInteger(linea.cantidad) && linea.cantidad > 0;
        return {
            productoId: linea.productoId, nombre: producto?.nombre ?? 'Juego no disponible',
            imagen: producto?.imagen ?? '', categoria: producto?.categoria ?? '',
            cantidad: linea.cantidad, stock: producto?.stock ?? 0,
            precioNormal: producto?.precio ?? 0, descuento: producto?.descuento ?? 0,
            precioUnitario: producto ? precioVenta(producto) : 0,
            subtotal: producto && cantidadValida ? precioVenta(producto) * linea.cantidad : 0,
            error
        };
    });
    const total = lineas.reduce((s, l) => s + l.subtotal, 0);
    const totalNormal = lineas.reduce((s, l) => s + (Number.isSafeInteger(l.cantidad) && l.cantidad > 0 ? l.precioNormal * l.cantidad : 0), 0);
    // La cotización identifica cantidades y precios; confirmar exige volver a revisarlos si cambian.
    const cotizacion = JSON.stringify([propietario, lineas.map(l => [l.productoId, l.cantidad, l.precioNormal, l.descuento])]);
    return {
        lineas, total, totalNormal, ahorro: totalNormal - total,
        unidades: lineas.reduce((s, l) => s + (Number.isSafeInteger(l.cantidad) && l.cantidad > 0 ? l.cantidad : 0), 0),
        valido: lineas.length > 0 && lineas.every(l => !l.error), cotizacion
    };
}

export function obtenerCarrito() {
    return construirResumen(leerDatos(), propietarioCarrito());
}

function cantidadDisponible(base, productoId, cantidad) {
    if (!Number.isSafeInteger(cantidad) || cantidad < 1) throw new Error('La cantidad debe ser un entero mayor que cero.');
    const producto = base.productos.find(p => p.id === productoId && p.activo);
    if (!producto) throw new Error('Este juego ya no está publicado.');
    if (producto.stock === 0) throw new Error('Este juego está agotado.');
    if (cantidad > producto.stock) throw new Error(`Solo hay ${producto.stock} unidades disponibles de ${producto.nombre}.`);
}

function guardarCarrito(base, propietario, lineas) {
    base.carritos[propietario] = lineas;
    guardarDatos(base);
    document.dispatchEvent(new CustomEvent('carrito:cambio'));
}

export function agregarAlCarrito(productoId, cantidad = 1) {
    const propietario = propietarioCarrito();
    const base = leerDatos();
    const lineas = lineasGuardadas(base, propietario);
    if (!Number.isSafeInteger(cantidad) || cantidad < 1) throw new Error('La cantidad debe ser un entero mayor que cero.');
    const existente = lineas.find(l => l.productoId === productoId);
    const nuevaCantidad = (existente?.cantidad ?? 0) + cantidad;
    cantidadDisponible(base, productoId, nuevaCantidad);
    if (existente) existente.cantidad = nuevaCantidad;
    else lineas.push({ productoId, cantidad });
    guardarCarrito(base, propietario, lineas);
}

export function cambiarCantidad(productoId, cantidad) {
    const propietario = propietarioCarrito();
    const base = leerDatos();
    const lineas = lineasGuardadas(base, propietario);
    const linea = lineas.find(l => l.productoId === productoId);
    if (!linea) throw new Error('Ese juego no está en tu carrito.');
    cantidadDisponible(base, productoId, cantidad);
    linea.cantidad = cantidad;
    guardarCarrito(base, propietario, lineas);
}

export function quitarDelCarrito(productoId) {
    const propietario = propietarioCarrito();
    const base = leerDatos();
    guardarCarrito(base, propietario, lineasGuardadas(base, propietario).filter(l => l.productoId !== productoId));
}

export function vaciarCarrito() {
    const propietario = propietarioCarrito();
    guardarCarrito(leerDatos(), propietario, []);
}

export function fusionarCarritoInvitado() {
    const usuario = obtenerSesion();
    if (!usuario || usuario.rol !== 'cliente') return;
    const base = leerDatos();
    const invitado = lineasGuardadas(base, 'invitado');
    if (!invitado.length) return;
    const propias = lineasGuardadas(base, usuario.id);
    for (const linea of invitado) {
        const existente = propias.find(l => l.productoId === linea.productoId);
        if (existente) existente.cantidad += linea.cantidad;
        else propias.push({ ...linea });
    }
    // Conserva la intención del comprador. Si el total supera el stock, el resumen pide corregirlo.
    base.carritos[usuario.id] = propias;
    base.carritos.invitado = [];
    guardarDatos(base);
    document.dispatchEvent(new CustomEvent('carrito:cambio'));
}
