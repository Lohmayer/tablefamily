/* Validación frontend: no guarda cuentas ni contraseñas. */

// CAMBIO ENTRE INICIAR SESIÓN Y ABRIR CUENTA
function cambiarVistaAcceso(vista) {
    const modal = document.getElementById("modal-acceso");

    if (!modal) return;

    const registro = vista === "registro";

    modal.querySelector("#form-login").hidden = registro;
    modal.querySelector("#form-registro").hidden = !registro;

    modal.querySelector("#titulo-acceso").textContent =
        registro ? "Abrir cuenta" : "Iniciar sesión";

    modal.querySelectorAll("[data-vista-acceso]").forEach(function (boton) {
        const activo = boton.dataset.vistaAcceso === vista;

        boton.classList.toggle("seleccionada", activo);
        boton.setAttribute("aria-pressed", String(activo));
    });

    modal.querySelector(".modal-body").scrollTop = 0;

    actualizarEstadoRegistro();

    bootstrap.Modal.getInstance(modal)?.handleUpdate();
}

// MENSAJES Y ESTADOS BOOTSTRAP
function mostrarErrorAcceso(campo, mensaje) {
    const invalido = Boolean(mensaje);

    campo.setAttribute("aria-invalid", String(invalido));
    campo.classList.toggle("is-invalid", invalido);
    campo.classList.toggle("is-valid", !invalido);

    const error = document.getElementById("error-" + campo.id);

    if (error) {
        error.textContent = mensaje;
    }
}

// EDAD MÍNIMA: 13 AÑOS CUMPLIDOS
function cumpleEdadAcceso(valor, hoy = new Date()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;

    const [anio, mes, dia] = valor.split("-").map(Number);
    const nacimiento = new Date(anio, mes - 1, dia);

    if (
        nacimiento.getFullYear() !== anio ||
        nacimiento.getMonth() !== mes - 1 ||
        nacimiento.getDate() !== dia ||
        nacimiento > hoy
    ) {
        return false;
    }

    let edad = hoy.getFullYear() - anio;

    const aunNoCumple =
        hoy.getMonth() < mes - 1 ||
        (
            hoy.getMonth() === mes - 1 &&
            hoy.getDate() < dia
        );

    if (aunNoCumple) edad--;

    return edad >= 13;
}

// VALIDACIÓN INDIVIDUAL DE CAMPOS
function errorCampoAcceso(campo) {
    const valor = campo.value;

    if (campo.required && !valor.trim()) {
        return "Este campo es obligatorio.";
    }

    if (
        campo.type === "email" &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim())
    ) {
        return "Ingresa un correo válido, por ejemplo nombre@correo.cl.";
    }

    if (campo.id === "registro-clave") {
        if (valor.length < 6 || valor.length > 18) {
            return "La contraseña debe tener entre 6 y 18 caracteres.";
        }

        if (!/[A-ZÁÉÍÓÚÜÑ]/.test(valor)) {
            return "Incluye al menos una letra mayúscula.";
        }

        if (!/[0-9]/.test(valor)) {
            return "Incluye al menos un número.";
        }
    }

    if (campo.id === "registro-confirmacion") {
        const clave = document.getElementById("registro-clave");

        if (!clave || valor !== clave.value) {
            return "Las contraseñas no coinciden.";
        }
    }

    if (
        campo.id === "registro-nacimiento" &&
        !cumpleEdadAcceso(valor)
    ) {
        return "Ingresa una fecha válida. Debes tener 13 años cumplidos o más.";
    }

    return "";
}

// REQUISITOS DE CONTRASEÑA EN ROJO O AZUL
function actualizarReglaClave(id, cumple) {
    const regla = document.getElementById(id);

    if (!regla) return;

    regla.classList.toggle("cumplida", cumple);

    const icono = regla.querySelector(".regla-icono");

    if (icono) {
        icono.textContent = cumple ? "✓" : "○";
    }
}

function actualizarRequisitosClave() {
    const clave = document.getElementById("registro-clave");
    const confirmacion = document.getElementById("registro-confirmacion");

    if (!clave || !confirmacion) return;

    const valor = clave.value;

    actualizarReglaClave(
        "regla-longitud",
        valor.length >= 6 && valor.length <= 18
    );

    actualizarReglaClave(
        "regla-mayuscula",
        /[A-ZÁÉÍÓÚÜÑ]/.test(valor)
    );

    actualizarReglaClave(
        "regla-numero",
        /[0-9]/.test(valor)
    );

    actualizarReglaClave(
        "ayuda-confirmacion",
        valor.length > 0 && valor === confirmacion.value
    );
}

// BLOQUEO DEL BOTÓN QUE ESTÁ DENTRO DEL REGISTRO
function actualizarBotonRegistro() {
    const formulario = document.getElementById("form-registro");

    if (!formulario) return false;

    const boton = formulario.querySelector('button[type="submit"]');

    if (!boton) return false;

    const idsObligatorios = [
        "registro-nombre",
        "registro-usuario",
        "registro-correo",
        "registro-clave",
        "registro-confirmacion",
        "registro-nacimiento"
    ];

    const todoValido = idsObligatorios.every(function (id) {
        const campo = formulario.querySelector("#" + id);

        return (
            campo !== null &&
            campo.value.trim() !== "" &&
            errorCampoAcceso(campo) === ""
        );
    });

    boton.id = "boton-validar-registro";
    boton.disabled = !todoValido;

    return todoValido;
}

function actualizarEstadoRegistro() {
    actualizarRequisitosClave();
    actualizarBotonRegistro();
}

// ABRIR MODAL Y CAMBIAR FORMULARIO
document.addEventListener("click", function (evento) {
    const abrir = evento.target.closest("[data-abrir-acceso]");

    if (abrir) {
        const modal = document.getElementById("modal-acceso");

        if (!modal || modal.classList.contains("show")) return;

        cambiarVistaAcceso("login");

        if (!modal.dataset.preparado) {
            modal.addEventListener("shown.bs.modal", function () {
                actualizarEstadoRegistro();
                modal.querySelector("#login-usuario")?.focus();
            });

            modal.addEventListener("hidden.bs.modal", function () {
                modal.querySelectorAll("form").forEach(function (formulario) {
                    formulario.reset();
                });

                actualizarEstadoRegistro();

                document.querySelector("[data-abrir-acceso]")?.focus();
            });

            modal.dataset.preparado = "true";
        }

        bootstrap.Modal.getOrCreateInstance(modal).show();
        return;
    }

    const opcion = evento.target.closest("[data-vista-acceso]");

    if (opcion) {
        cambiarVistaAcceso(opcion.dataset.vistaAcceso);
    }
});

// VALIDAR AL ENVIAR: TAMBIÉN CONTROLA EL ENVÍO CON ENTER
document.addEventListener("submit", function (evento) {
    const formulario = evento.target;

    if (!formulario.matches(".form-acceso")) return;

    evento.preventDefault();

    formulario.dataset.validado = "true";

    let primerError = null;

    formulario.querySelectorAll("input[required]").forEach(function (campo) {
        const error = errorCampoAcceso(campo);

        mostrarErrorAcceso(campo, error);

        if (error && !primerError) {
            primerError = campo;
        }
    });

    const resultado = formulario.querySelector(".acceso-resultado");

    const registroIncompleto =
        formulario.id === "form-registro" &&
        !actualizarBotonRegistro();

    if (primerError || registroIncompleto) {
        resultado.textContent = "Completa correctamente todos los campos obligatorios.";
        primerError?.focus();

        // No se continúa ni se envía información.
        return;
    }

    resultado.textContent = formulario.id === "form-registro"
        ? "Datos válidos. La creación de la cuenta estará disponible al conectar el servidor."
        : "Campos válidos. El inicio de sesión estará disponible al conectar el servidor.";
});

// ACTUALIZAR MIENTRAS SE ESCRIBE O CAMBIA UN CAMPO
function procesarCambioAcceso(evento) {
    const campo = evento.target;

    if (!campo.matches(".form-acceso input")) return;

    const formulario = campo.form;

    formulario.querySelector(".acceso-resultado").textContent = "";

    if (formulario.id === "form-registro") {
        actualizarEstadoRegistro();
    }

    // Los errores de campo se actualizan después del primer intento.
    // Los requisitos y el botón se actualizan desde el principio.
    if (!formulario.dataset.validado) return;

    if (campo.required) {
        mostrarErrorAcceso(campo, errorCampoAcceso(campo));
    }

    if (campo.id === "registro-clave") {
        const confirmacion = document.getElementById("registro-confirmacion");

        if (confirmacion) {
            mostrarErrorAcceso(
                confirmacion,
                errorCampoAcceso(confirmacion)
            );
        }
    }
}

document.addEventListener("input", procesarCambioAcceso);
document.addEventListener("change", procesarCambioAcceso);

// LIMPIAR DATOS, ERRORES Y ESTADOS
document.addEventListener("reset", function (evento) {
    const formulario = evento.target;

    if (!formulario.matches(".form-acceso")) return;

    delete formulario.dataset.validado;

    formulario.querySelectorAll("input").forEach(function (campo) {
        campo.removeAttribute("aria-invalid");
        campo.classList.remove("is-valid", "is-invalid");
    });

    formulario.querySelectorAll(".invalid-feedback").forEach(function (error) {
        error.textContent = "";
    });

    formulario.querySelector(".acceso-resultado").textContent = "";

    if (formulario.id === "form-registro") {
        const boton = formulario.querySelector('button[type="submit"]');

        if (boton) {
            boton.disabled = true;
        }
    }

    // El evento reset ocurre antes de que se restablezcan los valores.
    requestAnimationFrame(actualizarEstadoRegistro);
});

// INICIALIZACIÓN: EL ENCABEZADO SE CARGA CON FETCH
function prepararRegistroInicial() {
    if (!document.getElementById("form-registro")) return false;

    actualizarEstadoRegistro();
    return true;
}

if (!prepararRegistroInicial()) {
    const observadorRegistro = new MutationObserver(function () {
        if (prepararRegistroInicial()) {
            observadorRegistro.disconnect();
        }
    });

    observadorRegistro.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
}