import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { leerDatos } from '../js/servicios/almacenamiento.js';
import { iniciarSesion, cerrarSesion } from '../js/servicios/sesion.js';
import { registrarUsuario } from '../js/servicios/usuarios.js';
import { guardarProducto, obtenerProductoAdministracion } from '../js/servicios/productos.js';
import { agregarAlCarrito, cambiarCantidad, quitarDelCarrito, vaciarCarrito, obtenerCarrito } from '../js/servicios/carrito.js';
import { confirmarCompra, listarMisPedidos, listarPedidosAdministracion } from '../js/servicios/pedidos.js';
import { validarCompra } from '../js/validaciones/compra.js';

class Memoria {
    datos = new Map();
    fallar = false;
    getItem(k) { return this.datos.get(k) ?? null; }
    setItem(k, v) { if (this.fallar) { this.fallar = false; throw new Error('Almacenamiento lleno'); } this.datos.set(k, String(v)); }
    removeItem(k) { this.datos.delete(k); }
}
beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', { value: new Memoria(), configurable: true });
    Object.defineProperty(globalThis, 'sessionStorage', { value: new Memoria(), configurable: true });
    globalThis.document = new EventTarget();
});
const compra = { metodoPago: 'tarjeta-demo', entrega: 'retiro', direccion: '', acepto: true };
async function editar(id, datos) {
    await iniciarSesion('admin', 'Admin123');
    const producto = obtenerProductoAdministracion(id);
    guardarProducto({ ...producto, ...datos }, id);
}

test('carrito visitante: sumar, cambiar, quitar, vaciar y respetar stock', () => {
    agregarAlCarrito('catan');
    agregarAlCarrito('catan');
    assert.equal(obtenerCarrito().lineas.length, 1);
    assert.equal(obtenerCarrito().unidades, 2);
    assert.equal(obtenerCarrito().total, 64000);
    assert.equal(obtenerCarrito().ahorro, 16000);
    assert.equal(leerDatos().productos.find(p => p.id === 'catan').stock, 10);
    for (const cantidad of [0, -1, 1.5, NaN, 11]) {
        assert.throws(() => cambiarCantidad('catan', cantidad));
        assert.equal(obtenerCarrito().unidades, 2);
    }
    assert.throws(() => agregarAlCarrito('catan', 9));
    cambiarCantidad('catan', 3);
    assert.equal(obtenerCarrito().total, 96000);
    agregarAlCarrito('uno');
    quitarDelCarrito('catan');
    assert.equal(obtenerCarrito().lineas[0].productoId, 'uno');
    vaciarCarrito();
    assert.equal(obtenerCarrito().valido, false);
});

test('fusiona visitante con cliente y separa los carritos de cuentas distintas', async () => {
    agregarAlCarrito('uno');
    await iniciarSesion('admin', 'Admin123');
    assert.throws(() => agregarAlCarrito('uno'), /cliente/);
    cerrarSesion();
    assert.equal(obtenerCarrito().unidades, 1); // El admin no consume el carrito visitante.
    await iniciarSesion('cliente', 'Cliente123');
    assert.equal(obtenerCarrito().unidades, 1);
    cerrarSesion();
    agregarAlCarrito('uno', 2);
    await iniciarSesion('cliente', 'Cliente123');
    assert.equal(obtenerCarrito().unidades, 3);
    await registrarUsuario({nombre:'Otro', usuario:'otro', correo:'otro@example.com', clave:'Familia1', confirmacion:'Familia1', nacimiento:'2000-01-01'});
    await iniciarSesion('otro', 'Familia1');
    assert.equal(obtenerCarrito().unidades, 0);
    agregarAlCarrito('catan');
    await iniciarSesion('cliente', 'Cliente123');
    assert.equal(obtenerCarrito().unidades, 3);
});

test('el carrito combinado que supera el stock exige corregir cantidades', async () => {
    await iniciarSesion('cliente', 'Cliente123');
    agregarAlCarrito('uno', 6);
    cerrarSesion();
    agregarAlCarrito('uno', 6);
    await iniciarSesion('cliente', 'Cliente123');
    assert.equal(obtenerCarrito().unidades, 12);
    assert.equal(obtenerCarrito().valido, false);
    await assert.rejects(confirmarCompra(compra, obtenerCarrito().cotizacion, 'fusion'), /cantidades/);
    cambiarCantidad('uno', 10);
    assert.equal(obtenerCarrito().valido, true);
});

test('compra consistente: guarda snapshot, descuenta stock y vacía carrito una sola vez', async () => {
    await iniciarSesion('cliente', 'Cliente123');
    agregarAlCarrito('catan', 2);
    agregarAlCarrito('uno');
    const cotizacion = obtenerCarrito().cotizacion;
    const [pedido, repetido] = await Promise.all([
        confirmarCompra(compra, cotizacion, 'solicitud-1'),
        confirmarCompra(compra, cotizacion, 'solicitud-1')
    ]);
    assert.equal(pedido.id, repetido.id);
    assert.equal(pedido.total, 72000);
    assert.equal(pedido.lineas.length, 2);
    assert.equal(obtenerCarrito().unidades, 0);
    assert.equal(leerDatos().productos.find(p => p.id === 'catan').stock, 8);
    assert.equal(leerDatos().pedidos.length, 1);
    assert.equal(listarMisPedidos().length, 1);
    await editar('catan', {precio:50000, nombre:'Catan actualizado', descuento:0});
    await iniciarSesion('cliente', 'Cliente123');
    assert.equal(listarMisPedidos()[0].total, 72000);
    assert.equal(listarMisPedidos()[0].lineas[0].nombre, 'Catan');
    assert.equal(listarMisPedidos()[0].lineas[0].precioUnitario, 32000);
    agregarAlCarrito('uno');
    await confirmarCompra(compra, cotizacion, 'solicitud-1');
    assert.equal(obtenerCarrito().unidades, 1); // Un reintento no vacía un carrito nuevo.
});

test('precio cambiado y stock insuficiente rechazan sin modificar pedido ni inventario', async () => {
    await iniciarSesion('cliente', 'Cliente123');
    agregarAlCarrito('uno', 2);
    const anterior = obtenerCarrito().cotizacion;
    await editar('uno', {precio:20000, stock:1});
    await iniciarSesion('cliente', 'Cliente123');
    await assert.rejects(confirmarCompra(compra, anterior, 'stock'), /agotados|cantidades/);
    assert.equal(leerDatos().pedidos.length, 0);
    assert.equal(leerDatos().productos.find(p => p.id === 'uno').stock, 1);
    await editar('uno', {stock:5});
    await iniciarSesion('cliente', 'Cliente123');
    await assert.rejects(confirmarCompra(compra, anterior, 'precio'), /precios/);
    assert.equal(obtenerCarrito().unidades, 2);
    assert.equal(leerDatos().pedidos.length, 0);
    await confirmarCompra(compra, obtenerCarrito().cotizacion, 'precio-revisado');
    assert.equal(leerDatos().productos.find(p => p.id === 'uno').stock, 3);
});

test('historial privado por cliente y consulta del administrador', async () => {
    await iniciarSesion('cliente', 'Cliente123');
    agregarAlCarrito('uno');
    const primero = await confirmarCompra({...compra, entrega:'despacho', direccion:'Calle de prueba 123'}, obtenerCarrito().cotizacion, 'cliente-a');
    await registrarUsuario({nombre:'Otro', usuario:'otro', correo:'otro@example.com', clave:'Familia1', confirmacion:'Familia1', nacimiento:'2000-01-01'});
    await iniciarSesion('otro', 'Familia1');
    assert.equal(listarMisPedidos().length, 0);
    agregarAlCarrito('catan');
    const segundo = await confirmarCompra(compra, obtenerCarrito().cotizacion, 'cliente-b');
    assert.equal(listarMisPedidos()[0].id, segundo.id);
    assert.throws(() => listarPedidosAdministracion(), /administrador/);
    await iniciarSesion('cliente', 'Cliente123');
    assert.equal(listarMisPedidos().length, 1);
    assert.equal(listarMisPedidos()[0].id, primero.id);
    await iniciarSesion('admin', 'Admin123');
    assert.equal(listarPedidosAdministracion().length, 2);
    await assert.rejects(confirmarCompra(compra, '', 'admin'), /cliente/);
    cerrarSesion();
    assert.throws(() => listarMisPedidos(), /cliente/);
});

test('validación de pago y entrega: no requiere ni procesa datos bancarios', async () => {
    assert.deepEqual(validarCompra(compra), {});
    assert(validarCompra({...compra, acepto:false}).acepto);
    assert(validarCompra({...compra, metodoPago:'real'}).metodoPago);
    assert(validarCompra({...compra, entrega:'despacho', direccion:' '}).direccion);
    await iniciarSesion('cliente', 'Cliente123');
    agregarAlCarrito('uno');
    await assert.rejects(confirmarCompra({...compra, acepto:false}, obtenerCarrito().cotizacion, 'invalida'), /simulada/);
    assert.equal(leerDatos().pedidos.length, 0);
    assert.equal(obtenerCarrito().unidades, 1);
});

test('si falla el guardado, no queda stock descontado ni un pedido parcial', async () => {
    await iniciarSesion('cliente', 'Cliente123');
    agregarAlCarrito('uno');
    const cotizacion = obtenerCarrito().cotizacion;
    let eventos = 0;
    document.addEventListener('pedidos:cambio', () => eventos++);
    localStorage.fallar = true;
    await assert.rejects(confirmarCompra(compra, cotizacion, 'fallo'), /lleno/);
    assert.equal(leerDatos().pedidos.length, 0);
    assert.equal(leerDatos().productos.find(p => p.id === 'uno').stock, 10);
    assert.equal(obtenerCarrito().unidades, 1);
    assert.equal(eventos, 0);
});
