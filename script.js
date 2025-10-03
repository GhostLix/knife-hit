document.addEventListener('DOMContentLoaded', () => {
    // Elementi del DOM
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const knifeCounterElement = document.getElementById('knife-counter');
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('gameover-screen');
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const finalLevelElement = document.getElementById('final-level');

    // Impostazioni Canvas
    canvas.width = 400;
    canvas.height = 600;

    // Caricamento immagine del coltello
    const knifeImage = new Image();
    // --- IMMAGINE PIXEL ART CONFERMATA ---
    // Nota: ho usato un link stabile per l'immagine per evitare problemi.
    // Il link originale da vecteezy è una pagina web, non un'immagine diretta.
    knifeImage.src = 'https://i.ibb.co/z5p300V/pixel-knife.png';
    let imageLoaded = false;
    knifeImage.onload = () => {
        imageLoaded = true;
    };

    // Stato del gioco
    let gameState = 'start'; // 'start', 'playing', 'gameOver'
    let level = 1;
    let knivesLeft;
    let throwing = false;
    
    // Oggetti di gioco
    const target = {
        x: canvas.width / 2,
        y: 180,
        radius: 80,
        rotation: 0,
        rotationSpeed: 0,
        stuckKnives: []
    };

    const knife = {
        width: 40,
        height: 90,
        x: canvas.width / 2,
        y: canvas.height - 150,
        speed: 15
    };

    // --- FUNZIONI DI DISEGNO ---

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
            drawKnifeOnTarget();
            ctx.restore();
        });
        
        ctx.restore();
    }

    function drawKnifeOnTarget() {
        if (imageLoaded) {
            ctx.drawImage(knifeImage, -knife.width / 2, -target.radius - knife.height, knife.width, knife.height);
        }
    }
    
    function drawKnife() {
        if (imageLoaded) {
            ctx.drawImage(knifeImage, knife.x - knife.width / 2, knife.y, knife.width, knife.height);
        }
    }

    function updateKnifeCounter() {
        knifeCounterElement.innerHTML = '';
        for (let i = 0; i < knivesLeft; i++) {
            const knifeIcon = document.createElement('span');
            knifeIcon.textContent = '🔪';
            knifeCounterElement.appendChild(knifeIcon);
        }
    }

    // --- LOGICA DI GIOCO ---

    function setupLevel() {
        target.stuckKnives = [];
        target.rotation = 0;
        throwing = false;
        knife.y = canvas.height - 150;

        // --- MODIFICA RICHIESTA: COLTELLI FISSI A 7 ---
        knivesLeft = 7;

        // La difficoltà ora dipende solo da velocità e ostacoli
        const baseSpeed = 0.015 + level * 0.006;
        target.rotationSpeed = (Math.random() > 0.5 ? 1 : -1) * Math.max(baseSpeed, 0.05);
        
        const initialKnives = Math.min(Math.floor(level * 0.8), 6);
        for(let i = 0; i < initialKnives; i++) {
            target.stuckKnives.push({
                angle: (Math.PI * 2 / initialKnives) * i + (Math.random() - 0.5) * 0.2
            });
        }
        
        scoreElement.textContent = `Livello: ${level}`;
        updateKnifeCounter();
    }

    function throwKnife() {
        if (knivesLeft > 0 && !throwing) {
            throwing = true;
            knivesLeft--;
            updateKnifeCounter();
        }
    }

    function checkCollision() {
        const knifeTipY = knife.y;
        
        if (knifeTipY <= target.y + target.radius) {
            const distance = Math.sqrt(Math.pow(knife.x - target.x, 2) + Math.pow(knifeTipY - target.y, 2));
            
            if (distance < target.radius + 10) { // Tolleranza aumentata leggermente
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
                    gameOver();
                } else {
                    target.stuckKnives.push({ angle: hitAngle });
                    throwing = false;
                    knife.y = canvas.height - 150;

                    if (knivesLeft === 0) {
                        level++;
                        setTimeout(setupLevel, 800);
                    }
                }
            }
        }
    }
    
    function gameOver() {
        gameState = 'gameOver';
        finalLevelElement.textContent = level;
        gameOverScreen.style.display = 'flex';
    }
    
    // --- MODIFICA RICHIESTA: FUNZIONE RIPROVA CORRETTA ---
    function restartLevel() {
        gameState = 'playing';
        gameOverScreen.style.display = 'none';
        setupLevel(); // Ri-configura il livello attuale da zero
        update();     // Riavvia il ciclo di gioco
    }

    function startGame() {
        level = 1;
        gameState = 'playing';
        startScreen.style.display = 'none';
        setupLevel();
        update();
    }

    // --- GAME LOOP ---
    
    function update() {
        if (gameState !== 'playing') return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        target.rotation += target.rotationSpeed;
        
        if (throwing) {
            knife.y -= knife.speed;
            checkCollision();
            if (knife.y < -knife.height) {
                 gameOver();
            }
        }

        drawTarget();
        if(!throwing || knivesLeft > 0) {
            drawKnife();
        }

        requestAnimationFrame(update);
    }
    
    // --- EVENT LISTENERS ---
    
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartLevel); // Ora funziona come previsto

    canvas.addEventListener('mousedown', () => {
        if (gameState === 'playing') {
            throwKnife();
        }
    });
});
