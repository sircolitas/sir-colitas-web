// ============================================
// CATALOGO.JS - Motor de catálogo dinámico
// Lee productos y promociones desde Google Sheets
// Sir Colitas
// ============================================

const CATALOG_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQLMeF9HDiDBucxDQidmH_38TTKTNeJRLGalu4ZavRiHOKqHKx4ucOx6LiVji0sk9TR-HKo-YrAyAm7/pub?output=csv';

// Separa una línea CSV respetando comas dentro de comillas
function splitCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

// Convierte el texto CSV completo en una lista de filas (objetos)
function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    const headers = splitCSVLine(lines[0]).map(h => h.trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = splitCSVLine(lines[i]);
        const row = {};
        headers.forEach((h, idx) => { row[h] = (values[idx] || '').trim(); });
        rows.push(row);
    }
    return rows;
}

// Agrupa las filas (una por talla) en productos completos, filtrando por colección
function groupProducts(rows, collectionId) {
    const products = new Map();

    rows.forEach(row => {
        if ((row['Coleccion'] || '').toLowerCase() !== collectionId.toLowerCase()) return;
        const id = row['ID_Producto'];
        if (!id) return;

        if (!products.has(id)) {
            products.set(id, {
                id: id,
                nombre: row['Nombre'] || id,
                imagen: row['Imagen'] || '',
                activa: (row['Activa'] || '').toUpperCase() === 'SI',
                tallas: []
            });
        }

        const precio = parseFloat(row['Precio_Original']);
        const promo = parseFloat(row['Precio_Promocional']);
        if (row['Talla'] && !isNaN(precio)) {
            products.get(id).tallas.push({
                talla: row['Talla'],
                precio: precio,
                promo: !isNaN(promo) && promo > 0 ? promo : null
            });
        }
    });

    return Array.from(products.values());
}

// Construye el HTML de una tarjeta de producto
function buildProductCard(product, collectionName) {
    const imgSrc = product.imagen
        ? product.imagen
        : `https://placehold.co/400x400/152238/F9F8F4/png?text=${encodeURIComponent(product.id.toUpperCase())}`;

    const options = product.tallas.map(t => {
        const promoAttr = t.promo ? ` data-promo="${t.promo}"` : '';
        return `<option value="${t.precio}"${promoAttr}>${t.talla} (S/ ${t.precio.toFixed(2)})</option>`;
    }).join('');

    const firstPrice = product.tallas.length ? product.tallas[0].precio : 0;
    const showSizeGuide = product.tallas.length > 1 || (product.tallas[0] && product.tallas[0].talla !== 'Única');
    const nombreEscapado = product.nombre.replace(/'/g, "\\'");

    return `
    <div class="product-card" data-active="${product.activa ? 'SI' : 'NO'}">
        <img src="${imgSrc}" alt="${product.nombre}" onerror="this.src='https://placehold.co/400x400/152238/F9F8F4/png?text=${encodeURIComponent(product.id.toUpperCase())}'">
        <h3>${product.nombre}</h3>

        <div class="controls">
            <label data-i18n="choose_size">Elegir Talla:</label>
            <select class="size-select" onchange="updatePrice(this)">
                ${options}
            </select>

            <label data-i18n="quantity">Cantidad:</label>
            <input type="number" class="qty-input" value="1" min="1">
        </div>

        <div class="price-display">
            <span class="price-original" style="display:none;">S/ <span class="original-price-value"></span></span>
            <span class="price-final">S/ <span class="current-price">${firstPrice.toFixed(2)}</span></span>
        </div>

        <button class="btn-add" data-i18n="add_btn" onclick="addToCart('${nombreEscapado}', '${imgSrc}', this, '${collectionName}')">Añadir al pedido</button>
        ${showSizeGuide ? '<a href="tallas.html" target="_blank" class="size-link" data-i18n="size_guide">Ver Guía de Tallas</a>' : ''}
    </div>`;
}

// Carga el catálogo desde Google Sheets y dibuja las tarjetas en la página
async function loadCatalog(collectionId, collectionName) {
    const container = document.getElementById('products-container');
    if (!container) return;

    try {
        const response = await fetch(CATALOG_CSV_URL);
        const text = await response.text();
        const rows = parseCSV(text);
        const products = groupProducts(rows, collectionId);

        if (products.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#888; grid-column: 1/-1;">No hay productos disponibles en este momento.</p>';
            return;
        }

        container.innerHTML = products.map(p => buildProductCard(p, collectionName)).join('');

        // Aplicar precio/promo inicial a cada tarjeta
        document.querySelectorAll('.product-card .size-select').forEach(updatePrice);

        // Traducir las tarjetas nuevas según el idioma guardado
        const savedLang = localStorage.getItem('sirColitasLang') || 'es';
        if (typeof translations !== 'undefined') changeLanguage(savedLang);
        updateUI();

    } catch (error) {
        console.error('Error al cargar el catálogo:', error);
        container.innerHTML = '<p style="text-align:center; color:#e74c3c; grid-column: 1/-1;">No se pudo cargar el catálogo. Intenta recargar la página.</p>';
    }
}
