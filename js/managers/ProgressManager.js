// Progress Manager - Tracks player progress and mastery levels

class ProgressManager {
    constructor() {
        this.storage = storageManager;
        this.profile = this.storage.getProfile();
        this.tableProgress = this.storage.getTableProgress();
    }

    // Save game session results
    saveGameSession(results) {
        // Update profile stats
        this.updateProfileStats(results);

        // Update table-specific progress
        this.updateTableProgress(results);

        // Add to session history
        const sessionData = {
            date: new Date().toISOString(),
            table: results.table,
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
        this.recalculateMastery(results.table);

        return {
            newMastery: this.tableProgress[results.table].mastery,
            starsEarned: results.stars,
            totalStars: this.profile.totalStars
        };
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

    // Get weak areas (tables that need practice)
    getWeakAreas() {
        const weakAreas = [];

        Object.keys(this.tableProgress).forEach(table => {
            const tableData = this.tableProgress[table];

            // Consider weak if:
            // - Played at least once
            // - Accuracy below 70%
            // - Not yet mastered
            if (
                tableData.gamesPlayed > 0 &&
                tableData.accuracy < 70 &&
                tableData.mastery !== MASTERY_LEVELS.MASTERED.id
            ) {
                weakAreas.push({
                    table: parseInt(table),
                    accuracy: tableData.accuracy,
                    gamesPlayed: tableData.gamesPlayed
                });
            }
        });

        // Sort by accuracy (lowest first)
        weakAreas.sort((a, b) => a.accuracy - b.accuracy);

        return weakAreas;
    }

    // Get recommended practice (which table to practice next)
    getRecommendedPractice() {
        // Priority 1: Weak areas
        const weakAreas = this.getWeakAreas();
        if (weakAreas.length > 0) {
            return {
                table: weakAreas[0].table,
                reason: 'Needs practice',
                currentAccuracy: weakAreas[0].accuracy
            };
        }

        // Priority 2: Next unlocked table that hasn't been played much
        for (let table = 1; table <= 9; table++) {
            const tableData = this.tableProgress[table];
            const isUnlocked = isTableUnlocked(table, { tableProgress: this.tableProgress });

            if (isUnlocked && tableData.gamesPlayed < 3) {
                return {
                    table,
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
                reason: 'Keep practicing',
                mastery: this.tableProgress[randomTable].mastery
            };
        }

        // Default: table 1
        return {
            table: 1,
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
