/* Reglas de inventario independientes del DOM. Los precios están en pesos chilenos. */
export const CATEGORIAS = Object.freeze({
    estrategia: 'Estrategia', familiares: 'Familiares', cartas: 'Cartas', cooperativos: 'Cooperativos'
});

export const MAX_IMAGEN_BYTES = 1024 * 1024;
export function imagenProductoValida(valor) {
    if (typeof valor !== 'string') return false;
    if (/^img\/[A-Za-z0-9_-]+\.(png|jpe?g|webp)$/i.test(valor)) return true;
    if (valor.length > Math.ceil(MAX_IMAGEN_BYTES / 3) * 4 + 40) return false;
    const partes = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(valor);
    if (!partes || partes[2].length % 4 !== 0) return false;
    try {
        const bytes = atob(partes[2]);
        if (bytes.length > MAX_IMAGEN_BYTES) return false;
        if (partes[1] === 'png') return bytes.startsWith('\x89PNG\r\n\x1a\n');
        if (partes[1] === 'jpeg') return bytes.startsWith('\xff\xd8\xff');
        return bytes.startsWith('RIFF') && bytes.slice(8, 12) === 'WEBP';
    } catch { return false; }
}

export function validarProducto(datos) {
    const errores = {};
    const nombre = String(datos.nombre ?? '').trim();
    const descripcion = String(datos.descripcion ?? '').trim();
    if (!nombre || nombre.length > 100) errores.nombre = 'Ingresa un nombre de hasta 100 caracteres.';
    if (!descripcion || descripcion.length > 1000) errores.descripcion = 'Ingresa una descripción de hasta 1000 caracteres.';
    if (!Object.hasOwn(CATEGORIAS, datos.categoria)) errores.categoria = 'Selecciona una categoría válida.';
    if (!imagenProductoValida(datos.imagen)) {
        errores.imagen = 'Selecciona una imagen del proyecto o sube una foto válida desde tu computador.';
    }
    for (const [campo, minimo, maximo, mensaje] of [
        ['precio', 1, 1000000000, 'Ingresa un precio entero entre $1 y $1.000.000.000.'],
        ['descuento', 0, 100, 'El descuento debe ser un entero entre 0 y 100 %.'],
        ['stock', 0, 1000000, 'El stock debe ser un entero entre 0 y 1.000.000.']
    ]) {
        const valor = Number(datos[campo]);
        if (String(datos[campo] ?? '').trim() === '' || !Number.isSafeInteger(valor) || valor < minimo || valor > maximo) {
            errores[campo] = mensaje;
        }
    }
    return errores;
}
