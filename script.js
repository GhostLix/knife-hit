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
    knifeImage.src = 'https://i.ibb.co/wJg4V3C/knife-sprite.png'; // Immagine senza copyright
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
        width: 15,  // Larghezza dell'immagine per il calcolo
        height: 100, // Altezza dell'immagine per il calcolo
        x: canvas.width / 2,
        y: canvas.height - 150,
        speed: 15
    };

    // --- FUNZIONI DI DISEGNO ---

    function drawTarget() {
        ctx.save();
        ctx.translate(target.x, target.y);
        ctx.rotate(target.rotation);

        // Disegna il ceppo
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(0, 0, target.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 10;
        ctx.stroke();

        // Disegna i coltelli conficcati
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
            // Disegna l'immagine del coltello conficcata nel ceppo
            ctx.drawImage(knifeImage, -knife.width / 2, -target.radius - knife.height, knife.width, knife.height);
        }
    }
    
    function drawKnife() {
        if (imageLoaded) {
            // Disegna l'immagine del coltello pronto per essere lanciato
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
        // Resetta lo stato per il nuovo livello
        target.stuckKnives = [];
        target.rotation = 0;
        throwing = false;
        knife.y = canvas.height - 150;

        // Aumenta la difficoltà con i livelli
        const baseSpeed = 0.01 + level * 0.005;
        target.rotationSpeed = (Math.random() > 0.5 ? 1 : -1) * Math.max(baseSpeed, 0.05); // Direzione casuale e velocità minima
        knivesLeft = 5 + Math.floor(level / 3);

        // Aggiunge coltelli pre-conficcati nei livelli più alti
        const initialKnives = Math.min(Math.floor(level / 2), 4);
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
        
        // Controlla se il coltello ha raggiunto il bersaglio
        if (knifeTipY <= target.y + target.radius) {
            const distance = Math.sqrt(Math.pow(knife.x - target.x, 2) + Math.pow(knifeTipY - target.y, 2));
            
            if (distance < target.radius) {
                // Il coltello ha colpito il ceppo
                const hitAngle = Math.atan2(knifeTipY - target.y, knife.x - target.x) - target.rotation + Math.PI / 2;
                
                // Controlla se colpisce un altro coltello
                let collision = false;
                const minAngleDiff = 0.3; // Angolo minimo di separazione
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

                    // Controlla se il livello è stato superato
                    if (knivesLeft === 0) {
                        level++;
                        setTimeout(setupLevel, 800); // Passa al livello successivo dopo un ritardo
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
    
    function restartLevel() {
        gameState = 'playing';
        gameOverScreen.style.display = 'none';
        setupLevel(); // Ri-configura il livello attuale
        update();     // Riavvia il game loop
    }

    function startGame() {
        level = 1;
        gameState = 'playing';
        startScreen.style.display = 'none';
        setupLevel();
        update(); // Avvia il game loop per la prima volta
    }

    // --- GAME LOOP ---
    
    function update() {
        // Ferma il loop se il gioco non è in stato 'playing'
        if (gameState !== 'playing') return;

        // Pulisce il canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Aggiorna la rotazione del bersaglio
        target.rotation += target.rotationSpeed;
        
        // Logica del lancio
        if (throwing) {
            knife.y -= knife.speed;
            checkCollision();
            if (knife.y < -knife.height) { // Se il coltello esce dallo schermo senza colpire
                 gameOver();
            }
        }

        // Disegna tutto
        drawTarget();
        if(!throwing || knivesLeft > 0) {
            drawKnife();
        }

        // Continua il ciclo di animazione
        requestAnimationFrame(update);
    }
    
    // --- EVENT LISTENERS ---
    
    startButton.addEventListener('click', startGame);

    restartButton.addEventListener('click', restartLevel); // Funzione corretta per riprovare

    // Gestisce il lancio con click o tocco
    canvas.addEventListener('mousedown', () => {
        if (gameState === 'playing') {
            throwKnife();
        }
    });
});
