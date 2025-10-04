document.addEventListener('DOMContentLoaded', () => {
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

    canvas.width = 400;
    canvas.height = 600;

    let gameState = 'start'; 
    let level = 1;
    let knivesLeft;
    let throwing = false;
    const knivesPerLevel = 7;
    let logParticles = [];

    const target = {
        x: canvas.width / 2, y: 200, radius: 80,
        rotation: 0, rotationSpeed: 0,
        stuckKnives: [], visible: true
    };

    const knife = {
        width: 14, height: 85,
        x: canvas.width / 2, y: canvas.height - 150,
        speed: 25
    };

    function drawKnifeShape() {
        const w = knife.width;
        const h = knife.height;
        ctx.fillStyle = '#8B4513'; ctx.fillRect(-w / 2, -h, w, h * 0.5);
        ctx.fillStyle = '#7F8C8D'; ctx.fillRect(-w, -h * 0.5, w * 2, h * 0.1);
        ctx.fillStyle = '#ECF0F1'; ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(-w / 2, -h * 0.4);
        ctx.lineTo(w / 2, -h * 0.4); ctx.closePath(); ctx.fill();
    }

    function drawTarget() {
        if (!target.visible) return;
        ctx.save();
        ctx.translate(target.x, target.y);
        ctx.rotate(target.rotation);
        ctx.fillStyle = '#A0522D'; ctx.beginPath();
        ctx.arc(0, 0, target.radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#6B4226'; ctx.lineWidth = 10; ctx.stroke();
        target.stuckKnives.forEach(k => {
            ctx.save();
            ctx.rotate(k.angle); ctx.translate(0, target.radius);
            drawKnifeShape();
            ctx.restore();
        });
        ctx.restore();
    }

    function drawThrowingKnife() {
        ctx.save();
        ctx.translate(knife.x, knife.y);
        drawKnifeShape();
        ctx.restore();
    }

    function drawParticles() {
        logParticles.forEach((p, index) => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // Gravity
            p.alpha -= 0.02;
            if (p.alpha <= 0) {
                logParticles.splice(index, 1);
            } else {
                ctx.fillStyle = `rgba(160, 82, 45, ${p.alpha})`;
                ctx.fillRect(p.x, p.y, p.size, p.size);
            }
        });
    }

    function updateUI() {
        scoreElement.textContent = `Level: ${level}`;
        knifeCounterElement.innerHTML = '';
        for (let i = 0; i < knivesPerLevel; i++) {
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
        target.visible = true;
        throwing = false;
        logParticles = [];
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
                const hitAngle = Math.atan2(knifeTipY - target.y, knife.x - target.x) - target.rotation;
                let hitAnotherKnife = false;
                const safeZone = 0.35;
                for(let k of target.stuckKnives) {
                    let diff = Math.abs(k.angle - hitAngle);
                    diff = Math.min(diff, Math.PI * 2 - diff);
                    if (diff < safeZone) { hitAnotherKnife = true; break; }
                }

                if (hitAnotherKnife) {
                    triggerGameOver();
                } else {
                    target.stuckKnives.push({ angle: hitAngle });
                    throwing = false;
                    resetKnifePosition();
                    if (knivesLeft === 0) {
                        startLevelTransition();
                    }
                }
            }
        }
    }

    function startLevelTransition() {
        gameState = 'levelTransition';
        target.visible = false;
        for (let i = 0; i < 50; i++) {
            logParticles.push({
                x: target.x, y: target.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                size: Math.random() * 5 + 2,
                alpha: 1
            });
        }
        setTimeout(showLevelComplete, 1000);
    }

    function showLevelComplete() {
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
        canvas.classList.add('shake');
        setTimeout(() => {
            gameOverScreen.style.display = 'flex';
            canvas.classList.remove('shake');
        }, 500);
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

    function update() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (gameState === 'playing') {
            target.rotation += target.rotationSpeed;
            if (throwing) {
                knife.y -= knife.speed;
                checkCollision();
                if (knife.y < -knife.height) { triggerGameOver(); }
            }
        }
        drawTarget();
        if (gameState === 'playing' && (knivesLeft > 0 || throwing)) {
            drawThrowingKnife();
        }
        if (logParticles.length > 0) {
            drawParticles();
        }
        requestAnimationFrame(update);
    }
    
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

    update(); // Start the loop immediately
});
