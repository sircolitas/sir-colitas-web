// ============================================
// CARRITO.JS - Lógica compartida del carrito
// Sir Colitas
// ============================================

function changeLanguage(lang) {
    localStorage.setItem('sirColitasLang', lang);

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) el.innerHTML = translations[lang][key];
    });

    const selects = document.querySelectorAll('.size-select');
    selects.forEach(select => {
        const prefix = translations[lang] ? translations[lang]['size_prefix'] : null;
        if (!prefix) return;
        for (let i = 0; i < select.options.length; i++) {
            let text = select.options[i].text;
            if (text.includes('Talla')) text = text.replace('Talla', prefix);
            else if (text.includes('Size')) text = text.replace('Size', prefix);
            select.options[i].text = text;
        }
    });
}

function updatePrice(select) {
    const card = select.closest('.product-card');
    const originalPrice = parseFloat(select.value);
    const discount = parseFloat(card.dataset.discount || 0);
    const active = card.dataset.active === 'SI';

    const originalWrap = card.querySelector('.price-original');
    const originalValue = card.querySelector('.original-price-value');
    const currentEl = card.querySelector('.current-price');

    if (active && discount > 0) {
        const finalPrice = originalPrice * (1 - discount / 100);
        if (originalWrap) originalWrap.style.display = 'inline';
        if (originalValue) originalValue.innerText = originalPrice.toFixed(2);
        currentEl.innerText = finalPrice.toFixed(2);
    } else {
        if (originalWrap) originalWrap.style.display = 'none';
        currentEl.innerText = originalPrice.toFixed(2);
    }
}

function addToCart(productName, imageName, btnElement, collectionName) {
    const card = btnElement.closest('.product-card');
    const select = card.querySelector('.size-select');
    const qtyInput = card.querySelector('.qty-input');

    const price = parseFloat(select.value);
    const quantity = parseInt(qtyInput.value);
    const sizeText = select.options[select.selectedIndex].text.split(' (')[0];
    const lang = localStorage.getItem('sirColitasLang') || 'es';

    const product = {
        name: productName,
        image: imageName,
        price: price,
        size: sizeText,
        quantity: quantity,
        color: collectionName || ''
    };

    let cart = JSON.parse(localStorage.getItem('sirColitasCart')) || [];
    cart.push(product);
    localStorage.setItem('sirColitasCart', JSON.stringify(cart));

    updateUI();
    alert(translations[lang]['alert_added'] + ' ' + productName);
}

function updateUI() {
    const cart = JSON.parse(localStorage.getItem('sirColitasCart')) || [];
    const bar = document.getElementById('cart-bar');
    const count = document.getElementById('cart-count');

    if (!bar) return;

    if (cart.length > 0) {
        bar.style.display = 'flex';
        count.innerText = cart.length;
    } else {
        bar.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('sirColitasLang') || 'es';
    const selector = document.getElementById('lang-selector');
    if (selector) selector.value = savedLang;

    if (typeof translations !== 'undefined') changeLanguage(savedLang);
    updateUI();
});
