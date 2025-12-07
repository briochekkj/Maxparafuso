// ================== CONFIGURAÇÕES INICIAIS ==================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Ajuste canvas full screen mobile
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ================== VARIÁVEIS ==================
let player = {
    x: 100,
    y: canvas.height - 100,
    width: 50,
    height: 50,
    vy: 0,
    gravity: 0.8,
    isJumping: false,
    dashCooldown: 0,
    punchCooldown: 0,
    slowCooldown: 0,
    skin: "base"
};

let speed = 5;
let score = 0;
let coins = 0;
let multiplier = 1;
let timeElapsed = 0;
let obstacles = [];
let lastSpawn = 0;
let playerInvincible = false;

// ================== SKINS ==================
const skins = [
    { name: "Base", rarity: "Comum", price: 0 },
    { name: "Herói", rarity: "Comum", price: 50 },
    { name: "Robô", rarity: "Incomum", price: 200 },
    { name: "Verde Neon", rarity: "Épica", price: 500 },
    { name: "Demoníaco", rarity: "Épica", price: 500 },
    { name: "Dourado", rarity: "Lendária", price: 1000 },
    { name: "Só um Pixel", rarity: "Rara", price: 300 }
];

// ================== CENÁRIOS ==================
const scenes = [
    { name: "Deserto", symbol: "🌵" },
    { name: "Floresta", symbol: "🌲" },
    { name: "Cidade Neon", symbol: "🏙️" }
];
let currentScene = 0;

// ================== HABILIDADES ==================
const abilities = {
    dash: { cooldown: 3 },
    punch: { cooldown: 15 },
    slow: { cooldown: 12 }
};

// ================== MENU DEV ==================
let devMode = false;
let devTapCount = 0;
let devTapTime = 0;

// ================== FUNÇÕES ==================

// Spawn de obstáculos
function spawnObstacle() {
    const types = ["low","mid","high"];
    const type = types[Math.floor(Math.random()*types.length)];
    let width = 40, height = 40;
    if(type==="mid") height = 60;
    if(type==="high") height = 80;
    const minDist = 2.5*player.width;
    const maxDist = 7*player.width;
    const lastX = obstacles.length>0 ? obstacles[obstacles.length-1].x : canvas.width;
    const x = lastX + minDist + Math.random()*(maxDist-minDist);
    obstacles.push({ x, y: canvas.height-height, width, height, type, passed:false });
}

// Atualiza player
function updatePlayer() {
    player.vy += player.gravity;
    player.y += player.vy;
    if(player.y > canvas.height-player.height){
        player.y = canvas.height-player.height;
        player.vy = 0;
        player.isJumping = false;
    }

    // Cooldowns
    if(player.dashCooldown>0) player.dashCooldown -= 1/60;
    if(player.punchCooldown>0) player.punchCooldown -= 1/60;
    if(player.slowCooldown>0) player.slowCooldown -= 1/60;
}

// Atualiza obstáculos
function updateObstacles() {
    obstacles.forEach(o=>o.x-=speed);
    obstacles = obstacles.filter(o=>o.x+o.width>0);
}

// Checa colisão
function checkCollision(obj) {
    if(playerInvincible) return false;
    return !(player.x+player.width < obj.x ||
             player.x > obj.x+obj.width ||
             player.y+player.height < obj.y ||
             player.y > obj.y+obj.height);
}

// Atualiza score e moedas
function updateScore() {
    obstacles.forEach(o=>{
        if(!o.passed && o.x+o.width < player.x){
            o.passed = true;
            score += 1;
            coins += 1*multiplier;
        }
    });
}

// Atualiza multiplicador
function updateMultiplier() {
    multiplier = 1 + Math.floor(timeElapsed/30)*0.25;
}

// Reset game
function resetGame() {
    obstacles = [];
    player.y = canvas.height-100;
    player.vy = 0;
    score = 0;
    speed = 5;
    timeElapsed = 0;
    multiplier = 1;
    playerInvincible = false;
}

// Atualiza HUD
function drawHUD() {
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Coins: ${coins}`, 10, 60);
    ctx.fillText(`x${multiplier.toFixed(2)}`, 10, 90);
}

// Desenha player
function drawPlayer() {
    ctx.fillStyle = "red";
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

// Desenha obstáculos
function drawObstacles() {
    obstacles.forEach(o=>{
        ctx.fillStyle = o.type==="low"?"orange":o.type==="mid"?"blue":"purple";
        ctx.fillRect(o.x, o.y, o.width, o.height);
    });
}

// Game loop
function gameLoop(){
    timeElapsed += 1/60;
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Spawn obstáculo
    if(timeElapsed-lastSpawn>1.5){
        spawnObstacle();
        lastSpawn = timeElapsed;
    }

    updatePlayer();
    updateObstacles();
    updateScore();
    updateMultiplier();

    drawPlayer();
    drawObstacles();
    drawHUD();

    // Checa colisão
    obstacles.forEach(o=>{
        if(checkCollision(o)){
            resetGame();
        }
    });

    requestAnimationFrame(gameLoop);
}

// ================== CONTROLES TOUCH ==================
let touchStartTime = 0;
let touchCount = 0;
canvas.addEventListener("touchstart", e=>{
    e.preventDefault();
    const now = Date.now();

    if(now-touchStartTime<300){
        touchCount++;
    } else {
        touchCount = 1;
    }
    touchStartTime = now;

    if(touchCount===1){
        if(!player.isJumping){
            player.vy = -12;
            player.isJumping = true;
        }
    } else if(touchCount===2){
        if(player.dashCooldown<=0){
            player.x += 50;
            player.dashCooldown = abilities.dash.cooldown;
        }
    } else if(touchCount>=3){
        if(player.punchCooldown<=0){
            for(let i=0;i<3;i++){
                if(obstacles[i]) obstacles.splice(i,1);
            }
            player.punchCooldown = abilities.punch.cooldown;
        }
        touchCount = 0;
    }
});

canvas.addEventListener("touchmove", e=>{
    // slow motion: se arrastar pra cima
    if(player.slowCooldown<=0){
        speed/=2;
        setTimeout(()=>speed*=2,800);
        player.slowCooldown = abilities.slow.cooldown;
    }
});

// ================== MENU DEV ==================
const devButton = document.getElementById("devButton");
devButton.addEventListener("click", ()=>{
    const now = Date.now();
    if(now-devTapTime<250){
        devTapCount++;
    } else {
        devTapCount = 1;
    }
    devTapTime = now;
    if(devTapCount>=6){
        devMode = true;
        document.getElementById("devMenu").style.display = "block";
        alert("DEV MENU ATIVADO");
    }
});

// ================== START GAME ==================
document.getElementById("startBtn").addEventListener("click", ()=>{
    document.getElementById("menu").style.display="none";
    gameLoop();
});

// ================== LOJA ==================
const perkList = document.getElementById("perkList");
const skinList = document.getElementById("skinList");

function closeShop(){
    document.getElementById("shop").style.display="none";
}
document.getElementById("shopBtn").addEventListener("click", ()=>{
    document.getElementById("shop").style.display="block";
    updateShop();
});

function updateShop(){
    // perks
    perkList.innerHTML = `
        <div>Dash (3s) - Corre em alta velocidade - 100 moedas</div>
        <div>Soco (15s) - Quebra 3 obstáculos - 200 moedas</div>
        <div>Slow Motion (12s) - Deixa tudo lento - 150 moedas</div>
        <div>Pulo Carregado - Pulo mais alto - 150 moedas</div>
    `;
    // skins
    skinList.innerHTML = skins.map(s=>{
        const color = s.rarity==="Comum"?"gray":s.rarity==="Incomum"?"green":s.rarity==="Rara"?"blue":s.rarity==="Épica"?"purple":"gold";
        return `<div style="border:2px solid ${color}; padding:5px; margin:5px;">${s.name} - ${s.rarity} - ${s.price} moedas</div>`;
    }).join("");
}

// ================== SELEÇÃO DE CENÁRIO ==================
document.getElementById("prevScene").addEventListener("click", ()=>{
    currentScene = (currentScene-1+scenes.length)%scenes.length;
    document.getElementById("selectedScene").innerText = scenes[currentScene].symbol;
});
document.getElementById("nextScene").addEventListener("click", ()=>{
    currentScene = (currentScene+1)%scenes.length;
    document.getElementById("selectedScene").innerText = scenes[currentScene].symbol;
});
