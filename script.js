document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTI DEL DOM ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const knifeCounterElement = document.getElementById('knife-counter');
    const balanceDisplay = document.getElementById('balance-display');
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
    let balance = 0;
    let popUnderTriggeredForLevel = false; // NUOVA VARIABILE DI STATO
    
    // --- OGGETTI DI GIOCO ---
    const target = {
        x: canvas.width / 2, y: 180, radius: 80,
        rotation: 0, rotationSpeed: 0, stuckKnives: []
    };

    const knife = {
        width: 10, height: 70,
        x: canvas.width / 2, y: canvas.height - 150,
        speed: 20
    };

    // --- FUNZIONI PER IL SALDO E PUBBLICITÀ ---
    function loadBalance() {
        const savedBalance = localStorage.getItem('knifeHitBalance');
        if (savedBalance) balance = parseFloat(savedBalance);
        updateBalanceDisplay();
    }
    function saveBalance() {
        localStorage.setItem('knifeHitBalance', balance.toString());
    }
    function updateBalanceDisplay() {
        balanceDisplay.textContent = `Balance: $${balance.toFixed(2)}`;
    }

    // --- NUOVA FUNZIONE PER IL POP-UNDER ---
    function triggerPopUnder() {
        const popUnderScript = document.createElement('script');
        popUnderScript.type = 'text/javascript';
        popUnderScript.src = '//preferablyending.com/6c/d1/ab/6cd1ab02b52b2f5ca1e443752d7080b6.js';
        // Lo script si auto-rimuove dopo l'esecuzione per non sporcare la pagina
        popUnderScript.onload = () => popUnderScript.remove();
        document.body.appendChild(popUnderScript);
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
        popUnderTriggeredForLevel = false; // <<< "ARMA" IL POP-UNDER PER IL NUOVO LIVELLO

        const difficultyLevel = Math.min(level, 9);
        const baseSpeed = 0.015 + difficultyLevel * 0.005;
        target.rotationSpeed = (Math.random() > 0.5 ? 1 : -1) * Math.max(baseSpeed, 0.04);
        knivesLeft = Math.min(5 + Math.floor(difficultyLevel / 2), 9);
        
        scoreElement.textContent = `Level: ${level}`;
        updateKnifeCounter();
    }
    
    function endThrow(success, hitAngle = 0) {
        throwing = false;
        if (success) {
            target.stuckKnives.push({ angle: hitAngle });
            knife.y = canvas.height - 150;
            if (knivesLeft === 0) {
                gameState = 'levelComplete';
                setTimeout(() => levelCompleteScreen.style.display = 'flex', 800);
            }
        } else {
            gameState = 'gameOver';
            finalLevelElement.textContent = level;
            gameOverScreen.style.display = 'flex';
        }
    }
    
    function retryLevel() {
        gameOverScreen.style.display = 'none';
        gameState = 'playing';
        setupLevel();
    }

    function nextLevel() {
        if (level % 10 === 0) {
            balance += 0.01;
            balance = parseFloat(balance.toFixed(2));
            saveBalance();
            updateBalanceDisplay();
        }
        level++;
        levelCompleteScreen.style.display = 'none';
        gameState = 'playing';
        setupLevel();
    }

    function startGame() {
        level = 1;
        startScreen.style.display = 'none';
        gameState = 'playing';
        setupLevel();
        gameLoop();
    }

    function gameLoop() {
        if (gameState === 'playing') {
            target.rotation += target.rotationSpeed;
            if (throwing) {
                knife.y -= knife.speed;
                if (knife.y < -knife.height) { endThrow(false); }
                const knifeTipY = knife.y - knife.height;
                const distance = Math.hypot(knife.x - target.x, knifeTipY - target.y);
                if (distance < target.radius) {
                    const hitAngle = Math.atan2(knifeTipY - target.y, knife.x - target.x) - target.rotation + Math.PI / 2;
                    let collision = false;
                    const minAngleDiff = 0.35;
                    for (const k of target.stuckKnives) {
                        let diff = Math.abs(k.angle - hitAngle);
                        if (Math.min(diff, Math.PI * 2 - diff) < minAngleDiff) {
                            collision = true; break;
                        }
                    }
                    endThrow(!collision, hitAngle);
                }
            }
        }
        draw();
        requestAnimationFrame(gameLoop);
    }

    function updateKnifeCounter() {
        const difficultyLevel = Math.min(level, 9);
        const totalKnives = Math.min(5 + Math.floor(difficultyLevel / 2), 9);
        knifeCounterElement.innerHTML = '';
        for (let i = 0; i < totalKnives; i++) {
            const knifeIcon = document.createElement('span');
            knifeIcon.textContent = '🗡️';
            if (i >= knivesLeft) {
                knifeIcon.style.opacity = '0.3';
            }
            knifeCounterElement.appendChild(knifeIcon);
        }
    }
    
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', retryLevel);
    nextLevelButton.addEventListener('click', nextLevel);

    // --- MODIFICATO L'EVENT LISTENER PER IL CLICK ---
    canvas.addEventListener('mousedown', () => {
        // Logica del pop-under
        if (gameState === 'playing' && !popUnderTriggeredForLevel) {
            triggerPopUnder();
            popUnderTriggeredForLevel = true; // "DISARMA" il pop-under per questo livello
        }

        // Logica del lancio del coltello
        if (gameState === 'playing' && !throwing && knivesLeft > 0) {
            throwing = true;
            knivesLeft--;
            updateKnifeCounter();
        }
    });

    loadBalance();
    gameLoop();
});
