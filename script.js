// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
var scene, camera, renderer;
var planetMesh;
var controls;
var markers = [];
var autoRotate = true;
var isInteracting = false;
var planetData = [];
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var hoveredMarker = null;

// ===== ИНИЦИАЛИЗАЦИЯ 3D СЦЕНЫ =====
function initScene() {
    var container = document.getElementById('threeContainer');
    if (!container) return;
    
    var width = container.clientWidth;
    var height = container.clientHeight;
    
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 0, 0);
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = false;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.rotateSpeed = 0.6;
    controls.target.set(0, 0, 0);
    controls.minDistance = 4;
    controls.maxDistance = 12;
    
    // Свет
    var ambientLight = new THREE.AmbientLight(0x404060);
    scene.add(ambientLight);
    
    var directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);
    
    var directionalLight2 = new THREE.DirectionalLight(0x6c3bff, 0.5);
    directionalLight2.position.set(-5, -3, 5);
    scene.add(directionalLight2);
    
    var pointLight = new THREE.PointLight(0x6c3bff, 0.3, 20);
    pointLight.position.set(-3, 2, 4);
    scene.add(pointLight);
    
    // Обработчики для авто-вращения
    renderer.domElement.addEventListener('mousedown', function() { autoRotate = false; isInteracting = true; });
    renderer.domElement.addEventListener('mouseup', function() { isInteracting = false; setTimeout(function() { if (!isInteracting) autoRotate = true; }, 3000); });
    renderer.domElement.addEventListener('touchstart', function() { autoRotate = false; isInteracting = true; });
    renderer.domElement.addEventListener('touchend', function() { isInteracting = false; setTimeout(function() { if (!isInteracting) autoRotate = true; }, 3000); });
    
    // Клик по планете
    renderer.domElement.addEventListener('click', onPlanetClick);
    renderer.domElement.addEventListener('mousemove', onPlanetHover);
    
    window.addEventListener('resize', onResize);
}

function onResize() {
    var container = document.getElementById('threeContainer');
    if (!container) return;
    var width = container.clientWidth;
    var height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// ===== СОЗДАНИЕ ПЛАНЕТЫ С КОСМИЧЕСКОЙ ТЕКСТУРОЙ =====
function createPlanet() {
    // Планета
    var geometry = new THREE.SphereGeometry(2.8, 64, 64);
    
    // Космическая текстура (генерируем через Canvas)
    var canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    var ctx = canvas.getContext('2d');
    
    // Тёмный фон
    var gradient = ctx.createRadialGradient(512, 256, 50, 512, 256, 400);
    gradient.addColorStop(0, '#1a0a3a');
    gradient.addColorStop(0.3, '#2d1b69');
    gradient.addColorStop(0.6, '#1a1a4a');
    gradient.addColorStop(0.8, '#0a0a2a');
    gradient.addColorStop(1, '#050515');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 512);
    
    // Звёзды на планете
    for (var i = 0; i < 800; i++) {
        var x = Math.random() * 1024;
        var y = Math.random() * 512;
        var size = Math.random() * 2 + 0.5;
        var brightness = Math.random() * 150 + 50;
        ctx.fillStyle = 'rgba(255,255,255,' + (brightness / 255) + ')';
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Галактические полосы
    for (var i = 0; i < 3; i++) {
        var cx = Math.random() * 1024;
        var cy = Math.random() * 512;
        var gradient2 = ctx.createRadialGradient(cx, cy, 10, cx, cy, 150);
        gradient2.addColorStop(0, 'rgba(108, 59, 255, 0.15)');
        gradient2.addColorStop(0.5, 'rgba(255, 107, 53, 0.08)');
        gradient2.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient2;
        ctx.fillRect(cx - 150, cy - 150, 300, 300);
    }
    
    var texture = new THREE.CanvasTexture(canvas);
    
    var material = new THREE.MeshPhongMaterial({
        map: texture,
        shininess: 20,
        specular: new THREE.Color(0x444488),
        emissive: new THREE.Color(0x111144),
        emissiveIntensity: 0.15
    });
    
    var mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = 0.3;
    mesh.rotation.z = -0.1;
    
    return mesh;
}

// ===== СОЗДАНИЕ МАРКЕРОВ ТОВАРОВ НА ПЛАНЕТЕ =====
function createMarkers(products) {
    // Удаляем старые маркеры
    markers.forEach(function(m) {
        scene.remove(m);
    });
    markers = [];
    
    if (!products || products.length === 0) return;
    
    var radius = 2.85;
    var count = products.length;
    
    products.forEach(function(product, index) {
        // Распределяем маркеры по сфере (золотое сечение)
        var phi = Math.acos(1 - 2 * (index + 0.5) / count);
        var theta = Math.PI * (1 + Math.sqrt(5)) * (index + 0.5);
        
        var x = radius * Math.sin(phi) * Math.cos(theta);
        var y = radius * Math.sin(phi) * Math.sin(theta);
        var z = radius * Math.cos(phi);
        
        // Создаём группу для маркера
        var group = new THREE.Group();
        group.position.set(x, y, z);
        
        // Устанавливаем ориентацию к центру
        group.lookAt(0, 0, 0);
        
        // Круглая подложка маркера
        var markerGeometry = new THREE.CircleGeometry(0.35, 32);
        var markerMaterial = new THREE.MeshBasicMaterial({
            color: 0x6c3bff,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        var marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.z = 0.02;
        group.add(marker);
        
        // Ободок
        var ringGeometry = new THREE.RingGeometry(0.35, 0.45, 32);
        var ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x6c3bff,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        var ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.z = 0.01;
        group.add(ring);
        
        // Иконка товара (эмодзи в 3D)
        // Создаём спрайт с текстом
        var canvas2 = document.createElement('canvas');
        canvas2.width = 128;
        canvas2.height = 128;
        var ctx2 = canvas2.getContext('2d');
        
        // Круглый фон
        var grad = ctx2.createRadialGradient(64, 64, 10, 64, 64, 60);
        grad.addColorStop(0, 'rgba(108, 59, 255, 0.9)');
        grad.addColorStop(1, 'rgba(108, 59, 255, 0.2)');
        ctx2.fillStyle = grad;
        ctx2.beginPath();
        ctx2.arc(64, 64, 55, 0, Math.PI * 2);
        ctx2.fill();
        
        // Обводка
        ctx2.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx2.lineWidth = 2;
        ctx2.beginPath();
        ctx2.arc(64, 64, 55, 0, Math.PI * 2);
        ctx2.stroke();
        
        // Эмодзи или иконка
        ctx2.font = '48px Arial';
        ctx2.textAlign = 'center';
        ctx2.textBaseline = 'middle';
        ctx2.fillStyle = '#ffffff';
        ctx2.fillText(product.icon || '🛸', 64, 68);
        
        var texture2 = new THREE.CanvasTexture(canvas2);
        var spriteMaterial = new THREE.SpriteMaterial({
            map: texture2,
            transparent: true,
            depthTest: false,
            depthWrite: false
        });
        var sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(0.8, 0.8, 1);
        sprite.position.z = 0.05;
        group.add(sprite);
        
        // Сохраняем данные товара в группе
        group.userData = {
            productIndex: index,
            product: product,
            isMarker: true
        };
        
        scene.add(group);
        markers.push(group);
    });
}

// ===== ЗАГРУЗКА ТОВАРОВ =====
function loadPlanet() {
    if (planetMesh) {
        scene.remove(planetMesh);
        planetMesh.geometry.dispose();
        planetMesh.material.dispose();
    }
    
    var products = loadPlanetData(PLANET_KEYS.PRODUCTS, getDefaultProducts());
    planetData = products;
    
    if (products.length === 0) {
        showToast('🌠 Нет товаров');
        return;
    }
    
    // Создаём планету
    planetMesh = createPlanet();
    scene.add(planetMesh);
    
    // Создаём маркеры
    createMarkers(products);
}

// ===== ОБРАБОТЧИК КЛИКА ПО ПЛАНЕТЕ =====
function onPlanetClick(event) {
    var rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(markers, true);
    
    if (intersects.length > 0) {
        // Находим группу маркера
        var obj = intersects[0].object;
        var group = obj.parent;
        while (group && !group.userData.isMarker) {
            group = group.parent;
        }
        if (group && group.userData.isMarker) {
            var index = group.userData.productIndex;
            if (index !== undefined) {
                openProductModal(index);
                return;
            }
        }
    }
}

// ===== ОБРАБОТЧИК НАВЕДЕНИЯ =====
function onPlanetHover(event) {
    var rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(markers, true);
    
    var hoverInfo = document.getElementById('hoverInfo');
    if (intersects.length > 0) {
        var obj = intersects[0].object;
        var group = obj.parent;
        while (group && !group.userData.isMarker) {
            group = group.parent;
        }
        if (group && group.userData.isMarker) {
            var product = group.userData.product;
            if (product) {
                hoverInfo.textContent = '🪐 ' + product.name;
                hoverInfo.classList.add('active');
                renderer.domElement.style.cursor = 'pointer';
                return;
            }
        }
    }
    hoverInfo.classList.remove('active');
    renderer.domElement.style.cursor = 'default';
}

// ===== АНИМАЦИОННЫЙ ЦИКЛ =====
function animate() {
    requestAnimationFrame(animate);
    
    if (autoRotate && planetMesh) {
        planetMesh.rotation.y += 0.002;
        // Маркеры вращаются вместе с планетой
        markers.forEach(function(m) {
            // Маркеры уже привязаны к планете, вращаются автоматически
        });
    }
    
    controls.update();
    renderer.render(scene, camera);
}

// ===== ОТКРЫТИЕ МОДАЛЬНОГО ОКНА =====
function openProductModal(index) {
    var product = planetData[index];
    if (!product) return;
    
    document.getElementById('modalName').textContent = product.name;
    document.getElementById('modalCategory').textContent = getCategoryName(product.category);
    
    var priceHtml = product.price.toLocaleString() + ' ₽';
    document.getElementById('modalPrice').textContent = priceHtml;
    
    if (product.oldPrice) {
        document.getElementById('modalOldPrice').textContent = product.oldPrice.toLocaleString() + ' ₽';
        document.getElementById('modalOldPrice').style.display = 'block';
    } else {
        document.getElementById('modalOldPrice').style.display = 'none';
    }
    
    document.getElementById('modalDesc').textContent = product.desc || 'Без описания';
    
    var stockEl = document.getElementById('modalStock');
    if (product.inStock) {
        stockEl.textContent = '● В наличии';
        stockEl.className = 'modal-stock in-stock';
    } else {
        stockEl.textContent = '● Нет в наличии';
        stockEl.className = 'modal-stock out-of-stock';
    }
    
    // Мини-планета в модальном окне
    renderMiniPlanet(product.image);
    
    document.getElementById('productModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    document.body.style.overflow = '';
}

// ===== МИНИ-ПЛАНЕТА В МОДАЛЬНОМ ОКНЕ =====
var miniScene, miniCamera, miniRenderer, miniPlanet;

function renderMiniPlanet(imageUrl) {
    var container = document.getElementById('modalPlanetPreview');
    if (!container) return;
    
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    var width = container.clientWidth || 200;
    var height = container.clientHeight || 200;
    
    miniScene = new THREE.Scene();
    
    miniCamera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
    miniCamera.position.set(0, 0, 4);
    miniCamera.lookAt(0, 0, 0);
    
    miniRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    miniRenderer.setSize(width, height);
    miniRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(miniRenderer.domElement);
    
    var ambientLight = new THREE.AmbientLight(0x404060);
    miniScene.add(ambientLight);
    
    var directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 10, 7);
    miniScene.add(directionalLight);
    
    var textureLoader = new THREE.TextureLoader();
    var texture = textureLoader.load(imageUrl || 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=400');
    
    var geometry = new THREE.SphereGeometry(1.2, 48, 48);
    var material = new THREE.MeshPhongMaterial({
        map: texture,
        shininess: 30,
        specular: new THREE.Color(0x222244),
        emissive: new THREE.Color(0x111122),
        emissiveIntensity: 0.1
    });
    
    miniPlanet = new THREE.Mesh(geometry, material);
    miniScene.add(miniPlanet);
    
    function animateMini() {
        if (!miniPlanet) return;
        requestAnimationFrame(animateMini);
        miniPlanet.rotation.y += 0.01;
        miniRenderer.render(miniScene, miniCamera);
    }
    animateMini();
    
    setTimeout(function() {
        var newWidth = container.clientWidth || 200;
        var newHeight = container.clientHeight || 200;
        miniCamera.aspect = newWidth / newHeight;
        miniCamera.updateProjectionMatrix();
        miniRenderer.setSize(newWidth, newHeight);
    }, 100);
}

// ===== ЗАПУСК =====
document.addEventListener('DOMContentLoaded', function() {
    renderStars();
    initScene();
    loadPlanet();
    animate();
    updatePlanetStats();
});

// ===== ПОИСК =====
function searchProducts(e) {
    e.preventDefault();
    var query = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!query) {
        loadPlanet();
        return;
    }
    
    var products = loadPlanetData(PLANET_KEYS.PRODUCTS, getDefaultProducts());
    var filtered = products.filter(function(p) {
        return p.name.toLowerCase().includes(query) ||
               p.desc.toLowerCase().includes(query);
    });
    
    planetData = filtered;
    
    // Обновляем маркеры
    if (planetMesh) {
        scene.remove(planetMesh);
        planetMesh.geometry.dispose();
        planetMesh.material.dispose();
    }
    
    markers.forEach(function(m) {
        scene.remove(m);
    });
    markers = [];
    
    if (filtered.length === 0) {
        showToast('🌠 Товаров не найдено');
        return;
    }
    
    planetMesh = createPlanet();
    scene.add(planetMesh);
    createMarkers(filtered);
}

function getCategoryName(categoryId) {
    var categories = loadPlanetData(PLANET_KEYS.CATEGORIES, getDefaultCategories());
    var cat = categories.find(function(c) { return c.id === categoryId; });
    return cat ? cat.name : categoryId;
}

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

function showToast(msg) {
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    toast.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#fff;padding:12px 28px;border-radius:30px;font-size:14px;z-index:9999;backdrop-filter:blur(10px);border:0.5px solid rgba(255,255,255,0.04);animation:toastIn 0.4s ease;';
    document.body.appendChild(toast);
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = '0.4s';
        setTimeout(function() { toast.remove(); }, 400);
    }, 2500);
}
