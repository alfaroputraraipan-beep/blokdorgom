// --- 1. SETUP NYAWA GAME 3D (Scene, Camera, Renderer) ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e); // Warna langit malam

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / (window.innerHeight * 0.7), 0.1, 1000);
// Mengatur posisi sudut pandang kamera 3D
camera.position.set(10, 14, 15);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight * 0.7);
document.getElementById("canvas-container").appendChild(renderer.domElement);

// --- 2. PENCAHAYAAN (Matahari & Bayangan) ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(20, 40, 20);
scene.add(dirLight);

// --- 3. MEMBUAT GRID LANTAI 3D (Seperti Build a Boat) ---
const gridHelper = new THREE.GridHelper(12, 12, 0xffffff, 0x444444);
gridHelper.position.y = -0.5;
scene.add(gridHelper);

// Alas tanah transparan untuk mendeteksi klik sentuhan
const planeGeo = new THREE.PlaneGeometry(12, 12);
planeGeo.rotateX(-Math.PI / 2);
const planeMat = new THREE.ShadowMaterial({ opacity: 0.2 });
const plane = new THREE.Mesh(planeGeo, planeMat);
plane.position.y = -0.5;
scene.add(plane);

// --- 4. VARIABEL GAME ---
let selectedColor = 0xd7a15c; // Warna balok default
const blocksArray = []; // Menyimpan balok-balok yang sudah dibangun
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let cameraAngle = 0;

// Kubus bayangan pembantu (Preview) saat jari kita menunjuk grid
const rollOverGeo = new THREE.BoxGeometry(1, 1, 1);
const rollOverMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true });
const rollOverMesh = new THREE.Mesh(rollOverGeo, rollOverMat);
scene.add(rollOverMesh);

// --- 5. FUNGSI INTERAKSI (Sentuh & Pasang Balok 3D) ---
function setBlockColor(color) {
    selectedColor = color;
    rollOverMesh.material.color.setHex(color);
}

// Fungsi mendeteksi klik/sentuhan pada layar 3D
window.addEventListener('pointerdown', onPointerDown);

function onPointerDown(event) {
    // Menghitung posisi klik jari di layar canvas
    if (event.clientY > window.innerHeight * 0.7) return; // Jangan respon jika klik tombol menu di bawah
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / (window.innerHeight * 0.7)) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([plane, ...blocksArray]);

    if (intersects.length > 0) {
        const intersect = intersects[0];

        // Jika klik balok yang sudah ada sambil menekan tombol tertentu atau klik dua kali bisa untuk hapus,
        // Tapi di sini kita buat jika klik grid kosong/atas balok, kita tumpuk balok baru (Mekanisme Minecraft)
        const blockGeo = new THREE.BoxGeometry(1, 1, 1);
        const blockMat = new THREE.MeshLambertMaterial({ color: selectedColor });
        const voxel = new THREE.Mesh(blockGeo, blockMat);
        
        // Memposisikan balok pas di koordinat grid kotak
        voxel.position.copy(intersect.point).add(intersect.face.normal);
        voxel.position.divideScalar(1).floor().addScalar(0.5);
        
        // Batasi area agar tidak kejauhan membangunnya
        if (Math.abs(voxel.position.x) < 6 && Math.abs(voxel.position.z) < 6 && voxel.position.y >= 0) {
            scene.add(voxel);
            blocksArray.push(voxel);
        }
    }
}

// --- 6. KENDALIKAN KAMERA (Bisa Diputar 360 Derajat) ---
function rotateCamera() {
    cameraAngle += Math.PI / 4; // Berputar 45 derajat setiap ditekan
}

// --- 7. HAPUS SEMUA RAKITAN ---
function clearGrid() {
    blocksArray.forEach(block => scene.remove(block));
    blocksArray.length = 0;
}

// --- 8. GAME LOOP (RENDER UTAMA ANIME) ---
function animate() {
    requestAnimationFrame(animate);

    // Animasi perputaran kamera yang halus
    const targetX = Math.sin(cameraAngle) * 18;
    const targetZ = Math.cos(cameraAngle) * 18;
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.z += (targetZ - camera.position.z) * 0.05;
    camera.lookAt(0, 1, 0);

    renderer.render(scene, camera);
}

// Jalankan sistem animasi 3D
animate();

// Sesuaikan ukuran jika layar HP berputar
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / (window.innerHeight * 0.7);
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight * 0.7);
});
