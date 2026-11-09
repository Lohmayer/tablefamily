/* Componentes compartidos. Las rutas parten de este archivo, no del HTML actual. */
const raizProyecto = new URL('../', document.currentScript.src);
async function cargarComponente(id, archivo) {
    const contenedor = document.getElementById(id);
    if (!contenedor) return;
    try {
        const respuesta = await fetch(new URL('componentes/' + archivo, raizProyecto));
        if (!respuesta.ok) throw new Error('No se pudo cargar ' + archivo);
        contenedor.innerHTML = await respuesta.text();
        contenedor.querySelectorAll('[data-ruta]').forEach(a => {
            a.href = new URL(a.dataset.ruta, raizProyecto).href;
        });
        contenedor.querySelectorAll('[data-imagen]').forEach(img => {
            img.src = new URL(img.dataset.imagen, raizProyecto).href;
        });
        if (id === 'encabezado-compartido') {
            const pagina = document.body.dataset.pagina;
            contenedor.querySelectorAll('[data-menu]').forEach(a => {
                const activo = a.dataset.menu === pagina;
                a.classList.toggle('activo', activo);
                if (activo) a.setAttribute('aria-current', pagina === 'inicio' ? 'page' : 'true');
            });
            if (pagina === 'inicio') {
                contenedor.querySelector('[data-menu="categorias"]').href = '#categorias';
            }
        }
        document.dispatchEvent(new CustomEvent('componentes:listos', { detail: { id } }));
    } catch (error) {
        console.error(error);
        const p = document.createElement('p');
        p.className = 'container text-danger py-3';
        p.textContent = 'No se pudo cargar esta sección. Recarga la página.';
        contenedor.replaceChildren(p);
    }
}
cargarComponente('encabezado-compartido', 'encabezado.html');
cargarComponente('footer-compartido', 'footer.html');
