// ===== РЕНДЕРИНГ ЗВЁЗД =====
function renderStars() {
    var container = document.getElementById('stars');
    if (!container) return;
    
    for (var i = 0; i < 150; i++) {
        var star = document.createElement('div');
        star.className = 'star';
        var size = Math.random() * 3 + 1;
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.setProperty('--duration', (Math.random() * 3 + 2) + 's');
        star.style.animationDelay = Math.random() * 5 + 's';
        container.appendChild(star);
    }
}

// ===== РЕНДЕРИНГ КАТЕГОРИЙ =====
function renderCategories() {
    var container = document.getElementById('categoriesOrbit');
    if (!container) return;
    
    var categories = loadPlanetData(PLANET_KEYS.CATEGORIES, getDefaultCategories());
    var products = loadPlanetData(PLANET_KEYS.PRODUCTS, getDefaultProducts());
    
    container.innerHTML = categories.map(function(cat) {
        var count = products.filter(function(p) { return p.category === cat.id; }).length;
        return '<button class="category-item" data-category="' + cat.id + '" onclick="filterByCategory(\'' + cat.id + '\')">' +
            cat.icon + ' ' + cat.name +
            '<span class="category-count">' + count + '</span>' +
            '</button>';
    }).join('');
    
    // Добавляем "Все"
    var allBtn = document.createElement('button');
    allBtn.className = 'category-item active';
    allBtn.dataset.category = 'all';
    allBtn.innerHTML = '🌌 Все <span class="category-count">' + products.length + '</span>';
    allBtn.onclick = function() { filterByCategory('all'); };
    container.prepend(allBtn);
}

// ===== РЕНДЕРИНГ ТОВАРОВ =====
function renderProducts(products) {
    var container = document.getElementById('productsUniverse');
    if (!container) return;
    
    if (!products || products.length === 0) {
        container.innerHTML = '<div class="no-results"><h3>🌠 Товаров не найдено</h3><p>Попробуйте изменить поиск</p></div>';
        return;
    }
    
    container.innerHTML = products.map(function(p, index) {
        var oldPriceHtml = p.oldPrice ? '<span class="old">' + p.oldPrice.toLocaleString() + ' ₽</span>' : '';
        var tagHtml = '';
        if (p.isHit) tagHtml = '<span class="product-tag hit">🔥 Хит</span>';
        else if (p.isNew) tagHtml = '<span class="product-tag">✨ Новинка</span>';
        var stockHtml = p.inStock ? 
            '<span class="product-stock in-stock">● В наличии</span>' : 
            '<span class="product-stock out-of-stock">● Нет в наличии</span>';
        var orbitDelay = (index * 0.3) + 's';
        
        return '<div class="product-card" style="animation-delay: ' + orbitDelay + '" onclick="openProduct(' + p.id + ')">' +
            '<div class="orbit-ring"></div>' +
            '<div class="product-image">' +
            '<img src="' + p.image + '" alt="' + p.name + '" loading="lazy">' +
            tagHtml +
            '</div>' +
            '<div class="product-info">' +
            '<div class="product-name">' + p.name + '</div>' +
            '<div class="product-category">' + getCategoryName(p.category) + '</div>' +
            '<div class="product-price">' + p.price.toLocaleString() + ' ₽ ' + oldPriceHtml + '</div>' +
            '<div class="product-desc">' + p.desc + '</div>' +
            stockHtml +
            '</div>' +
            '</div>';
    }).join('');
}

// ===== ПОЛУЧИТЬ ИМЯ КАТЕГОРИИ =====
function getCategoryName(categoryId) {
    var categories = loadPlanetData(PLANET_KEYS.CATEGORIES, getDefaultCategories());
    var cat = categories.find(function(c) { return c.id === categoryId; });
    return cat ? cat.name : categoryId;
}

// ===== ФИЛЬТР ПО КАТЕГОРИЯМ =====
var currentCategory = 'all';
var currentSearch = '';

function filterByCategory(categoryId) {
    currentCategory = categoryId;
    document.querySelectorAll('.category-item').forEach(function(el) {
        el.classList.toggle('active', el.dataset.category === categoryId);
    });
    applyFilters();
}

function searchProducts(e) {
    e.preventDefault();
    var input = document.getElementById('searchInput');
    currentSearch = input.value.trim().toLowerCase();
    applyFilters();
}

function applyFilters() {
    var products = loadPlanetData(PLANET_KEYS.PRODUCTS, getDefaultProducts());
    
    // Фильтр по категории
    if (currentCategory !== 'all') {
        products = products.filter(function(p) { return p.category === currentCategory; });
    }
    
    // Фильтр по поиску
    if (currentSearch) {
        products = products.filter(function(p) {
            return p.name.toLowerCase().includes(currentSearch) ||
                   p.desc.toLowerCase().includes(currentSearch);
        });
    }
    
    renderProducts(products);
}

// ===== ОТКРЫТИЕ ТОВАРА (модальное окно) =====
function openProduct(id) {
    var products = loadPlanetData(PLANET_KEYS.PRODUCTS, getDefaultProducts());
    var product = products.find(function(p) { return p.id === id; });
    if (!product) return;
    
    alert('🪐 ' + product.name + '\n\n' + 
          '📦 Категория: ' + getCategoryName(product.category) + '\n' +
          '💰 Цена: ' + product.price.toLocaleString() + ' ₽\n' +
          (product.oldPrice ? '🔥 Старая цена: ' + product.oldPrice.toLocaleString() + ' ₽\n' : '') +
          '📝 ' + product.desc + '\n' +
          (product.inStock ? '✅ В наличии' : '❌ Нет в наличии'));
}

// ===== ЗАПУСК =====
document.addEventListener('DOMContentLoaded', function() {
    renderStars();
    renderCategories();
    applyFilters();
    updatePlanetStats();
});
