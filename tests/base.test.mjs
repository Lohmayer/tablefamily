import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cumpleEdad, validarRegistro, requisitosClave } from '../js/validaciones/formularios.js';
import { leerDatos } from '../js/servicios/almacenamiento.js';
import { registrarUsuario, actualizarPerfil } from '../js/servicios/usuarios.js';
import { iniciarSesion, obtenerSesion, cerrarSesion } from '../js/servicios/sesion.js';
import { listarProductos, precioVenta } from '../js/servicios/productos.js';

class AlmacenMemoria {
    datos = new Map();
    getItem(clave) { return this.datos.get(clave) ?? null; }
    setItem(clave, valor) { this.datos.set(clave, String(valor)); }
    removeItem(clave) { this.datos.delete(clave); }
}
Object.defineProperty(globalThis, 'localStorage', {value: new AlmacenMemoria(), configurable: true});
Object.defineProperty(globalThis, 'sessionStorage', {value: new AlmacenMemoria(), configurable: true});
globalThis.document = new EventTarget();

test('edad con cumpleaños exacto, día pendiente, fechas futuras e inexistentes', () => {
    const hoy = new Date(2026, 10, 5);
    assert.equal(cumpleEdad('2013-11-05', hoy), true);
    assert.equal(cumpleEdad('2013-11-06', hoy), false);
    assert.equal(cumpleEdad('2010-02-30', hoy), false);
    assert.equal(cumpleEdad('2099-01-01', hoy), false);
});

test('cuatro reglas de contraseña y confirmación exacta', () => {
    assert(Object.values(requisitosClave('Abc123')).every(Boolean));
    assert(Object.values(requisitosClave('Ab' + '1'.repeat(16))).every(Boolean));
    for (const clave of ['Abc12', 'Ab' + '1'.repeat(17), 'ABC123', 'abc123', 'Abcdef']) {
        assert(!Object.values(requisitosClave(clave)).every(Boolean), clave);
    }
    const datos = {nombre:'Price', usuario:'price', correo:'price@example.com', clave:'Familia1', confirmacion:'Familia1', nacimiento:'2000-01-01'};
    assert.deepEqual(validarRegistro(datos), {}); // Dirección opcional.
    assert(validarRegistro({...datos, confirmacion:'otra'}).confirmacion);
    assert(validarRegistro({...datos, correo:'invalido'}).correo);
    assert.equal(Object.keys(validarRegistro({})).length, 6);
});

test('login por rol, registro persistido, duplicados y perfil sin cambios de privilegios', async () => {
    assert.equal(listarProductos().length, 12);
    assert.equal(listarProductos('cartas').length, 3);
    assert.equal(precioVenta({precio:40000, descuento:20}), 32000);
    await assert.rejects(iniciarSesion('admin', 'Incorrecta1'), /no son correctos/);
    assert.equal(obtenerSesion(), null);
    assert.equal((await iniciarSesion('admin', 'Admin123')).rol, 'administrador');
    cerrarSesion();
    assert.equal(obtenerSesion(), null);
    const datos = {nombre:'Price', usuario:'price', correo:'price@example.com', clave:'Familia1', confirmacion:'Familia1', nacimiento:'2000-01-01', rol:'administrador'};
    const usuario = await registrarUsuario(datos);
    assert.equal(usuario.rol, 'cliente');
    assert.equal(usuario.claveHash, undefined);
    assert(!JSON.stringify(leerDatos()).includes('Familia1'));
    await assert.rejects(registrarUsuario({...datos, correo:'otro@example.com'}), /ya está registrado/);
    await assert.rejects(registrarUsuario({...datos, usuario:'otro'}), /correo ya está registrado/);
    assert.equal((await iniciarSesion('price', 'Familia1')).id, usuario.id);
    const actualizado = actualizarPerfil(usuario.id, {...datos, usuario:'price2', rol:'administrador'});
    assert.equal(actualizado.rol, 'cliente');
    assert.equal(obtenerSesion().usuario, 'price2');
    assert.equal((await iniciarSesion('price2', 'Familia1')).id, usuario.id);
});
