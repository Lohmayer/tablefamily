import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarProducto } from '../js/validaciones/productos.js';
import { leerDatos } from '../js/servicios/almacenamiento.js';
import { iniciarSesion, cerrarSesion } from '../js/servicios/sesion.js';
import { guardarProducto, listarProductos, listarInventario, obtenerProductoAdministracion, cambiarPublicacion, precioVenta } from '../js/servicios/productos.js';

class AlmacenMemoria {
    datos = new Map();
    getItem(clave) { return this.datos.get(clave) ?? null; }
    setItem(clave, valor) { this.datos.set(clave, String(valor)); }
    removeItem(clave) { this.datos.delete(clave); }
}
Object.defineProperty(globalThis, 'localStorage', { value: new AlmacenMemoria(), configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: new AlmacenMemoria(), configurable: true });
globalThis.document = new EventTarget();

const juego = { nombre: 'Juego de prueba', categoria: 'cartas', descripcion: 'Una partida de prueba.', imagen: 'img/juego-uno.png', precio: '20000', descuento: '25', stock: '5' };

test('límites de inventario, campos vacíos, enteros y rutas de imagen', () => {
    assert.deepEqual(validarProducto(juego), {});
    for (const [campo, valores] of Object.entries({
        nombre: ['', ' '.repeat(4), 'x'.repeat(101)],
        descripcion: ['', 'x'.repeat(1001)],
        categoria: ['', 'inexistente', '__proto__'],
        precio: ['', '0', '-1', '12.5', 'Infinity', '1000000001'],
        descuento: ['', '-1', '101', '2.5'],
        stock: ['', '-1', '1.5', '1000001'],
        imagen: ['', 'javascript:alert(1)', 'https://otra.example/a.png', 'img/../secreto.png']
    })) {
        for (const valor of valores) assert(validarProducto({ ...juego, [campo]: valor })[campo], `${campo}=${valor}`);
    }
    assert.deepEqual(validarProducto({ ...juego, precio: '1', descuento: '100', stock: '0' }), {});
});

test('solo administrador puede crear, editar, retirar y publicar', async () => {
    assert.throws(() => guardarProducto(juego), /administrador/);
    assert.throws(() => listarInventario(), /administrador/);
    await iniciarSesion('cliente', 'Cliente123');
    assert.throws(() => guardarProducto(juego), /administrador/);
    await iniciarSesion('admin', 'Admin123');
    let cambios = 0;
    document.addEventListener('productos:cambio', () => cambios++);
    const cantidadInicial = listarProductos('cartas').length;
    const agregado = guardarProducto({ ...juego, id: 'id-no-confiable', activo: false });
    assert.notEqual(agregado.id, 'id-no-confiable');
    assert.equal(agregado.activo, true);
    assert.equal(listarProductos('cartas').length, cantidadInicial + 1);
    assert.equal(precioVenta(agregado), 15000);
    assert.throws(() => guardarProducto({ ...juego, nombre: ' JUEGO DE PRUEBA ' }), /Ya existe/);
    const editado = guardarProducto({ ...juego, categoria: 'estrategia', precio: '30000', descuento: '0', stock: '0' }, agregado.id);
    assert.equal(editado.id, agregado.id);
    assert.equal(precioVenta(editado), 30000);
    assert.equal(listarProductos('cartas').length, cantidadInicial);
    assert(listarProductos('estrategia').some(p => p.id === agregado.id && p.stock === 0));
    assert.throws(() => guardarProducto({ ...juego, stock: '-1' }, agregado.id));
    assert.equal(obtenerProductoAdministracion(agregado.id).stock, 0);
    cambiarPublicacion(agregado.id, false);
    assert(!listarProductos().some(p => p.id === agregado.id));
    assert(listarInventario().some(p => p.id === agregado.id));
    assert.throws(() => cambiarPublicacion(agregado.id, 'true'), /no es válido/);
    cambiarPublicacion(agregado.id, true);
    assert(listarProductos().some(p => p.id === agregado.id));
    assert.equal(cambios, 4);
    assert.equal(leerDatos().productos.find(p => p.id === agregado.id).stock, 0);
    cerrarSesion();
    assert.throws(() => cambiarPublicacion(agregado.id, false), /administrador/);
    assert.throws(() => guardarProducto(juego, agregado.id), /administrador/);
});
