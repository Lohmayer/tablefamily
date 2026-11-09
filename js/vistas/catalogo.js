import { listarProductos, precioVenta, formatoPesos } from '../servicios/productos.js';
import { CATEGORIAS } from '../validaciones/productos.js';
import { obtenerSesion } from '../servicios/sesion.js';

const grilla = document.querySelector('.grilla-productos');
if (grilla) {
    const plantilla = grilla.querySelector('.producto').cloneNode(true);
    const aviso = document.createElement('p');
    aviso.id = 'aviso-catalogo';
    aviso.className = 'mensaje-carrito';
    aviso.setAttribute('role', 'status');
    aviso.setAttribute('aria-live', 'polite');
    grilla.before(aviso);
    function renderCatalogo() {
    const productos = listarProductos(document.body.dataset.categoria);
    const fragmento = document.createDocumentFragment();
    const raiz = new URL('../../', import.meta.url);
    for (const producto of productos) {
        const col = document.createElement('div');
        col.className = 'col-12 col-md-6 col-lg-4';
        const tarjeta = plantilla.cloneNode(true);
        tarjeta.dataset.productoId = producto.id;
        tarjeta.setAttribute('aria-labelledby', 'nombre-' + producto.id);
        const titulo = tarjeta.querySelector('h3');
        titulo.id = 'nombre-' + producto.id;
        titulo.textContent = producto.nombre;
        const imagen = tarjeta.querySelector('img');
        imagen.src = new URL(producto.imagen, raiz);
        imagen.alt = producto.nombre;
        tarjeta.querySelector('.producto-descripcion').textContent = producto.descripcion;
        tarjeta.querySelector('.producto-categoria').textContent = CATEGORIAS[producto.categoria];
        const stock = document.createElement('p');
        stock.className = 'stock-producto ' + (producto.stock === 0 ? 'stock-agotado' : '');
        stock.textContent = producto.stock === 0 ? 'Agotado' : `${producto.stock} unidades disponibles`;
        tarjeta.querySelector('.producto-contenido').insertBefore(stock, tarjeta.querySelector('.producto-precios'));
        const distintivo = tarjeta.querySelector('.distintivo');
        distintivo.className = 'distintivo ' + (producto.descuento ? 'descuento' : 'sin-descuento');
        distintivo.textContent = producto.descuento ? `${producto.descuento} % de descuento` : 'Sin descuento';
        const precios = tarjeta.querySelector('.producto-precios');
        precios.replaceChildren();
        if (producto.descuento) {
            const anterior = document.createElement('p');
            anterior.className = 'precio-anterior';
            anterior.append('Precio normal: ');
            const del = document.createElement('del');
            del.textContent = formatoPesos(producto.precio);
            anterior.append(del);
            precios.append(anterior);
        }
        const venta = document.createElement('p');
        venta.className = 'precio-venta';
        const etiqueta = document.createElement('span');
        etiqueta.textContent = 'Precio de venta';
        const valor = document.createElement('strong');
        valor.textContent = formatoPesos(precioVenta(producto));
        venta.append(etiqueta, valor);
        precios.append(venta);
        if (producto.descuento) {
            const ahorro = document.createElement('p');
            ahorro.className = 'ahorro';
            ahorro.textContent = 'Ahorras ' + formatoPesos(producto.precio - precioVenta(producto));
            precios.append(ahorro);
        }
        if (obtenerSesion()?.rol === 'administrador') {
            const enlace = document.createElement('a');
            enlace.className = 'btn acceso-limpiar w-100 mt-3';
            enlace.href = new URL('paginas/administracion.html', raiz);
            enlace.textContent = 'Gestionar inventario';
            precios.append(enlace);
        } else {
            const agregar = document.createElement('button');
            agregar.type = 'button';
            agregar.className = 'btn acceso-enviar w-100 mt-3';
            agregar.dataset.agregarCarrito = producto.id;
            agregar.disabled = producto.stock === 0;
            agregar.textContent = producto.stock === 0 ? 'Agotado' : 'Agregar al carrito';
            agregar.setAttribute('aria-label', 'Agregar ' + producto.nombre + ' al carrito');
            precios.append(agregar);
        }
        col.append(tarjeta);
        fragmento.append(col);
    }
    if (!productos.length) {
        const vacio = document.createElement('p');
        vacio.className = 'col-12 catalogo-vacio';
        vacio.textContent = 'Por ahora no hay juegos publicados en esta categoría.';
        fragmento.append(vacio);
    }
    grilla.replaceChildren(fragmento);
    const cuenta = document.querySelector('.encabezado-catalogo > p');
    if (cuenta) cuenta.textContent = `${productos.length} juegos disponibles en el catálogo`;
    }
    renderCatalogo();
    document.addEventListener('productos:cambio', renderCatalogo);
    document.addEventListener('sesion:cambio', renderCatalogo);
    window.addEventListener('pageshow', renderCatalogo);
    window.addEventListener('storage', evento => {
        if (!evento.key || evento.key.startsWith('tablefamily.mock.')) renderCatalogo();
    });
}
