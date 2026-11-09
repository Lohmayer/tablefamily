import { leerDatos, guardarDatos } from './almacenamiento.js';
import { obtenerSesion } from './sesion.js';
import { validarProducto } from '../validaciones/productos.js';

export function listarProductos(categoria) {
    return leerDatos().productos.filter(p => p.activo && (!categoria || p.categoria === categoria));
}

export function precioVenta(producto) {
    return Math.round(producto.precio * (1 - producto.descuento / 100));
}

export function formatoPesos(valor) {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(valor);
}

function exigirAdministrador() {
    if (obtenerSesion()?.rol !== 'administrador') {
        throw new Error('Inicia sesión como administrador para gestionar el inventario.');
    }
}

export function listarInventario() {
    exigirAdministrador();
    return leerDatos().productos;
}

export function obtenerProductoAdministracion(id) {
    exigirAdministrador();
    const producto = leerDatos().productos.find(p => p.id === id);
    if (!producto) throw new Error('El juego ya no está disponible en el inventario.');
    return producto;
}

export function guardarProducto(datos, id = null) {
    exigirAdministrador();
    const errores = validarProducto(datos);
    if (Object.keys(errores).length) throw new Error(Object.values(errores)[0]);
    const base = leerDatos();
    const nombre = datos.nombre.trim();
    if (base.productos.some(p => p.id !== id && p.categoria === datos.categoria &&
        p.nombre.trim().toLocaleLowerCase() === nombre.toLocaleLowerCase())) {
        throw new Error('Ya existe un juego con ese nombre en la categoría seleccionada.');
    }
    let producto;
    if (id) {
        producto = base.productos.find(p => p.id === id);
        if (!producto) throw new Error('El juego ya no está disponible en el inventario.');
    } else {
        producto = { id: crypto.randomUUID(), activo: true };
        base.productos.push(producto);
    }
    // Lista explícita: conserva el identificador y el estado de publicación al editar.
    Object.assign(producto, {
        nombre, categoria: datos.categoria, descripcion: datos.descripcion.trim(), imagen: datos.imagen,
        precio: Number(datos.precio), descuento: Number(datos.descuento), stock: Number(datos.stock)
    });
    guardarDatos(base);
    document.dispatchEvent(new CustomEvent('productos:cambio'));
    return producto;
}

export function cambiarPublicacion(id, activo) {
    exigirAdministrador();
    if (typeof activo !== 'boolean') throw new Error('El estado de publicación no es válido.');
    const base = leerDatos();
    const producto = base.productos.find(p => p.id === id);
    if (!producto) throw new Error('No se encontró el juego.');
    producto.activo = activo;
    guardarDatos(base);
    document.dispatchEvent(new CustomEvent('productos:cambio'));
    return producto;
}
