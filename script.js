document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTI DEL DOM ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const knifeCounterElement = document.getElementById('knife-counter');
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
    
    // --- OGGETTI DI GIOCO ---
    const target = {
        x: canvas.width / 2, y: 180, radius: 80,
        rotation: 0, rotationSpeed: 0, baseRotationSpeed: 0,
        wobbleAngle: 0, wobbleSpeed: 0, wobbleAmplitude: 0,
        stuckKnives: []
    };

    const knife = {
        width: 10, height: 70,
        x: canvas.width / 2, y: canvas.height - 150,
        speed: 20
    };

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

        // --- KEY CHANGE: La difficoltà si ferma al livello 10 ---
        const difficultyLevel = Math.min(level, 10);

        const baseSpeed = 0.015 + difficultyLevel * 0.005;
        target.baseRotationSpeed = (Math.random() > 0.5 ? 1 : -1) * Math.max(baseSpeed, 0.04);
        
        // La velocità irregolare inizia comunque dopo il livello 10, ma senza aumentare la velocità di base
        if (level > 10) {
            target.wobbleAngle = 0;
            target.wobbleSpeed = 0.01 + (level - 10) * 0.002;
            target.wobbleAmplitude = Math.min(target.baseRotationSpeed * (0.5 + (level - 10) * 0.05), target.baseRotationSpeed * 0.9);
        } else {
            target.rotationSpeed = target.baseRotationSpeed;
            target.wobbleAmplitude = 0;
        }

        // Anche il numero di coltelli si ferma al valore del livello 10
        knivesLeft = Math.min(5 + Math.floor(difficultyLevel / 2), 9);
        
        scoreElement.textContent = `Level: ${level}`;
        updateKnifeCounter();
    }
    
    // --- GESTIONE STATI DI GIOCO ---
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

    // --- GAME LOOP ---
    function gameLoop() {
        if (gameState === 'playing') {
            if (level > 10) {
                target.wobbleAngle += target.wobbleSpeed;
                const wobbleEffect = Math.sin(target.wobbleAngle) * target.wobbleAmplitude;
                target.rotationSpeed = target.baseRotationSpeed + wobbleEffect;
            }
            target.rotation += target.rotationSpeed;
            
            if (throwing) {
                knife.y -= knife.speed;
                
                if (knife.y < -knife.height) {
                    endThrow(false);
                }

                const knifeTipY = knife.y - knife.height;
                const distance = Math.hypot(knife.x - target.x, knifeTipY - target.y);

                if (distance < target.radius) {
                    const hitAngle = Math.atan2(knifeTipY - target.y, knife.x - target.x) - target.rotation + Math.PI / 2;
                    let collision = false;
                    const minAngleDiff = 0.35;
                    for (const k of target.stuckKnives) {
                        let diff = Math.abs(k.angle - hitAngle);
                        if (Math.min(diff, Math.PI * 2 - diff) < minAngleDiff) {
                            collision = true;
                            break;
                        }
                    }
                    endThrow(collision ? false : true, hitAngle);
                }
            }
        }
        
        draw();
        requestAnimationFrame(gameLoop);
    }

    function updateKnifeCounter() {
        knifeCounterElement.innerHTML = '';
        const difficultyLevel = Math.min(level, 10);
        const totalKnives = Math.min(5 + Math.floor(difficultyLevel / 2), 9);
        for (let i = 0; i < totalKnives; i++) {
            const knifeIcon = document.createElement('span');
            knifeIcon.textContent = '🗡️';
            if (i >= knivesLeft) {
                knifeIcon.style.opacity = '0.3';
            }
            knifeCounterElement.appendChild(knifeIcon);
        }
    }
    
    // --- EVENT LISTENERS ---
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', retryLevel);
    nextLevelButton.addEventListener('click', nextLevel);

    canvas.addEventListener('mousedown', () => {
        if (gameState === 'playing' && !throwing && knivesLeft > 0) {
            throwing = true;
            knivesLeft--;
            updateKnifeCounter();
        }
    });
});
