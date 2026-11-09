import { obtenerSesion } from '../servicios/sesion.js';
import { listarMisPedidos } from '../servicios/pedidos.js';
import { crearTarjetaPedido } from './pedidos.js';

const lista = document.getElementById('lista-compras');
function renderCompras() {
    if (!lista) return;
    const usuario = obtenerSesion();
    const permitido = usuario?.rol === 'cliente';
    document.getElementById('compras-requiere-cliente').hidden = permitido;
    document.getElementById('compras-vacias').hidden = true;
    document.getElementById('mensaje-compras').textContent = '';
    lista.replaceChildren();
    if (!permitido) return;
    const pedidos = listarMisPedidos();
    document.getElementById('compras-vacias').hidden = pedidos.length > 0;
    const destacado = new URLSearchParams(window.location.search).get('pedido');
    for (const pedido of pedidos) {
        const tarjeta = crearTarjetaPedido(pedido);
        if (pedido.id === destacado) {
            tarjeta.classList.add('pedido-confirmado');
            tarjeta.querySelector('details').open = true;
            document.getElementById('mensaje-compras').textContent = 'Compra simulada confirmada. Tu pedido es ' + pedido.codigo + '.';
        }
        lista.append(tarjeta);
    }
}
if (lista) {
    for (const evento of ['sesion:cambio', 'pedidos:cambio']) document.addEventListener(evento, renderCompras);
    window.addEventListener('storage', evento => {
        if (!evento.key || evento.key.startsWith('tablefamily.mock.')) renderCompras();
    });
    window.addEventListener('pageshow', renderCompras);
    renderCompras();
}
