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

    // --- ASSETS ---
    const knifeImage = new Image();
    knifeImage.src = './knife-skin.png'; 
    let imageLoaded = false;
    knifeImage.onload = () => { imageLoaded = true; };
    knifeImage.onerror = () => { console.error("Error loading './knife-skin.png'. Ensure the file is in the same folder as index.html."); };

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
        // HITBOX dimensions: These are used for collision detection. They remain unchanged.
        width: 25,  
        height: 85, 
        
        // --- KEY CHANGE: SPRITE dimensions for drawing, 20% larger ---
        spriteWidth: 25 * 1.2,  // 30
        spriteHeight: 85 * 1.2, // 102
        
        // The (x,y) coordinate represents the TIP of the blade for accurate collision.
        x: canvas.width / 2,
        y: canvas.height - 150,
        speed: 20 
    };

    // --- DRAWING FUNCTIONS ---

    function drawTarget() {
        ctx.save();
        ctx.translate(target.x, target.y);
        ctx.rotate(target.rotation);

        // Draw Log
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(0, 0, target.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 8;
        ctx.stroke();

        target.stuckKnives.forEach(k => {
            ctx.save();
            ctx.rotate(k.angle);
            
            // --- KEY CHANGE: Drawing stuck knives correctly ---
            // The context is rotated so that the Y-axis points OUT from the log's center.
            // We draw the knife image along this axis, pointing outwards.
            if (imageLoaded) {
                // The knife's tip should be on the edge (-target.radius).
                // We draw the image from its top-left corner, so we offset it by its full height.
                ctx.drawImage(
                    knifeImage, 
                    -knife.spriteWidth / 2, // Center the sprite horizontally
                    -target.radius - knife.spriteHeight, // Position the tip on the log's edge
                    knife.spriteWidth, // Use larger sprite width
                    knife.spriteHeight // Use larger sprite height
                );
            }
            ctx.restore();
        });
        
        ctx.restore();
    }
    
    // Draws the throwing knife at its current position.
    function drawThrowingKnife() {
        if (!imageLoaded) return;
        
        // --- KEY CHANGE: Use larger sprite dimensions for the throwing knife ---
        // The knife's (x, y) is its tip. We draw the image above that point.
        ctx.drawImage(
            knifeImage, 
            knife.x - knife.spriteWidth / 2, // Center the larger sprite on the hitbox
            knife.y - knife.spriteHeight, // Position top of sprite so bottom (tip) is at knife.y
            knife.spriteWidth, 
            knife.spriteHeight
        );
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

    // --- GAME LOGIC ---

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

    function resetKnifePosition() {
        knife.y = canvas.height - 150;
    }

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
                const hitAngle = Math.atan2(knifeTipY - target.y, knife.x - target.x) - target.rotation + Math.PI / 2;
                
                let hitAnotherKnife = false;
                const safeZone = 0.35;

                for(let k of target.stuckKnives) {
                    let diff = Math.abs(k.angle - hitAngle);
                    diff = Math.min(diff, Math.PI * 2 - diff);

                    if (diff < safeZone) {
                        hitAnotherKnife = true;
                        break;
                    }
                }

                if (hitAnotherKnife) {
                    triggerGameOver();
                } else {
                    target.stuckKnives.push({ angle: hitAngle });
                    throwing = false;
                    resetKnifePosition();

                    if (knivesLeft === 0) {
                        setTimeout(showLevelComplete, 300);
                    }
                }
            }
        }
    }
    
    // --- STATE MANAGEMENT FUNCTIONS ---

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
            if (knife.y < 0) {
                throwing = false;
                resetKnifePosition();
            }
        }

        drawTarget(); 
        
        if(knivesLeft > 0 || throwing) {
            drawThrowingKnife();
        }

        requestAnimationFrame(update);
    }
    
    // --- EVENT LISTENERS ---
    
    startButton.addEventListener('click', startFirstGame);
    restartButton.addEventListener('click', retryCurrentLevel);
    nextLevelButton.addEventListener('click', proceedToNextLevel);

    function handleInput(e) {
        if(e.type === 'touchstart') e.preventDefault();
        if (gameState === 'playing') {
            throwKnife();
        }
    }

    canvas.addEventListener('mousedown', handleInput);
    canvas.addEventListener('touchstart', handleInput, {passive: false});
    
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && gameState === 'playing') {
            throwKnife();
        }
    });
});
