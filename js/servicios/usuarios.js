import { leerDatos, guardarDatos } from './almacenamiento.js';
import { validarRegistro, validarPerfil } from '../validaciones/formularios.js';

export function usuarioPublico(usuario) {
    if (!usuario) return null;
    const { claveHash, ...publico } = usuario;
    return publico;
}

export function obtenerUsuario(id) {
    return usuarioPublico(leerDatos().usuarios.find(u => u.id === id && u.activo));
}

// Huella solo para la simulación; la autenticación real corresponderá al backend.
async function huella(valor) {
    if (!globalThis.crypto?.subtle) throw new Error('Abre TableFamily desde localhost o HTTPS para usar el acceso simulado.');
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(valor));
    return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verificarCredenciales(nombre, clave) {
    const hash = await huella(clave);
    const usuario = leerDatos().usuarios.find(u => u.activo &&
        u.usuario.toLocaleLowerCase() === nombre.trim().toLocaleLowerCase() && u.claveHash === hash);
    if (!usuario) throw new Error('El usuario o la contraseña no son correctos.');
    return usuarioPublico(usuario);
}

function comprobarDuplicados(usuarios, datos, excluirId) {
    if (usuarios.some(u => u.id !== excluirId && u.usuario.toLocaleLowerCase() === datos.usuario.trim().toLocaleLowerCase())) {
        throw new Error('Ese nombre de usuario ya está registrado.');
    }
    if (usuarios.some(u => u.id !== excluirId && u.correo.toLocaleLowerCase() === datos.correo.trim().toLocaleLowerCase())) {
        throw new Error('Ese correo ya está registrado.');
    }
}

export async function registrarUsuario(datos) {
    if (Object.keys(validarRegistro(datos)).length) throw new Error('Completa correctamente los datos del registro.');
    const claveHash = await huella(datos.clave);
    const base = leerDatos();
    comprobarDuplicados(base.usuarios, datos);
    const usuario = {
        id: crypto.randomUUID(), nombre: datos.nombre.trim(), usuario: datos.usuario.trim(),
        correo: datos.correo.trim(), nacimiento: datos.nacimiento, direccion: (datos.direccion ?? '').trim(),
        rol: 'cliente', activo: true, claveHash
    };
    base.usuarios.push(usuario);
    guardarDatos(base);
    return usuarioPublico(usuario);
}

export function actualizarPerfil(id, datos) {
    if (Object.keys(validarPerfil(datos)).length) throw new Error('Revisa los datos del perfil.');
    const base = leerDatos();
    const usuario = base.usuarios.find(u => u.id === id && u.activo);
    if (!usuario) throw new Error('La cuenta ya no está disponible.');
    comprobarDuplicados(base.usuarios, datos, id);
    // Lista explícita: el formulario de perfil nunca modifica el rol ni la clave.
    for (const campo of ['nombre', 'usuario', 'correo', 'nacimiento', 'direccion']) {
        usuario[campo] = (datos[campo] ?? '').trim();
    }
    guardarDatos(base);
    return usuarioPublico(usuario);
}

export function listarUsuarios() {
    return leerDatos().usuarios.map(usuarioPublico);
}
