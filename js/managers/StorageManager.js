// Storage Manager - Handles all localStorage operations

class StorageManager {
    constructor() {
        this.isAvailable = this.checkLocalStorageAvailability();
        if (!this.isAvailable) {
            console.warn('localStorage is not available. Progress will not be saved.');
        }
        this.initializeStorage();
    }

    // Check if localStorage is available and working
    checkLocalStorageAvailability() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    // Initialize storage with default values if not exists
    initializeStorage() {
        if (!this.isAvailable) return;

        // Initialize player profile
        if (!this.get(STORAGE_KEYS.PLAYER_PROFILE)) {
            this.set(STORAGE_KEYS.PLAYER_PROFILE, DEFAULT_PROFILE);
        }

        // Initialize table progress
        if (!this.get(STORAGE_KEYS.TABLE_PROGRESS)) {
            this.set(STORAGE_KEYS.TABLE_PROGRESS, DEFAULT_TABLE_PROGRESS);
        }

        // Initialize session history
        if (!this.get(STORAGE_KEYS.SESSION_HISTORY)) {
            this.set(STORAGE_KEYS.SESSION_HISTORY, []);
        }

        // Initialize achievements
        if (!this.get(STORAGE_KEYS.ACHIEVEMENTS)) {
            const defaultAchievements = {};
            Object.keys(ACHIEVEMENTS).forEach(key => {
                defaultAchievements[key] = {
                    unlocked: false,
                    unlockedDate: null
                };
            });
            this.set(STORAGE_KEYS.ACHIEVEMENTS, defaultAchievements);
        }

        // Initialize settings
        if (!this.get(STORAGE_KEYS.SETTINGS)) {
            this.set(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
        }

        // Initialize operation progress (all operations)
        if (!this.get(STORAGE_KEYS.OPERATION_PROGRESS)) {
            this.set(STORAGE_KEYS.OPERATION_PROGRESS, {});
        }

        // Initialize fact performance
        if (!this.get(STORAGE_KEYS.FACT_PERFORMANCE)) {
            this.set(STORAGE_KEYS.FACT_PERFORMANCE, {});
        }

        // Initialize ship data
        if (!this.get(STORAGE_KEYS.EQUIPPED_SHIP)) {
            this.set(STORAGE_KEYS.EQUIPPED_SHIP, 'explorer');
        }
        if (!this.get(STORAGE_KEYS.UNLOCKED_SHIPS)) {
            this.set(STORAGE_KEYS.UNLOCKED_SHIPS, ['explorer']);
        }
    }

    // Get item from localStorage
    get(key) {
        if (!this.isAvailable) return null;

        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error(`Error reading from localStorage (${key}):`, e);
            return null;
        }
    }

    // Set item in localStorage
    set(key, value) {
        if (!this.isAvailable) return false;

        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            // Handle quota exceeded error
            if (e.name === 'QuotaExceededError') {
                console.error('localStorage quota exceeded. Cleaning up old data...');
                this.cleanupOldSessions();
                // Try again after cleanup
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                    return true;
                } catch (e2) {
                    console.error('Failed to save even after cleanup:', e2);
                    return false;
                }
            }
            console.error(`Error writing to localStorage (${key}):`, e);
            return false;
        }
    }

    // Remove item from localStorage
    remove(key) {
        if (!this.isAvailable) return false;

        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error(`Error removing from localStorage (${key}):`, e);
            return false;
        }
    }

    // Clear all game data
    clearAll() {
        if (!this.isAvailable) return false;

        const confirmed = confirm(
            'Are you sure you want to reset all progress? This cannot be undone!'
        );

        if (!confirmed) return false;

        try {
            Object.values(STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            // Reinitialize with defaults
            this.initializeStorage();
            return true;
        } catch (e) {
            console.error('Error clearing localStorage:', e);
            return false;
        }
    }

    // Clean up old sessions (keep only MAX_SESSION_HISTORY most recent)
    cleanupOldSessions() {
        const history = this.get(STORAGE_KEYS.SESSION_HISTORY) || [];

        if (history.length > MAX_SESSION_HISTORY) {
            const trimmedHistory = history
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, MAX_SESSION_HISTORY);

            this.set(STORAGE_KEYS.SESSION_HISTORY, trimmedHistory);
            console.log(`Cleaned up session history: ${history.length} -> ${trimmedHistory.length}`);
        }
    }

    // Get player profile
    getProfile() {
        return this.get(STORAGE_KEYS.PLAYER_PROFILE) || DEFAULT_PROFILE;
    }

    // Update player profile
    updateProfile(updates) {
        const profile = this.getProfile();
        const updatedProfile = { ...profile, ...updates };
        return this.set(STORAGE_KEYS.PLAYER_PROFILE, updatedProfile);
    }

    // Get table progress
    getTableProgress() {
        return this.get(STORAGE_KEYS.TABLE_PROGRESS) || DEFAULT_TABLE_PROGRESS;
    }

    // Update specific table progress
    updateTableProgress(table, updates) {
        const allProgress = this.getTableProgress();
        allProgress[table] = { ...allProgress[table], ...updates };
        return this.set(STORAGE_KEYS.TABLE_PROGRESS, allProgress);
    }

    // Get session history
    getSessionHistory() {
        return this.get(STORAGE_KEYS.SESSION_HISTORY) || [];
    }

    // Add new session to history
    addSession(sessionData) {
        const history = this.getSessionHistory();
        history.unshift(sessionData); // Add to beginning

        // Trim if needed
        if (history.length > MAX_SESSION_HISTORY) {
            history.length = MAX_SESSION_HISTORY;
        }

        return this.set(STORAGE_KEYS.SESSION_HISTORY, history);
    }

    // Get achievements
    getAchievements() {
        return this.get(STORAGE_KEYS.ACHIEVEMENTS) || {};
    }

    // Unlock achievement
    unlockAchievement(achievementId) {
        const achievements = this.getAchievements();

        if (!achievements[achievementId]) {
            console.warn(`Achievement ${achievementId} not found`);
            return false;
        }

        if (achievements[achievementId].unlocked) {
            return false; // Already unlocked
        }

        achievements[achievementId] = {
            unlocked: true,
            unlockedDate: new Date().toISOString()
        };

        return this.set(STORAGE_KEYS.ACHIEVEMENTS, achievements);
    }

    // Get settings
    getSettings() {
        return this.get(STORAGE_KEYS.SETTINGS) || DEFAULT_SETTINGS;
    }

    // Update settings
    updateSettings(updates) {
        const settings = this.getSettings();
        const updatedSettings = { ...settings, ...updates };
        return this.set(STORAGE_KEYS.SETTINGS, updatedSettings);
    }

    // Export all data as JSON (for backup)
    exportData() {
        if (!this.isAvailable) return null;

        const data = {
            profile: this.getProfile(),
            tableProgress: this.getTableProgress(),
            operationProgress: this.getOperationProgress(),
            sessionHistory: this.getSessionHistory(),
            achievements: this.getAchievements(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString()
        };

        return JSON.stringify(data, null, 2);
    }

    // Import data from JSON (for restore)
    importData(jsonString) {
        if (!this.isAvailable) return false;

        try {
            const data = JSON.parse(jsonString);

            // Validate data structure
            if (!data.profile || !data.tableProgress) {
                throw new Error('Invalid data format');
            }

            // Import all data
            this.set(STORAGE_KEYS.PLAYER_PROFILE, data.profile);
            this.set(STORAGE_KEYS.TABLE_PROGRESS, data.tableProgress);
            this.set(STORAGE_KEYS.SESSION_HISTORY, data.sessionHistory || []);
            this.set(STORAGE_KEYS.ACHIEVEMENTS, data.achievements || {});
            this.set(STORAGE_KEYS.SETTINGS, data.settings || DEFAULT_SETTINGS);
            if (data.operationProgress) {
                this.set(STORAGE_KEYS.OPERATION_PROGRESS, data.operationProgress);
            }

            return true;
        } catch (e) {
            console.error('Error importing data:', e);
            return false;
        }
    }

    // Get operation progress (all operations)
    getOperationProgress() {
        return this.get(STORAGE_KEYS.OPERATION_PROGRESS) || {};
    }

    // Update operation progress for a specific key
    updateOperationProgress(key, updates) {
        const allProgress = this.getOperationProgress();
        allProgress[key] = { ...(allProgress[key] || DEFAULT_OPERATION_PROGRESS_ENTRY), ...updates };
        return this.set(STORAGE_KEYS.OPERATION_PROGRESS, allProgress);
    }

    // Get a single operation progress entry with defaults
    getOperationProgressEntry(key) {
        const allProgress = this.getOperationProgress();
        return allProgress[key] || { ...DEFAULT_OPERATION_PROGRESS_ENTRY };
    }

    // Get fact performance data
    getFactPerformance() {
        return this.get(STORAGE_KEYS.FACT_PERFORMANCE) || {};
    }

    // Update fact performance
    updateFactPerformance(factKey, data) {
        const facts = this.getFactPerformance();
        facts[factKey] = { ...(facts[factKey] || {}), ...data };
        return this.set(STORAGE_KEYS.FACT_PERFORMANCE, facts);
    }

    // Get equipped ship
    getEquippedShip() {
        return this.get(STORAGE_KEYS.EQUIPPED_SHIP) || 'explorer';
    }

    // Set equipped ship
    setEquippedShip(shipId) {
        return this.set(STORAGE_KEYS.EQUIPPED_SHIP, shipId);
    }

    // Get unlocked ships
    getUnlockedShips() {
        return this.get(STORAGE_KEYS.UNLOCKED_SHIPS) || ['explorer'];
    }

    // Unlock a ship
    unlockShip(shipId) {
        const ships = this.getUnlockedShips();
        if (!ships.includes(shipId)) {
            ships.push(shipId);
            return this.set(STORAGE_KEYS.UNLOCKED_SHIPS, ships);
        }
        return true;
    }

    // Spend stars (returns true if successful)
    spendStars(amount) {
        const profile = this.getProfile();
        if (profile.totalStars >= amount) {
            profile.totalStars -= amount;
            return this.set(STORAGE_KEYS.PLAYER_PROFILE, profile);
        }
        return false;
    }

    // Get statistics for display
    getStats() {
        const profile = this.getProfile();
        const tableProgress = this.getTableProgress();
        const achievements = this.getAchievements();

        // Count mastered tables
        const masteredCount = Object.values(tableProgress).filter(
            t => t.mastery === MASTERY_LEVELS.MASTERED.id
        ).length;

        // Count unlocked achievements
        const achievementsUnlocked = Object.values(achievements).filter(
            a => a.unlocked
        ).length;

        return {
            totalGames: profile.totalGamesPlayed,
            totalQuestions: profile.totalQuestionsAnswered,
            overallAccuracy: Math.round(profile.overallAccuracy),
            totalStars: profile.totalStars,
            tablesMastered: masteredCount,
            totalTables: 9,
            achievementsUnlocked,
            totalAchievements: Object.keys(ACHIEVEMENTS).length,
            lastPlayed: profile.lastPlayedDate
        };
    }
}

// Create global instance
const storageManager = new StorageManager();
