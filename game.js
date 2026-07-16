const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// UPDATE POSISI DAN UKURAN DI SINI
let playerSize = 40; // Diperkecil sedikit agar pas di canvas 400
let playerX = canvas.width / 2 - playerSize / 2; // Tepat di tengah
const playerY = canvas.height - 60;   // Di bagian bawah canvas hitam
const speed = 5; // Kecepatan gerak

// Status tombol
let moveLeft = false;
let moveRight = false;

const btnLeft = document.getElementById("btnLeft");
const btnRight = document.getElementById("btnRight");

// --- Bagian deteksi sentuhan (TETAP SAMA SEPERTI SEBELUMNYA) ---
btnLeft.addEventListener("touchstart", (e) => { e.preventDefault(); moveLeft = true; });
btnLeft.addEventListener("touchend", (e) => { e.preventDefault(); moveLeft = false; });
btnRight.addEventListener("touchstart", (e) => { e.preventDefault(); moveRight = true; });
btnRight.addEventListener("touchend", (e) => { e.preventDefault(); moveRight = false; });

// Tambahan deteksi mouse klik (untuk cadangan)
btnLeft.addEventListener("mousedown", () => { moveLeft = true; });
btnLeft.addEventListener("mouseup", () => { moveLeft = false; });
btnRight.addEventListener("mousedown", () => { moveRight = true; });
btnRight.addEventListener("mouseup", () => { moveRight = false; });
// ----------------------------------------------------------------

// GAME LOOP
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Pergerakan player
    if (moveLeft && playerX > 0) {
        playerX -= speed;
    }
    if (moveRight && playerX < canvas.width - playerSize) {
        playerX += speed;
    }

    // GAMBAR PLAYER (Kita ubah warnanya jadi MERAH mencolok)
    ctx.fillStyle = "red";
    ctx.fillRect(playerX, playerY, playerSize, playerSize);

    requestAnimationFrame(gameLoop);
}

gameLoop();
