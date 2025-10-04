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
        width: 25,  
        height: 85, 
        spriteWidth: 25 * 1.2,
        spriteHeight: 85 * 1.2,
        x: canvas.width / 2,
        y: canvas.height - 150,
        speed: 20 
    };
    
    // --- ADVERTISEMENT LOGIC ---

    // Pop-under on button click
    function triggerPopUnder() {
        const popUnderScript = document.createElement('script');
        popUnderScript.type = 'text/javascript';
        popUnderScript.src = '//preferablyending.com/6c/d1/ab/6cd1ab02b52b2f5ca1e443752d7080b6.js';
        document.body.appendChild(popUnderScript);
    }

    // --- NEW: Native Banner Injection ---
    function loadNativeBanner(screenElement) {
        const container = screenElement.querySelector('.native-ad-container');
        if (!container) return;

        // Clear previous ad
        container.innerHTML = '';

        // Create the necessary div and script
        const adDiv = document.createElement('div');
        adDiv.id = 'container-4a286212fda5668b421eed9472b17e7b';

        const adScript = document.createElement('script');
        adScript.async = true;
        adScript.setAttribute('data-cfasync', 'false');
        adScript.src = '//preferablyending.com/4a286212fda5668b421eed9472b17e7b/invoke.js';

        // Append to the container inside the specific screen
        container.appendChild(adDiv);
        container.appendChild(adScript);
    }

    // --- DRAWING FUNCTIONS ---
    function drawTarget() {
        ctx.save();
        ctx.translate(target.x, target.y);
        ctx.rotate(target.rotation);
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
            if (imageLoaded) {
                ctx.drawImage(knifeImage, -knife.spriteWidth / 2, -target.radius - knife.spriteHeight, knife.spriteWidth, knife.spriteHeight);
            }
            ctx.restore();
        });
        ctx.restore();
    }
    
    function drawThrowingKnife() {
        if (!imageLoaded) return;
        ctx.drawImage(knifeImage, knife.x - knife.spriteWidth / 2, knife.y - knife.spriteHeight, knife.spriteWidth, knife.spriteHeight);
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
        loadNativeBanner(levelCompleteScreen); // Load native ad here
    }

    function proceedToNextLevel() {
        triggerPopUnder();
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
        loadNativeBanner(gameOverScreen); // Load native ad here
    }
    
    function retryCurrentLevel() {
        triggerPopUnder();
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

    // --- INITIAL LOAD ---
    loadNativeBanner(startScreen); // Load the first native ad on the start screen
});
