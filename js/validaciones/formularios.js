/* Reglas puras: no conocen HTML, Bootstrap ni almacenamiento. */
export function cumpleEdad(valor, hoy = new Date()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
    const [anio, mes, dia] = valor.split('-').map(Number);
    const nacimiento = new Date(anio, mes - 1, dia);
    if (nacimiento.getFullYear() !== anio || nacimiento.getMonth() !== mes - 1 ||
        nacimiento.getDate() !== dia || nacimiento > hoy) return false;
    let edad = hoy.getFullYear() - anio;
    if (hoy.getMonth() < mes - 1 || (hoy.getMonth() === mes - 1 && hoy.getDate() < dia)) edad--;
    return edad >= 13;
}

export function requisitosClave(valor = '') {
    return {
        longitud: valor.length >= 6 && valor.length <= 18,
        mayuscula: /[A-ZÁÉÍÓÚÜÑ]/.test(valor),
        minuscula: /[a-záéíóúüñ]/.test(valor),
        numero: /[0-9]/.test(valor)
    };
}

export function validarCampo(nombre, valor = '', datos = {}) {
    if (nombre === 'direccion') return '';
    if (!valor.trim()) return 'Este campo es obligatorio.';
    if (nombre === 'correo' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim())) {
        return 'Ingresa un correo válido, por ejemplo nombre@correo.cl.';
    }
    if (nombre === 'clave') {
        const reglas = requisitosClave(valor);
        if (!reglas.longitud) return 'La contraseña debe tener entre 6 y 18 caracteres.';
        if (!reglas.mayuscula) return 'Incluye al menos una letra mayúscula.';
        if (!reglas.minuscula) return 'Incluye al menos una letra minúscula.';
        if (!reglas.numero) return 'Incluye al menos un número.';
    }
    if (nombre === 'confirmacion' && valor !== datos.clave) return 'Las contraseñas no coinciden.';
    if (nombre === 'nacimiento' && !cumpleEdad(valor)) return 'Debes tener al menos 13 años cumplidos e ingresar una fecha válida.';
    return '';
}

export function validarRegistro(datos) {
    const errores = {};
    for (const campo of ['nombre', 'usuario', 'correo', 'clave', 'confirmacion', 'nacimiento']) {
        const error = validarCampo(campo, datos[campo] ?? '', datos);
        if (error) errores[campo] = error;
    }
    return errores;
}

export function validarPerfil(datos) {
    const errores = {};
    for (const campo of ['nombre', 'usuario', 'correo', 'nacimiento']) {
        const error = validarCampo(campo, datos[campo] ?? '', datos);
        if (error) errores[campo] = error;
    }
    return errores;
}
