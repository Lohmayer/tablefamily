import { obtenerSesion, cerrarSesion } from '../servicios/sesion.js';
const raiz = new URL('../../', import.meta.url);
export function actualizarCabecera() {
    const invitado = document.querySelector('[data-abrir-acceso]');
    const contenedor = document.getElementById('sesion-activa');
    if (!invitado || !contenedor) return;
    const usuario = obtenerSesion();
    invitado.hidden = Boolean(usuario);
    contenedor.hidden = !usuario;
    contenedor.replaceChildren();
    if (!usuario) return;
    const saludo = document.createElement('span');
    saludo.className = 'saludo-sesion';
    saludo.textContent = 'Hola, ' + usuario.usuario;
    const perfil = document.createElement('a');
    perfil.className = 'btn boton-acceso';
    perfil.href = new URL('paginas/perfil.html', raiz);
    perfil.textContent = 'Mi cuenta';
    contenedor.append(saludo, perfil);
    if (usuario.rol === 'cliente') {
        const compras = document.createElement('a');
        compras.className = 'btn acceso-limpiar';
        compras.href = new URL('paginas/compras.html', raiz);
        compras.textContent = 'Mis compras';
        contenedor.append(compras);
    }
    if (usuario.rol === 'administrador') {
        const admin = document.createElement('a');
        admin.className = 'btn acceso-limpiar';
        admin.href = new URL('paginas/administracion.html', raiz);
        admin.textContent = 'Administración';
        contenedor.append(admin);
    }
    const salir = document.createElement('button');
    salir.type = 'button';
    salir.className = 'btn acceso-limpiar';
    salir.dataset.cerrarSesion = '';
    salir.textContent = 'Salir';
    contenedor.append(salir);
}
document.addEventListener('componentes:listos', actualizarCabecera);
document.addEventListener('sesion:cambio', actualizarCabecera);
document.addEventListener('click', evento => {
    if (evento.target.closest('[data-cerrar-sesion]')) cerrarSesion();
});
actualizarCabecera();
