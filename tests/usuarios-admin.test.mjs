import { test } from 'node:test';
import assert from 'node:assert/strict';
import { iniciarSesion, cerrarSesion, obtenerSesion } from '../js/servicios/sesion.js';
import { listarCuentas, editarCliente, cambiarEstadoCliente } from '../js/servicios/administracion-usuarios.js';
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

test('gestión exclusiva del administrador; edición validada sin cambiar privilegios o contraseña', async () => {
    assert.throws(listarCuentas, /administrador/);
    await iniciarSesion('cliente', 'Cliente123');
    assert.throws(listarCuentas, /administrador/);
    assert.throws(() => editarCliente('usuario-cliente-demo', {}), /administrador/);
    assert.throws(() => cambiarEstadoCliente('usuario-cliente-demo', false), /administrador/);
    await iniciarSesion('admin', 'Admin123');
    const cuentas = listarCuentas();
    assert(cuentas.every(u => !('claveHash' in u)));
    const cliente = cuentas.find(u => u.rol === 'cliente');
    const antes = leerDatos().usuarios.find(u => u.id === cliente.id);
    assert.throws(() => editarCliente(cliente.id, { ...cliente, correo: 'invalido' }), /Revisa/);
    assert.throws(() => editarCliente(cliente.id, { ...cliente, usuario: ' ADMIN ' }), /registrado/);
    assert.throws(() => editarCliente(cliente.id, { ...cliente, correo: 'ADMIN@example.com' }), /registrado/);
    assert.throws(() => editarCliente('usuario-admin-demo', cliente), /clientes/);
    const editado = editarCliente(cliente.id, { ...cliente, usuario: 'Price', rol: 'administrador', claveHash: 'otra', activo: false });
    assert.equal(editado.usuario, 'Price');
    assert.equal(editado.rol, 'cliente');
    assert.equal(editado.activo, true);
    assert.equal(leerDatos().usuarios.find(u => u.id === cliente.id).claveHash, antes.claveHash);
    await iniciarSesion('Price', 'Cliente123');
    assert.equal(obtenerSesion().id, cliente.id);
});

test('desactivar bloquea el acceso, conserva pedidos y permite reactivar; administrador protegido', async () => {
    await iniciarSesion('admin', 'Admin123');
    const base = leerDatos();
    base.pedidos.push({ id: 'pedido-conservado', usuarioId: 'usuario-cliente-demo' });
    guardarDatos(base);
    assert.throws(() => cambiarEstadoCliente('usuario-admin-demo', false), /clientes/);
    assert.throws(() => cambiarEstadoCliente('usuario-cliente-demo', 'false'), /válido/);
    assert.throws(() => cambiarEstadoCliente('inexistente', false), /existe/);
    cambiarEstadoCliente('usuario-cliente-demo', false);
    await assert.rejects(iniciarSesion('Price', 'Cliente123'), /no son correctos/);
    assert.equal(obtenerSesion().rol, 'administrador');
    assert.equal(leerDatos().pedidos[0].id, 'pedido-conservado');
    cambiarEstadoCliente('usuario-cliente-demo', true);
    await iniciarSesion('Price', 'Cliente123');
    assert.equal(obtenerSesion().rol, 'cliente');
    cerrarSesion();
});
