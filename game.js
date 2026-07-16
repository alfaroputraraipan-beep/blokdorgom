// --- 1. INITIALIZATION THREE.JS AREA (FULLSCREEN) ---
const container = document.getElementById("canvas-container");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x4a90e2); // Langit biru cerah

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 6); // Posisi awal kamera/pemain

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// --- 2. LIGHTING (CAHAYA MATAHARI) ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight.position.set(20, 40, 20);
scene.add(dirLight);

// --- 3. DASAR TANAH (MINECRAFT GRASS LAND) ---
const groundGeo = new THREE.BoxGeometry(60, 1, 60);
const groundMat = new THREE.MeshLambertMaterial({ color: 0x557a46 }); // Hijau rumput
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.position.set(0, -0.5, 0); 
scene.add(ground);

// Variabel Kontrol & Game
let selectedColor = 0xd7a15c;
const blocksArray = [];
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let moveControls = { forward: false, backward: false, left: false, right: false };
let playerSpeed = 0.12; // Sedikit disesuaikan agar pergerakan tabrakan lebih halus

// Ukuran fisik pemain untuk deteksi tabrakan (lebar 0.6, tinggi bebas, tebal 0.6)
const playerRadius = 0.3; 

// --- LOGIKA ROTASI KAMERA ---
let lon = -90; 
let lat = 0;   
let phi = 0, theta = 0;

let lastTouchX = 0;
let lastTouchY = 0;
let isMovingCamera = false;
let hasMovedMuch = false;

// Indikator Transparansi Peletakan Balok (Preview)
const rollOverGeo = new THREE.BoxGeometry(1, 1, 1);
const rollOverMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true });
const rollOverMesh = new THREE.Mesh(rollOverGeo, rollOverMat);
scene.add(rollOverMesh);

// Mengubah warna aktif dari tombol UI
window.setBlockColor = function(color, buttonId) {
    selectedColor = color;
    rollOverMesh.material.color.setHex(color);
    
    document.querySelectorAll(".hotbar button").forEach(btn => {
        btn.classList.remove("selected-block");
    });
    const clickedBtn = document.getElementById(buttonId);
    if(clickedBtn) clickedBtn.classList.add("selected-block");
};

// --- 4. SISTEM SENTUH LAYAR ---
container.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        isMovingCamera = true;
        hasMovedMuch = false;
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
    }
}, { passive: true });

container.addEventListener('touchmove', (e) => {
    if (!isMovingCamera || e.touches.length !== 1) return;

    const sensitivity = 0.22; 
    const deltaX = e.touches[0].clientX - lastTouchX;
    const deltaY = e.touches[0].clientY - lastTouchY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        hasMovedMuch = true;
    }

    lon += deltaX * sensitivity;
    lat -= deltaY * sensitivity;
    lat = Math.max(-85, Math.min(85, lat));

    lastTouchX = e.touches[0].clientX;
    lastTouchY = e.touches[0].clientY;
});

container.addEventListener('touchend', (e) => {
    isMovingCamera = false;
    if (!hasMovedMuch) {
        const touch = e.changedTouches[0];
        placeBlock(touch);
    }
});

// --- 5. MEKANISME PASANG BALOK PRESISI ---
function placeBlock(touchEvent) {
    const rect = container.getBoundingClientRect();
    mouse.x = ((touchEvent.clientX - rect.left) / container.clientWidth) * 2 - 1;
    mouse.y = -((touchEvent.clientY - rect.top) / container.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([ground, ...blocksArray]);

    if (intersects.length > 0) {
        const intersect = intersects[0];
        const blockGeo = new THREE.BoxGeometry(1, 1, 1);
        const blockMat = new THREE.MeshLambertMaterial({ color: selectedColor });
        const voxel = new THREE.Mesh(blockGeo, blockMat);
        
        voxel.position.copy(intersect.point).addScaledVector(intersect.face.normal, 0.5);
        voxel.position.floor().addScalar(0.5);
        
        // Mencegah meletakkan balok tepat di posisi badan pemain berdiri
        const distToPlayer = Math.hypot(voxel.position.x - camera.position.x, voxel.position.z - camera.position.z);
        if (voxel.position.y >= 0.5 && (distToPlayer > 0.7 || Math.abs(voxel.position.y - camera.position.y) > 0.8)) {
            scene.add(voxel);
            blocksArray.push(voxel);
        }
    }
}

// --- 6. NAVIGASI D-PAD INPUT ---
window.movePlayer = function(dir) { moveControls[dir] = true; };
window.stopPlayer = function(dir) { moveControls[dir] = false; };
window.clearGrid = function() {
    blocksArray.forEach(b => scene.remove(b));
    blocksArray.length = 0;
};

// --- 7. LOGIKA DETEKSI TABRAKAN (COLLISION) ---
// Memeriksa apakah suatu posisi koordinat (x, z) menabrak balok yang ada
function checkCollision(targetX, targetZ) {
    // Kelilingi area pemain dengan kotak kecil fiktif
    const pMinX = targetX - playerRadius;
    const pMaxX = targetX + playerRadius;
    const pMinZ = targetZ - playerRadius;
    const pMaxZ = targetZ + playerRadius;

    for (let i = 0; i < blocksArray.length; i++) {
        const block = blocksArray[i];
        
        // Hanya cek balok yang tingginya sejajar dengan tinggi mata/kaki pemain (y sekitar 0.5 sampai 1.5)
        if (block.position.y > 0 && block.position.y < 2.0) {
            const bMinX = block.position.x - 0.5;
            const bMaxX = block.position.x + 0.5;
            const bMinZ = block.position.z - 0.5;
            const bMaxZ = block.position.z + 0.5;

            // Jika kotak pemain bersentuhan dengan kotak balok
            if (pMaxX > bMinX && pMinX < bMaxX && pMaxZ > bMinZ && pMinZ < bMaxZ) {
                return true; // Terjadi tabrakan!
            }
        }
    }
    return false; // Aman, tidak menabrak
}

// --- 8. GAME ANIMATION LOOP ---
function animate() {
    requestAnimationFrame(animate);

    phi = THREE.MathUtils.degToRad(90 - lat);
    theta = THREE.MathUtils.degToRad(lon);

    const target = new THREE.Vector3();
    target.x = camera.position.x + 100 * Math.sin(phi) * Math.cos(theta);
    target.y = camera.position.y + 100 * Math.cos(phi);
    target.z = camera.position.z + 100 * Math.sin(phi) * Math.sin(theta);
    camera.lookAt(target);

    // Vektor pergerakan
    const forwardVector = new THREE.Vector3();
    camera.getWorldDirection(forwardVector);
    forwardVector.y = 0;
    forwardVector.normalize();

    const sideVector = new THREE.Vector3();
    sideVector.crossVectors(camera.up, forwardVector).normalize();

    // Prediksi posisi baru sebelum pemain melangkah
    let nextX = camera.position.x;
    let nextZ = camera.position.z;

    if (moveControls.forward) {
        nextX += forwardVector.x * playerSpeed;
        nextZ += forwardVector.z * playerSpeed;
    }
    if (moveControls.backward) {
        nextX -= forwardVector.x * playerSpeed;
        nextZ -= forwardVector.z * playerSpeed;
    }
    if (moveControls.left) {
        nextX += sideVector.x * playerSpeed;
        nextZ += sideVector.z * playerSpeed;
    }
    if (moveControls.right) {
        nextX -= sideVector.x * playerSpeed;
        nextZ -= sideVector.z * playerSpeed;
    }

    // Gerakkan pemain hanya jika posisi tujuan TIDAK menabrak balok apa pun
    if (!checkCollision(nextX, nextZ)) {
        camera.position.x = nextX;
        camera.position.z = nextZ;
    } else {
        // Sliding Collision: Coba jalankan hanya di sumbu X saja agar gerakan di dinding halus
        if (!checkCollision(nextX, camera.position.z)) {
            camera.position.x = nextX;
        } 
        // Coba jalankan hanya di sumbu Z saja
        else if (!checkCollision(camera.position.x, nextZ)) {
            camera.position.z = nextZ;
        }
    }

    // Selalu jaga ketinggian kamera agar tetap berdiri tegak di atas tanah
    camera.position.y = 1.5; 

    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
