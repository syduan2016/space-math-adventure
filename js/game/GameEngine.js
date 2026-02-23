// Game Engine - Main game loop and state management

class GameEngine {
    constructor(levelConfig) {
        // Support both old-style (table number) and new-style (levelConfig object)
        if (typeof levelConfig === 'number') {
            this.table = levelConfig;
            this.config = getDifficultyTier(levelConfig);
            this.operation = 'multiplication';
            this.levelConfig = buildLevelConfig('multiplication', levelConfig);
        } else {
            this.levelConfig = levelConfig;
            this.table = levelConfig.table || levelConfig.level || 1;
            this.config = getOperationDifficultyTier(levelConfig.operation, levelConfig.level);
            this.operation = levelConfig.operation || 'multiplication';
            // Merge tier config with level config
            this.config = { ...this.config, ...levelConfig };
        }

        // Canvas setup
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();

        // Game objects
        this.player = new Player(this.canvas, this.levelConfig.shipConfig || null);
        this.enemies = [];
        this.projectiles = [];
        this.questionManager = new QuestionManager(this.levelConfig);
        this.particleSystem = new ParticleSystem(this.canvas);

        // Power-up manager (if available)
        this.powerUpManager = typeof PowerUpManager !== 'undefined' ? new PowerUpManager(this) : null;

        // Adaptive difficulty (if available)
        if (typeof adaptiveDifficultyManager !== 'undefined') {
            this.questionManager.adaptiveManager = adaptiveDifficultyManager;
        }

        // Game state
        this.isRunning = false;
        this.isPaused = false;
        this.isGameOver = false;
        this.practiceMode = this.levelConfig.practiceMode || false;
        this.currentQuestion = null;
        this.questionStartTime = null;

        // Scoring
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.lives = this.practiceMode ? 10 : this.config.lives;
        this.fastCorrectCount = 0; // For time freeze power-up

        // Timing
        this.lastTime = 0;
        this.shootTimer = 0;
        this.spawnTimer = 0;

        // Input
        this.mouseX = this.canvas.width / 2;
        this.mouseY = this.canvas.height - 100;

        // Bind event handlers
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleAnswerClick = this.handleAnswerClick.bind(this);

        this.setupEventListeners();
        this.setupAnswerButtons();
    }

    // Setup canvas with proper dimensions
    setupCanvas() {
        const container = this.canvas.parentElement;
        const maxWidth = Math.min(container.clientWidth - 40, GAME_CONFIG.CANVAS_WIDTH);
        const maxHeight = Math.min(container.clientHeight - 200, GAME_CONFIG.CANVAS_HEIGHT);

        this.canvas.width = maxWidth;
        this.canvas.height = maxHeight;

        // Update player start position based on actual canvas size
        GAME_CONFIG.PLAYER_START_X = this.canvas.width / 2;
        GAME_CONFIG.PLAYER_START_Y = this.canvas.height - 100;
    }

    // Setup input event listeners
    setupEventListeners() {
        this.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    }

    // Mouse movement handler
    handleMouseMove(e) {
        if (!this.isRunning || this.isPaused) return;

        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
    }

    // Touch movement handler
    handleTouchMove(e) {
        if (!this.isRunning || this.isPaused) return;

        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.mouseX = touch.clientX - rect.left;
        this.mouseY = touch.clientY - rect.top;
    }

    // Setup answer buttons
    setupAnswerButtons() {
        const answerButtonsContainer = document.getElementById('answer-buttons');
        answerButtonsContainer.innerHTML = '';
    }

    // Populate answer buttons for current question
    updateAnswerButtons() {
        if (!this.currentQuestion) return;

        const answerButtonsContainer = document.getElementById('answer-buttons');
        answerButtonsContainer.innerHTML = '';

        this.currentQuestion.answers.forEach(answer => {
            const button = document.createElement('button');
            button.className = 'answer-btn';
            button.textContent = answer;
            button.dataset.answer = answer;
            button.addEventListener('click', this.handleAnswerClick);
            answerButtonsContainer.appendChild(button);
        });
    }

    // Handle answer button click
    handleAnswerClick(e) {
        if (!this.isRunning || this.isPaused || !this.currentQuestion) return;

        const answer = parseInt(e.target.dataset.answer);
        const result = this.questionManager.checkAnswer(answer, this.questionStartTime);

        // Visual feedback
        e.target.classList.add(result.isCorrect ? 'correct' : 'wrong');

        // Disable all buttons temporarily
        const buttons = document.querySelectorAll('.answer-btn');
        buttons.forEach(btn => btn.disabled = true);

        if (result.isCorrect) {
            this.handleCorrectAnswer(result);
        } else {
            this.handleWrongAnswer(result, e.target);
        }

        // Trigger encouragement if available
        if (typeof encouragementManager !== 'undefined') {
            encouragementManager.showEncouragement({
                wasCorrect: result.isCorrect,
                question: this.currentQuestion,
                responseTime: result.responseTime,
                combo: this.combo,
                accuracy: this.questionManager.getSessionStats().accuracy,
                lives: this.lives
            });
        }

        // Move to next question after delay
        setTimeout(() => {
            this.spawnNextEnemy();
        }, 800);
    }

    // Handle correct answer
    handleCorrectAnswer(result) {
        // Destroy all active enemies (representing this question)
        this.enemies.forEach(enemy => {
            if (enemy.question === this.currentQuestion) {
                const pos = enemy.getPosition();
                this.particleSystem.createSuccessEffect(pos.x, pos.y);
                enemy.destroy();
            }
        });

        // Update combo
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;

        // Track fast answers for power-ups
        if (result.earnedSpeedBonus) {
            this.fastCorrectCount++;
        }

        // Calculate score
        let points = SCORING.BASE_POINTS;

        // Speed bonus
        if (result.earnedSpeedBonus) {
            points += SCORING.SPEED_BONUS;
        }

        // Combo multiplier
        const multiplier = getComboMultiplier(this.combo);
        points = Math.floor(points * multiplier);

        // Double points power-up
        if (this.powerUpManager && this.powerUpManager.isActive('doublePoints')) {
            points *= 2;
        }

        // Practice mode: reduced scoring
        if (this.practiceMode) {
            points = Math.floor(points * 0.5);
        }

        this.score += points;

        // Check power-up triggers
        if (this.powerUpManager) {
            this.powerUpManager.onCorrectAnswer(this.combo, this.fastCorrectCount, result.earnedSpeedBonus);
        }

        // Update HUD
        this.updateHUD();

        // Play sound
        soundManager.playCorrect();
        soundManager.playExplosion();

        // Play combo sound if applicable
        if (this.combo >= 3) {
            soundManager.playCombo(this.combo);
        }
    }

    // Handle wrong answer
    handleWrongAnswer(result, buttonElement) {
        // Check for shield power-up
        if (this.powerUpManager && this.powerUpManager.useShield()) {
            // Shield absorbed the wrong answer
            soundManager.playClick();
            this.updateHUD();
            return;
        }

        // Check for second chance power-up
        if (this.powerUpManager && this.powerUpManager.useSecondChance()) {
            // Re-enable buttons (except the wrong one) for another try
            buttonElement.disabled = true;
            const buttons = document.querySelectorAll('.answer-btn:not(.wrong)');
            buttons.forEach(btn => btn.disabled = false);
            soundManager.playClick();
            return;
        }

        // Reset combo
        this.combo = 0;
        this.fastCorrectCount = 0;

        // Take damage
        this.lives--;

        if (this.lives <= 0) {
            this.gameOver();
        }

        // Update HUD
        this.updateHUD();

        // Shake effect
        this.canvas.parentElement.classList.add('shake');
        setTimeout(() => {
            this.canvas.parentElement.classList.remove('shake');
        }, 200);

        // Play sound
        soundManager.playWrong();
    }

    // Spawn next enemy with new question
    spawnNextEnemy() {
        if (this.questionManager.isSessionComplete()) {
            this.endGame();
            return;
        }

        // Generate new question
        this.currentQuestion = this.questionManager.generateQuestion();
        this.questionStartTime = Date.now();

        // Update question UI
        document.getElementById('question-text').textContent = this.currentQuestion.questionText;
        this.updateAnswerButtons();

        // Pre-fetch hint if AI hints available
        if (typeof hintManager !== 'undefined') {
            hintManager.prefetchHint(this.currentQuestion);
        }

        // Spawn enemy with this question
        const x = randomInt(100, this.canvas.width - 100);
        const y = -GAME_CONFIG.ENEMY_HEIGHT;
        const speed = this.powerUpManager && this.powerUpManager.isActive('timeFreeze')
            ? 0 : this.config.enemySpeed;
        const enemy = new Enemy(x, y, this.currentQuestion, speed, this.canvas);
        this.enemies.push(enemy);

        this.spawnTimer = 0;
    }

    // Start the game
    start() {
        this.isRunning = true;
        this.isPaused = false;
        this.isGameOver = false;

        // Reset state
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.lives = this.practiceMode ? 10 : this.config.lives;
        this.enemies = [];
        this.projectiles = [];
        this.questionManager.reset();

        // Reset player
        this.player.reset();
        this.player.lives = this.lives;

        // Apply ship abilities
        if (this.powerUpManager && this.levelConfig.shipConfig) {
            this.powerUpManager.applyShipAbilities(this.levelConfig.shipConfig);
        }

        // Update HUD
        this.updateHUD();

        // Show hint button if AI hints available
        const hintBtn = document.getElementById('btn-hint');
        if (hintBtn) hintBtn.style.display = typeof hintManager !== 'undefined' ? 'block' : 'none';

        // Spawn first enemy
        this.spawnNextEnemy();

        // Start game loop
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    // Main game loop
    gameLoop(currentTime) {
        if (!this.isRunning) return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        if (!this.isPaused) {
            this.update(deltaTime);
            this.render();
        }

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    // Update game state
    update(deltaTime) {
        // Update player
        this.player.update(deltaTime, this.mouseX, this.mouseY);

        // Update particle system
        this.particleSystem.update(deltaTime);

        // Update power-ups
        if (this.powerUpManager) {
            this.powerUpManager.update(deltaTime);
        }

        // Auto-shoot if enabled
        if (GAME_CONFIG.AUTO_SHOOT) {
            this.shootTimer += deltaTime;
            if (this.shootTimer >= GAME_CONFIG.SHOOT_INTERVAL) {
                this.shoot();
                this.shootTimer = 0;
            }
        }

        // Update enemies
        this.enemies = this.enemies.filter(enemy => {
            // Freeze enemies if time freeze is active
            if (!(this.powerUpManager && this.powerUpManager.isActive('timeFreeze'))) {
                enemy.update(deltaTime);
            }

            // Check if enemy escaped
            if (enemy.hasEscaped() && !enemy.isDestroyed) {
                return false;
            }

            return enemy.isActive;
        });

        // Update projectiles
        this.projectiles = this.projectiles.filter(proj => {
            proj.update(deltaTime);
            return proj.isActive;
        });

        // Check collisions
        this.checkCollisions();
    }

    // Render everything
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw starfield background
        this.drawBackground();

        // Render game objects
        this.player.render();

        this.enemies.forEach(enemy => enemy.render());
        this.projectiles.forEach(proj => proj.render());

        // Render particles on top
        this.particleSystem.render();

        // Render power-up effects
        if (this.powerUpManager) {
            this.powerUpManager.render(this.ctx);
        }
    }

    // Draw animated background
    drawBackground() {
        // Simple starfield
        const ctx = this.ctx;
        const time = Date.now();

        for (let i = 0; i < 50; i++) {
            const x = (i * 73) % this.canvas.width;
            const y = ((time * 0.02 * (i % 3 + 1)) + i * 137) % this.canvas.height;
            const size = (i % 3) + 1;

            ctx.fillStyle = 'rgba(255, 255, 255, ' + (0.3 + (i % 3) * 0.2) + ')';
            ctx.fillRect(x, y, size, size);
        }
    }

    // Shoot projectile
    shoot() {
        const playerBounds = this.player.getBounds();
        const projectile = new Projectile(playerBounds.centerX, this.player.y, this.canvas);
        this.projectiles.push(projectile);

        // Play laser sound occasionally (not every shot to avoid spam)
        if (Math.random() < 0.3) {
            soundManager.playLaser();
        }
    }

    // Check all collisions
    checkCollisions() {
        // Projectile vs Enemy collisions
        this.projectiles.forEach(proj => {
            this.enemies.forEach(enemy => {
                if (proj.collidesWith(enemy)) {
                    proj.destroy();
                    // Note: Don't destroy enemy here - only destroyed by correct answer
                    // This makes projectiles purely visual
                }
            });
        });
    }

    // Update HUD
    updateHUD() {
        document.getElementById('score-value').textContent = formatNumber(this.score);
        document.getElementById('combo-value').textContent = this.combo;

        // Update lives display
        const livesDisplay = document.getElementById('lives-display');
        livesDisplay.innerHTML = '';
        for (let i = 0; i < this.lives; i++) {
            const heart = document.createElement('span');
            heart.textContent = '\u2764\ufe0f';
            livesDisplay.appendChild(heart);
        }

        // Update power-up HUD
        if (this.powerUpManager) {
            this.powerUpManager.updateHUD();
        }
    }

    // Pause game
    pause() {
        this.isPaused = true;
    }

    // Resume game
    resume() {
        this.isPaused = false;
        this.lastTime = performance.now();
    }

    // Toggle pause
    togglePause() {
        if (this.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    }

    // End game (completed all questions)
    endGame() {
        this.isRunning = false;

        // Get session stats
        const stats = this.questionManager.getSessionStats();

        // Calculate stars
        const stars = calculateStars(stats.accuracy);

        // Prepare results
        const results = {
            table: this.table,
            operation: this.operation,
            level: this.levelConfig.level || this.table,
            score: this.score,
            accuracy: stats.accuracy,
            questionsAnswered: stats.questionsAnswered,
            correctAnswers: stats.correctAnswers,
            stars,
            speedBonuses: stats.speedBonuses,
            maxCombo: this.maxCombo,
            livesRemaining: this.lives,
            startingLives: this.practiceMode ? 10 : this.config.lives,
            practiceMode: this.practiceMode,
            wrongAnswers: this.questionManager.getWrongAnswers(),
            questionHistory: this.questionManager.questionHistory
        };

        // Save progress (skip for practice mode)
        if (!this.practiceMode) {
            this.saveProgress(results);
        }

        // Show results screen
        if (window.app) {
            window.app.navigateToResults(results);
        }
    }

    // Game over (ran out of lives)
    gameOver() {
        this.isGameOver = true;
        this.lives = 0;
        this.endGame();
    }

    // Save progress
    saveProgress(results) {
        // Save session results
        const progressResult = progressManager.saveGameSession(results);

        // Check for new achievements
        const newAchievements = rewardManager.checkAchievements(results);

        // Add progress and achievement info to results
        results.progressResult = progressResult;
        results.newAchievements = newAchievements;
        results.totalStars = progressManager.getProfile().totalStars;

        console.log('Progress saved:', {
            mastery: progressResult.newMastery,
            starsEarned: results.stars,
            totalStars: results.totalStars,
            newAchievements: newAchievements.length
        });

        return results;
    }

    // Stop the game
    stop() {
        this.isRunning = false;
        this.cleanup();
    }

    // Cleanup
    cleanup() {
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);

        const answerButtons = document.querySelectorAll('.answer-btn');
        answerButtons.forEach(btn => {
            btn.removeEventListener('click', this.handleAnswerClick);
        });
    }
}
