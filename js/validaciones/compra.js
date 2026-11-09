export function validarCompra(datos) {
    const errores = {};
    if (!['tarjeta-demo', 'transferencia-demo'].includes(datos.metodoPago)) errores.metodoPago = 'Selecciona un medio de pago simulado.';
    if (!['retiro', 'despacho'].includes(datos.entrega)) errores.entrega = 'Selecciona retiro o despacho.';
    if (datos.entrega === 'despacho' && (!String(datos.direccion ?? '').trim() || String(datos.direccion).trim().length > 200)) {
        errores.direccion = 'Ingresa una dirección de despacho de hasta 200 caracteres.';
    }
    if (datos.acepto !== true) errores.acepto = 'Debes confirmar que entiendes que esta compra es simulada.';
    return errores;
}
