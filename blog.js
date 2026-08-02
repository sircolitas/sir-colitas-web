// ============================================
// BLOG.JS - Motor del blog dinámico
// Lee publicaciones desde Google Sheets
// Sir Colitas
// ============================================

const BLOG_CSV_URL = 'PEGA_AQUI_TU_ENLACE_CSV_DEL_BLOG';

function buildPostCard(post) {
    const imgSrc = post.imagen || 'https://placehold.co/800x400/152238/F9F8F4/png?text=SIR+COLITAS';
    const autorLinea = post.autor
        ? `Por <strong>${post.autor}</strong>${post.autorCargo ? ' — ' + post.autorCargo : ''}`
        : '';

    return `
    <div class="post-card">
        <img src="${imgSrc}" alt="${post.titulo}" onerror="this.src='https://placehold.co/800x400/152238/F9F8F4/png?text=SIR+COLITAS'">
        <div class="post-body">
            <p class="post-date">${post.fecha}</p>
            <h3 class="post-title">${post.titulo}</h3>
            ${autorLinea ? `<p class="post-author">${autorLinea}</p>` : ''}
            <p class="post-summary">${post.resumen}</p>
            <div class="post-content" style="display:none;">${post.contenido}</div>
            <button class="btn-read-more" onclick="togglePost(this)" data-i18n="read_more">Leer más</button>
        </div>
    </div>`;
}

function togglePost(btn) {
    const card = btn.closest('.post-card');
    const content = card.querySelector('.post-content');
    const summary = card.querySelector('.post-summary');
    const isOpen = content.style.display !== 'none';
    const lang = localStorage.getItem('sirColitasLang') || 'es';

    if (isOpen) {
        content.style.display = 'none';
        summary.style.display = 'block';
        btn.innerText = translations[lang]['read_more'];
    } else {
        content.style.display = 'block';
        summary.style.display = 'none';
        btn.innerText = translations[lang]['read_less'];
    }
}

async function loadBlog() {
    const container = document.getElementById('posts-container');
    if (!container) return;

    try {
        const response = await fetch(BLOG_CSV_URL);
        const text = await response.text();
        const rows = parseCSV(text);

        const posts = rows
            .filter(row => (row['Publicado'] || '').toUpperCase() === 'SI')
            .map(row => ({
                titulo: row['Titulo'] || '',
                fecha: row['Fecha'] || '',
                autor: row['Autor'] || '',
                autorCargo: row['Autor_Cargo'] || '',
                imagen: row['Imagen'] || '',
                resumen: row['Resumen'] || '',
                contenido: row['Contenido'] || ''
            }));

        if (posts.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#888; grid-column: 1/-1;" data-i18n="no_posts">Todavía no hay artículos publicados. ¡Vuelve pronto!</p>';
            return;
        }

        container.innerHTML = posts.map(buildPostCard).join('');

        const savedLang = localStorage.getItem('sirColitasLang') || 'es';
        if (typeof translations !== 'undefined') changeLanguage(savedLang);

    } catch (error) {
        console.error('Error al cargar el blog:', error);
        container.innerHTML = '<p style="text-align:center; color:#e74c3c; grid-column: 1/-1;">No se pudo cargar el blog. Intenta recargar la página.</p>';
    }
}
