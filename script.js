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
    const KNIVES_PER_LEVEL = 7;
    
    // --- STATO DEL GIOCO ---
    let gameState = 'start'; // 'start', 'playing', 'gameOver', 'levelComplete'
    let level = 1;
    let knivesLeft = KNIVES_PER_LEVEL;
    let throwing = false;
    
    // --- OGGETTI DI GIOCO ---
    const target = {
        x: canvas.width / 2,
        y: 200,
        radius: 80,
        rotation: 0,
        rotationSpeed: 0,
        stuckKnives: [] // Array di angoli
    };

    const knife = {
        width: 14,
        height: 85,
        x: canvas.width / 2,
        y: canvas.height - 150,
        speed: 25
    };

    // --- FUNZIONI DI DISEGNO (SEMPLIFICATE E CORRETTE) ---
    function drawKnifeShape() {
        const w = knife.width;
        const h = knife.height;
        ctx.fillStyle = '#8B4513'; ctx.fillRect(-w / 2, -h, w, h * 0.5);
        ctx.fillStyle = '#7F8C8D'; ctx.fillRect(-w, -h * 0.5, w * 2, h * 0.1);
        ctx.fillStyle = '#ECF0F1'; ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(-w / 2, -h * 0.4);
        ctx.lineTo(w / 2, -h * 0.4); ctx.closePath(); ctx.fill();
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Disegna il ceppo e i coltelli conficcati
        ctx.save();
        ctx.translate(target.x, target.y);
        ctx.rotate(target.rotation);
        
        ctx.fillStyle = '#A0522D'; ctx.beginPath();
        ctx.arc(0, 0, target.radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#6B4226'; ctx.lineWidth = 10; ctx.stroke();
        
        target.stuckKnives.forEach(angle => {
            ctx.save();
            ctx.rotate(angle);
            ctx.translate(0, target.radius);
            drawKnifeShape();
            ctx.restore();
        });
        ctx.restore();

        // Disegna il coltello da lanciare
        if (gameState === 'playing' && knivesLeft > 0) {
            ctx.save();
            ctx.translate(knife.x, knife.y);
            drawKnifeShape();
            ctx.restore();
        }
    }

    // --- FUNZIONI DI LOGICA (RISCRITTE DA ZERO) ---
    function update() {
        if (gameState !== 'playing') return;

        target.rotation += target.rotationSpeed;
        
        if (throwing) {
            knife.y -= knife.speed;

            // Se il coltello esce dallo schermo (mancato)
            if (knife.y < -knife.height) {
                endThrow(false); // Sconfitta per aver mancato
            }

            // Rilevamento collisione con il ceppo
            const distance = Math.hypot(knife.x - target.x, knife.y - target.y);
            if (distance <= target.radius) {
                const hitAngle = Math.atan2(knife.y - target.y, knife.x - target.x) - target.rotation;
                
                // Controlla se colpisce un altro coltello
                let collision = false;
                const safeZone = 0.4; // Angolo minimo
                target.stuckKnives.forEach(stuckAngle => {
                    let diff = Math.abs(hitAngle - stuckAngle);
                    diff = Math.min(diff, Math.PI * 2 - diff);
                    if (diff < safeZone) {
                        collision = true;
                    }
                });
                
                if (collision) {
                    endThrow(false); // Sconfitta per aver colpito un altro coltello
                } else {
                    endThrow(true, hitAngle); // Colpo andato a segno
                }
            }
        }
        
        draw();
        requestAnimationFrame(update);
    }
    
    function endThrow(success, hitAngle = 0) {
        throwing = false;
        if (success) {
            target.stuckKnives.push(hitAngle);
            if (knivesLeft === 0) {
                // Vittoria
                gameState = 'levelComplete';
                setTimeout(() => levelCompleteScreen.style.display = 'flex', 500);
            } else {
                knife.y = canvas.height - 150; // Reset per il prossimo lancio
            }
        } else {
            // Sconfitta
            gameState = 'gameOver';
            finalLevelElement.textContent = level;
            setTimeout(() => gameOverScreen.style.display = 'flex', 200);
        }
    }

    function updateUI() {
        scoreElement.textContent = `Level: ${level}`;
        knifeCounterElement.innerHTML = '';
        for (let i = 0; i < KNIVES_PER_LEVEL; i++) {
            const knifeIcon = document.createElement('span');
            knifeIcon.textContent = '🗡️';
            if (i >= knivesLeft) {
                knifeIcon.className = 'used';
            }
            knifeCounterElement.appendChild(knifeIcon);
        }
    }

    function setupLevel() {
        target.stuckKnives = [];
        target.rotation = 0;
        knivesLeft = KNIVES_PER_LEVEL;
        const speedMultiplier = 0.02 + level * 0.005;
        target.rotationSpeed = (Math.random() > 0.5 ? 1 : -1) * Math.max(speedMultiplier, 0.03);
        const obstacles = Math.min(Math.floor(level * 0.7), 5);
        for (let i = 0; i < obstacles; i++) {
            target.stuckKnives.push(Math.random() * Math.PI * 2);
        }
        updateUI();
    }

    // --- GESTIONE DEGLI STATI DI GIOCO ---
    function startGame() {
        level = 1;
        startScreen.style.display = 'none';
        gameState = 'playing';
        setupLevel();
        requestAnimationFrame(update);
    }

    function nextLevel() {
        level++;
        levelCompleteScreen.style.display = 'none';
        gameState = 'playing';
        setupLevel();
    }

    function retryLevel() {
        gameOverScreen.style.display = 'none';
        gameState = 'playing';
        setupLevel();
    }

    // --- EVENT LISTENERS ---
    startButton.addEventListener('click', startGame);
    nextLevelButton.addEventListener('click', nextLevel);
    restartButton.addEventListener('click', retryLevel);

    canvas.addEventListener('click', () => {
        if (gameState === 'playing' && !throwing && knivesLeft > 0) {
            knivesLeft--;
            updateUI();
            throwing = true;
            knife.y = canvas.height - 150;
        }
    });

    // Disegno iniziale
    draw();
});
