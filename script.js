document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
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

    // Canvas setup
    canvas.width = 400;
    canvas.height = 600;

    // --- GAME STATE ---
    let gameState = 'start'; 
    let level = 1;
    let knivesLeft;
    let throwing = false;
    const knivesPerLevel = 7;
    
    // --- GAME OBJECTS ---
    const target = {
        x: canvas.width / 2,
        y: 200,
        radius: 80,
        rotation: 0,
        rotationSpeed: 0,
        stuckKnives: [] 
    };

    const knife = {
        width: 14, 
        height: 85,
        x: canvas.width / 2, 
        y: canvas.height - 150, // Position of the knife's TIP
        speed: 20 
    };
    
    // --- DRAWING FUNCTIONS ---

    // --- REWRITTEN & CORRECTED ---
    // Draws a knife shape pointing UP (towards negative Y).
    // The origin (0,0) of the drawing is the TIP of the blade.
    function drawKnifeShape() {
        const w = knife.width;
        const h = knife.height;

        // Handle (drawn first)
        ctx.fillStyle = '#8B4513'; // Brown
        ctx.fillRect(-w / 2, -h, w, h * 0.5);

        // Guard
        ctx.fillStyle = '#7F8C8D'; // Grey
        ctx.fillRect(-w, -h * 0.5, w * 2, h * 0.1);

        // Blade
        ctx.fillStyle = '#ECF0F1'; // Silver
        ctx.beginPath();
        ctx.moveTo(0, 0); // Tip
        ctx.lineTo(-w / 2, -h * 0.4);
        ctx.lineTo(w / 2, -h * 0.4);
        ctx.closePath();
        ctx.fill();
    }
    
    function drawTarget() {
        ctx.save();
        ctx.translate(target.x, target.y);
        ctx.rotate(target.rotation);
        
        // Log
        ctx.fillStyle = '#A0522D';
        ctx.beginPath();
        ctx.arc(0, 0, target.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#6B4226';
        ctx.lineWidth = 10;
        ctx.stroke();
        
        // --- REWRITTEN & CORRECTED ---
        // Stuck knives
        target.stuckKnives.forEach(k => {
            ctx.save();
            // 1. Rotate the context to the angle where the knife hit.
            ctx.rotate(k.angle);
            
            // 2. Translate to the edge of the log along the new Y-axis.
            ctx.translate(0, target.radius);
            
            // 3. Draw the knife. Since drawKnifeShape() points UP (negative Y),
            // it will now correctly point INWARDS towards the log's center.
            drawKnifeShape();
            
            ctx.restore();
        });
        ctx.restore();
    }
    
    // --- REWRITTEN & CORRECTED ---
    function drawThrowingKnife() {
        ctx.save();
        // Move the canvas origin to the throwing knife's tip position
        ctx.translate(knife.x, knife.y);
        // Draw the knife shape, which points UP (negative Y), ready to be thrown.
        drawKnifeShape();
        ctx.restore();
    }
    
    function updateUI() {
        scoreElement.textContent = `Level: ${level}`;
        knifeCounterElement.innerHTML = '';
        for (let i = 0; i < knivesLeft; i++) {
            const knifeIcon = document.createElement('span');
            knifeIcon.textContent = '🗡️'; 
            knifeCounterElement.appendChild(knifeIcon);
        }
    }

    // --- GAME LOGIC & STATE MANAGEMENT ---
    function setupLevel() {
        target.stuckKnives = [];
        target.rotation = 0;
        throwing = false;
        resetKnifePosition();
        knivesLeft = knivesPerLevel;
        const speedMultiplier = 0.02 + (level * 0.005);
        target.rotationSpeed = (Math.random() > 0.5 ? 1 : -1) * Math.max(speedMultiplier, 0.03);
        const obstacles = Math.min(Math.floor((level - 1) * 0.7), 5);
        for(let i = 0; i < obstacles; i++) {
            const angle = (Math.PI * 2 / obstacles) * i + (Math.random() - 0.5) * 0.5;
            target.stuckKnives.push({ angle: angle });
        }
        updateUI();
    }

    function resetKnifePosition() { knife.y = canvas.height - 150; }

    function throwKnife() {
        if (knivesLeft > 0 && !throwing && gameState === 'playing') {
            throwing = true;
            knivesLeft--;
            updateUI();
        }
    }

    function checkCollision() {
        const knifeTipY = knife.y;
        if (knifeTipY <= target.y + target.radius) {
            const distance = Math.sqrt(Math.pow(knife.x - target.x, 2) + Math.pow(knifeTipY - target.y, 2));
            if (distance <= target.radius) {
                // The angle calculation is correct and does not need to change.
                const hitAngle = Math.atan2(knifeTipY - target.y, knife.x - target.x) - target.rotation + Math.PI / 2;
                
                let hitAnotherKnife = false;
                const safeZone = 0.35; // Minimum angle between knives
                for(let k of target.stuckKnives) {
                    let diff = Math.abs(k.angle - hitAngle);
                    diff = Math.min(diff, Math.PI * 2 - diff);
                    if (diff < safeZone) { hitAnotherKnife = true; break; }
                }
                if (hitAnotherKnife) { triggerGameOver(); } 
                else {
                    target.stuckKnives.push({ angle: hitAngle });
                    throwing = false;
                    resetKnifePosition();
                    if (knivesLeft === 0) { setTimeout(showLevelComplete, 300); }
                }
            }
        }
    }
    
    function showLevelComplete() {
        gameState = 'levelComplete';
        levelCompleteScreen.style.display = 'flex';
    }

    function proceedToNextLevel() {
        level++;
        levelCompleteScreen.style.display = 'none';
        gameState = 'playing';
        setupLevel();
        update();
    }

    function triggerGameOver() {
        gameState = 'gameOver';
        finalLevelElement.textContent = level;
        gameOverScreen.style.display = 'flex';
    }
    
    function retryCurrentLevel() {
        gameOverScreen.style.display = 'none';
        gameState = 'playing';
        setupLevel();
        update();
    }

    function startFirstGame() {
        level = 1;
        startScreen.style.display = 'none';
        gameState = 'playing';
        setupLevel();
        update();
    }

    // --- MAIN GAME LOOP ---
    function update() {
        if (gameState !== 'playing') return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        target.rotation += target.rotationSpeed;
        if (throwing) {
            knife.y -= knife.speed;
            checkCollision();
            if (knife.y < 0) { throwing = false; resetKnifePosition(); }
        }
        drawTarget(); 
        if(knivesLeft > 0 || throwing) { drawThrowingKnife(); }
        requestAnimationFrame(update);
    }
    
    // --- EVENT LISTENERS ---
    startButton.addEventListener('click', startFirstGame);
    restartButton.addEventListener('click', retryCurrentLevel);
    nextLevelButton.addEventListener('click', proceedToNextLevel);

    function handleInput(e) {
        if(e.type === 'touchstart') e.preventDefault();
        if (gameState === 'playing') { throwKnife(); }
    }
    canvas.addEventListener('mousedown', handleInput);
    canvas.addEventListener('touchstart', handleInput, {passive: false});
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && gameState === 'playing') { throwKnife(); }
    });
});
