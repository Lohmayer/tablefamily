import { imagenProductoValida } from '../validaciones/productos.js';

// En el mock se guarda la imagen en los datos locales. Un backend recibirá el archivo.
export async function prepararFotoProducto(archivo) {
    if (!archivo || !['image/png', 'image/jpeg', 'image/webp'].includes(archivo.type)) {
        throw new Error('Selecciona una foto PNG, JPG o WebP.');
    }
    if (!archivo.size || archivo.size > 5 * 1024 * 1024) throw new Error('La foto debe pesar hasta 5 MB y no estar vacía.');
    const ruta = URL.createObjectURL(archivo);
    try {
        const imagen = new Image();
        await new Promise((resolve, reject) => {
            imagen.onload = resolve;
            imagen.onerror = () => reject(new Error('No se pudo abrir la foto. Prueba con otra imagen.'));
            imagen.src = ruta;
        });
        if (!imagen.naturalWidth || !imagen.naturalHeight) throw new Error('La imagen no tiene dimensiones válidas.');
        const escala = Math.min(1, 1200 / Math.max(imagen.naturalWidth, imagen.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(imagen.naturalWidth * escala));
        canvas.height = Math.max(1, Math.round(imagen.naturalHeight * escala));
        const contexto = canvas.getContext('2d');
        if (!contexto) throw new Error('El navegador no pudo procesar la foto.');
        contexto.fillStyle = '#ffffff';
        contexto.fillRect(0, 0, canvas.width, canvas.height);
        contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);
        const datos = canvas.toDataURL('image/jpeg', 0.82);
        if (!imagenProductoValida(datos)) throw new Error('La foto procesada es demasiado grande. Prueba con una imagen más pequeña.');
        return datos;
    } finally { URL.revokeObjectURL(ruta); }
}
