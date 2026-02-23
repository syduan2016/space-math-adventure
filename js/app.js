// Main Application Controller

class App {
    constructor() {
        this.currentScreen = null;
        this.gameEngine = null;
        this.menuScreen = null;
        this.levelSelect = null;
        this.gameHUD = null;
        this.resultsScreen = null;
        this.progressScreen = null;
        this.soundManager = null;
        this.isInitialized = false;
        this.countdownTimer = null;
        this.selectedOperation = 'multiplication';
    }

    async init() {
        if (this.isInitialized) return;

        console.log('Initializing Space Math Adventure...');

        try {
            // Show loading screen
            this.showScreen('loading-screen');

            // Initialize managers
            await this.initializeManagers();

            // Initialize UI components
            this.initializeUI();

            // Set up event listeners
            this.setupEventListeners();

            // Hide loading screen and show menu
            setTimeout(() => {
                this.showScreen('menu-screen');
                this.isInitialized = true;
                console.log('App initialized successfully!');
            }, 1500); // Give user time to see loading screen

        } catch (error) {
            console.error('Error initializing app:', error);
            alert('Failed to initialize game. Please refresh the page.');
        }
    }

    async initializeManagers() {
        // Storage is already initialized globally

        // Initialize sound manager (will be created in Phase 5)
        // this.soundManager = new SoundManager();
        // await this.soundManager.init();

        // Initialize progress manager (will be created in Phase 3)
        // this.progressManager = new ProgressManager();

        // Initialize reward manager (will be created in Phase 3)
        // this.rewardManager = new RewardManager();

        console.log('Managers initialized');
    }

    initializeUI() {
        // Initialize UI components (will be created in Phase 4)
        // this.menuScreen = new MenuScreen();
        // this.levelSelect = new LevelSelect();
        // this.gameHUD = new GameHUD();
        // this.resultsScreen = new ResultsScreen();
        // this.progressScreen = new ProgressScreen();

        console.log('UI components initialized');
    }

    setupEventListeners() {
        // Main Menu Buttons
        const btnPlay = document.getElementById('btn-play');
        const btnProgress = document.getElementById('btn-progress');
        const btnSettings = document.getElementById('btn-settings');

        if (btnPlay) {
            btnPlay.addEventListener('click', () => this.navigateToLevelSelect());
        }

        if (btnProgress) {
            btnProgress.addEventListener('click', () => this.navigateToProgress());
        }

        if (btnSettings) {
            btnSettings.addEventListener('click', () => this.navigateToSettings());
        }

        // Back buttons
        const btnBackFromLevels = document.getElementById('btn-back-from-levels');
        const btnBackFromProgress = document.getElementById('btn-back-from-progress');
        const btnBackFromSettings = document.getElementById('btn-back-from-settings');

        if (btnBackFromLevels) {
            btnBackFromLevels.addEventListener('click', () => this.navigateToMenu());
        }

        if (btnBackFromProgress) {
            btnBackFromProgress.addEventListener('click', () => this.navigateToMenu());
        }

        if (btnBackFromSettings) {
            btnBackFromSettings.addEventListener('click', () => this.navigateToMenu());
        }

        // Operation tab buttons
        const operationTabs = document.querySelectorAll('.operation-tab');
        operationTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const op = tab.dataset.operation;

                // Check division lock
                if (op === 'division' && !this.isDivisionUnlocked()) {
                    this.showLockedTooltip(tab, 'Complete any multiplication table at Intermediate level (table 4+) with 60%+ accuracy to unlock Division.');
                    return;
                }

                // Check mixed lock
                if (op === 'mixed' && !this.isMixedUnlocked()) {
                    this.showLockedTooltip(tab, 'Play at least 3 different operations to unlock Mixed mode.');
                    return;
                }

                this.selectedOperation = op;
                operationTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.populateLevelSelect();
            });
        });

        // Results screen buttons
        const btnPlayAgain = document.getElementById('btn-play-again');
        const btnMenuFromResults = document.getElementById('btn-menu-from-results');

        if (btnPlayAgain) {
            btnPlayAgain.addEventListener('click', () => this.navigateToLevelSelect());
        }

        if (btnMenuFromResults) {
            btnMenuFromResults.addEventListener('click', () => this.navigateToMenu());
        }

        // Continue Now button (skip countdown)
        const btnContinueNow = document.getElementById('btn-continue-now');
        if (btnContinueNow) {
            btnContinueNow.addEventListener('click', () => this.skipCountdownAndContinue());
        }

        // Pause button
        const btnPause = document.getElementById('btn-pause');
        if (btnPause) {
            btnPause.addEventListener('click', () => this.togglePause());
        }

        // Pause modal buttons
        const btnResume = document.getElementById('btn-resume');
        const btnQuit = document.getElementById('btn-quit');

        if (btnResume) {
            btnResume.addEventListener('click', () => this.resumeGame());
        }

        if (btnQuit) {
            btnQuit.addEventListener('click', () => this.quitGame());
        }

        // Settings
        const musicToggle = document.getElementById('music-toggle');
        const sfxToggle = document.getElementById('sfx-toggle');
        const musicVolume = document.getElementById('music-volume');
        const sfxVolume = document.getElementById('sfx-volume');
        const btnResetProgress = document.getElementById('btn-reset-progress');

        if (musicToggle) {
            musicToggle.addEventListener('change', (e) => this.updateSetting('musicEnabled', e.target.checked));
        }

        if (sfxToggle) {
            sfxToggle.addEventListener('change', (e) => this.updateSetting('sfxEnabled', e.target.checked));
        }

        if (musicVolume) {
            musicVolume.addEventListener('input', (e) => {
                const value = parseInt(e.target.value) / 100;
                this.updateSetting('musicVolume', value);
                document.getElementById('music-volume-value').textContent = e.target.value + '%';
            });
        }

        if (sfxVolume) {
            sfxVolume.addEventListener('input', (e) => {
                const value = parseInt(e.target.value) / 100;
                this.updateSetting('sfxVolume', value);
                document.getElementById('sfx-volume-value').textContent = e.target.value + '%';
            });
        }

        if (btnResetProgress) {
            btnResetProgress.addEventListener('click', () => this.resetProgress());
        }

        console.log('Event listeners set up');
    }

    // Navigation methods
    showScreen(screenId) {
        // Clear countdown timer if leaving results screen
        if (this.currentScreen === 'results-screen' && screenId !== 'results-screen') {
            this.clearCountdownTimer();
        }

        // Hide all screens
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            screen.classList.remove('active');
        });

        // Show requested screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
        } else {
            console.error(`Screen not found: ${screenId}`);
        }
    }

    navigateToMenu() {
        this.playClickSound();
        this.showScreen('menu-screen');
    }

    navigateToLevelSelect() {
        this.playClickSound();
        this.showScreen('level-select-screen');
        // Populate level select (will be implemented in Phase 4)
        this.populateLevelSelect();
    }

    navigateToProgress() {
        this.playClickSound();
        this.showScreen('progress-screen');
        // Update progress display (will be implemented in Phase 3)
        this.updateProgressDisplay();
    }

    navigateToSettings() {
        this.playClickSound();
        this.showScreen('settings-screen');
        this.loadSettings();
    }

    navigateToGame(operation, level) {
        this.playClickSound();
        this.showScreen('game-screen');
        this.startGame(operation, level);
    }

    navigateToResults(results) {
        this.clearCountdownTimer();
        this.showScreen('results-screen');
        this.displayResults(results);

        if (results.accuracy >= AUTO_REDIRECT.ACCURACY_THRESHOLD) {
            this.startAutoRedirectCountdown();
        } else {
            this.showStandardResultsButtons();
        }
    }

    // Game control methods
    startGame(operation, level) {
        const levelConfig = buildLevelConfig(operation, level);
        console.log(`Starting game: ${operation} level ${level}`, levelConfig);

        // Initialize game engine
        if (this.gameEngine) {
            this.gameEngine.stop();
        }

        this.gameEngine = new GameEngine(levelConfig);
        this.gameEngine.start();
    }

    togglePause() {
        const modal = document.getElementById('pause-modal');
        if (modal) {
            modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
        }

        if (this.gameEngine) {
            this.gameEngine.togglePause();
        }
    }

    resumeGame() {
        this.playClickSound();
        const modal = document.getElementById('pause-modal');
        if (modal) {
            modal.style.display = 'none';
        }

        if (this.gameEngine) {
            this.gameEngine.resume();
        }
    }

    quitGame() {
        this.playClickSound();

        if (this.gameEngine) {
            this.gameEngine.stop();
            this.gameEngine = null;
        }

        const modal = document.getElementById('pause-modal');
        if (modal) {
            modal.style.display = 'none';
        }

        this.navigateToMenu();
    }

    // Check if division is unlocked
    isDivisionUnlocked() {
        const tableProgress = storageManager.getTableProgress();
        const operationProgress = storageManager.getOperationProgress();

        // Check multiplication tables 4+ (intermediate) for gamesPlayed > 0 and accuracy >= 60
        for (let t = 4; t <= 9; t++) {
            const tp = tableProgress[t];
            if (tp && tp.gamesPlayed > 0 && tp.accuracy >= 60) return true;

            // Also check operationProgress for multiplication
            const key = getProgressKey('multiplication', t);
            const op = operationProgress[key];
            if (op && op.gamesPlayed > 0 && op.accuracy >= 60) return true;
        }
        return false;
    }

    // Check if mixed mode is unlocked
    isMixedUnlocked() {
        const operationProgress = storageManager.getOperationProgress();
        const tableProgress = storageManager.getTableProgress();

        const opsWithGames = new Set();

        // Check multiplication via tableProgress
        for (let t = 1; t <= 9; t++) {
            if (tableProgress[t] && tableProgress[t].gamesPlayed > 0) {
                opsWithGames.add('multiplication');
                break;
            }
        }

        // Check all operation progress entries
        Object.keys(operationProgress).forEach(key => {
            const data = operationProgress[key];
            if (data && data.gamesPlayed > 0) {
                if (key.startsWith('mul_')) opsWithGames.add('multiplication');
                else if (key.startsWith('add_')) opsWithGames.add('addition');
                else if (key.startsWith('sub_')) opsWithGames.add('subtraction');
                else if (key.startsWith('div_')) opsWithGames.add('division');
            }
        });

        return opsWithGames.size >= 3;
    }

    // Show locked tooltip near a tab button
    showLockedTooltip(tabElement, message) {
        // Remove any existing tooltip
        const existing = document.querySelector('.locked-tooltip');
        if (existing) existing.remove();

        const tooltip = document.createElement('div');
        tooltip.className = 'locked-tooltip';
        tooltip.textContent = message;
        tabElement.parentElement.appendChild(tooltip);

        // Position near the tab
        const rect = tabElement.getBoundingClientRect();
        const parentRect = tabElement.parentElement.getBoundingClientRect();
        tooltip.style.top = (rect.bottom - parentRect.top + 8) + 'px';
        tooltip.style.left = (rect.left - parentRect.left) + 'px';

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (tooltip.parentElement) tooltip.remove();
        }, 3000);
    }

    // Level select population
    populateLevelSelect() {
        const levelGrid = document.getElementById('level-grid');
        if (!levelGrid) return;

        levelGrid.innerHTML = '';

        const operation = this.selectedOperation;
        const levels = OPERATION_LEVELS[operation];
        if (!levels) return;

        const tableProgress = storageManager.getTableProgress();
        const operationProgress = storageManager.getOperationProgress();

        // Check operation-level lock for division and mixed
        if (operation === 'division' && !this.isDivisionUnlocked()) {
            levelGrid.innerHTML = `
                <div class="operation-locked-message">
                    <div class="lock-icon-large">🔒</div>
                    <h3>Division Locked</h3>
                    <p>Complete any multiplication table at Intermediate level (table 4+) with 60%+ accuracy to unlock Division.</p>
                </div>
            `;
            return;
        }

        if (operation === 'mixed' && !this.isMixedUnlocked()) {
            levelGrid.innerHTML = `
                <div class="operation-locked-message">
                    <div class="lock-icon-large">🔒</div>
                    <h3>Mixed Mode Locked</h3>
                    <p>Play at least 3 different operations to unlock Mixed mode.</p>
                </div>
            `;
            return;
        }

        // Get recommendation for highlighting
        const recommendation = progressManager.getRecommendedPractice();

        levels.forEach(levelDef => {
            const level = levelDef.level;
            const progressKey = getProgressKey(operation, level);

            // Determine unlock status
            let isUnlocked;
            if (operation === 'multiplication') {
                isUnlocked = isTableUnlocked(level, { tableProgress });
            } else {
                isUnlocked = isOperationLevelUnlocked(operation, level, operationProgress);
            }

            // Get progress data
            let progress;
            if (operation === 'multiplication') {
                progress = tableProgress[level] || DEFAULT_OPERATION_PROGRESS_ENTRY;
            } else {
                progress = operationProgress[progressKey] || DEFAULT_OPERATION_PROGRESS_ENTRY;
            }

            const tier = getOperationDifficultyTier(operation, level);
            const masteryKey = (progress.mastery || 'learning').toUpperCase();
            const mastery = MASTERY_LEVELS[masteryKey] || MASTERY_LEVELS.LEARNING;
            const opLabel = OPERATION_LABELS[operation];

            // Check if this level card matches the recommendation
            const isRecommended = isUnlocked && recommendation &&
                recommendation.operation === operation &&
                (recommendation.source === 'factTracker'
                    ? true  // factTracker recommendation applies to the whole operation
                    : (recommendation.level === level || recommendation.table === level));

            const levelCard = document.createElement('div');
            levelCard.className = `level-card ${isUnlocked ? '' : 'locked'} ${isRecommended ? 'recommended' : ''}`;
            levelCard.innerHTML = `
                ${isRecommended ? '<div class="recommended-badge">Recommended</div>' : ''}
                <div class="level-number">${opLabel.icon}</div>
                <div class="level-title">${levelDef.label}</div>
                <div class="level-tier" style="color: ${tier.color}">${tier.name}</div>
                <div class="level-mastery">
                    <span class="mastery-icon">${mastery.icon}</span>
                    <span class="mastery-text">${mastery.name}</span>
                </div>
                <div class="level-stats">
                    <div class="stat-small">
                        <span class="label">Accuracy:</span>
                        <span class="value">${Math.round(progress.accuracy || 0)}%</span>
                    </div>
                    <div class="stat-small">
                        <span class="label">Games:</span>
                        <span class="value">${progress.gamesPlayed || 0}</span>
                    </div>
                </div>
                ${!isUnlocked ? '<div class="lock-icon">🔒</div>' : ''}
            `;

            if (isUnlocked) {
                levelCard.addEventListener('click', () => {
                    this.navigateToGame(operation, level);
                });
            }

            levelGrid.appendChild(levelCard);
        });
    }

    // Progress display
    updateProgressDisplay() {
        const stats = storageManager.getStats();

        // Update overall stats
        const totalGames = document.getElementById('total-games');
        const totalAccuracy = document.getElementById('total-accuracy');
        const totalStars = document.getElementById('total-stars');
        const tablesMastered = document.getElementById('tables-mastered');

        if (totalGames) totalGames.textContent = stats.totalGames;
        if (totalAccuracy) totalAccuracy.textContent = stats.overallAccuracy + '%';
        if (totalStars) totalStars.textContent = stats.totalStars;
        if (tablesMastered) tablesMastered.textContent = `${stats.tablesMastered}/${stats.totalTables}`;

        // Update table/operation progress grid
        this.updateTableProgressGrid();

        // Update fact mastery display
        this.updateFactMasteryDisplay();

        // Update achievements grid
        this.updateAchievementsGrid();
    }

    updateTableProgressGrid() {
        const tablesGrid = document.getElementById('tables-progress');
        if (!tablesGrid) return;

        tablesGrid.innerHTML = '';

        // Add operation tabs for progress view
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'progress-operation-tabs';
        tabsContainer.style.gridColumn = '1 / -1';

        const operations = ['multiplication', 'addition', 'subtraction', 'division', 'mixed'];
        const progressOperation = this._progressViewOperation || 'multiplication';

        operations.forEach(op => {
            const opLabel = OPERATION_LABELS[op];
            const btn = document.createElement('button');
            btn.className = `progress-operation-tab ${op === progressOperation ? 'active' : ''}`;
            btn.textContent = `${opLabel.icon} ${opLabel.name}`;
            btn.addEventListener('click', () => {
                this._progressViewOperation = op;
                this.updateTableProgressGrid();
            });
            tabsContainer.appendChild(btn);
        });

        tablesGrid.appendChild(tabsContainer);

        if (progressOperation === 'multiplication') {
            // Show multiplication tables 1-9
            const tableProgress = storageManager.getTableProgress();
            for (let table = 1; table <= 9; table++) {
                const progress = tableProgress[table];
                const masteryKey = (progress.mastery || 'learning').toUpperCase();
                const mastery = MASTERY_LEVELS[masteryKey] || MASTERY_LEVELS.LEARNING;

                const tableCard = document.createElement('div');
                tableCard.className = 'table-progress-card';
                tableCard.innerHTML = `
                    <div class="table-number">${table}x</div>
                    <div class="mastery-badge" style="background: ${mastery.color}">
                        ${mastery.icon}
                    </div>
                    <div class="table-stats">
                        <div>${Math.round(progress.accuracy)}% accuracy</div>
                        <div>${progress.gamesPlayed} games</div>
                    </div>
                `;
                tablesGrid.appendChild(tableCard);
            }
        } else {
            // Show operation levels
            const operationProgress = storageManager.getOperationProgress();
            const levels = OPERATION_LEVELS[progressOperation] || [];

            levels.forEach(levelDef => {
                const progressKey = getProgressKey(progressOperation, levelDef.level);
                const progress = operationProgress[progressKey] || DEFAULT_OPERATION_PROGRESS_ENTRY;
                const masteryKey = (progress.mastery || 'learning').toUpperCase();
                const mastery = MASTERY_LEVELS[masteryKey] || MASTERY_LEVELS.LEARNING;

                const tableCard = document.createElement('div');
                tableCard.className = 'table-progress-card';
                tableCard.innerHTML = `
                    <div class="table-number">${OPERATION_LABELS[progressOperation].icon}</div>
                    <div style="font-size: var(--font-size-sm); font-weight: 600; margin-bottom: 4px;">${levelDef.label}</div>
                    <div class="mastery-badge" style="background: ${mastery.color}">
                        ${mastery.icon}
                    </div>
                    <div class="table-stats">
                        <div>${Math.round(progress.accuracy || 0)}% accuracy</div>
                        <div>${progress.gamesPlayed || 0} games</div>
                    </div>
                `;
                tablesGrid.appendChild(tableCard);
            });
        }
    }

    updateFactMasteryDisplay() {
        const legend = document.getElementById('fact-mastery-legend');
        const content = document.getElementById('fact-mastery-content');
        if (!legend || !content) return;

        // Render legend
        legend.innerHTML = '';
        const legendRow = document.createElement('div');
        legendRow.className = 'mastery-legend';
        Object.values(FACT_MASTERY).forEach(level => {
            const swatch = document.createElement('div');
            swatch.className = 'mastery-legend-item';
            swatch.innerHTML = `<span class="mastery-swatch" style="background:${level.color}"></span>${level.name}`;
            legendRow.appendChild(swatch);
        });
        legend.appendChild(legendRow);

        // Render grid or list based on current progress view operation
        content.innerHTML = '';
        const operation = this._progressViewOperation || 'multiplication';

        if (operation === 'multiplication') {
            this._renderMultiplicationGrid(content);
        } else {
            this._renderFactList(content, operation);
        }
    }

    _renderMultiplicationGrid(container) {
        const grid = document.createElement('div');
        grid.className = 'multiplication-mastery-grid';

        // Top-left empty corner
        const corner = document.createElement('div');
        corner.className = 'grid-cell grid-header';
        corner.textContent = 'x';
        grid.appendChild(corner);

        // Column headers (1-9)
        for (let c = 1; c <= 9; c++) {
            const header = document.createElement('div');
            header.className = 'grid-cell grid-header';
            header.textContent = c;
            grid.appendChild(header);
        }

        // Rows
        for (let r = 1; r <= 9; r++) {
            // Row header
            const rowHeader = document.createElement('div');
            rowHeader.className = 'grid-cell grid-header';
            rowHeader.textContent = r;
            grid.appendChild(rowHeader);

            // Fact cells
            for (let c = 1; c <= 9; c++) {
                const product = r * c;
                const factKey = FactTracker.normalizeFactKey('multiplication', r, c);
                const mastery = (typeof factTracker !== 'undefined') ? factTracker.getMasteryLevel(factKey) : 'new';
                const factData = (typeof factTracker !== 'undefined') ? factTracker.getFactData(factKey) : null;
                const masteryInfo = FACT_MASTERY[mastery.toUpperCase()] || FACT_MASTERY.NEW;

                const cell = document.createElement('div');
                cell.className = 'grid-cell fact-cell';
                cell.style.background = masteryInfo.color;
                cell.textContent = product;

                // Tooltip
                let tooltip = `${r} x ${c} = ${product}`;
                if (factData && factData.attempts > 0) {
                    const acc = Math.round((factData.correct / factData.attempts) * 100);
                    tooltip += `\n${acc}% (${factData.attempts} attempts)`;
                } else {
                    tooltip += `\nNot practiced yet`;
                }
                cell.title = tooltip;

                grid.appendChild(cell);
            }
        }

        container.appendChild(grid);
    }

    _renderFactList(container, operation) {
        if (typeof factTracker === 'undefined') {
            container.innerHTML = '<p class="fact-list-empty">No facts practiced yet</p>';
            return;
        }

        const facts = factTracker.getAllFacts(operation)
            .filter(f => f.attempts > 0);

        if (facts.length === 0) {
            container.innerHTML = '<p class="fact-list-empty">No facts practiced yet</p>';
            return;
        }

        // Sort weakest first
        facts.sort((a, b) => {
            const accA = a.correct / a.attempts;
            const accB = b.correct / b.attempts;
            return accA - accB;
        });

        const list = document.createElement('div');
        list.className = 'fact-list';

        facts.forEach(fact => {
            const acc = Math.round((fact.correct / fact.attempts) * 100);
            const masteryInfo = FACT_MASTERY[fact.masteryLevel.toUpperCase()] || FACT_MASTERY.NEW;

            const item = document.createElement('div');
            item.className = 'fact-list-item';
            item.innerHTML = `
                <span class="fact-key">${fact.factKey}</span>
                <span class="fact-accuracy">${acc}%</span>
                <span class="fact-attempts">${fact.attempts} attempts</span>
                <span class="fact-mastery-badge" style="background:${masteryInfo.color}">${masteryInfo.name}</span>
            `;
            list.appendChild(item);
        });

        container.appendChild(list);
    }

    updateAchievementsGrid() {
        const achievementsGrid = document.getElementById('achievements-grid');
        if (!achievementsGrid) return;

        achievementsGrid.innerHTML = '';

        const unlockedAchievements = storageManager.getAchievements();

        Object.values(ACHIEVEMENTS).forEach(achievement => {
            const isUnlocked = unlockedAchievements[achievement.id]?.unlocked || false;

            const achievementCard = document.createElement('div');
            achievementCard.className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`;
            achievementCard.innerHTML = `
                <div class="achievement-icon">${isUnlocked ? achievement.icon : '🔒'}</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-description">${achievement.description}</div>
                <div class="achievement-stars">${achievement.stars} ⭐</div>
            `;

            achievementsGrid.appendChild(achievementCard);
        });
    }

    // Results display
    displayResults(results) {
        this.lastResults = results;

        // Show operation + level header
        const resultsTitle = document.querySelector('.results-title');
        if (resultsTitle) {
            const op = results.operation || 'multiplication';
            const opLabel = OPERATION_LABELS[op] || OPERATION_LABELS.multiplication;
            const opLevels = OPERATION_LEVELS[op];
            const levelDef = opLevels ? opLevels.find(l => l.level === (results.level || results.table)) : null;
            const levelLabel = levelDef ? levelDef.label : '';

            // Add operation header above the title
            let opHeader = document.getElementById('results-operation-header');
            if (!opHeader) {
                opHeader = document.createElement('div');
                opHeader.id = 'results-operation-header';
                opHeader.className = 'results-operation-header';
                resultsTitle.parentNode.insertBefore(opHeader, resultsTitle);
            }
            opHeader.innerHTML = `<span class="operation-symbol">${opLabel.icon}</span> ${opLabel.name} — ${levelLabel}`;
        }

        // Update results screen with data
        document.getElementById('result-score').textContent = formatNumber(results.score);
        document.getElementById('result-accuracy').textContent = results.accuracy + '%';
        document.getElementById('result-questions').textContent =
            `${results.correctAnswers}/${results.questionsAnswered}`;

        // Display stars
        const starsContainer = document.getElementById('stars-container');
        starsContainer.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const star = document.createElement('span');
            star.className = 'star';
            star.textContent = i < results.stars ? '⭐' : '☆';
            if (i < results.stars) {
                star.style.animationDelay = `${i * 0.2}s`;
            }
            starsContainer.appendChild(star);
        }

        // Display mixed-mode breakdown if available
        const breakdownContainer = document.getElementById('mixed-breakdown');
        if (breakdownContainer) {
            if (results.operationBreakdown) {
                const tbody = document.getElementById('breakdown-tbody');
                tbody.innerHTML = '';

                Object.keys(results.operationBreakdown).forEach(op => {
                    const data = results.operationBreakdown[op];
                    const opLabel = OPERATION_LABELS[op] || { icon: '', name: op };
                    const acc = data.attempted > 0 ? Math.round((data.correct / data.attempted) * 100) : 0;
                    let accClass = 'accuracy-green';
                    if (acc < 60) accClass = 'accuracy-red';
                    else if (acc < 80) accClass = 'accuracy-yellow';

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${opLabel.icon} ${opLabel.name}</td>
                        <td>${data.attempted}</td>
                        <td>${data.correct}</td>
                        <td>${data.attempted - data.correct}</td>
                        <td class="${accClass}">${acc}%</td>
                    `;
                    tbody.appendChild(row);
                });

                breakdownContainer.style.display = 'block';
            } else {
                breakdownContainer.style.display = 'none';
            }
        }

        // Display newly unlocked achievements
        const achievementsContainer = document.getElementById('achievements-unlocked');
        achievementsContainer.innerHTML = '';

        if (results.newAchievements && results.newAchievements.length > 0) {
            const title = document.createElement('h3');
            title.textContent = 'New Achievements!';
            title.style.color = COLORS.accent;
            achievementsContainer.appendChild(title);

            results.newAchievements.forEach(achievement => {
                const achCard = document.createElement('div');
                achCard.className = 'achievement-card unlocked achievement-unlock';
                achCard.innerHTML = `
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-stars">+${achievement.stars} ⭐</div>
                `;
                achievementsContainer.appendChild(achCard);
            });
        }

        console.log('Results displayed:', results);
    }

    // Auto-redirect countdown methods
    startAutoRedirectCountdown() {
        const countdownContainer = document.getElementById('auto-redirect-container');
        const countdownNumber = document.getElementById('countdown-number');
        const resultsButtons = document.getElementById('results-buttons-container');

        if (!countdownContainer || !countdownNumber) return;

        // Hide standard buttons, show countdown
        if (resultsButtons) resultsButtons.style.display = 'none';
        countdownContainer.style.display = 'block';

        let secondsRemaining = AUTO_REDIRECT.COUNTDOWN_SECONDS;
        countdownNumber.textContent = secondsRemaining;

        this.countdownTimer = setInterval(() => {
            secondsRemaining--;
            countdownNumber.textContent = secondsRemaining;

            // Pulse animation each tick
            countdownNumber.classList.remove('countdown-pulse');
            void countdownNumber.offsetWidth;
            countdownNumber.classList.add('countdown-pulse');

            if (secondsRemaining <= 0) {
                this.clearCountdownTimer();
                this.navigateToLevelSelectFromResults();
            }
        }, 1000);
    }

    skipCountdownAndContinue() {
        this.playClickSound();
        this.clearCountdownTimer();
        this.navigateToLevelSelectFromResults();
    }

    navigateToLevelSelectFromResults() {
        this.showScreen('level-select-screen');
        this.populateLevelSelect();
    }

    showStandardResultsButtons() {
        const countdownContainer = document.getElementById('auto-redirect-container');
        const resultsButtons = document.getElementById('results-buttons-container');

        if (countdownContainer) countdownContainer.style.display = 'none';
        if (resultsButtons) resultsButtons.style.display = 'flex';
    }

    clearCountdownTimer() {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
    }

    // Settings methods
    loadSettings() {
        const settings = storageManager.getSettings();

        const musicToggle = document.getElementById('music-toggle');
        const sfxToggle = document.getElementById('sfx-toggle');
        const musicVolume = document.getElementById('music-volume');
        const sfxVolume = document.getElementById('sfx-volume');

        if (musicToggle) musicToggle.checked = settings.musicEnabled;
        if (sfxToggle) sfxToggle.checked = settings.sfxEnabled;
        if (musicVolume) {
            musicVolume.value = settings.musicVolume * 100;
            document.getElementById('music-volume-value').textContent = Math.round(settings.musicVolume * 100) + '%';
        }
        if (sfxVolume) {
            sfxVolume.value = settings.sfxVolume * 100;
            document.getElementById('sfx-volume-value').textContent = Math.round(settings.sfxVolume * 100) + '%';
        }
    }

    updateSetting(key, value) {
        storageManager.updateSettings({ [key]: value });

        // Update sound manager if available
        if (this.soundManager) {
            this.soundManager.updateSettings(storageManager.getSettings());
        }
    }

    resetProgress() {
        const success = storageManager.clearAll();
        if (success) {
            alert('Progress reset successfully!');
            this.navigateToMenu();
            this.updateProgressDisplay();
        }
    }

    // Sound helpers
    playClickSound() {
        soundManager.playClick();
    }
}

// Initialize app when DOM is ready
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new App();
    app.init();
});

// Make app globally accessible for debugging
window.app = app;
