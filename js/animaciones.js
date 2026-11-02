let efectoActivo = false;

document.addEventListener("click", function (evento) {
    const enlace = evento.target.closest(".tarjeta-enlace");

    if (!enlace) return;

    // Permite abrir enlaces en otra pestaña.
    if (
        evento.button !== 0 ||
        evento.ctrlKey ||
        evento.metaKey ||
        evento.shiftKey ||
        evento.altKey
    ) {
        return;
    }

    const reducirMovimiento = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducirMovimiento) return;

    const imagen = enlace.querySelector(".tarjeta-imagen");
    const titulo = enlace.querySelector("h3");

    if (!imagen || !titulo) return;

    evento.preventDefault();

    if (efectoActivo) return;
    efectoActivo = true;

    const posicion = imagen.getBoundingClientRect();
    const fondo = getComputedStyle(imagen).backgroundImage;

    const portal = document.createElement("div");
    portal.dataset.portal = "true";

    Object.assign(portal.style, {
        position: "fixed",
        zIndex: "99999",
        left: posicion.left + "px",
        top: posicion.top + "px",
        width: posicion.width + "px",
        height: posicion.height + "px",
        backgroundImage: fondo,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#082747",
        borderRadius: "18px",
        overflow: "hidden"
    });

    portal.setAttribute("aria-hidden", "true");

    const mensaje = document.createElement("div");
    mensaje.textContent = "Explora " + titulo.textContent.trim();

    Object.assign(mensaje.style, {
        position: "absolute",
        inset: "0",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "linear-gradient(transparent, rgba(4,24,45,0.8))",
        color: "white",
        fontFamily: "Georgia, serif",
        fontSize: "clamp(2rem, 5vw, 4rem)",
        fontWeight: "bold",
        textAlign: "center"
    });

    portal.appendChild(mensaje);
    document.body.appendChild(portal);

    mensaje.animate(
        [
            { opacity: 0, offset: 0 },
            { opacity: 0, offset: 0.60 },
            { opacity: 1, offset: 0.78 },
            { opacity: 1, offset: 1 }
        ],
        {
            duration: 3000,
            fill: "forwards"
        }
    );

    const expansion = portal.animate(
        [
            {
                left: posicion.left + "px",
                top: posicion.top + "px",
                width: posicion.width + "px",
                height: posicion.height + "px",
                borderRadius: "18px"
            },
            {
                left: "0px",
                top: "0px",
                width: window.innerWidth + "px",
                height: window.innerHeight + "px",
                borderRadius: "0px"
            }
        ],
        {
            duration: 3000,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "forwards"
        }
    );

    expansion.finished.then(async function () {
            await mensaje.animate([{opacity: 1}, {opacity: 1}], {
                duration: 1000, fill: "forwards"
            }).finished;
            await mensaje.animate([{opacity: 1}, {opacity: 0}], {
                duration: 600, easing: "ease-in-out", fill: "forwards"
            }).finished;
            try {
                sessionStorage.setItem("transicionCategoria", JSON.stringify({
                    destino: enlace.href, fondo: fondo
                }));
            } catch {}
            window.location.assign(enlace.href);
        });
});

window.addEventListener("pageshow", function () {
    document.querySelectorAll("[data-portal]").forEach(function (portal) {
        portal.remove();
    });

    efectoActivo = false;
});

function revelarCategoria() {
    let datos;
    try {
        const guardado = sessionStorage.getItem("transicionCategoria");
        if (!guardado) return;
        sessionStorage.removeItem("transicionCategoria");
        datos = JSON.parse(guardado);
    } catch { return; }
    if (!datos || datos.destino !== location.href) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const capa = document.createElement("div");
    capa.dataset.entradaCategoria = "true";
    capa.setAttribute("aria-hidden", "true");
    Object.assign(capa.style, {
        position: "fixed", inset: "0", zIndex: "99999", pointerEvents: "none",
        backgroundImage: datos.fondo, backgroundSize: "cover",
        backgroundPosition: "center", backgroundColor: "#082747"
    });
    document.body.appendChild(capa);
    capa.animate([
        {opacity: 1, filter: "blur(0px)", offset: 0},
        {opacity: 0.95, filter: "blur(4px)", offset: 0.25},
        {opacity: 0.55, filter: "blur(14px)", offset: 0.65},
        {opacity: 0, filter: "blur(26px)", offset: 1}
    ], {duration: 2200, easing: "ease-in-out", fill: "forwards"})
        .finished.catch(() => {}).finally(() => capa.remove());
}
window.addEventListener("pageshow", function (evento) {
    if (evento.persisted) {
        document.querySelectorAll("[data-entrada-categoria]").forEach(c => c.remove());
    }
});
revelarCategoria();

