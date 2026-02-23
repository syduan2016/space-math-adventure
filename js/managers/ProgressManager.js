// Progress Manager - Tracks player progress and mastery levels

class ProgressManager {
    constructor() {
        this.storage = storageManager;
        this.profile = this.storage.getProfile();
        this.tableProgress = this.storage.getTableProgress();
        this._migrateProgressData();
    }

    // Migrate existing multiplication table progress into operationProgress format
    _migrateProgressData() {
        const operationProgress = this.storage.getOperationProgress();

        // If operationProgress already has multiplication keys, skip
        if (operationProgress['mul_1']) return;

        // Check if there's any table progress to migrate
        let hasData = false;
        for (let t = 1; t <= 9; t++) {
            if (this.tableProgress[t] && this.tableProgress[t].gamesPlayed > 0) {
                hasData = true;
                break;
            }
        }

        if (!hasData) return;

        // Copy table progress into operationProgress as mul_1 through mul_9
        for (let t = 1; t <= 9; t++) {
            const key = getProgressKey('multiplication', t);
            const td = this.tableProgress[t];
            if (td) {
                this.storage.updateOperationProgress(key, {
                    mastery: td.mastery,
                    accuracy: td.accuracy,
                    gamesPlayed: td.gamesPlayed,
                    questionsAnswered: td.questionsAnswered,
                    correctAnswers: td.correctAnswers,
                    bestScore: td.bestScore,
                    bestStars: td.bestStars
                });
            }
        }
        console.log('Migrated multiplication progress to operationProgress');
    }

    // Save game session results
    saveGameSession(results) {
        const operation = results.operation || 'multiplication';
        const level = results.level || results.table;

        // Update profile stats
        this.updateProfileStats(results);

        // Update table-specific progress (for backward compat with multiplication)
        if (operation === 'multiplication') {
            this.updateTableProgress(results);
        }

        // Update operation progress for ALL operations
        this.updateOperationProgress(operation, level, results);

        // Add to session history
        const sessionData = {
            date: new Date().toISOString(),
            table: results.table,
            operation: operation,
            level: level,
            score: results.score,
            accuracy: results.accuracy,
            questionsAnswered: results.questionsAnswered,
            correctAnswers: results.correctAnswers,
            stars: results.stars,
            speedBonuses: results.speedBonuses || 0,
            maxCombo: results.maxCombo || 0,
            timePlayed: results.timePlayed || 0
        };

        this.storage.addSession(sessionData);

        // Recalculate mastery levels
        if (operation === 'multiplication') {
            this.recalculateMastery(results.table);
        }
        this.recalculateOperationMastery(operation, level);

        const progressKey = getProgressKey(operation, level);
        const opProgress = this.storage.getOperationProgress();

        return {
            newMastery: operation === 'multiplication'
                ? this.tableProgress[results.table].mastery
                : (opProgress[progressKey] || {}).mastery || 'learning',
            starsEarned: results.stars,
            totalStars: this.profile.totalStars
        };
    }

    // Update operation-specific progress
    updateOperationProgress(operation, level, results) {
        const key = getProgressKey(operation, level);
        const allProgress = this.storage.getOperationProgress();
        const existing = allProgress[key] || { ...DEFAULT_OPERATION_PROGRESS_ENTRY };

        existing.gamesPlayed = (existing.gamesPlayed || 0) + 1;
        existing.questionsAnswered = (existing.questionsAnswered || 0) + results.questionsAnswered;
        existing.correctAnswers = (existing.correctAnswers || 0) + results.correctAnswers;

        if (existing.questionsAnswered > 0) {
            existing.accuracy = Math.round(
                (existing.correctAnswers / existing.questionsAnswered) * 100
            );
        }

        if (results.score > (existing.bestScore || 0)) {
            existing.bestScore = results.score;
        }
        if (results.stars > (existing.bestStars || 0)) {
            existing.bestStars = results.stars;
        }

        this.storage.updateOperationProgress(key, existing);
    }

    // Recalculate mastery for an operation level
    recalculateOperationMastery(operation, level) {
        const key = getProgressKey(operation, level);
        const allProgress = this.storage.getOperationProgress();
        const data = allProgress[key];
        if (!data) return;

        const newMastery = calculateMasteryLevel(data);
        if (newMastery !== data.mastery) {
            data.mastery = newMastery;
            this.storage.updateOperationProgress(key, data);
        }
    }

    // Update overall profile statistics
    updateProfileStats(results) {
        this.profile.totalGamesPlayed++;
        this.profile.totalQuestionsAnswered += results.questionsAnswered;
        this.profile.totalCorrect += results.correctAnswers;
        this.profile.totalStars += results.stars;
        this.profile.lastPlayedDate = new Date().toISOString();

        // Recalculate overall accuracy
        if (this.profile.totalQuestionsAnswered > 0) {
            this.profile.overallAccuracy = Math.round(
                (this.profile.totalCorrect / this.profile.totalQuestionsAnswered) * 100
            );
        }

        this.storage.updateProfile(this.profile);
        this.profile = this.storage.getProfile(); // Refresh
    }

    // Update table-specific progress
    updateTableProgress(results) {
        const table = results.table;
        const tableData = this.tableProgress[table];

        // Update games played
        tableData.gamesPlayed++;

        // Update questions
        tableData.questionsAnswered += results.questionsAnswered;
        tableData.correctAnswers += results.correctAnswers;

        // Recalculate accuracy
        if (tableData.questionsAnswered > 0) {
            tableData.accuracy = Math.round(
                (tableData.correctAnswers / tableData.questionsAnswered) * 100
            );
        }

        // Update best score
        if (results.score > tableData.bestScore) {
            tableData.bestScore = results.score;
        }

        // Update best stars
        if (results.stars > tableData.bestStars) {
            tableData.bestStars = results.stars;
        }

        this.storage.updateTableProgress(table, tableData);
        this.tableProgress = this.storage.getTableProgress(); // Refresh
    }

    // Recalculate mastery level for a table
    recalculateMastery(table) {
        const tableData = this.tableProgress[table];
        const oldMastery = tableData.mastery;

        // Calculate new mastery level
        const newMastery = calculateMasteryLevel(tableData);

        if (newMastery !== oldMastery) {
            tableData.mastery = newMastery;
            this.storage.updateTableProgress(table, tableData);
            this.tableProgress = this.storage.getTableProgress(); // Refresh

            return {
                changed: true,
                oldMastery,
                newMastery
            };
        }

        return { changed: false };
    }

    // Get progress for a specific table
    getTableProgress(table) {
        return this.tableProgress[table] || DEFAULT_TABLE_PROGRESS[table];
    }

    // Get all table progress
    getAllTableProgress() {
        return this.tableProgress;
    }

    // Get player profile
    getProfile() {
        return this.profile;
    }

    // Get recent session history
    getRecentSessions(limit = 10) {
        const history = this.storage.getSessionHistory();
        return history.slice(0, limit);
    }

    // Get statistics for a specific table
    getTableStats(table) {
        const tableData = this.tableProgress[table];
        const mastery = MASTERY_LEVELS[tableData.mastery.toUpperCase()];

        return {
            table,
            mastery: mastery.name,
            masteryIcon: mastery.icon,
            masteryColor: mastery.color,
            accuracy: tableData.accuracy,
            gamesPlayed: tableData.gamesPlayed,
            questionsAnswered: tableData.questionsAnswered,
            correctAnswers: tableData.correctAnswers,
            bestScore: tableData.bestScore,
            bestStars: tableData.bestStars,
            isUnlocked: isTableUnlocked(table, { tableProgress: this.tableProgress })
        };
    }

    // Get overall statistics
    getOverallStats() {
        const masteredCount = Object.values(this.tableProgress).filter(
            t => t.mastery === MASTERY_LEVELS.MASTERED.id
        ).length;

        const goodCount = Object.values(this.tableProgress).filter(
            t => t.mastery === MASTERY_LEVELS.GOOD.id
        ).length;

        return {
            totalGames: this.profile.totalGamesPlayed,
            totalQuestions: this.profile.totalQuestionsAnswered,
            totalCorrect: this.profile.totalCorrect,
            overallAccuracy: this.profile.overallAccuracy,
            totalStars: this.profile.totalStars,
            tablesMastered: masteredCount,
            tablesGood: goodCount,
            totalTables: 9,
            lastPlayed: this.profile.lastPlayedDate
        };
    }

    // Get improvement trends (7-day accuracy trend)
    getImprovementTrend(table, days = 7) {
        const history = this.storage.getSessionHistory();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const recentSessions = history.filter(session => {
            return session.table === table && new Date(session.date) >= cutoffDate;
        });

        if (recentSessions.length === 0) {
            return { trend: 'neutral', change: 0, sessions: 0 };
        }

        // Calculate average accuracy for first half vs second half
        const midpoint = Math.floor(recentSessions.length / 2);
        const firstHalf = recentSessions.slice(midpoint);
        const secondHalf = recentSessions.slice(0, midpoint);

        const avgFirst = firstHalf.reduce((sum, s) => sum + s.accuracy, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((sum, s) => sum + s.accuracy, 0) / secondHalf.length;

        const change = avgSecond - avgFirst;

        return {
            trend: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable',
            change: Math.round(change),
            sessions: recentSessions.length,
            currentAverage: Math.round(avgSecond)
        };
    }

    // Get weak areas (tables and operation levels that need practice)
    getWeakAreas() {
        const weakAreas = [];

        // Check multiplication table progress
        Object.keys(this.tableProgress).forEach(table => {
            const tableData = this.tableProgress[table];

            if (
                tableData.gamesPlayed > 0 &&
                tableData.accuracy < 70 &&
                tableData.mastery !== MASTERY_LEVELS.MASTERED.id
            ) {
                weakAreas.push({
                    table: parseInt(table),
                    operation: 'multiplication',
                    level: parseInt(table),
                    accuracy: tableData.accuracy,
                    gamesPlayed: tableData.gamesPlayed
                });
            }
        });

        // Check operation progress for non-multiplication
        const operationProgress = this.storage.getOperationProgress();
        Object.keys(operationProgress).forEach(key => {
            // Skip multiplication keys (already handled above)
            if (key.startsWith('mul_')) return;

            const data = operationProgress[key];
            if (
                data.gamesPlayed > 0 &&
                data.accuracy < 70 &&
                data.mastery !== MASTERY_LEVELS.MASTERED.id
            ) {
                // Parse key to get operation and level
                const parts = key.split('_');
                const prefix = parts[0];
                const level = parseInt(parts[1]);
                const opMap = { add: 'addition', sub: 'subtraction', div: 'division', mix: 'mixed' };
                const operation = opMap[prefix] || prefix;

                weakAreas.push({
                    operation,
                    level,
                    accuracy: data.accuracy,
                    gamesPlayed: data.gamesPlayed
                });
            }
        });

        // Append per-fact weak areas from FactTracker
        if (typeof factTracker !== 'undefined') {
            const weakFacts = factTracker.getWeakestFacts(10)
                .filter(f => f.attempts >= 3);
            weakFacts.forEach(f => {
                const acc = f.attempts > 0 ? Math.round((f.correct / f.attempts) * 100) : 0;
                weakAreas.push({
                    type: 'fact',
                    factKey: f.factKey,
                    operation: f.operation,
                    accuracy: acc,
                    attempts: f.attempts,
                    masteryLevel: f.masteryLevel
                });
            });
        }

        weakAreas.sort((a, b) => a.accuracy - b.accuracy);
        return weakAreas;
    }

    // Get recommended practice (which table/level to practice next)
    getRecommendedPractice() {
        // Priority 0: Fact-level weak areas from FactTracker
        if (typeof factTracker !== 'undefined' && factTracker.getTotalAttempts() >= 10) {
            const weakFacts = factTracker.getWeakestFacts(10)
                .filter(f => f.attempts >= 3);

            if (weakFacts.length > 0) {
                // Group weak facts by operation, find operation with lowest avg accuracy
                const opAccuracy = {};
                weakFacts.forEach(f => {
                    if (!opAccuracy[f.operation]) {
                        opAccuracy[f.operation] = { total: 0, correct: 0, facts: [] };
                    }
                    opAccuracy[f.operation].total += f.attempts;
                    opAccuracy[f.operation].correct += f.correct;
                    opAccuracy[f.operation].facts.push(f);
                });

                let worstOp = null;
                let worstAcc = 100;
                Object.keys(opAccuracy).forEach(op => {
                    const acc = opAccuracy[op].total > 0
                        ? Math.round((opAccuracy[op].correct / opAccuracy[op].total) * 100)
                        : 0;
                    if (acc < worstAcc) {
                        worstAcc = acc;
                        worstOp = op;
                    }
                });

                if (worstOp && worstAcc < 85) {
                    return {
                        operation: worstOp,
                        level: 1,
                        table: worstOp === 'multiplication' ? 1 : undefined,
                        reason: 'Weak facts need practice',
                        currentAccuracy: worstAcc,
                        weakFacts: opAccuracy[worstOp].facts,
                        source: 'factTracker'
                    };
                }
            }
        }

        // Priority 1: Weak areas
        const weakAreas = this.getWeakAreas();
        if (weakAreas.length > 0) {
            const weak = weakAreas[0];
            return {
                table: weak.table || weak.level,
                operation: weak.operation || 'multiplication',
                level: weak.level || weak.table,
                reason: 'Needs practice',
                currentAccuracy: weak.accuracy
            };
        }

        // Priority 2: Next unlocked table that hasn't been played much
        for (let table = 1; table <= 9; table++) {
            const tableData = this.tableProgress[table];
            const isUnlocked = isTableUnlocked(table, { tableProgress: this.tableProgress });

            if (isUnlocked && tableData.gamesPlayed < 3) {
                return {
                    table,
                    operation: 'multiplication',
                    level: table,
                    reason: 'New challenge',
                    gamesPlayed: tableData.gamesPlayed
                };
            }
        }

        // Priority 3: Random from unlocked tables
        const unlockedTables = [];
        for (let table = 1; table <= 9; table++) {
            if (isTableUnlocked(table, { tableProgress: this.tableProgress })) {
                unlockedTables.push(table);
            }
        }

        if (unlockedTables.length > 0) {
            const randomTable = randomChoice(unlockedTables);
            return {
                table: randomTable,
                operation: 'multiplication',
                level: randomTable,
                reason: 'Keep practicing',
                mastery: this.tableProgress[randomTable].mastery
            };
        }

        // Default: table 1
        return {
            table: 1,
            operation: 'multiplication',
            level: 1,
            reason: 'Start here',
            mastery: MASTERY_LEVELS.LEARNING.id
        };
    }

    // Export progress data
    exportProgress() {
        return this.storage.exportData();
    }

    // Import progress data
    importProgress(jsonData) {
        return this.storage.importData(jsonData);
    }

    // Reset all progress
    resetAllProgress() {
        return this.storage.clearAll();
    }

    // Refresh data from storage
    refresh() {
        this.profile = this.storage.getProfile();
        this.tableProgress = this.storage.getTableProgress();
    }
}

// Create global instance
const progressManager = new ProgressManager();
