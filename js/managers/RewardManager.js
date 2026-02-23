// Reward Manager - Handles achievements and rewards

class RewardManager {
    constructor() {
        this.storage = storageManager;
        this.achievements = this.storage.getAchievements();
        this.profile = this.storage.getProfile();
    }

    // Check and unlock achievements after a game session
    checkAchievements(sessionResults) {
        const newlyUnlocked = [];
        const profile = progressManager.getProfile();
        const tableProgress = progressManager.getAllTableProgress();

        // Check each achievement
        Object.values(ACHIEVEMENTS).forEach(achievement => {
            const currentStatus = this.achievements[achievement.id];

            // Skip if already unlocked
            if (currentStatus && currentStatus.unlocked) {
                return;
            }

            // Check if achievement criteria is met
            const profileWithProgress = {
                ...profile,
                tableProgress,
                operationProgress: storageManager.getOperationProgress()
            };

            if (achievement.check(profileWithProgress, sessionResults)) {
                // Unlock the achievement
                this.storage.unlockAchievement(achievement.id);

                // Award stars
                this.awardStars(achievement.stars);

                newlyUnlocked.push({
                    id: achievement.id,
                    name: achievement.name,
                    description: achievement.description,
                    icon: achievement.icon,
                    stars: achievement.stars
                });
            }
        });

        // Refresh local data
        this.achievements = this.storage.getAchievements();
        this.profile = this.storage.getProfile();

        return newlyUnlocked;
    }

    // Award stars to the player
    awardStars(amount) {
        const profile = this.storage.getProfile();
        profile.totalStars = (profile.totalStars || 0) + amount;
        this.storage.updateProfile(profile);
    }

    // Get all achievements with status
    getAllAchievements() {
        const achievementList = [];

        Object.values(ACHIEVEMENTS).forEach(achievement => {
            const status = this.achievements[achievement.id] || { unlocked: false };

            achievementList.push({
                id: achievement.id,
                name: achievement.name,
                description: achievement.description,
                icon: achievement.icon,
                stars: achievement.stars,
                unlocked: status.unlocked,
                unlockedDate: status.unlockedDate
            });
        });

        return achievementList;
    }

    // Get unlocked achievements
    getUnlockedAchievements() {
        return this.getAllAchievements().filter(a => a.unlocked);
    }

    // Get locked achievements
    getLockedAchievements() {
        return this.getAllAchievements().filter(a => !a.unlocked);
    }

    // Get achievement progress stats
    getAchievementStats() {
        const all = this.getAllAchievements();
        const unlocked = all.filter(a => a.unlocked);

        const totalStars = all.reduce((sum, a) => sum + a.stars, 0);
        const earnedStars = unlocked.reduce((sum, a) => sum + a.stars, 0);

        return {
            total: all.length,
            unlocked: unlocked.length,
            locked: all.length - unlocked.length,
            completionPercentage: Math.round((unlocked.length / all.length) * 100),
            totalStars,
            earnedStars,
            starPercentage: Math.round((earnedStars / totalStars) * 100)
        };
    }

    // Get achievements by category
    getAchievementsByCategory() {
        const achievements = this.getAllAchievements();

        const categories = {
            learning: [],
            skill: [],
            persistence: [],
            accuracy: []
        };

        achievements.forEach(achievement => {
            // Categorize based on achievement ID prefix or type
            if (achievement.id.includes('first_') || achievement.id.includes('table_') || achievement.id.includes('grand_')) {
                categories.learning.push(achievement);
            } else if (achievement.id.includes('speed') || achievement.id.includes('combo') || achievement.id.includes('sharp')) {
                categories.skill.push(achievement);
            } else if (achievement.id.includes('student') || achievement.id.includes('centurion') || achievement.id.includes('knowledge')) {
                categories.persistence.push(achievement);
            } else {
                categories.accuracy.push(achievement);
            }
        });

        return categories;
    }

    // Get next achievement to unlock (motivation)
    getNextAchievement() {
        const profile = progressManager.getProfile();
        const tableProgress = progressManager.getAllTableProgress();
        const locked = this.getLockedAchievements();

        // Find the closest achievement to unlocking
        let closest = null;
        let closestDistance = Infinity;

        locked.forEach(achievement => {
            const achievementDef = ACHIEVEMENTS[achievement.id];
            if (!achievementDef) return;

            // Calculate "distance" to unlocking (simplified)
            let distance = 0;

            if (achievement.id === 'first_win') {
                distance = 1 - profile.totalGamesPlayed;
            } else if (achievement.id === 'dedicated_student') {
                distance = 10 - profile.totalGamesPlayed;
            } else if (achievement.id === 'centurion') {
                distance = 100 - profile.totalGamesPlayed;
            } else if (achievement.id === 'knowledge_seeker') {
                distance = 1000 - profile.totalQuestionsAnswered;
            } else if (achievement.id === 'table_champion') {
                const masteredCount = Object.values(tableProgress).filter(t => t.mastery === 'mastered').length;
                distance = masteredCount > 0 ? 0 : 1;
            } else if (achievement.id === 'grand_master') {
                const masteredCount = Object.values(tableProgress).filter(t => t.mastery === 'mastered').length;
                distance = 9 - masteredCount;
            } else if (achievement.id === 'ace_student') {
                distance = Math.max(0, 85 - profile.overallAccuracy);
            }

            if (distance >= 0 && distance < closestDistance) {
                closestDistance = distance;
                closest = {
                    ...achievement,
                    progress: Math.max(0, 100 - (distance * 10)) // Rough progress percentage
                };
            }
        });

        return closest;
    }

    // Check if specific achievement is unlocked
    isAchievementUnlocked(achievementId) {
        const status = this.achievements[achievementId];
        return status && status.unlocked;
    }

    // Get total stars earned
    getTotalStars() {
        return this.profile.totalStars || 0;
    }

    // Refresh data from storage
    refresh() {
        this.achievements = this.storage.getAchievements();
        this.profile = this.storage.getProfile();
    }
}

// Create global instance
const rewardManager = new RewardManager();
