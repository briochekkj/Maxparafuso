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
    y: canvas.height - 120,
    width: 40,
    height: 60,
    vy: 0,
    gravity: 1,
    isJumping: false,
    dashCooldown: 0,
    punchCooldown: 0,
    slowCooldown: 0,
    skin: 0
};

let speed = 5;
let score = 0;
let coins = 0;
let multiplier = 1;
let timeElapsed = 0;
let obstacles = [];
let lastSpawn = 0;
let playerInvincible = false;

const skins = [
    { name: "Base", color:"#999", rarity:"Comum", price:0 },
    { name: "Herói", color:"#0F0", rarity:"Comum", price:50 },
    { name: "Robô", color:"#AAA", rarity:"Incomum", price:200 },
    { name: "Verde Neon", color:"#0FF", rarity:"Épica", price:500 },
    { name: "Demoníaco", color:"#F00", rarity:"Épica", price:500 },
    { name: "Dourado", color:"#FFD700", rarity:"Lendária", price:1000 },
    { name: "Só um Pixel", color:"#FFF", rarity:"Rara", price:300 }
];

const scenes = [
    { name: "Deserto", bg:"#FEEAA4", obstacleColor:"#C08000" },
    { name: "Floresta", bg:"#228B22", obstacleColor:"#654321" },
    { name: "Cidade Neon", bg:"#2E0854", obstacleColor:"#00FFFF" }
];
let currentScene = 0;

const abilities = {
    dash: { cooldown: 3 },
    punch: { cooldown: 15 },
    slow: { cooldown: 12 }
};

let devMode = false;
let devTapCount = 0;
let devTapTime = 0;

// ================== PARTICULAS ==================
let particles = [];
function spawnParticle(x,y,color){
    particles.push({x,y,vx:(Math.random()-0.5)*2,vy:-Math.random()*2,life:30,color});
}
function updateParticles(){
    for(let i=particles.length-1;i>=0;i--){
        let p = particles[i];
        p.x+=p.vx; p.y+=p.vy; p.vy+=0.1; p.life--;
        if(p.life<=0) particles.splice(i,1);
        else{
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x,p.y,2,2);
        }
    }
}

// ================== FUNÇÕES ==================

// Spawn Obstáculo
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

// ================== UPDATE PLAYER ==================
function updatePlayer() {
    player.vy += player.gravity;
    player.y += player.vy;
    if(player.y > canvas.height-player.height){
        player.y = canvas.height-player.height;
        player.vy = 0;
        player.isJumping = false;
    }

    if(player.dashCooldown>0) player.dashCooldown -= 1/60;
    if(player.punchCooldown>0) player.punchCooldown -= 1/60;
    if(player.slowCooldown>0) player.slowCooldown -= 1/60;
}

// ================== UPDATE OBSTÁCULOS ==================
function updateObstacles() {
    obstacles.forEach(o=>o.x-=speed);
    obstacles = obstacles.filter(o=>o.x+o.width>0);
}

// ================== CHECAGEM DE COLISÃO ==================
function checkCollision(obj) {
    if(playerInvincible) return false;
    return !(player.x+player.width < obj.x ||
             player.x > obj.x+obj.width ||
             player.y+player.height < obj.y ||
             player.y > obj.y+obj.height);
}

// ================== SCORE E MOEDAS ==================
function updateScore() {
    obstacles.forEach(o=>{
        if(!o.passed && o.x+o.width < player.x){
            o.passed = true;
            score += 1;
            coins += 1*multiplier;
            spawnParticle(player.x+player.width/2, player.y+player.height/2, "yellow");
        }
    });
}
function updateMultiplier() {
    multiplier = 1 + Math.floor(timeElapsed/30)*0.25;
}

// ================== RESET ==================
function resetGame() {
    obstacles = [];
    player.y = canvas.height-120;
    player.vy = 0;
    score = 0;
    speed = 5;
    timeElapsed = 0;
    multiplier = 1;
    playerInvincible = false;
}

// ================== DRAW PLAYER ==================
function drawPlayer() {
    let skinColor = skins[player.skin].color;
    ctx.fillStyle = skinColor;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    // Cabeça simplificada
    ctx.fillStyle = "#555";
    ctx.fillRect(player.x+5, player.y-10, player.width-10, 10);
    // Olho
    ctx.fillStyle = "#FFF";
    ctx.fillRect(player.x+10, player.y+15, 5,5);
}

// ================== DRAW OBSTÁCULOS ==================
function drawObstacles() {
    obstacles.forEach(o=>{
        let color = scenes[currentScene].obstacleColor;
        if(o.type==="mid") color="#00F";
        if(o.type==="high") color="#F0F";
        ctx.fillStyle = color;
        ctx.fillRect(o.x, o.y, o.width, o.height);
    });
}

// ================== DRAW CENÁRIO ==================
function drawScene() {
    ctx.fillStyle = scenes[currentScene].bg;
    ctx.fillRect(0,0,canvas.width,canvas.height);
}

// ================== DRAW HUD ==================
function drawHUD() {
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Coins: ${coins}`, 10, 60);
    ctx.fillText(`x${multiplier.toFixed(2)}`, 10, 90);
}

// ================== GAME LOOP ==================
function gameLoop(){
    timeElapsed += 1/60;
    drawScene();
    if(timeElapsed-lastSpawn>1.5){
        spawnObstacle();
        lastSpawn = timeElapsed;
    }
    updatePlayer();
    updateObstacles();
    updateScore();
    updateMultiplier();
    drawObstacles();
    drawPlayer();
    updateParticles();
    drawHUD();

    obstacles.forEach(o=>{
        if(checkCollision(o)){
            resetGame();
        }
    });

    speed = 5 + Math.floor(timeElapsed/15); // dificuldade progressiva

    requestAnimationFrame(gameLoop);
}

// ================== CONTROLES TOUCH ==================
let touchStartTime = 0;
let touchCount = 0;
canvas.addEventListener("touchstart", e=>{
    e.preventDefault();
    const now = Date.now();
    if(now-touchStartTime<300) touchCount++;
    else touchCount = 1;
    touchStartTime = now;

    if(touchCount===1 && !player.isJumping){
        player.vy = -15;
        player.isJumping = true;
    } else if(touchCount===2 && player.dashCooldown<=0){
        player.x += 50;
        player.dashCooldown = abilities.dash.cooldown;
    } else if(touchCount>=3 && player.punchCooldown<=0){
        for(let i=0;i<3;i++){ if(obstacles[i]) obstacles.splice(i,1);}
        player.punchCooldown = abilities.punch.cooldown;
        touchCount = 0;
    }
});

canvas.addEventListener("touchmove", e=>{
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
    if(now-devTapTime<250) devTapCount++;
    else devTapCount = 1;
    devTapTime = now;
    if(devTapCount>=6){
        devMode = true;
        document.getElementById("devMenu").style.display = "block";
        alert("DEV MENU ATIVADO");
    }
});

// ================== BOTÕES PRINCIPAIS ==================
document.getElementById("startBtn").addEventListener("click", ()=>{
    document.getElementById("menu").style.display="none";
    gameLoop();
});
