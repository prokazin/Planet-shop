// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
var currentPlanetIndex = 0;
var planets = [];
var scene, camera, renderer;
var planetMeshes = [];
var controls;
var autoRotate = true;
var isInteracting = false;
var planetData = [];

// ===== ИНИЦИАЛИЗАЦИЯ 3D СЦЕНЫ =====
function initScene() {
    var container = document.getElementById('threeContainer');
    if (!container) return;
    
    var width = container.clientWidth;
    var height = container.clientHeight;
    
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1, 8);
    camera.lookAt(0, 0, 0);
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    
    // Используем встроенный OrbitControls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = false;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.rotateSpeed = 0.8;
    controls.target.set(0, 0, 0);
    
    // Свет
    var ambientLight = new THREE.AmbientLight(0x404060);
    scene.add(ambientLight);
    
    var directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);
    
    var pointLight = new THREE.PointLight(0x6c3bff, 0.5, 20);
    pointLight.position.set(-3, 2, 4);
    scene.add(pointLight);
    
    // Обработчики
    renderer.domElement.addEventListener('mousedown', function() { autoRotate = false; isInteracting = true; });
    renderer.domElement.addEventListener('mouseup', function() { isInteracting = false; setTimeout(function() { if (!isInteracting) autoRotate = true; }, 3000); });
    renderer.domElement.addEventListener('touchstart', function() { autoRotate = false; isInteracting = true; });
    renderer.domElement.addEventListener('touchend', function() { isInteracting = false; setTimeout(function() { if (!isInteracting) autoRotate = true; }, 3000); });
    
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

// ===== СОЗДАНИЕ ПЛАНЕТЫ =====
function createPlanet(product, index, total) {
    var textureLoader = new THREE.TextureLoader();
    
    var geometry = new THREE.SphereGeometry(1.2, 64, 64);
    
    var texture = textureLoader.load(product.image || 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=400');
    
    var material = new THREE.MeshPhongMaterial({
        map: texture,
        shininess: 30,
        specular: new THREE.Color(0x222244),
        emissive: new THREE.Color(0x111122),
        emissiveIntensity: 0.1
    });
    
    var mesh = new THREE.Mesh(geometry, material);
    
    var cols = Math.min(total, 5);
    var rows = Math.ceil(total / cols);
    var col = index % cols;
    var row = Math.floor(index / cols);
    var spacingX = 3.5;
    var spacingZ = 3.5;
    
    var offsetX = (cols - 1) * spacingX / 2;
    var offsetZ = (rows - 1) * spacingZ / 2;
    
    mesh.position.set(
        col * spacingX - offsetX,
        0,
        row * spacingZ - offsetZ
    );
    
    mesh.userData = { 
        productIndex: index,
        autoRotateSpeed: 0.003 + (index % 3) * 0.001
    };
    
    return mesh;
}

// ===== ЗАГРУЗКА ТОВАРОВ =====
function loadPlanets() {
    planetMeshes.forEach(function(mesh) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
    });
    planetMeshes = [];
    
    var products = loadPlanetData(PLANET_KEYS.PRODUCTS, getDefaultProducts());
    planetData = products;
    
    if (products.length === 0) {
        showToast('🌠 Нет товаров');
        return;
    }
    
    products.forEach(function(product, index) {
        var mesh = createPlanet(product, index, products.length);
        scene.add(mesh);
        planetMeshes.push(mesh);
    });
    
    updateIndicator(products.length);
}

function updateIndicator(count) {
    var container = document.getElementById('planetIndicator');
    if (!container) return;
    container.innerHTML = '';
    for (var i = 0; i < count; i++) {
        var dot = document.createElement('span');
        dot.className = 'dot' + (i === 0 ? ' active' : '');
        dot.onclick = (function(idx) {
            return function() { goToPlanet(idx); };
        })(i);
        container.appendChild(dot);
    }
}

function changePlanet(direction) {
    var total = planetMeshes.length;
    if (total === 0) return;
    currentPlanetIndex = (currentPlanetIndex + direction + total) % total;
    goToPlanet(currentPlanetIndex);
}

function goToPlanet(index) {
    if (index < 0 || index >= planetMeshes.length) return;
    currentPlanetIndex = index;
    
    var mesh = planetMeshes[index];
    if (!mesh) return;
    
    var targetPos = mesh.position.clone();
    targetPos.z += 4;
    targetPos.y += 0.5;
    
    var startPos = camera.position.clone();
    var startTime = Date.now();
    var duration = 600;
    
    function animateCamera() {
        var elapsed = Date.now() - startTime;
        var progress = Math.min(elapsed / duration, 1);
        var ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
        
        camera.position.lerpVectors(startPos, targetPos, ease);
        camera.lookAt(mesh.position);
        controls.target.copy(mesh.position);
        
        if (progress < 1) {
            requestAnimationFrame(animateCamera);
        }
    }
    animateCamera();
    
    document.querySelectorAll('.planet-indicator .dot').forEach(function(dot, i) {
        dot.classList.toggle('active', i === index);
    });
}

function animate() {
    requestAnimationFrame(animate);
    
    if (autoRotate) {
        planetMeshes.forEach(function(mesh) {
            mesh.rotation.y += mesh.userData.autoRotateSpeed || 0.003;
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
    loadPlanets();
    animate();
    updatePlanetStats();
    
    if (renderer && renderer.domElement) {
        renderer.domElement.addEventListener('click', function(event) {
            var rect = renderer.domElement.getBoundingClientRect();
            var mouse = new THREE.Vector2(
                ((event.clientX - rect.left) / rect.width) * 2 - 1,
                -((event.clientY - rect.top) / rect.height) * 2 + 1
            );
            
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);
            
            var intersects = raycaster.intersectObjects(planetMeshes);
            if (intersects.length > 0) {
                var hitMesh = intersects[0].object;
                var index = planetMeshes.indexOf(hitMesh);
                if (index !== -1) {
                    openProductModal(index);
                }
            }
        });
    }
});

function searchProducts(e) {
    e.preventDefault();
    var query = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!query) {
        loadPlanets();
        return;
    }
    
    var products = loadPlanetData(PLANET_KEYS.PRODUCTS, getDefaultProducts());
    var filtered = products.filter(function(p) {
        return p.name.toLowerCase().includes(query) ||
               p.desc.toLowerCase().includes(query);
    });
    
    planetData = filtered;
    
    planetMeshes.forEach(function(mesh) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
    });
    planetMeshes = [];
    
    if (filtered.length === 0) {
        showToast('🌠 Товаров не найдено');
        return;
    }
    
    filtered.forEach(function(product, index) {
        var mesh = createPlanet(product, index, filtered.length);
        scene.add(mesh);
        planetMeshes.push(mesh);
    });
    
    updateIndicator(filtered.length);
    currentPlanetIndex = 0;
    goToPlanet(0);
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
