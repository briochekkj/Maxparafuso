// game.js

// --- CONFIGURAÇÕES ---
const player = {
    x: 50,
    y: 300,
    width: 50,
    height: 50,
    vy: 0,
    gravity: 0.8,
    isJumping: false,
    dashCooldown: 0,
    punchCooldown: 0,
    slowCooldown: 0
};

let obstacles = [];
let speed = 5;
let score = 0;
let coins = 0;
let multiplier = 1;
let timeElapsed = 0;
let lastSpawn = 0;
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- HABILIDADES ---
const abilities = {
    dash: { cooldown: 3, active: false },
    punch: { cooldown: 15, active: false },
    slow: { cooldown: 12, active: false },
    jumpCharge: { charge: 0, active: false }
};

// --- MENU DEV ---
let devMode = false;
let devTapCount = 0;
let devTapTime = 0;

// --- FUNÇÕES AUXILIARES ---
function spawnObstacle() {
    const types = ["low", "mid", "high"];
    const type = types[Math.floor(Math.random() * types.length)];
    const width = 40;
    let height = 40;
    if(type === "mid") height = 60;
    if(type === "high") height = 80;

    const minDist = 2.5 * player.width;
    const maxDist = 7 * player.width;
    const lastX = obstacles.length > 0 ? obstacles[obstacles.length-1].x : canvas.width;
    const x = lastX + minDist + Math.random() * (maxDist - minDist);

    obstacles.push({ x, y: canvas.height - height, width, height, type });
}

function updatePlayer() {
    // gravidade
    player.vy += player.gravity;
    player.y += player.vy;

    if(player.y > canvas.height - player.height){
        player.y = canvas.height - player.height;
        player.vy = 0;
        player.isJumping = false;
    }

    // cooldowns
    if(player.dashCooldown > 0) player.dashCooldown -= 1/60;
    if(player.punchCooldown > 0) player.punchCooldown -= 1/60;
    if(player.slowCooldown > 0) player.slowCooldown -= 1/60;
}

function updateObstacles() {
    for(let i = 0; i < obstacles.length; i++){
        obstacles[i].x -= speed;
    }
    // remove obstáculos fora da tela
    obstacles = obstacles.filter(o => o.x + o.width > 0);
}

function checkCollision(obj) {
    return !(player.x + player.width < obj.x ||
             player.x > obj.x + obj.width ||
             player.y + player.height < obj.y ||
             player.y > obj.y + obj.height);
}

function updateScore() {
    obstacles.forEach(o => {
        if(!o.passed && o.x + o.width < player.x){
            o.passed = true;
            score += 1;
            coins += 1 * multiplier;
        }
    });
}

function updateMultiplier() {
    multiplier = 1 + Math.floor(timeElapsed/30) * 0.25;
}

function gameLoop(timestamp) {
    timeElapsed += 1/60;

    ctx.clearRect(0,0,canvas.width,canvas.height);

    // spawn de obstáculos
    if(timeElapsed - lastSpawn > 1.5){
        spawnObstacle();
        lastSpawn = timeElapsed;
    }

    updatePlayer();
    updateObstacles();
    updateScore();
    updateMultiplier();

    // desenhar player
    ctx.fillStyle = "red";
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // desenhar obstáculos
    ctx.fillStyle = "gray";
    obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.width, o.height));

    // HUD
    ctx.fillStyle = "black";
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Coins: ${coins}`, 10, 40);
    ctx.fillText(`Multiplier: x${multiplier.toFixed(2)}`, 10, 60);

    requestAnimationFrame(gameLoop);
}

// --- CONTROLES ---
document.addEventListener("keydown", e => {
    if(e.code === "Space" && !player.isJumping){
        player.vy = -12;
        player.isJumping = true;
    }
    if(e.code === "KeyD" && player.dashCooldown <= 0){
        player.x += 50;
        player.dashCooldown = abilities.dash.cooldown;
    }
    if(e.code === "KeyF" && player.punchCooldown <= 0){
        // destruir próximos 3 obstáculos
        for(let i = 0; i < 3; i++){
            if(obstacles[i]) obstacles.splice(i,1);
        }
        player.punchCooldown = abilities.punch.cooldown;
    }
    if(e.code === "KeyS" && player.slowCooldown <= 0){
        speed /= 2;
        setTimeout(()=> speed *= 2, 1500);
        player.slowCooldown = abilities.slow.cooldown;
    }
});

// --- BOTÃO DEV ---
const devButton = document.getElementById("devButton");
devButton.addEventListener("click", ()=>{
    const now = Date.now();
    if(now - devTapTime < 250){
        devTapCount++;
    } else {
        devTapCount = 1;
    }
    devTapTime = now;

    if(devTapCount >= 6){
        devMode = true;
        alert("DEV MENU ATIVADO");
        // aqui você poderia abrir um menu HTML com cheats
    }
});

// --- INICIO ---
requestAnimationFrame(gameLoop);
