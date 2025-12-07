// ================== CANVAS ==================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ================== VARIÁVEIS ==================
let player = {
    x: 150,
    y: 0,
    width: 80,
    height: 120,
    vy: 0,
    gravity: 1.2,
    isJumping: false,
    dashCD: 0,
    punchCD: 0,
    slowCD: 0,
    skin: 0
};

let speed = 7, score = 0, coins = 0, multiplier = 1, timeElapsed = 0;
let obstacles = [], lastSpawn = 0, playerInvincible = false;
let particles = [];

const skins = [
    { name: "Base", color: "#999", rarity: "Comum", price: 0 },
    { name: "Herói", color: "#0F0", rarity: "Comum", price: 50 },
    { name: "Robô", color: "#AAA", rarity: "Incomum", price: 200 },
    { name: "Verde Neon", color: "#0FF", rarity: "Épica", price: 500 },
    { name: "Demoníaco", color: "#F00", rarity: "Épica", price: 500 },
    { name: "Dourado", color: "#FFD700", rarity: "Lendária", price: 1000 },
    { name: "Só um Pixel", color: "#FFF", rarity: "Rara", price: 300 }
];

const scenes = [
    { name: "Deserto", bg: "#FEEAA4", obstacleColor: "#C08000" },
    { name: "Floresta", bg: "#228B22", obstacleColor: "#654321" },
    { name: "Cidade Neon", bg: "#2E0854", obstacleColor: "#00FFFF" }
];
let currentScene = 0;

const perks = [
    { name: "Dash", desc: "Corre em alta velocidade", price: 100 },
    { name: "Soco", desc: "Soco quebra 3 obstáculos", price: 150 },
    { name: "Slow Motion", desc: "Deixa tudo lento", price: 200 },
    { name: "Pulo Carregado", desc: "Pulo mais alto segurando", price: 250 }
];

let devMode = false, devTapCount = 0, devTapTime = 0;

// ================== PARTICULAS ==================
function spawnParticle(x, y, color) {
    particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3,
        life: 40,
        color
    });
}
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--;
        if (p.life <= 0) particles.splice(i, 1);
        else { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 4, 4); }
    }
}

// ================== SPAWN OBSTÁCULOS ==================
function spawnObstacle() {
    const types = ["low", "mid", "high"];
    const type = types[Math.floor(Math.random() * types.length)];
    let width = 60, height = 60;
    if (type === "mid") height = 90;
    if (type === "high") height = 130;
    const minDist = 2.5 * player.width, maxDist = 7 * player.width;
    const lastX = obstacles.length > 0 ? obstacles[obstacles.length - 1].x : canvas.width;
    const x = lastX + minDist + Math.random() * (maxDist - minDist);
    const y = canvas.height - height;
    obstacles.push({ x, y, width, height, type, passed: false });
}

// ================== UPDATE PLAYER ==================
function updatePlayer() {
    player.vy += player.gravity;
    player.y += player.vy;
    if (player.y > canvas.height - player.height) {
        player.y = canvas.height - player.height;
        player.vy = 0;
        player.isJumping = false;
    }
    if (player.dashCD > 0) player.dashCD -= 1 / 60;
    if (player.punchCD > 0) player.punchCD -= 1 / 60;
    if (player.slowCD > 0) player.slowCD -= 1 / 60;
}

// ================== UPDATE OBSTÁCULOS ==================
function updateObstacles() {
    obstacles.forEach(o => o.x -= speed);
    obstacles = obstacles.filter(o => o.x + o.width > 0);
}

// ================== CHECAGEM DE COLISÃO ==================
function checkCollision(obj) {
    if (playerInvincible) return false;
    return !(player.x + player.width < obj.x || player.x > obj.x + obj.width ||
        player.y + player.height < obj.y || player.y > obj.y + obj.height);
}

// ================== SCORE E MOEDAS ==================
function updateScore() {
    obstacles.forEach(o => {
        if (!o.passed && o.x + o.width < player.x) {
            o.passed = true;
            score += 1;
            coins += 1 * multiplier;
            spawnParticle(player.x + player.width / 2, player.y + player.height / 2, "yellow");
        }
    });
}
function updateMultiplier() {
    multiplier = 1 + Math.floor(timeElapsed / 30) * 0.25;
}

// ================== RESET ==================
function resetGame() {
    obstacles = [];
    player.y = canvas.height - player.height - 20;
    player.vy = 0;
    score = 0;
    speed = 7;
    timeElapsed = 0;
    multiplier = 1;
    playerInvincible = false;
}

// ================== DRAW PLAYER ==================
function drawPlayer() {
    let skinColor = skins[player.skin].color;
    ctx.fillStyle = skinColor;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillStyle = "#555"; ctx.fillRect(player.x + 10, player.y - 15, player.width - 20, 12);
    ctx.fillStyle = "#FFF"; ctx.fillRect(player.x + 20, player.y + 30, 8, 8);
}

// ================== DRAW OBSTÁCULOS ==================
function drawObstacles() {
    obstacles.forEach(o => {
        let color = scenes[currentScene].obstacleColor;
        if (o.type === "mid") color = "#00F";
        if (o.type === "high") color = "#F0F";
        ctx.fillStyle = color;
        ctx.fillRect(o.x, o.y, o.width, o.height);
    });
}

// ================== DRAW CENÁRIO ==================
function drawScene() {
    ctx.fillStyle = scenes[currentScene].bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ================== DRAW HUD ==================
function drawHUD() {
    ctx.fillStyle = "white";
    ctx.font = "28px Arial";
    ctx.fillText(`Score: ${score}`, 20, 40);
    ctx.fillText(`Coins: ${coins}`, 20, 80);
    ctx.fillText(`x${multiplier.toFixed(2)}`, 20, 120);
}

// ================== GAME LOOP ==================
function gameLoop() {
    timeElapsed += 1 / 60;
    drawScene();
    if (timeElapsed - lastSpawn > 1.2) { spawnObstacle(); lastSpawn = timeElapsed; }
    updatePlayer();
    updateObstacles();
    updateScore();
    updateMultiplier();
    drawObstacles();
    drawPlayer();
    updateParticles();
    drawHUD();
    obstacles.forEach(o => { if (checkCollision(o)) { resetGame(); } });
    speed = 7 + Math.floor(timeElapsed / 15);
    requestAnimationFrame(gameLoop);
}

// ================== TOUCH CONTROLS ==================
let touchStartTime = 0, touchCount = 0;
canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    const now = Date.now();
    if (now - touchStartTime < 300) touchCount++;
    else touchCount = 1;
    touchStartTime = now;
    if (touchCount === 1 && !player.isJumping) { player.vy = -22; player.isJumping = true; }
    else if (touchCount === 2 && player.dashCD <= 0) { player.x += 100; player.dashCD = 3; }
    else if (touchCount >= 3 && player.punchCD <= 0) {
        for (let i = 0; i < 3; i++) { if (obstacles[i]) obstacles.splice(i, 1); }
        player.punchCD = 15; touchCount = 0;
    }
});
canvas.addEventListener("touchmove", e => {
    if (player.slowCD <= 0) { speed /= 2; setTimeout(() => speed *= 2, 1200); player.slowCD = 12; }
});

// ================== MENU DEV ==================
const devButton = document.getElementById("devButton");
devButton.addEventListener("click", () => {
    const now = Date.now();
    if (now - devTapTime < 250) devTapCount++; else devTapCount = 1;
    devTapTime = now;
    if (devTapCount >= 6) { devMode = true; document.getElementById("devMenu").style.display = "block"; alert("DEV MENU ATIVADO"); }
});

// ================== BOTÕES PRINCIPAIS ==================
document.getElementById("startBtn").addEventListener("click", () => { document.getElementById("menu").style.display = "none"; gameLoop(); });

// ================== LOJA ==================
const shopOverlay = document.getElementById("shopOverlay");
document.getElementById("openShopBtn").addEventListener("click", () => { shopOverlay.style.display = "block"; updateShop(); });
document.getElementById("closeShop").addEventListener("click", () => { shopOverlay.style.display = "none"; });

function updateShop() {
    const perkList = document.getElementById("perkList"); perkList.innerHTML = "";
    perks.forEach(p => { let div = document.createElement("div"); div.innerText = `${p.name} - ${p.desc} - ${p.price} moedas`; perkList.appendChild(div); });
    const skinList = document.getElementById("skinList"); skinList.innerHTML = "";
    skins.forEach(s => { let div = document.createElement("div"); div.innerText = `${s.name} - ${s.rarity} - ${s.price} moedas`; div.setAttribute("data-rarity", s.rarity); skinList.appendChild(div); });
}

// ================== SELEÇÃO DE CENÁRIO E SKIN ==================
document.getElementById("prevScene").addEventListener("click", () => { currentScene = (currentScene - 1 + scenes.length) % scenes.length; document.getElementById("selectedScene").innerText = scenes[currentScene].name; });
document.getElementById("nextScene").addEventListener("click", () => { currentScene = (currentScene + 1) % scenes.length; document.getElementById("selectedScene").innerText = scenes[currentScene].name; });
document.getElementById("prevSkin").addEventListener("click", () => { player.skin = (player.skin - 1 + skins.length) % skins.length; document.getElementById("selectedCharacter").innerText = skins[player.skin].name; });
document.getElementById("nextSkin").addEventListener("click", () => { player.skin = (player.skin + 1) % skins.length; document.getElementById("selectedCharacter").innerText = skins[player.skin].name; });
