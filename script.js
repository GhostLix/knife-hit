document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTI DEL DOM ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const knifeCounterElement = document.getElementById('knife-counter');
    const balanceDisplay = document.getElementById('balance-display'); // Nuovo elemento
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('gameover-screen');
    const levelCompleteScreen = document.getElementById('level-complete-screen');
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const nextLevelButton = document.getElementById('next-level-button');
    const finalLevelElement = document.getElementById('final-level');

    // --- IMPOSTAZIONI DI GIOCO ---
    canvas.width = 400;
    canvas.height = 600;

    // --- STATO DEL GIOCO ---
    let gameState = 'start';
    let level = 1;
    let knivesLeft;
    let throwing = false;
    let balance = 0; // Nuova variabile per il saldo
    
    // --- OGGETTI DI GIOCO ---
    const target = {
        x: canvas.width / 2, y: 180, radius: 80,
        rotation: 0, rotationSpeed: 0,
        stuckKnives: []
    };

    const knife = {
        width: 10, height: 70,
        x: canvas.width / 2, y: canvas.height - 150,
        speed: 20
    };

    // --- NUOVE FUNZIONI PER IL SALDO ---
    function loadBalance() {
        const savedBalance = localStorage.getItem('knifeHitBalance');
        if (savedBalance !== null) {
            balance = parseFloat(savedBalance);
        }
        updateBalanceDisplay();
    }

    function saveBalance() {
        localStorage.setItem('knifeHitBalance', balance.toString());
    }

    function updateBalanceDisplay() {
        balanceDisplay.textContent = `Balance: $${balance.toFixed(2)}`;
    }

    // --- FUNZIONI DI DISEGNO ---
    function drawKnifeShape(x, y, w, h) {
        ctx.fillStyle = '#bdc3c7';
        ctx.fillRect(x - w / 2, y - h, w, h * 0.7);
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(x - w / 2, y - h * 0.3, w, h * 0.3);
    }
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(target.x, target.y);
        ctx.rotate(target.rotation);
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(0, 0, target.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 10;
        ctx.stroke();
        target.stuckKnives.forEach(k => {
            ctx.save();
            ctx.rotate(k.angle);
            drawKnifeShape(0, -target.radius, knife.width, knife.height);
            ctx.restore();
        });
        ctx.restore();
        if (gameState === 'playing' && (knivesLeft > 0 || throwing)) {
            drawKnifeShape(knife.x, knife.y, knife.width, knife.height);
        }
    }

    // --- LOGICA DI GIOCO ---
    function setupLevel() {
        target.stuckKnives = [];
        target.rotation = 0;
        throwing = false;
        knife.y = canvas.height - 150;
