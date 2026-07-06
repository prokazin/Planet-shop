// ===== УНИКАЛЬНЫЕ КЛЮЧИ ДЛЯ PLANET SHOP =====
var PLANET_KEYS = {
    PRODUCTS: 'planet_products',
    CATEGORIES: 'planet_categories',
    STATS: 'planet_stats',
    LEADS: 'planet_leads'
};

// ===== ДЕФОЛТНЫЕ КАТЕГОРИИ =====
function getDefaultCategories() {
    return [
        { id: 'electronics', name: '📡 Электроника', icon: '📡' },
        { id: 'clothing', name: '👕 Одежда', icon: '👕' },
        { id: 'books', name: '📚 Книги', icon: '📚' },
        { id: 'sports', name: '🏃 Спорт', icon: '🏃' },
        { id: 'home', name: '🏠 Дом', icon: '🏠' }
    ];
}

// ===== ДЕФОЛТНЫЕ ТОВАРЫ =====
function getDefaultProducts() {
    return [
        {
            id: 1,
            name: '🪐 Космический гаджет',
            category: 'electronics',
            price: 2999,
            oldPrice: 3999,
            desc: 'Уникальный гаджет из далёкой галактики. Работает на тёмной энергии.',
            image: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=400',
            inStock: true,
            isHit: true
        },
        {
            id: 2,
            name: '👕 Галактическая футболка',
            category: 'clothing',
            price: 1499,
            oldPrice: null,
            desc: 'Футболка с принтом звёздного неба. Светится в темноте.',
            image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
            inStock: true,
            isHit: false
        },
        {
            id: 3,
            name: '📚 Книга "Путеводитель по галактике"',
            category: 'books',
            price: 899,
            oldPrice: 1299,
            desc: 'Полное руководство по путешествиям между звёздами. Бестселлер.',
            image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
            inStock: true,
            isHit: true
        },
        {
            id: 4,
            name: '🏃 Беговые кроссовки "Gravity"',
            category: 'sports',
            price: 4599,
            oldPrice: null,
            desc: 'Кроссовки с эффектом невесомости. Беги как по облакам.',
            image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
            inStock: false,
            isHit: false
        },
        {
            id: 5,
            name: '🏠 Светильник "Звёздное небо"',
            category: 'home',
            price: 1999,
            oldPrice: 2899,
            desc: 'Проектор звёздного неба для вашего дома. Более 1000 звёзд.',
            image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400',
            inStock: true,
            isHit: true
        },
        {
            id: 6,
            name: '📡 Космический будильник',
            category: 'electronics',
            price: 1299,
            oldPrice: null,
            desc: 'Будильник с имитацией восхода и заката солнца на других планетах.',
            image: 'https://images.unsplash.com/photo-1545291730-faff8ca1d4b0?w=400',
            inStock: true,
            isHit: false
        }
    ];
}

// ===== ЗАГРУЗКА ДАННЫХ =====
function loadPlanetData(key, defaultData) {
    var stored = localStorage.getItem(key);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            return defaultData;
        }
    }
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
}

function savePlanetData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// ===== СТАТИСТИКА ПОСЕЩЕНИЙ =====
function updatePlanetStats() {
    var stats = loadPlanetData(PLANET_KEYS.STATS, { views: 0, today: 0, lastVisit: null });
    var today = new Date().toISOString().split('T')[0];
    
    stats.views = (stats.views || 0) + 1;
    if (stats.lastVisit !== today) {
        stats.today = 1;
        stats.lastVisit = today;
    } else {
        stats.today = (stats.today || 0) + 1;
    }
    
    savePlanetData(PLANET_KEYS.STATS, stats);
}

// ===== ИНИЦИАЛИЗАЦИЯ ДАННЫХ =====
var planetProducts = loadPlanetData(PLANET_KEYS.PRODUCTS, getDefaultProducts());
var planetCategories = loadPlanetData(PLANET_KEYS.CATEGORIES, getDefaultCategories());
