// Game Constants and Configuration

const GAME_CONFIG = {
    // Canvas settings
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,

    // Game settings
    FPS: 60,
    AUTO_SHOOT: true, // Auto-shooting enabled for younger kids

    // Player settings
    PLAYER_WIDTH: 60,
    PLAYER_HEIGHT: 60,
    PLAYER_SPEED: 5,
    PLAYER_START_X: 400, // Center of canvas
    PLAYER_START_Y: 500,

    // Enemy settings
    ENEMY_WIDTH: 80,
    ENEMY_HEIGHT: 80,
    ENEMY_SPAWN_INTERVAL: 3000, // ms between spawns

    // Projectile settings
    PROJECTILE_WIDTH: 8,
    PROJECTILE_HEIGHT: 20,
    PROJECTILE_SPEED: 7,
    PROJECTILE_COLOR: '#00d9ff',
    SHOOT_INTERVAL: 300, // ms between shots

    // Particle settings
    PARTICLE_COUNT: 20,
    PARTICLE_LIFETIME: 1000, // ms
};

// Difficulty configurations for each level tier
const DIFFICULTY_TIERS = {
    beginner: {
        name: 'Beginner',
        tables: [1, 2, 3],
        enemySpeed: 1,
        answerChoices: 3,
        questionsPerGame: 12,
        lives: 5,
        timeBonus: 3000, // ms - time to get speed bonus
        color: '#4ade80' // green
    },
    intermediate: {
        name: 'Intermediate',
        tables: [4, 5, 6],
        enemySpeed: 1.5,
        answerChoices: 4,
        questionsPerGame: 15,
        lives: 3,
        timeBonus: 3000,
        color: '#fbbf24' // yellow
    },
    advanced: {
        name: 'Advanced',
        tables: [7, 8, 9],
        enemySpeed: 2,
        answerChoices: 4,
        questionsPerGame: 18,
        lives: 3,
        timeBonus: 2500,
        color: '#f87171' // red
    }
};

// Get difficulty tier for a specific table
function getDifficultyTier(table) {
    if (table <= 3) return DIFFICULTY_TIERS.beginner;
    if (table <= 6) return DIFFICULTY_TIERS.intermediate;
    return DIFFICULTY_TIERS.advanced;
}

// Scoring system
const SCORING = {
    BASE_POINTS: 100,
    SPEED_BONUS: 50,
    PERFECT_ROUND_BONUS: 1000,
    COMBO_MULTIPLIERS: {
        3: 1.5,
        5: 2.0,
        10: 3.0
    }
};

// Star thresholds (based on accuracy percentage)
const STAR_THRESHOLDS = {
    ONE_STAR: 60,
    TWO_STARS: 80,
    THREE_STARS: 100
};

// Mastery levels
const MASTERY_LEVELS = {
    LEARNING: {
        id: 'learning',
        name: 'Learning',
        color: '#cd7f32', // bronze
        icon: '🥉',
        requirement: 'Just starting!'
    },
    GOOD: {
        id: 'good',
        name: 'Good',
        color: '#c0c0c0', // silver
        icon: '🥈',
        requirement: '70% accuracy over 3 games'
    },
    MASTERED: {
        id: 'mastered',
        name: 'Mastered',
        color: '#ffd700', // gold
        icon: '🥇',
        requirement: '90% accuracy over 5 games'
    }
};

// Check mastery requirements
function calculateMasteryLevel(tableData) {
    if (!tableData || tableData.gamesPlayed === 0) {
        return MASTERY_LEVELS.LEARNING.id;
    }

    if (tableData.accuracy >= 90 && tableData.gamesPlayed >= 5) {
        return MASTERY_LEVELS.MASTERED.id;
    }

    if (tableData.accuracy >= 70 && tableData.gamesPlayed >= 3) {
        return MASTERY_LEVELS.GOOD.id;
    }

    return MASTERY_LEVELS.LEARNING.id;
}

// Level unlock criteria
const UNLOCK_CRITERIA = {
    MIN_ACCURACY: 85, // minimum accuracy to unlock next level
    MIN_GAMES: 5, // OR minimum games played (allows struggling kids to progress)
    ALWAYS_UNLOCKED: [1, 2, 3] // These tables are always available
};

// Auto-redirect settings for results screen
const AUTO_REDIRECT = {
    ACCURACY_THRESHOLD: 85, // minimum accuracy to trigger auto-redirect
    COUNTDOWN_SECONDS: 5,   // countdown duration before redirect
};

// Check if a table is unlocked
function isTableUnlocked(table, progressData) {
    // First 3 tables always unlocked
    if (UNLOCK_CRITERIA.ALWAYS_UNLOCKED.includes(table)) {
        return true;
    }

    // Check previous table progress
    const prevTable = table - 1;
    const prevProgress = progressData.tableProgress[prevTable];

    if (!prevProgress) return false;

    return (
        prevProgress.accuracy >= UNLOCK_CRITERIA.MIN_ACCURACY ||
        prevProgress.gamesPlayed >= UNLOCK_CRITERIA.MIN_GAMES
    );
}

// Achievement definitions
const ACHIEVEMENTS = {
    // Learning Milestones
    first_win: {
        id: 'first_win',
        name: 'Blast Off!',
        description: 'Complete your first game',
        icon: '🚀',
        stars: 10,
        check: (profile, session) => profile.totalGamesPlayed === 1
    },
    first_perfect: {
        id: 'first_perfect',
        name: 'Perfect Score',
        description: 'Get 100% accuracy in a game',
        icon: '💯',
        stars: 25,
        check: (profile, session) => session && session.accuracy === 100
    },
    table_champion: {
        id: 'table_champion',
        name: 'Table Champion',
        description: 'Master any multiplication table',
        icon: '👑',
        stars: 30,
        check: (profile) => {
            return Object.values(profile.tableProgress).some(t => t.mastery === 'mastered');
        }
    },
    grand_master: {
        id: 'grand_master',
        name: 'Grand Master',
        description: 'Master all 1-9 multiplication tables',
        icon: '🏆',
        stars: 100,
        check: (profile) => {
            return Object.values(profile.tableProgress).every(t => t.mastery === 'mastered');
        }
    },

    // Speed & Skill
    speed_demon: {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Answer 10 questions with speed bonus',
        icon: '⚡',
        stars: 20,
        check: (profile, session) => {
            // This would be tracked during gameplay
            return session && session.speedBonuses >= 10;
        }
    },
    combo_king: {
        id: 'combo_king',
        name: 'Combo King',
        description: 'Get 20 correct answers in a row',
        icon: '🔥',
        stars: 30,
        check: (profile, session) => {
            return session && session.maxCombo >= 20;
        }
    },
    sharpshooter: {
        id: 'sharpshooter',
        name: 'Sharpshooter',
        description: 'Win without losing any lives',
        icon: '🎯',
        stars: 25,
        check: (profile, session) => {
            return session && session.livesRemaining === session.startingLives;
        }
    },

    // Persistence
    dedicated_student: {
        id: 'dedicated_student',
        name: 'Dedicated Student',
        description: 'Play 10 games',
        icon: '📚',
        stars: 15,
        check: (profile) => profile.totalGamesPlayed >= 10
    },
    centurion: {
        id: 'centurion',
        name: 'Centurion',
        description: 'Play 100 games',
        icon: '💪',
        stars: 50,
        check: (profile) => profile.totalGamesPlayed >= 100
    },
    knowledge_seeker: {
        id: 'knowledge_seeker',
        name: 'Knowledge Seeker',
        description: 'Answer 1000 questions',
        icon: '🧠',
        stars: 40,
        check: (profile) => profile.totalQuestionsAnswered >= 1000
    },

    // Accuracy
    ace_student: {
        id: 'ace_student',
        name: 'Ace Student',
        description: 'Maintain 85%+ overall accuracy',
        icon: '⭐',
        stars: 35,
        check: (profile) => profile.overallAccuracy >= 85
    },

    // Operation Achievements
    addition_ace: {
        id: 'addition_ace',
        name: 'Addition Ace',
        description: 'Get 3 stars on all 9 addition levels',
        icon: '➕',
        stars: 40,
        check: (profile) => {
            const opProgress = profile.operationProgress || {};
            const levels = OPERATION_LEVELS.addition || [];
            return levels.every(l => {
                const key = getProgressKey('addition', l.level);
                const data = opProgress[key];
                return data && data.bestStars >= 3;
            });
        }
    },
    subtraction_star: {
        id: 'subtraction_star',
        name: 'Subtraction Star',
        description: 'Get 3 stars on all 9 subtraction levels',
        icon: '➖',
        stars: 40,
        check: (profile) => {
            const opProgress = profile.operationProgress || {};
            const levels = OPERATION_LEVELS.subtraction || [];
            return levels.every(l => {
                const key = getProgressKey('subtraction', l.level);
                const data = opProgress[key];
                return data && data.bestStars >= 3;
            });
        }
    },
    division_dynamo: {
        id: 'division_dynamo',
        name: 'Division Dynamo',
        description: 'Get 3 stars on all 9 division levels',
        icon: '➗',
        stars: 40,
        check: (profile) => {
            const opProgress = profile.operationProgress || {};
            const levels = OPERATION_LEVELS.division || [];
            return levels.every(l => {
                const key = getProgressKey('division', l.level);
                const data = opProgress[key];
                return data && data.bestStars >= 3;
            });
        }
    },
    math_mixer: {
        id: 'math_mixer',
        name: 'Math Mixer',
        description: 'Play 10 mixed-mode games',
        icon: '🎲',
        stars: 30,
        check: (profile) => {
            const opProgress = profile.operationProgress || {};
            let totalMixedGames = 0;
            const levels = OPERATION_LEVELS.mixed || [];
            levels.forEach(l => {
                const key = getProgressKey('mixed', l.level);
                const data = opProgress[key];
                if (data) totalMixedGames += (data.gamesPlayed || 0);
            });
            return totalMixedGames >= 10;
        }
    },
    operation_master: {
        id: 'operation_master',
        name: 'Operation Master',
        description: 'Get 3 stars on ALL operation levels',
        icon: '🏅',
        stars: 150,
        check: (profile) => {
            const opProgress = profile.operationProgress || {};
            const ops = ['addition', 'subtraction', 'multiplication', 'division', 'mixed'];
            return ops.every(op => {
                const levels = OPERATION_LEVELS[op] || [];
                return levels.every(l => {
                    const key = getProgressKey(op, l.level);
                    // For multiplication, also check tableProgress
                    if (op === 'multiplication') {
                        const tp = profile.tableProgress || {};
                        const tData = tp[l.level];
                        const opData = opProgress[key];
                        return (tData && tData.bestStars >= 3) || (opData && opData.bestStars >= 3);
                    }
                    const data = opProgress[key];
                    return data && data.bestStars >= 3;
                });
            });
        }
    }
};

// Color scheme
const COLORS = {
    // Main colors
    background: '#0a1128', // deep space blue
    primary: '#00d9ff', // bright cyan
    secondary: '#b537f2', // vibrant purple
    accent: '#ffd500', // sunny yellow

    // Feedback colors
    success: '#39ff14', // lime green
    error: '#ff006e', // hot pink
    warning: '#fbbf24', // yellow

    // UI colors
    text: '#ffffff',
    textSecondary: '#94a3b8',
    cardBg: 'rgba(15, 23, 42, 0.8)',
    border: 'rgba(148, 163, 184, 0.2)',

    // Button colors
    buttonPrimary: '#00d9ff',
    buttonSecondary: '#b537f2',
    buttonWarning: '#ef4444'
};

// Enemy types (different visual styles and behaviors)
const ENEMY_TYPES = {
    asteroid: {
        id: 'asteroid',
        name: 'Asteroid',
        color: '#6b7280',
        shape: 'circle',
        points: 100
    },
    alien: {
        id: 'alien',
        name: 'Alien Ship',
        color: '#8b5cf6',
        shape: 'triangle',
        points: 150
    },
    ufo: {
        id: 'ufo',
        name: 'UFO',
        color: '#10b981',
        shape: 'ellipse',
        points: 200
    }
};

// Get random enemy type
function getRandomEnemyType() {
    const types = Object.values(ENEMY_TYPES);
    return types[Math.floor(Math.random() * types.length)];
}

// Local storage keys
const STORAGE_KEYS = {
    PLAYER_PROFILE: 'spaceMath_playerProfile',
    TABLE_PROGRESS: 'spaceMath_tableProgress',
    SESSION_HISTORY: 'spaceMath_sessionHistory',
    ACHIEVEMENTS: 'spaceMath_achievements',
    SETTINGS: 'spaceMath_settings',
    OPERATION_PROGRESS: 'spaceMath_operationProgress',
    FACT_PERFORMANCE: 'spaceMath_factPerformance',
    EQUIPPED_SHIP: 'spaceMath_equippedShip',
    UNLOCKED_SHIPS: 'spaceMath_unlockedShips'
};

// Default player profile
const DEFAULT_PROFILE = {
    name: 'Space Explorer',
    totalGamesPlayed: 0,
    totalQuestionsAnswered: 0,
    totalCorrect: 0,
    overallAccuracy: 0,
    totalStars: 0,
    createdDate: new Date().toISOString(),
    lastPlayedDate: null
};

// Default table progress
const DEFAULT_TABLE_PROGRESS = {};
for (let i = 1; i <= 9; i++) {
    DEFAULT_TABLE_PROGRESS[i] = {
        mastery: MASTERY_LEVELS.LEARNING.id,
        accuracy: 0,
        gamesPlayed: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        bestScore: 0,
        bestStars: 0
    };
}

// Default settings
const DEFAULT_SETTINGS = {
    musicEnabled: true,
    sfxEnabled: true,
    musicVolume: 0.5,
    sfxVolume: 0.8
};

// Session history limit
const MAX_SESSION_HISTORY = 50;

// Animation durations (ms)
const ANIMATIONS = {
    screenTransition: 300,
    buttonHover: 150,
    starAppear: 500,
    achievementUnlock: 2000,
    explosionDuration: 800,
    screenShake: 200
};

// Sound file paths (to be added when assets are available)
const SOUNDS = {
    sfx: {
        laser: 'assets/sounds/laser.mp3',
        explosion: 'assets/sounds/explosion.mp3',
        correct: 'assets/sounds/correct.mp3',
        wrong: 'assets/sounds/wrong.mp3',
        click: 'assets/sounds/click.mp3',
        achievement: 'assets/sounds/achievement.mp3',
        star: 'assets/sounds/star.mp3',
        powerup: 'assets/sounds/powerup.mp3'
    },
    music: {
        menu: 'assets/sounds/menu-theme.mp3',
        game1: 'assets/sounds/game-theme-1.mp3',
        game2: 'assets/sounds/game-theme-2.mp3',
        game3: 'assets/sounds/game-theme-3.mp3',
        victory: 'assets/sounds/victory.mp3'
    }
};

// Helper function to get music for difficulty tier
function getMusicForTable(table) {
    const tier = getDifficultyTier(table);
    if (tier === DIFFICULTY_TIERS.beginner) return SOUNDS.music.game1;
    if (tier === DIFFICULTY_TIERS.intermediate) return SOUNDS.music.game2;
    return SOUNDS.music.game3;
}

// Ship configurations
const SHIP_CONFIGS = {
    explorer: {
        id: 'explorer',
        name: 'Explorer',
        cost: 0,
        description: 'Your trusty starter ship',
        colors: { primary: '#00d9ff', secondary: '#b537f2' },
        trailColor: '#ffd500',
        ability: null,
        abilityDescription: 'No special ability'
    },
    comet: {
        id: 'comet',
        name: 'Comet',
        cost: 50,
        description: 'Blazing fast with extra protection',
        colors: { primary: '#ff6b35', secondary: '#ff2222' },
        trailColor: '#ff4500',
        ability: 'extraLife',
        abilityDescription: '+1 starting life'
    },
    nova: {
        id: 'nova',
        name: 'Nova',
        cost: 150,
        description: 'Brilliant and swift',
        colors: { primary: '#ffffff', secondary: '#ffd700' },
        trailColor: '#ffe066',
        ability: 'speedBonus',
        abilityDescription: '10% faster speed bonus threshold'
    },
    nebula: {
        id: 'nebula',
        name: 'Nebula',
        cost: 300,
        description: 'Cosmic dust shields you',
        colors: { primary: '#e040fb', secondary: '#ff80ab' },
        trailColor: '#ce93d8',
        ability: 'startShield',
        abilityDescription: 'Starts with Shield power-up'
    },
    galaxy: {
        id: 'galaxy',
        name: 'Galaxy',
        cost: 500,
        description: 'The ultimate math machine',
        colors: { primary: '#ff0000', secondary: '#0000ff' },
        trailColor: '#ffffff',
        ability: 'comboBoost',
        abilityDescription: '2x combo growth rate'
    }
};

// Power-up configurations
const POWER_UP_CONFIGS = {
    shield: {
        id: 'shield',
        name: 'Shield',
        icon: '\ud83d\udee1\ufe0f',
        description: 'Absorbs one wrong answer',
        trigger: 'combo',
        triggerValue: 5,
        duration: null // Until used
    },
    timeFreeze: {
        id: 'timeFreeze',
        name: 'Time Freeze',
        icon: '\u2744\ufe0f',
        description: 'Pauses enemy descent for 8 seconds',
        trigger: 'fastCorrect',
        triggerValue: 3,
        duration: 8000
    },
    doublePoints: {
        id: 'doublePoints',
        name: 'Double Points',
        icon: '\u2728',
        description: 'Next 3 answers worth 2x points',
        trigger: 'random',
        triggerValue: 0.15,
        duration: null, // 3 answers
        uses: 3
    },
    hintReveal: {
        id: 'hintReveal',
        name: 'Hint Reveal',
        icon: '\ud83d\udca1',
        description: 'Eliminates one wrong choice',
        trigger: 'manual',
        triggerValue: 500, // star cost
        duration: null
    },
    secondChance: {
        id: 'secondChance',
        name: 'Second Chance',
        icon: '\ud83d\udd04',
        description: 'One retry on a wrong answer',
        trigger: 'sessionEnd',
        triggerValue: 90, // accuracy threshold
        duration: null
    }
};

// Default operation progress entry
const DEFAULT_OPERATION_PROGRESS_ENTRY = {
    mastery: 'learning',
    accuracy: 0,
    gamesPlayed: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    bestScore: 0,
    bestStars: 0
};
