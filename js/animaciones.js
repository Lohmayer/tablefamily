(() => {
    const CLAVE = "transicionCategoria";
    let efectoActivo = false;

    function reducirMovimiento() {
        return window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;
    }

    function animar(elemento, fotogramas, opciones) {
        return elemento.animate(fotogramas, {
            fill: "forwards",
            ...opciones
        }).finished;
    }

    function crearCapa(fondo) {
        const capa = document.createElement("div");

        capa.dataset.entradaCategoria = "true";
        capa.setAttribute("aria-hidden", "true");

        Object.assign(capa.style, {
            position: "fixed",
            inset: "0",
            zIndex: "99999",
            backgroundImage: fondo,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundColor: "#082747",
            opacity: "1",
            filter: "blur(14px)",
            transform: "scale(1.04)",
            pointerEvents: "auto"
        });

        return capa;
    }

    function esperarComoMaximo(promesa, tiempo) {
        let temporizador;

        return Promise.race([
            promesa,
            new Promise(resolve => {
                temporizador = setTimeout(resolve, tiempo);
            })
        ]).finally(() => {
            clearTimeout(temporizador);
        });
    }

    function esperarEncabezado() {
        const encabezado = document.getElementById(
            "encabezado-compartido"
        );

        if (!encabezado || encabezado.children.length) {
            return Promise.resolve();
        }

        return new Promise(resolve => {
            const observador = new MutationObserver(() => {
                if (encabezado.children.length) terminar();
            });

            const temporizador = setTimeout(terminar, 2000);

            function terminar() {
                clearTimeout(temporizador);
                observador.disconnect();
                resolve();
            }

            observador.observe(encabezado, {
                childList: true
            });
        });
    }

    // Crea la capa antes de mostrar el contenido de la página nueva.
    function prepararEntrada() {
        let datos;

        try {
            const guardado = sessionStorage.getItem(CLAVE);

            if (!guardado) return;

            sessionStorage.removeItem(CLAVE);
            datos = JSON.parse(guardado);
        } catch {
            return;
        }

        if (
            !datos ||
            datos.destino !== location.href ||
            reducirMovimiento()
        ) {
            return;
        }

        // Descarta transiciones antiguas.
        if (datos.fecha && Date.now() - datos.fecha > 20000) {
            return;
        }

        const capa = crearCapa(datos.fondo);

        // No esperamos al body: así evitamos mostrar primero la categoría.
        document.documentElement.appendChild(capa);

        async function revelar() {
            try {
                // Conserva la misma capa al trasladarla al body.
                document.body.appendChild(capa);

                await esperarEncabezado();

                const imagenes = [...document.images].filter(
                    imagen => imagen.loading !== "lazy"
                );

                await esperarComoMaximo(
                    Promise.allSettled([
                        ...imagenes.map(imagen => imagen.decode()),
                        document.fonts?.ready ?? Promise.resolve()
                    ]),
                    1800
                );

                await new Promise(resolve => {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(resolve);
                    });
                });

                if (!capa.isConnected) return;

                // Continúa desde el desenfoque de la página anterior.
                await animar(
                    capa,
                    [
                        {
                            opacity: 1,
                            filter: "blur(14px)",
                            transform: "scale(1.04)",
                            offset: 0
                        },
                        {
                            opacity: 0.95,
                            filter: "blur(18px)",
                            transform: "scale(1.05)",
                            offset: 0.20
                        },
                        {
                            opacity: 0.5,
                            filter: "blur(25px)",
                            transform: "scale(1.07)",
                            offset: 0.65
                        },
                        {
                            opacity: 0,
                            filter: "blur(32px)",
                            transform: "scale(1.08)",
                            offset: 1
                        }
                    ],
                    {
                        duration: 2400,
                        easing: "ease-in-out"
                    }
                );
            } catch {
                // Un fallo del efecto no impide usar la categoría.
            } finally {
                capa.remove();
            }
        }

        if (document.readyState === "loading") {
            document.addEventListener(
                "DOMContentLoaded",
                revelar,
                { once: true }
            );
        } else {
            revelar();
        }
    }

    prepararEntrada();

    document.addEventListener("click", async function (evento) {
        const enlace = evento.target.closest(".tarjeta-enlace");

        if (
            !enlace ||
            evento.defaultPrevented ||
            evento.button !== 0 ||
            evento.ctrlKey ||
            evento.metaKey ||
            evento.shiftKey ||
            evento.altKey ||
            enlace.target === "_blank" ||
            enlace.hasAttribute("download") ||
            reducirMovimiento()
        ) {
            return;
        }

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
        portal.setAttribute("aria-hidden", "true");

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

        const mensaje = document.createElement("div");

        mensaje.textContent = "Explora " + titulo.textContent.trim();

        Object.assign(mensaje.style, {
            position: "absolute",
            inset: "0",
            display: "grid",
            placeItems: "center",
            padding: "24px",
            background:
                "linear-gradient(transparent, rgba(4,24,45,0.8))",
            color: "white",
            fontFamily: "Georgia, serif",
            fontSize: "clamp(2rem, 5vw, 4rem)",
            fontWeight: "bold",
            textAlign: "center",
            opacity: "0"
        });

        portal.appendChild(mensaje);
        document.body.appendChild(portal);

        try {
            // Expande la imagen y muestra el texto cuando ya hay espacio.
            await Promise.all([
                animar(
                    mensaje,
                    [
                        { opacity: 0, offset: 0 },
                        { opacity: 0, offset: 0.60 },
                        { opacity: 1, offset: 0.78 },
                        { opacity: 1, offset: 1 }
                    ],
                    {
                        duration: 3000
                    }
                ),
                animar(
                    portal,
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
                        easing: "cubic-bezier(0.22, 1, 0.36, 1)"
                    }
                )
            ]);

            // Mantiene el texto visible.
            await animar(
                mensaje,
                [
                    { opacity: 1 },
                    { opacity: 1 }
                ],
                {
                    duration: 1000
                }
            );

            // Retira suavemente el texto.
            await animar(
                mensaje,
                [
                    { opacity: 1 },
                    { opacity: 0 }
                ],
                {
                    duration: 700,
                    easing: "ease-in-out"
                }
            );

            // Comienza el desenfoque antes de cambiar de página.
            await animar(
                portal,
                [
                    {
                        filter: "blur(0px)",
                        transform: "scale(1)"
                    },
                    {
                        filter: "blur(14px)",
                        transform: "scale(1.04)"
                    }
                ],
                {
                    duration: 900,
                    easing: "ease-in-out"
                }
            );

            try {
                sessionStorage.setItem(
                    CLAVE,
                    JSON.stringify({
                        destino: enlace.href,
                        fondo: fondo,
                        fecha: Date.now()
                    })
                );
            } catch {
                // La navegación funciona sin almacenamiento.
            }

            location.assign(enlace.href);
        } catch {
            portal.remove();
            efectoActivo = false;
            location.assign(enlace.href);
        }
    });

    // Limpia las capas al regresar con el botón Atrás.
    window.addEventListener("pageshow", function (evento) {
        document.querySelectorAll("[data-portal]").forEach(capa => {
            capa.remove();
        });

        efectoActivo = false;

        if (evento.persisted) {
            document
                .querySelectorAll("[data-entrada-categoria]")
                .forEach(capa => {
                    capa.remove();
                });
        }
    });
})();