var ADMIN_PASSWORD = 'planet2026';
var data = null;
var modalType = '';
var editIndex = null;

function login() {
    var pass = document.getElementById('adminPassword').value;
    if (pass === ADMIN_PASSWORD) {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        loadAll();
        renderAll();
        updateDashboard();
        loadTopProducts();
    } else {
        showToast('❌ Неверный пароль!');
    }
}

function loadAll() {
    data = {
        products: loadPlanetData(PLANET_KEYS.PRODUCTS, getDefaultProducts()),
        categories: loadPlanetData(PLANET_KEYS.CATEGORIES, getDefaultCategories()),
        stats: loadPlanetData(PLANET_KEYS.STATS, { views: 0, today: 0, lastVisit: null })
    };
    fillStats();
}

function renderAll() {
    renderProducts();
    renderCategories();
    updateDashboard();
}

function fillStats() {
    var stats = data.stats || { views: 0, today: 0, lastVisit: null };
    document.getElementById('statsTotal').textContent = stats.views || 0;
    document.getElementById('statsToday').textContent = stats.today || 0;
    document.getElementById('statsLast').textContent = stats.lastVisit || '—';
}

function resetStats() {
    if (!confirm('Сбросить статистику?')) return;
    savePlanetData(PLANET_KEYS.STATS, { views: 0, today: 0, lastVisit: null });
    data.stats = { views: 0, today: 0, lastVisit: null };
    fillStats();
    updateDashboard();
    showToast('↺ Статистика сброшена');
}

function updateDashboard() {
    document.getElementById('statProducts').textContent = data.products ? data.products.length : 0;
    document.getElementById('statCategories').textContent = data.categories ? data.categories.length : 0;
    var stats = loadPlanetData(PLANET_KEYS.STATS, { views: 0, today: 0 });
    document.getElementById('statViews').textContent = stats.views || 0;
    document.getElementById('statToday').textContent = stats.today || 0;
}

// ===== ТОП ТОВАРОВ =====
function loadTopProducts() {
    var container = document.getElementById('topProducts');
    if (!container) return;
    
    var analytics = loadPlanetData('planet_analytics', { views: {} });
    var products = loadPlanetData(PLANET_KEYS.PRODUCTS, getDefaultProducts());
    
    var viewsList = [];
    for (var productId in analytics.views) {
        var total = analytics.views[productId].total || 0;
        viewsList.push({ id: parseInt(productId), views: total });
    }
    
    viewsList.sort(function(a, b) { return b.views - a.views; });
    var top5 = viewsList.slice(0, 5);
    
    if (top5.length === 0) {
        container.innerHTML = '<div class="empty">Нет данных по просмотрам</div>';
        return;
    }
    
    var html = '';
    for (var i = 0; i < top5.length; i++) {
        var product = products.find(function(p) { return p.id === top5[i].id; });
        if (!product) continue;
        var medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i] || '•';
        html += '<div class="item"><span>' + medal + ' ' + product.name + '</span><span style="color:#6c3bff;">' + top5[i].views + ' просмотров</span></div>';
    }
    
    container.innerHTML = html;
}

function renderProducts() {
    var container = document.getElementById('adminProducts');
    if (!container) return;
    var items = data.products || [];
    if (items.length === 0) { container.innerHTML = '<div class="empty">Нет товаров</div>'; return; }
    var html = '';
    for (var i = 0; i < items.length; i++) {
        var p = items[i];
        var hitBadge = p.isHit ? '<span class="badge hit">🔥 Хит</span>' : '';
        var stockBadge = p.inStock ? '<span class="badge on">В наличии</span>' : '<span class="badge off">Нет</span>';
        html += '<div class="item"><span>' + p.name + ' — ' + p.price.toLocaleString() + ' ₽ ' + hitBadge + ' ' + stockBadge + '</span>';
        html += '<div class="item-actions"><button class="edit" onclick="editProduct(' + i + ')">✎</button>';
        html += '<button class="delete" onclick="deleteProduct(' + i + ')">✕</button></div></div>';
    }
    container.innerHTML = html;
}

function openProductModal(index) {
    editIndex = (index !== undefined) ? index : null;
    var p = editIndex !== null ? data.products[editIndex] : null;
    modalType = 'product';
    var title = document.getElementById('modalTitle');
    var body = document.getElementById('modalBody');
    title.textContent = editIndex !== null ? '✎ Редактировать товар' : '➕ Добавить товар';

    var categories = data.categories || [];
    var catOptions = '';
    for (var i = 0; i < categories.length; i++) {
        var selected = p && p.category === categories[i].id ? ' selected' : '';
        catOptions += '<option value="' + categories[i].id + '"' + selected + '>' + categories[i].name + '</option>';
    }

    var html = '';
    html += '<label>Название</label><input type="text" id="modalName" value="' + (p ? p.name : '') + '">';
    html += '<label>Цена</label><input type="number" id="modalPrice" value="' + (p ? p.price : '') + '">';
    html += '<label>Старая цена (скидка)</label><input type="number" id="modalOldPrice" value="' + (p && p.oldPrice ? p.oldPrice : '') + '">';
    html += '<label>Категория</label><select id="modalCategory">' + catOptions + '</select>';
    html += '<label>Описание</label><textarea id="modalDesc" rows="3">' + (p ? p.desc : '') + '</textarea>';
    html += '<label>Ссылка на фото</label><input type="text" id="modalImage" value="' + (p ? p.image : '') + '">';
    html += '<label>Иконка для планеты (эмодзи)</label><input type="text" id="modalIcon" value="' + (p ? p.icon : '🛸') + '">';
    html += '<label>В наличии</label><select id="modalStock"><option value="true"' + (p && p.inStock ? ' selected' : '') + '>Да</option><option value="false"' + (p && !p.inStock ? ' selected' : '') + '>Нет</option></select>';
    html += '<label>Хит продаж</label><select id="modalHit"><option value="true"' + (p && p.isHit ? ' selected' : '') + '>Да</option><option value="false"' + (p && !p.isHit ? ' selected' : '') + '>Нет</option></select>';
    html += '<div class="btn-group"><button class="btn btn-add" onclick="saveProduct()">💾 Сохранить</button><button class="btn btn-secondary" onclick="closeModal()">Отмена</button></div>';
    body.innerHTML = html;
    document.getElementById('modalOverlay').classList.add('active');
}

function editProduct(index) { openProductModal(index); }

function saveProduct() {
    var name = document.getElementById('modalName').value;
    var price = parseInt(document.getElementById('modalPrice').value);
    var oldPrice = parseInt(document.getElementById('modalOldPrice').value) || null;
    var category = document.getElementById('modalCategory').value;
    var desc = document.getElementById('modalDesc').value;
    var image = document.getElementById('modalImage').value;
    var icon = document.getElementById('modalIcon').value || '🛸';
    var inStock = document.getElementById('modalStock').value === 'true';
    var isHit = document.getElementById('modalHit').value === 'true';

    if (!name || !price) { showToast('❌ Заполните название и цену!'); return; }

    var product = {
        id: editIndex !== null ? data.products[editIndex].id : Date.now(),
        name: name,
        price: price,
        oldPrice: oldPrice,
        category: category,
        desc: desc || 'Без описания',
        image: image || 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=400',
        icon: icon,
        inStock: inStock,
        isHit: isHit
    };

    if (editIndex !== null) {
        data.products[editIndex] = product;
    } else {
        data.products.push(product);
    }

    savePlanetData(PLANET_KEYS.PRODUCTS, data.products);
    renderAll();
    closeModal();
    showToast('✅ Товар сохранён!');
}

function deleteProduct(index) {
    if (!confirm('Удалить товар?')) return;
    data.products.splice(index, 1);
    savePlanetData(PLANET_KEYS.PRODUCTS, data.products);
    renderAll();
    showToast('🗑️ Товар удалён');
}

function renderCategories() {
    var container = document.getElementById('adminCategories');
    if (!container) return;
    var items = data.categories || [];
    if (items.length === 0) { container.innerHTML = '<div class="empty">Нет категорий</div>'; return; }
    var html = '';
    for (var i = 0; i < items.length; i++) {
        var c = items[i];
        html += '<div class="item"><span>' + c.icon + ' ' + c.name + '</span>';
        html += '<div class="item-actions"><button class="edit" onclick="editCategory(' + i + ')">✎</button>';
        html += '<button class="delete" onclick="deleteCategory(' + i + ')">✕</button></div></div>';
    }
    container.innerHTML = html;
}

function openCategoryModal(index) {
    editIndex = (index !== undefined) ? index : null;
    var c = editIndex !== null ? data.categories[editIndex] : null;
    modalType = 'category';
    var title = document.getElementById('modalTitle');
    var body = document.getElementById('modalBody');
    title.textContent = editIndex !== null ? '✎ Редактировать категорию' : '➕ Добавить категорию';

    var html = '';
    html += '<label>Иконка (эмодзи)</label><input type="text" id="modalIcon" value="' + (c ? c.icon : '📡') + '">';
    html += '<label>Название</label><input type="text" id="modalName" value="' + (c ? c.name : '') + '">';
    html += '<label>ID (английскими буквами)</label><input type="text" id="modalId" value="' + (c ? c.id : '') + '">';
    html += '<div class="btn-group"><button class="btn btn-add" onclick="saveCategory()">💾 Сохранить</button><button class="btn btn-secondary" onclick="closeModal()">Отмена</button></div>';
    body.innerHTML = html;
    document.getElementById('modalOverlay').classList.add('active');
}

function editCategory(index) { openCategoryModal(index); }

function saveCategory() {
    var icon = document.getElementById('modalIcon').value || '📡';
    var name = document.getElementById('modalName').value;
    var id = document.getElementById('modalId').value.toLowerCase().replace(/\s/g, '_');

    if (!name || !id) { showToast('❌ Заполните все поля!'); return; }

    var category = { id: id, name: name, icon: icon };

    if (editIndex !== null) {
        data.categories[editIndex] = category;
    } else {
        if (data.categories.some(function(c) { return c.id === id; })) {
            showToast('❌ Категория с таким ID уже существует!');
            return;
        }
        data.categories.push(category);
    }

    savePlanetData(PLANET_KEYS.CATEGORIES, data.categories);
    renderAll();
    closeModal();
    showToast('✅ Категория сохранена!');
}

function deleteCategory(index) {
    if (!confirm('Удалить категорию?')) return;
    data.categories.splice(index, 1);
    savePlanetData(PLANET_KEYS.CATEGORIES, data.categories);
    renderAll();
    showToast('🗑️ Категория удалена');
}

function loadLeads() {
    var container = document.getElementById('adminLeads');
    if (!container) return;
    var leads = loadPlanetData(PLANET_KEYS.LEADS, []);
    if (leads.length === 0) { container.innerHTML = '<div class="empty">📭 Заявок нет</div>'; return; }
    var html = '';
    for (var i = leads.length - 1; i >= 0; i--) {
        var l = leads[i];
        html += '<div class="item"><span>' + l.name + ' — ' + l.contact + ' — ' + l.message + ' <span style="color:#6a6a72;font-size:12px;">' + l.date + '</span></span>';
        html += '<div class="item-actions"><button class="delete" onclick="deleteLead(' + i + ')">✕</button></div></div>';
    }
    container.innerHTML = html;
}

function deleteLead(index) {
    var leads = loadPlanetData(PLANET_KEYS.LEADS, []);
    leads.splice(index, 1);
    savePlanetData(PLANET_KEYS.LEADS, leads);
    loadLeads();
    showToast('🗑️ Заявка удалена');
}

function clearLeads() {
    if (!confirm('Удалить все заявки?')) return;
    savePlanetData(PLANET_KEYS.LEADS, []);
    loadLeads();
    showToast('🗑️ Все заявки удалены');
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(function(el) { el.classList.remove('active'); });
    var target = document.getElementById('tab-' + tabId);
    if (target) target.classList.add('active');
    document.querySelectorAll('.tab-btn').forEach(function(el) { el.classList.remove('active'); });
    document.querySelectorAll('.tab-btn').forEach(function(el) {
        var map = {
            'dashboard': 'Дашборд',
            'products': 'Товары',
            'categories': 'Категории',
            'stats': 'Статистика',
            'leads': 'Заявки',
            'backup': 'Бэкап'
        };
        if (el.textContent.indexOf(map[tabId]) !== -1) el.classList.add('active');
    });
    if (tabId === 'leads') loadLeads();
    if (tabId === 'stats') fillStats();
    if (tabId === 'dashboard') loadTopProducts();
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    editIndex = null;
}

function exportData() {
    var fullData = {
        products: data.products,
        categories: data.categories,
        stats: data.stats,
        leads: loadPlanetData(PLANET_KEYS.LEADS, [])
    };
    var blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'planet_shop_backup_' + new Date().toISOString().slice(0,10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('📤 Данные экспортированы!');
}

function importData(event) {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var imported = JSON.parse(e.target.result);
            if (imported.products) { data.products = imported.products; savePlanetData(PLANET_KEYS.PRODUCTS, data.products); }
            if (imported.categories) { data.categories = imported.categories; savePlanetData(PLANET_KEYS.CATEGORIES, data.categories); }
            if (imported.stats) { data.stats = imported.stats; savePlanetData(PLANET_KEYS.STATS, data.stats); }
            if (imported.leads) { savePlanetData(PLANET_KEYS.LEADS, imported.leads); }
            renderAll();
            fillStats();
            showToast('📥 Данные импортированы!');
        } catch (err) { alert('❌ Ошибка импорта!'); }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function resetAll() {
    if (!confirm('⚠️ Удалить все данные?')) return;
    if (!confirm('Точно?')) return;
    localStorage.removeItem(PLANET_KEYS.PRODUCTS);
    localStorage.removeItem(PLANET_KEYS.CATEGORIES);
    localStorage.removeItem(PLANET_KEYS.STATS);
    localStorage.removeItem(PLANET_KEYS.LEADS);
    loadAll();
    renderAll();
    fillStats();
    showToast('↺ Все данные сброшены!');
}

function showToast(msg) {
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = '0.4s';
        setTimeout(function() { toast.remove(); }, 400);
    }, 2500);
}

document.addEventListener('DOMContentLoaded', function() {
    switchTab('dashboard');
});
