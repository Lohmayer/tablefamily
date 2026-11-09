import { obtenerSesion } from '../servicios/sesion.js';
import { obtenerCarrito, agregarAlCarrito, cambiarCantidad, quitarDelCarrito, vaciarCarrito } from '../servicios/carrito.js';
import { confirmarCompra } from '../servicios/pedidos.js';
import { formatoPesos } from '../servicios/productos.js';
import { validarCompra } from '../validaciones/compra.js';

const raiz = new URL('../../', import.meta.url);
const pagina = document.getElementById('lineas-carrito');
let cotizacionConfirmada = null;
let solicitudId = null;
let procesando = false;

function mensaje(texto, error = false) {
    const salida = document.getElementById('mensaje-carrito') ?? document.getElementById('aviso-catalogo');
    if (!salida) return;
    salida.textContent = texto;
    salida.classList.toggle('text-danger', error);
}

function actualizarContador() {
    const admin = obtenerSesion()?.rol === 'administrador';
    const unidades = admin ? 0 : obtenerCarrito().unidades;
    document.querySelectorAll('[data-enlace-carrito]').forEach(enlace => {
        enlace.hidden = admin;
        enlace.setAttribute('aria-label', `Ver carrito: ${unidades} unidades`);
    });
    document.querySelectorAll('[data-cantidad-carrito]').forEach(badge => badge.textContent = unidades);
}

function botonCantidad(texto, etiqueta, id, delta, desactivado) {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'btn cantidad-boton';
    boton.textContent = texto;
    boton.dataset.cantidadProducto = id;
    boton.dataset.delta = delta;
    boton.disabled = desactivado;
    boton.setAttribute('aria-label', etiqueta);
    return boton;
}

function crearLinea(linea) {
    const tarjeta = document.createElement('article');
    tarjeta.className = 'panel-cuenta linea-carrito';
    tarjeta.dataset.lineaCarrito = linea.productoId;
    const fila = document.createElement('div');
    fila.className = 'row g-3 align-items-center';
    const presentacion = document.createElement('div');
    presentacion.className = 'col-12 col-md-5 d-flex align-items-center gap-3';
    if (linea.imagen) {
        const imagen = document.createElement('img');
        imagen.className = 'imagen-carrito';
        imagen.src = new URL(linea.imagen, raiz);
        imagen.alt = linea.nombre;
        presentacion.append(imagen);
    }
    const info = document.createElement('div');
    info.className = 'info-linea';
    const titulo = document.createElement('h2');
    titulo.textContent = linea.nombre;
    const precio = document.createElement('p');
    precio.className = 'precio-unitario mb-0';
    precio.textContent = formatoPesos(linea.precioUnitario) + ' por unidad';
    info.append(titulo, precio);
    presentacion.append(info);
    const cantidades = document.createElement('div');
    cantidades.className = 'col-7 col-md-4';
    const grupo = document.createElement('div');
    grupo.className = 'control-cantidad';
    const campo = document.createElement('input');
    campo.type = 'number';
    campo.className = 'form-control cantidad-input';
    campo.min = 1;
    campo.max = Math.max(1, linea.stock);
    campo.step = 1;
    campo.value = linea.cantidad;
    campo.dataset.cantidadInput = linea.productoId;
    campo.setAttribute('aria-label', 'Cantidad de ' + linea.nombre);
    campo.disabled = linea.stock === 0;
    grupo.append(
        botonCantidad('−', 'Reducir cantidad de ' + linea.nombre, linea.productoId, -1, linea.cantidad <= 1 || linea.stock === 0),
        campo,
        botonCantidad('+', 'Aumentar cantidad de ' + linea.nombre, linea.productoId, 1, linea.cantidad >= linea.stock)
    );
    cantidades.append(grupo);
    const acciones = document.createElement('div');
    acciones.className = 'col-5 col-md-3 text-end';
    const subtotal = document.createElement('p');
    subtotal.className = 'subtotal-carrito mb-1';
    subtotal.textContent = formatoPesos(linea.subtotal);
    const quitar = document.createElement('button');
    quitar.type = 'button';
    quitar.className = 'btn quitar-carrito';
    quitar.dataset.quitarCarrito = linea.productoId;
    quitar.textContent = 'Quitar';
    quitar.setAttribute('aria-label', 'Quitar ' + linea.nombre + ' del carrito');
    acciones.append(subtotal, quitar);
    fila.append(presentacion, cantidades, acciones);
    tarjeta.append(fila);
    if (linea.error) {
        const problema = document.createElement('p');
        problema.className = 'text-danger mt-3 mb-0';
        problema.textContent = linea.error;
        tarjeta.append(problema);
    }
    return tarjeta;
}

function renderCarrito() {
    actualizarContador();
    if (!pagina) return;
    const usuario = obtenerSesion();
    const admin = usuario?.rol === 'administrador';
    document.getElementById('carrito-no-disponible').hidden = !admin;
    document.getElementById('carrito-contenido').hidden = admin;
    document.getElementById('carrito-vacio').hidden = true;
    pagina.replaceChildren();
    if (admin) {
        bootstrap.Modal.getInstance(document.getElementById('modal-compra'))?.hide();
        return;
    }
    const resumen = obtenerCarrito();
    document.getElementById('carrito-contenido').hidden = resumen.lineas.length === 0;
    document.getElementById('carrito-vacio').hidden = resumen.lineas.length > 0;
    for (const linea of resumen.lineas) pagina.append(crearLinea(linea));
    document.getElementById('carrito-normal').textContent = formatoPesos(resumen.totalNormal);
    document.getElementById('carrito-ahorro').textContent = '− ' + formatoPesos(resumen.ahorro);
    document.getElementById('carrito-total').textContent = formatoPesos(resumen.total);
    document.getElementById('aviso-estado-carrito').textContent = resumen.valido
        ? 'El stock se comprobará nuevamente al confirmar.' : 'Revisa los juegos y las cantidades indicadas para continuar.';
    document.getElementById('abrir-compra').hidden = !usuario;
    document.getElementById('abrir-compra').disabled = !resumen.valido;
    document.getElementById('ingresar-para-comprar').hidden = Boolean(usuario);
    if (!usuario) bootstrap.Modal.getInstance(document.getElementById('modal-compra'))?.hide();
    if (cotizacionConfirmada && !procesando) actualizarFormularioCompra();
}

function datosCompra() {
    const form = document.getElementById('form-compra');
    return {
        metodoPago: form.elements.metodoPago.value,
        entrega: form.elements.entrega.value,
        direccion: form.elements.direccion.value,
        acepto: form.elements.acepto.checked
    };
}

function actualizarFormularioCompra(mostrar = false) {
    const form = document.getElementById('form-compra');
    const datos = datosCompra();
    document.getElementById('campo-direccion-compra').hidden = datos.entrega !== 'despacho';
    form.elements.direccion.required = datos.entrega === 'despacho';
    const errores = validarCompra(datos);
    if (mostrar) {
        for (const nombre of ['metodoPago', 'entrega', 'direccion', 'acepto']) {
            const campo = form.elements.namedItem(nombre);
            campo.classList.toggle('is-invalid', Boolean(errores[nombre]));
            campo.setAttribute('aria-invalid', String(Boolean(errores[nombre])));
            document.getElementById('error-compra-' + nombre).textContent = errores[nombre] ?? '';
        }
    }
    const usuario = obtenerSesion();
    const resumen = usuario?.rol === 'cliente' ? obtenerCarrito() : null;
    const cambio = !resumen?.valido || resumen.cotizacion !== cotizacionConfirmada;
    document.getElementById('confirmar-compra').disabled = procesando || cambio || Object.keys(errores).length > 0;
    if (cambio && !procesando) {
        document.getElementById('resultado-compra').textContent = 'El carrito cambió. Vuelve al carrito, revisa el resumen y abre la confirmación nuevamente.';
    }
}

function abrirConfirmacion() {
    if (obtenerSesion()?.rol !== 'cliente') throw new Error('Inicia sesión como cliente para continuar.');
    const resumen = obtenerCarrito();
    if (!resumen.valido) throw new Error('Revisa las cantidades y la disponibilidad de los juegos.');
    cotizacionConfirmada = resumen.cotizacion;
    solicitudId = crypto.randomUUID();
    const form = document.getElementById('form-compra');
    form.reset();
    form.querySelectorAll('.is-invalid').forEach(c => c.classList.remove('is-invalid'));
    form.querySelectorAll('[aria-invalid]').forEach(c => c.removeAttribute('aria-invalid'));
    form.querySelectorAll('.invalid-feedback').forEach(e => e.textContent = '');
    form.elements.direccion.value = obtenerSesion().direccion ?? '';
    document.getElementById('resultado-compra').textContent = '';
    document.getElementById('total-confirmacion').textContent = formatoPesos(resumen.total);
    actualizarFormularioCompra();
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modal-compra')).show();
}

// Estos eventos se delegan para funcionar con tarjetas y encabezados cargados dinámicamente.
document.addEventListener('click', evento => {
    try {
        const agregar = evento.target.closest('[data-agregar-carrito]');
        if (agregar) {
            agregarAlCarrito(agregar.dataset.agregarCarrito);
            mensaje('Juego agregado al carrito. Puedes seguir eligiendo o abrir tu carrito.');
        }
        const quitar = evento.target.closest('[data-quitar-carrito]');
        if (quitar) {
            quitarDelCarrito(quitar.dataset.quitarCarrito);
            mensaje('Juego quitado del carrito.');
        }
        const cantidad = evento.target.closest('[data-cantidad-producto]');
        if (cantidad) {
            const id = cantidad.dataset.cantidadProducto;
            const linea = obtenerCarrito().lineas.find(l => l.productoId === id);
            cambiarCantidad(id, linea.cantidad + Number(cantidad.dataset.delta));
            mensaje('Cantidad actualizada.');
            [...document.querySelectorAll('[data-cantidad-input]')].find(c => c.dataset.cantidadInput === id)?.focus();
        }
        if (evento.target.closest('#vaciar-carrito')) { vaciarCarrito(); mensaje('Carrito vaciado.'); }
        if (evento.target.closest('#abrir-compra')) abrirConfirmacion();
    } catch (error) { mensaje(error.message, true); }
});

document.addEventListener('change', evento => {
    const campo = evento.target.closest('[data-cantidad-input]');
    if (!campo) return;
    try { cambiarCantidad(campo.dataset.cantidadInput, Number(campo.value)); mensaje('Cantidad actualizada.'); }
    catch (error) { renderCarrito(); mensaje(error.message, true); }
});

if (pagina) {
    const form = document.getElementById('form-compra');
    for (const tipo of ['input', 'change']) form.addEventListener(tipo, () => {
        document.getElementById('resultado-compra').textContent = '';
        actualizarFormularioCompra();
    });
    form.addEventListener('submit', async evento => {
        evento.preventDefault();
        if (procesando) return;
        actualizarFormularioCompra(true);
        if (document.getElementById('confirmar-compra').disabled) return;
        procesando = true;
        document.getElementById('confirmar-compra').disabled = true;
        try {
            const pedido = await confirmarCompra(datosCompra(), cotizacionConfirmada, solicitudId);
            bootstrap.Modal.getInstance(document.getElementById('modal-compra'))?.hide();
            location.assign(new URL('paginas/compras.html?pedido=' + encodeURIComponent(pedido.id), raiz));
        } catch (error) {
            document.getElementById('resultado-compra').textContent = error.message;
        } finally {
            procesando = false;
            actualizarFormularioCompra();
        }
    });
    document.getElementById('modal-compra').addEventListener('hidden.bs.modal', () => {
        cotizacionConfirmada = null;
        solicitudId = null;
        document.getElementById('abrir-compra').focus();
    });
}
for (const evento of ['carrito:cambio', 'sesion:cambio', 'productos:cambio', 'componentes:listos']) document.addEventListener(evento, renderCarrito);
window.addEventListener('storage', evento => {
    if (!evento.key || evento.key.startsWith('tablefamily.mock.')) renderCarrito();
});
window.addEventListener('pageshow', renderCarrito);
renderCarrito();
