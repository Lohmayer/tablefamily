import { formatoPesos } from '../servicios/productos.js';

const pagos = { 'tarjeta-demo': 'Tarjeta (simulada)', 'transferencia-demo': 'Transferencia (simulada)' };
export function crearTarjetaPedido(pedido, administrador = false) {
    const tarjeta = document.createElement('article');
    tarjeta.className = 'panel-cuenta tarjeta-pedido';
    tarjeta.dataset.pedidoId = pedido.id;
    const cabecera = document.createElement('div');
    cabecera.className = 'd-flex flex-wrap gap-2 align-items-center justify-content-between';
    const titulo = document.createElement('h2');
    titulo.textContent = 'Pedido ' + pedido.codigo;
    const total = document.createElement('strong');
    total.className = 'subtotal-carrito';
    total.textContent = formatoPesos(pedido.total);
    cabecera.append(titulo, total);
    const fecha = document.createElement('p');
    fecha.className = 'aviso-cuenta';
    fecha.textContent = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(pedido.fecha)) + ' · ' + pedido.estado;
    tarjeta.append(cabecera, fecha);
    if (administrador) {
        const cliente = document.createElement('p');
        cliente.textContent = 'Cliente: ' + pedido.cliente.nombre + ' · ' + pedido.cliente.correo;
        tarjeta.append(cliente);
    }
    const detalles = document.createElement('details');
    const resumen = document.createElement('summary');
    resumen.textContent = 'Ver detalle de la compra';
    detalles.append(resumen);
    const scroll = document.createElement('div');
    scroll.className = 'table-responsive mt-3';
    scroll.tabIndex = 0;
    scroll.setAttribute('role', 'region');
    scroll.setAttribute('aria-label', 'Detalle del pedido ' + pedido.codigo);
    const tabla = document.createElement('table');
    tabla.className = 'table tabla-panel';
    const caption = document.createElement('caption');
    caption.textContent = 'Valores registrados al momento de confirmar la compra.';
    tabla.append(caption);
    const head = tabla.createTHead().insertRow();
    for (const nombre of ['Juego', 'Cantidad', 'Precio unitario', 'Subtotal']) {
        const th = document.createElement('th');
        th.scope = 'col';
        th.textContent = nombre;
        head.append(th);
    }
    const tbody = tabla.createTBody();
    for (const linea of pedido.lineas) {
        const fila = tbody.insertRow();
        for (const valor of [linea.nombre, linea.cantidad, formatoPesos(linea.precioUnitario), formatoPesos(linea.subtotal)]) {
            fila.insertCell().textContent = valor;
        }
    }
    scroll.append(tabla);
    detalles.append(scroll);
    const entrega = document.createElement('p');
    entrega.className = 'mt-3 mb-1';
    entrega.textContent = pedido.entrega === 'despacho' ? 'Despacho a: ' + pedido.direccion : 'Retiro en tienda';
    const pago = document.createElement('p');
    pago.className = 'mb-0';
    pago.textContent = 'Medio de pago: ' + (pagos[pedido.metodoPago] ?? 'Pago simulado');
    detalles.append(entrega, pago);
    tarjeta.append(detalles);
    return tarjeta;
}
