import { leerDatos, guardarDatos } from './almacenamiento.js';
import { obtenerSesion } from './sesion.js';
import { usuarioPublico } from './usuarios.js';
import { validarPerfil } from '../validaciones/formularios.js';

function exigirAdministrador() {
    if (obtenerSesion()?.rol !== 'administrador') throw new Error('Inicia sesión como administrador para gestionar usuarios.');
}
export function listarCuentas() {
    exigirAdministrador();
    return leerDatos().usuarios.map(usuarioPublico);
}
function buscarCliente(base, id) {
    const cuenta = base.usuarios.find(u => u.id === id);
    if (!cuenta) throw new Error('La cuenta ya no existe.');
    if (cuenta.rol !== 'cliente') throw new Error('Esta gestión corresponde a cuentas de clientes.');
    return cuenta;
}
export function editarCliente(id, datos) {
    exigirAdministrador();
    if (Object.keys(validarPerfil(datos)).length) throw new Error('Revisa los datos del cliente.');
    const base = leerDatos();
    const cuenta = buscarCliente(base, id);
    for (const campo of ['usuario', 'correo']) {
        if (base.usuarios.some(u => u.id !== id && u[campo].toLocaleLowerCase() === datos[campo].trim().toLocaleLowerCase())) {
            throw new Error(campo === 'usuario' ? 'Ese nombre de usuario ya está registrado.' : 'Ese correo ya está registrado.');
        }
    }
    for (const campo of ['nombre', 'usuario', 'correo', 'nacimiento', 'direccion']) cuenta[campo] = (datos[campo] ?? '').trim();
    guardarDatos(base);
    document.dispatchEvent(new CustomEvent('usuarios:cambio'));
    return usuarioPublico(cuenta);
}
export function cambiarEstadoCliente(id, activo) {
    exigirAdministrador();
    if (typeof activo !== 'boolean') throw new Error('El estado no es válido.');
    const base = leerDatos();
    const cuenta = buscarCliente(base, id);
    cuenta.activo = activo;
    guardarDatos(base);
    document.dispatchEvent(new CustomEvent('usuarios:cambio'));
    return usuarioPublico(cuenta);
}
