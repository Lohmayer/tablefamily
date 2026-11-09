import { prepararFotoProducto } from './imagenes-producto.js';
import { obtenerSesion } from '../servicios/sesion.js';
import { mostrarUsuarios } from './usuarios.js';
import { listarInventario, obtenerProductoAdministracion, guardarProducto, cambiarPublicacion, precioVenta, formatoPesos } from '../servicios/productos.js';
import { CATEGORIAS, validarProducto } from '../validaciones/productos.js';
import { PRODUCTOS_INICIALES } from '../datos/datos-iniciales.js';
import { listarPedidosAdministracion } from '../servicios/pedidos.js';
import { crearTarjetaPedido } from './pedidos.js';

const panel = document.getElementById('contenido-administracion');
const raiz = new URL('../../', import.meta.url);
let publicacionPendiente = null;
let versionFoto = 0;
let fotoPendiente = false;
let errorFoto = '';
function limpiarFoto() {
    versionFoto++;
    fotoPendiente = false;
    errorFoto = '';
    document.getElementById('archivo-imagen-producto').value = '';
    const estado = document.getElementById('estado-archivo-producto');
    estado.textContent = '';
    estado.classList.remove('text-danger');
    document.getElementById('guardar-producto').disabled = false;
}

function agregarFila(tbody, valores) {
    const fila = document.createElement('tr');
    for (const valor of valores) {
        const celda = document.createElement('td');
        celda.textContent = valor;
        fila.append(celda);
    }
    tbody.append(fila);
    return fila;
}

function resultado(texto, error = false) {
    const salida = document.getElementById('resultado-inventario');
    salida.textContent = texto;
    salida.classList.toggle('text-danger', error);
}

function renderInventario() {
    if (!panel || obtenerSesion()?.rol !== 'administrador') return;
    const productos = listarInventario();
    const activos = productos.filter(p => p.activo);
    document.getElementById('total-productos').textContent = activos.length;
    document.getElementById('resumen-inventario').textContent =
        `${productos.length} juegos en inventario · ${productos.length - activos.length} retirados · ${activos.filter(p => p.stock === 0).length} publicados sin stock.`;
    const consulta = document.getElementById('buscar-producto').value.trim().toLocaleLowerCase();
    const categoria = document.getElementById('filtrar-categoria').value;
    const estado = document.getElementById('filtrar-estado').value;
    const filtrados = productos.filter(p =>
        p.nombre.toLocaleLowerCase().includes(consulta) && (!categoria || p.categoria === categoria) &&
        (estado === 'todos' || (estado === 'publicados' ? p.activo : !p.activo)));
    const tabla = document.getElementById('tabla-productos');
    tabla.replaceChildren();
    for (const p of filtrados) {
        const fila = agregarFila(tabla, [p.nombre, CATEGORIAS[p.categoria], formatoPesos(p.precio), `${p.descuento} %`, formatoPesos(precioVenta(p)), p.stock, p.activo ? 'Publicado' : 'Retirado']);
        fila.dataset.productoId = p.id;
        if (p.stock === 0) fila.children[5].classList.add('stock-agotado');
        const acciones = document.createElement('td');
        const grupo = document.createElement('div');
        grupo.className = 'acciones-producto';
        const editar = document.createElement('button');
        editar.type = 'button';
        editar.className = 'btn btn-sm acceso-limpiar';
        editar.dataset.editarProducto = p.id;
        editar.textContent = 'Editar';
        editar.setAttribute('aria-label', 'Editar ' + p.nombre);
        const publicar = document.createElement('button');
        publicar.type = 'button';
        publicar.className = 'btn btn-sm ' + (p.activo ? 'acceso-limpiar' : 'acceso-enviar');
        publicar.dataset.publicarProducto = p.id;
        publicar.textContent = p.activo ? 'Retirar' : 'Publicar';
        publicar.setAttribute('aria-label', (p.activo ? 'Retirar ' : 'Publicar ') + p.nombre);
        grupo.append(editar, publicar);
        acciones.append(grupo);
        fila.append(acciones);
    }
    if (!filtrados.length) {
        const fila = tabla.insertRow();
        const celda = fila.insertCell();
        celda.colSpan = 8;
        celda.className = 'text-center py-4';
        celda.textContent = 'No hay juegos que coincidan con los filtros.';
    }
}

function mostrarAdministracion() {
    if (!panel) return;
    const usuario = obtenerSesion();
    const permitido = usuario?.rol === 'administrador';
    panel.hidden = !permitido;
    document.getElementById('acceso-requerido').hidden = permitido;
    document.getElementById('mensaje-acceso').textContent = usuario
        ? 'Esta sección corresponde a la cuenta de administrador. Puedes ingresar con otra cuenta.'
        : 'Inicia sesión como administrador para gestionar el inventario.';
    document.getElementById('tabla-productos').replaceChildren();
    document.getElementById('tabla-usuarios').replaceChildren();
    document.getElementById('lista-pedidos-admin').replaceChildren();
    if (!permitido) {
        publicacionPendiente = null;
        for (const id of ['modal-producto', 'modal-publicacion']) {
            bootstrap.Modal.getInstance(document.getElementById(id))?.hide();
        }
        return;
    }
    renderInventario();
    mostrarUsuarios();
    mostrarPedidos();
}

function mostrarPedidos() {
    const lista = document.getElementById('lista-pedidos-admin');
    if (!lista) return;
    lista.replaceChildren();
    if (obtenerSesion()?.rol !== 'administrador') return;
    const pedidos = listarPedidosAdministracion();
    if (!pedidos.length) {
        const vacio = document.createElement('p');
        vacio.className = 'aviso-cuenta mb-0';
        vacio.textContent = 'Todavía no hay pedidos confirmados.';
        lista.append(vacio);
    }
    for (const pedido of pedidos) lista.append(crearTarjetaPedido(pedido, true));
}

function limpiarEditor() {
    const form = document.getElementById('form-producto');
    form.reset();
    limpiarFoto();
    delete form.dataset.validado;
    form.querySelectorAll('.is-invalid, .is-valid').forEach(c => {
        c.classList.remove('is-invalid', 'is-valid');
        c.removeAttribute('aria-invalid');
    });
    form.querySelectorAll('.invalid-feedback').forEach(e => e.textContent = '');
    document.getElementById('resultado-producto').textContent = '';
}

function mostrarErroresProducto() {
    const form = document.getElementById('form-producto');
    const errores = validarProducto(Object.fromEntries(new FormData(form)));
    for (const campo of form.querySelectorAll('[required]')) {
        const mensaje = errores[campo.name] ?? '';
        campo.classList.toggle('is-invalid', Boolean(mensaje));
        campo.classList.toggle('is-valid', !mensaje);
        campo.setAttribute('aria-invalid', String(Boolean(mensaje)));
        document.getElementById('error-' + campo.id).textContent = mensaje;
    }
    return errores;
}

function actualizarVistaPrevia() {
    const form = document.getElementById('form-producto');
    const datos = Object.fromEntries(new FormData(form));
    const errores = validarProducto(datos);
    document.getElementById('precio-final-producto').textContent = errores.precio || errores.descuento
        ? '—' : formatoPesos(precioVenta({ precio: Number(datos.precio), descuento: Number(datos.descuento) }));
    const imagen = document.getElementById('vista-imagen-producto');
    imagen.hidden = Boolean(errores.imagen);
    if (!errores.imagen) imagen.src = new URL(datos.imagen, raiz);
    else imagen.removeAttribute('src');
}

function abrirEditor(id = null) {
    if (obtenerSesion()?.rol !== 'administrador') throw new Error('Inicia sesión como administrador.');
    limpiarEditor();
    const form = document.getElementById('form-producto');
    const opciones = form.elements.namedItem('imagen');
    const crearOpcion = (nombre, ruta) => {
        const opcion = document.createElement('option');
        opcion.value = ruta;
        opcion.textContent = nombre;
        return opcion;
    };
    opciones.replaceChildren(crearOpcion('Seleccionar imagen', ''));
    const imagenes = new Map(PRODUCTOS_INICIALES.map(p => [p.imagen, p.nombre]));
    const producto = id ? obtenerProductoAdministracion(id) : null;
    if (producto) imagenes.set(producto.imagen, producto.imagen.startsWith('data:') ? 'Foto guardada de este juego' : producto.nombre);
    for (const [ruta, nombre] of imagenes) opciones.append(crearOpcion(nombre, ruta));
    if (producto) {
        for (const campo of ['id', 'nombre', 'categoria', 'descripcion', 'precio', 'descuento', 'stock', 'imagen']) {
            form.elements.namedItem(campo).value = producto[campo];
        }
    }
    document.getElementById('titulo-producto').textContent = id ? 'Editar juego' : 'Agregar juego';
    actualizarVistaPrevia();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modal-producto')).show();
}

if (panel) {
    mostrarAdministracion();
    document.addEventListener('sesion:cambio', mostrarAdministracion);
    document.addEventListener('productos:cambio', renderInventario);
    document.addEventListener('pedidos:cambio', mostrarPedidos);
    window.addEventListener('storage', evento => {
        if (!evento.key || evento.key.startsWith('tablefamily.mock.')) mostrarAdministracion();
    });
    window.addEventListener('pageshow', mostrarAdministracion);
    const filtros = document.getElementById('filtros-inventario');
    filtros.addEventListener('submit', e => e.preventDefault());
    filtros.addEventListener('input', renderInventario);
    filtros.addEventListener('change', renderInventario);
    panel.addEventListener('click', evento => {
        try {
            if (evento.target.closest('#agregar-producto')) abrirEditor();
            const editar = evento.target.closest('[data-editar-producto]');
            if (editar) abrirEditor(editar.dataset.editarProducto);
            const publicar = evento.target.closest('[data-publicar-producto]');
            if (publicar) {
                const producto = obtenerProductoAdministracion(publicar.dataset.publicarProducto);
                publicacionPendiente = { id: producto.id, activo: !producto.activo };
                document.getElementById('titulo-publicacion').textContent = producto.activo ? 'Retirar juego' : 'Publicar juego';
                document.getElementById('mensaje-publicacion').textContent = producto.activo
                    ? `¿Retirar “${producto.nombre}” del catálogo? Sus datos se conservarán y podrás publicarlo nuevamente.`
                    : `¿Volver a publicar “${producto.nombre}” en el catálogo?`;
                document.getElementById('error-publicacion').textContent = '';
                bootstrap.Modal.getOrCreateInstance(document.getElementById('modal-publicacion')).show();
            }
        } catch (error) { resultado(error.message, true); }
    });
    const form = document.getElementById('form-producto');
    form.addEventListener('submit', evento => {
        evento.preventDefault();
        if (fotoPendiente || errorFoto) {
            document.getElementById('resultado-producto').textContent = errorFoto || 'Espera mientras se procesa la foto.';
            return;
        }
        form.dataset.validado = 'true';
        const errores = mostrarErroresProducto();
        if (Object.keys(errores).length) {
            document.getElementById('resultado-producto').textContent = 'Revisa los campos indicados.';
            form.querySelector('.is-invalid')?.focus();
            return;
        }
        const boton = document.getElementById('guardar-producto');
        if (boton.disabled) return;
        boton.disabled = true;
        try {
            const datos = Object.fromEntries(new FormData(form));
            const producto = guardarProducto(datos, datos.id || null);
            resultado(`“${producto.nombre}” se guardó correctamente.`);
            bootstrap.Modal.getInstance(document.getElementById('modal-producto')).hide();
        } catch (error) {
            document.getElementById('resultado-producto').textContent = error.message;
        } finally { boton.disabled = false; }
    });
    for (const evento of ['input', 'change']) form.addEventListener(evento, () => {
        actualizarVistaPrevia();
        document.getElementById('resultado-producto').textContent = '';
        if (form.dataset.validado) mostrarErroresProducto();
    });
    const archivoFoto = document.getElementById('archivo-imagen-producto');
    form.elements.namedItem('imagen').addEventListener('change', limpiarFoto);
    archivoFoto.addEventListener('change', async () => {
        const archivo = archivoFoto.files?.[0];
        if (!archivo) return;
        const version = ++versionFoto;
        fotoPendiente = true;
        errorFoto = '';
        const guardar = document.getElementById('guardar-producto');
        const estado = document.getElementById('estado-archivo-producto');
        guardar.disabled = true;
        estado.classList.remove('text-danger');
        estado.textContent = 'Preparando foto…';
        try {
            const foto = await prepararFotoProducto(archivo);
            if (version !== versionFoto) return;
            const selector = form.elements.namedItem('imagen');
            selector.querySelector('[data-foto-subida]')?.remove();
            const opcion = document.createElement('option');
            opcion.dataset.fotoSubida = 'true';
            opcion.value = foto;
            opcion.textContent = 'Foto subida: ' + archivo.name;
            selector.append(opcion);
            selector.value = foto;
            actualizarVistaPrevia();
            if (form.dataset.validado) mostrarErroresProducto();
            estado.textContent = 'Foto lista. Presiona Guardar juego para conservarla.';
        } catch (error) {
            if (version !== versionFoto) return;
            errorFoto = error.message;
            estado.textContent = errorFoto;
            estado.classList.add('text-danger');
        } finally {
            if (version === versionFoto) {
                fotoPendiente = false;
                guardar.disabled = Boolean(errorFoto);
            }
        }
    });
    document.getElementById('modal-producto').addEventListener('hide.bs.modal', limpiarFoto);
    document.getElementById('modal-producto').addEventListener('shown.bs.modal', () => document.getElementById('producto-nombre').focus());
    document.getElementById('modal-producto').addEventListener('hidden.bs.modal', () => document.getElementById('agregar-producto').focus());
    document.getElementById('confirmar-publicacion').addEventListener('click', () => {
        if (!publicacionPendiente) return;
        try {
            const producto = cambiarPublicacion(publicacionPendiente.id, publicacionPendiente.activo);
            resultado(`“${producto.nombre}” quedó ${producto.activo ? 'publicado' : 'retirado'}.`);
            bootstrap.Modal.getInstance(document.getElementById('modal-publicacion')).hide();
        } catch (error) { document.getElementById('error-publicacion').textContent = error.message; }
    });
    document.getElementById('modal-publicacion').addEventListener('hidden.bs.modal', () => {
        publicacionPendiente = null;
        document.getElementById('agregar-producto').focus();
    });
}
