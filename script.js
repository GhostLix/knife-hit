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

    // --- ASSET ---
    // Rimossa la logica di caricamento immagine

    // --- STATO DEL GIOCO ---
    let gameState = 'start';
    let level = 1;
    let knivesLeft;
    let throwing = false;
    
    // --- OGGETTI DI GIOCO ---
    const target = {
        x: canvas.width / 2,
        y: 180,
        radius: 80,
        rotation: 0,
        rotationSpeed: 0,
        stuckKnives: []
    };

    const knife = {
        width: 10, // Larghezza del rettangolo (hitbox)
        height: 70, // Altezza del rettangolo (hitbox)
        x: canvas.width / 2,
        y: canvas.height - 150,
        speed: 20
    };

    // --- FUNZIONI DI DISEGNO (con rettangoli) ---
    function drawTarget() {
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
            // Disegna il rettangolo-coltello conficcato
            ctx.fillStyle = '#7f8c8d'; // Grigio per la lama
            ctx.fillRect(-knife.width / 2, -target.radius - knife.height, knife.width, knife.height * 0.7);
            ctx.fillStyle = '#8B4513'; // Marrone per il manico
            ctx.fillRect(-knife.width / 2, -target.radius - knife.height * 0.3, knife.width, knife.height * 0.3);
            ctx.restore();
        });
        
        ctx.restore();
    }
    
    function drawKnife() {
        // Disegna il rettangolo-coltello da lanciare
        const bladeHeight = knife.height * 0.7;
        const handleHeight = knife.height * 0.3;
        
        // Disegna la lama
        ctx.fillStyle = '#bdc3c7'; // Grigio chiaro
        ctx.fillRect(knife.x - knife.width / 2, knife.y - knife.height, knife.width, bladeHeight);
        
        // Disegna il manico
        ctx.fillStyle = '#A0522D'; // Marrone chiaro
        ctx.fillRect(knife.x - knife.width / 2, knife.y - handleHeight, knife.width, handleHeight);
    }

    function updateKnifeCounter() {
        knifeCounterElement.innerHTML = '';
        for (let i = 0; i < knivesLeft; i++) {
            const knifeIcon = document.createElement('span');
            knifeIcon.textContent = '🗡️';
            knifeCounterElement.appendChild(knifeIcon);
        }
    }

    // --- LOGICA DI GIOCO (invariata) ---
    function setupLevel() {
        target.stuckKnives = [];
        target.rotation = 0;
        throwing = false;
        knife.y = canvas.height - 150;

        const baseSpeed = 0.015 + level * 0.005;
        target.rotationSpeed = (Math.random() > 0.5 ? 1 : -1) * Math.max(baseSpeed, 0.04);
        knivesLeft = 5 + Math.floor(level / 2);

        const initialKnives = Math.min(Math.floor(level * 0.8), 5);
        for(let i = 0; i < initialKnives; i++) {
            target.stuckKnives.push({
                angle: (Math.PI * 2 / initialKnives) * i + (Math.random() - 0.5) * 0.3
            });
        }
        
        scoreElement.textContent = `Level: ${level}`;
        updateKnifeCounter();
    }

    function throwKnife() {
        if (knivesLeft > 0 && !throwing && gameState === 'playing') {
            throwing = true;
            knivesLeft--;
            updateKnifeCounter();
        }
    }

    function checkCollision() {
        const knifeTipY = knife.y - knife.height;
        
        if (knifeTipY <= target.y + target.radius) {
            const distance = Math.hypot(knife.x - target.x, knifeTipY - target.y);
            
            if (distance < target.radius) {
                const hitAngle = Math.atan2(knifeTipY - target.y, knife.x - target.x) - target.rotation + Math.PI / 2;
                
                let collision = false;
                const minAngleDiff = 0.35;
                target.stuckKnives.forEach(k => {
                    let diff = Math.abs(k.angle - hitAngle);
                    if (Math.min(diff, Math.PI * 2 - diff) < minAngleDiff) {
                        collision = true;
                    }
                });

                if (collision) {
                    triggerGameOver();
                } else {
                    target.stuckKnives.push({ angle: hitAngle });
                    throwing = false;
                    knife.y = canvas.height - 150;

                    if (knivesLeft === 0) {
                        gameState = 'levelComplete';
                        setTimeout(() => levelCompleteScreen.style.display = 'flex', 800);
                    }
                }
            }
        }
    }
    
    // --- GESTIONE STATI DI GIOCO (invariata) ---
    function triggerGameOver() {
        gameState = 'gameOver';
        finalLevelElement.textContent = level;
        gameOverScreen.style.display = 'flex';
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
        update();
    }

    // --- GAME LOOP (invariato) ---
    function update() {
        if (gameState !== 'playing') {
            requestAnimationFrame(update);
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        target.rotation += target.rotationSpeed;
        
        if (throwing) {
            knife.y -= knife.speed;
            checkCollision();
            if (knife.y < -knife.height) {
                 triggerGameOver();
            }
        }

        drawTarget();
        if (knivesLeft > 0 || throwing) {
            drawKnife();
        }

        requestAnimationFrame(update);
    }
    
    // --- EVENT LISTENERS (invariati) ---
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', retryLevel);
    nextLevelButton.addEventListener('click', nextLevel);

    canvas.addEventListener('mousedown', () => {
        if (gameState === 'playing') {
            throwKnife();
        }
    });
});
