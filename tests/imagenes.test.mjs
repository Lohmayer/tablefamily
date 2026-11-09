import { test } from 'node:test';
import assert from 'node:assert/strict';
import { imagenProductoValida } from '../js/validaciones/productos.js';
import { prepararFotoProducto } from '../js/vistas/imagenes-producto.js';
import { iniciarSesion } from '../js/servicios/sesion.js';
import { guardarProducto, listarProductos, obtenerProductoAdministracion } from '../js/servicios/productos.js';
import { leerDatos, guardarDatos } from '../js/servicios/almacenamiento.js';
class Memoria {
    datos = new Map();
    getItem(k) { return this.datos.get(k) ?? null; }
    setItem(k, v) { this.datos.set(k, String(v)); }
    removeItem(k) { this.datos.delete(k); }
}
Object.defineProperty(globalThis, 'localStorage', { value: new Memoria(), configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: new Memoria(), configurable: true });
globalThis.document = new EventTarget();
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+afoQAAAAASUVORK5CYII=';
test('valida formatos de imagen y rechaza contenido, rutas y tamaño inválidos', async () => {
    assert(imagenProductoValida(png));
    assert(imagenProductoValida('img/juego-uno.png'));
    for (const valor of ['data:image/svg+xml;base64,PHN2Zz4=', 'javascript:alert(1)', 'data:image/png;base64,aG9sYQ==', 'data:image/jpeg;base64,AAAA', 'img/../a.png', 'data:image/png;base64,' + 'A'.repeat(1500000)]) assert(!imagenProductoValida(valor));
    await assert.rejects(prepararFotoProducto({ type: 'image/svg+xml', size: 100 }), /PNG/);
    await assert.rejects(prepararFotoProducto({ type: 'image/png', size: 6 * 1024 * 1024 }), /5 MB/);
});
test('la imagen subida persiste y sirve al catálogo y al editor; cuota fallida conserva datos previos', async () => {
    await iniciarSesion('admin', 'Admin123');
    const producto = guardarProducto({ nombre: 'Juego con foto', descripcion: 'Foto propia', categoria: 'cartas', imagen: png, precio: '10000', descuento: '0', stock: '2' });
    assert.equal(obtenerProductoAdministracion(producto.id).imagen, png);
    assert.equal(listarProductos('cartas').find(p => p.id === producto.id).imagen, png);
    const antes = JSON.stringify(leerDatos());
    const original = localStorage.setItem;
    localStorage.setItem = () => { const error = new Error('quota'); error.name = 'QuotaExceededError'; throw error; };
    assert.throws(() => guardarDatos({ ...leerDatos(), productos: [] }), /foto más pequeña/);
    localStorage.setItem = original;
    assert.equal(JSON.stringify(leerDatos()), antes);
});
