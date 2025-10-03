document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const knifeCounterElement = document.getElementById('knife-counter');
    
    // Screens
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('gameover-screen');
    const levelCompleteScreen = document.getElementById('level-complete-screen');
    
    // Buttons
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const nextLevelButton = document.getElementById('next-level-button');
    
    const finalLevelElement = document.getElementById('final-level');

    // Canvas setup
    canvas.width = 400;
    canvas.height = 600;

    // --- ASSETS ---
    const knifeImage = new Image();
    // Loads local image from root
    knifeImage.src = './knife-skin.png'; 
    let imageLoaded = false;
    knifeImage.onload = () => { imageLoaded = true; };
    knifeImage.onerror = () => { console.error("Error loading ./knife-skin.png. Ensure file exists."); };

    // --- GAME STATE ---
    let gameState = 'start'; // 'start', 'playing', 'levelComplete', 'gameOver'
    let level = 1;
    let knivesLeft;
    let throwing = false;
    const knivesPerLevel = 7; // Fixed amount
    
    // --- GAME OBJECTS ---
    const target = {
        x: canvas.width / 2,
        y: 200,
        radius: 80,
        rotation: 0,
        rotationSpeed: 0,
        stuckKnives: [] // Stores angles of stuck knives
    };

    const knife = {
        width: 40,  // Adjust based on your png aspect ratio
        height: 90, 
        x: canvas.width / 2,
        y: canvas.height - 150,
        speed: 20 // Faster throwing speed for better feel
    };

    // --- DRAWING FUNCTIONS ---

    function drawTarget() {
        ctx.save();
        ctx.translate(target.x, target.y);
        ctx.rotate(target.rotation);

        // Draw Log Body
        ctx.fillStyle = '#8B4513'; // Wood color
        ctx.beginPath();
        ctx.arc(0, 0, target.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw Log Border
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 8;
        ctx.stroke();
        
        // Draw simple wood grain details
        ctx.strokeStyle = '#A0522D';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, target.radius * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, target.radius * 0.3, 0, Math.PI * 2);
        ctx.stroke();

        // Draw Stuck Knives attached to target
        target.stuckKnives.forEach(k => {
            ctx.save();
            ctx.rotate(k.angle);
            drawKnifeSprite(true);
            ctx.restore();
        });
        
        ctx.restore();
    }

    // Draws the knife image. 'isStuck' determines position.
    function drawKnifeSprite(isStuck) {
        if (!imageLoaded) {
            // Fallback if image isn't there
            ctx.fillStyle = '#bdc3c7';
            if(isStuck) ctx.fillRect(-5, -target.radius - 40, 10, 40);
            else ctx.fillRect(knife.x - 5, knife.y, 10, 40);
            return;
        }

        if (isStuck) {
            // Draw at origin (0,0 is center of log), offset upwards
            // Adjust -target.radius + Y offset to make it look embedded
            ctx.drawImage(knifeImage, -knife.width / 2, -target.radius - (knife.height * 0.8), knife.width, knife.height);
        } else {
            // Draw at current knife position
            ctx.drawImage(knifeImage, knife.x - knife.width / 2, knife.y, knife.width, knife.height);
        }
    }

    function updateUI() {
        scoreElement.textContent = `Level: ${level}`;
        
        // Update knife icons
        knifeCounterElement.innerHTML = '';
        for (let i = 0; i < knivesLeft; i++) {
            const knifeIcon = document.createElement('span');
            // Using a darker knife unicode for available knives
            knifeIcon.textContent = '🗡️'; 
            knifeIcon.style.opacity = "1";
            knifeCounterElement.appendChild(knifeIcon);
        }
        // Optional: Show used knives as faded
        for (let i = 0; i < (knivesPerLevel - knivesLeft); i++) {
             const usedIcon = document.createElement('span');
             usedIcon.textContent = '🗡️';
             usedIcon.style.opacity = "0.3";
             knifeCounterElement.appendChild(usedIcon);
        }
    }

    // --- GAME LOGIC ---

    function setupLevel() {
        // Reset for current level
        target.stuckKnives = [];
        target.rotation = 0;
        throwing = false;
        resetKnifePosition();
        knivesLeft = knivesPerLevel;

        // Difficulty scaling: Speed and pre-stuck obstacles
        // Base speed increases slightly, direction is random
        const speedMultiplier = 0.02 + (level * 0.005);
        target.rotationSpeed = (Math.random() > 0.5 ? 1 : -1) * Math.max(speedMultiplier, 0.03);
        
        // Add Obstacles (max 5 to leave room for 7 throws)
        const obstacles = Math.min(Math.floor((level - 1) * 0.7), 5);
        for(let i = 0; i < obstacles; i++) {
            // Distribute somewhat evenly with random jitter
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
            updateUI(); // Update counter immediately upon throw
        }
    }

    function checkCollision() {
        // Tip of the knife
        const knifeTipY = knife.y;
        
        // Check if knife tip reached the target circle's bounding box Y
        if (knifeTipY <= target.y + target.radius) {
            
            // Exact distance check
            const distance = Math.sqrt(Math.pow(knife.x - target.x, 2) + Math.pow(knifeTipY - target.y, 2));
            
            // Hit the wood? (add slight tolerance just inside the radius)
            if (distance <= target.radius + 5) {
                
                // Calculate angle of impact relative to current rotation
                // Math.PI/2 compensates for 0 being exactly right, we hit from bottom
                const hitAngle = Math.atan2(knifeTipY - target.y, knife.x - target.x) - target.rotation + Math.PI / 2;
                
                // Normalize angle between 0 and 2PI for easier comparison
                const normalizedHitAngle = (hitAngle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);

                // Check collision with existing knives
                let hitAnotherKnife = false;
                // Required empty space (radians). 0.35 is roughly 20 degrees.
                const safeZone = 0.35; 

                for(let k of target.stuckKnives) {
                    const normalizedStuckAngle = (k.angle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
                    
                    // Calculate shortest difference between angles
                    let diff = Math.abs(normalizedStuckAngle - normalizedHitAngle);
                    diff = Math.min(diff, Math.PI * 2 - diff);

                    if (diff < safeZone) {
                        hitAnotherKnife = true;
                        break;
                    }
                }

                if (hitAnotherKnife) {
                    // Bounce effect could go here
                    triggerGameOver();
                } else {
                    // SUCCESSFUL HIT
                    // Store the angle relative to the log
                    target.stuckKnives.push({ angle: hitAngle });
                    
                    throwing = false;
                    resetKnifePosition();

                    // Check Level Completion
                    if (knivesLeft === 0) {
                        // Small delay before showing screen specifically for the last knife
                        setTimeout(showLevelComplete, 300);
                    }
                }
            }
        }
    }
    
    // --- STATE MANAGEMENT FUNCTIONS ---

    function showLevelComplete() {
        gameState = 'levelComplete'; // Stop update loop
        levelCompleteScreen.style.display = 'flex';
    }

    function proceedToNextLevel() {
        level++;
        levelCompleteScreen.style.display = 'none';
        gameState = 'playing';
        setupLevel();
        update(); // Restart loop
    }

    function triggerGameOver() {
        gameState = 'gameOver';
        finalLevelElement.textContent = level;
        gameOverScreen.style.display = 'flex';
        // Optional: Shake effect on canvas
        canvas.style.transform = "translateX(5px)";
        setTimeout(() => canvas.style.transform = "translateX(0)", 50);
    }
    
    function retryCurrentLevel() {
        gameOverScreen.style.display = 'none';
        gameState = 'playing';
        setupLevel(); // Re-setup the *current* level
        update(); // Restart loop
    }

    function startFirstGame() {
        level = 1;
        startScreen.style.display = 'none';
        gameState = 'playing';
        setupLevel();
        update(); // Begin the main loop
    }

    // --- MAIN GAME LOOP ---
    
    function update() {
        // Stop updating if we are in a menu or finished state
        if (gameState !== 'playing') return;

        // 1. Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 2. Update Physics
        target.rotation += target.rotationSpeed;
        
        if (throwing) {
            knife.y -= knife.speed;
            checkCollision();
            
            // Failsafe: Knife missed completely (shouldn't happen with standard setup)
            if (knife.y < -knife.height) {
                throwing = false;
                resetKnifePosition();
            }
        }

        // 3. Draw
        drawTarget(); // Draws log and stuck knives
        
        // Draw throwing knife if not all used, or if currently mid-air
        if(knivesLeft > 0 || throwing) {
            drawKnifeSprite(false);
        }

        // 4. Loop
        requestAnimationFrame(update);
    }
    
    // --- INPUT & EVENT LISTENERS ---
    
    // Button clicks
    startButton.addEventListener('click', startFirstGame);
    restartButton.addEventListener('click', retryCurrentLevel);
    nextLevelButton.addEventListener('click', proceedToNextLevel);

    // Gameplay input (Mouse & Touch)
    function handleInput(e) {
        // Prevent default behaviors (scrolling, zooming on touch)
        if(e.type === 'touchstart') e.preventDefault();
        
        if (gameState === 'playing') {
            throwKnife();
        }
    }

    canvas.addEventListener('mousedown', handleInput);
    canvas.addEventListener('touchstart', handleInput, {passive: false});
    
    // Allow spacebar to throw
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && gameState === 'playing') {
            throwKnife();
        }
    });
});
