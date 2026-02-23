// Operation Configurations - Level configs per operation type

const OPERATION_TYPES = {
    MULTIPLICATION: 'multiplication',
    ADDITION: 'addition',
    SUBTRACTION: 'subtraction',
    DIVISION: 'division',
    MIXED: 'mixed'
};

const OPERATION_LABELS = {
    multiplication: { name: 'Multiplication', symbol: '\u00d7', icon: '\u2716\ufe0f' },
    addition: { name: 'Addition', symbol: '+', icon: '\u2795' },
    subtraction: { name: 'Subtraction', symbol: '\u2212', icon: '\u2796' },
    division: { name: 'Division', symbol: '\u00f7', icon: '\u2797' },
    mixed: { name: 'Mixed', symbol: '?', icon: '\ud83c\udfb2' }
};

// Level configs for each operation
const OPERATION_LEVELS = {
    multiplication: [
        { level: 1, label: '1 Times Table', table: 1 },
        { level: 2, label: '2 Times Table', table: 2 },
        { level: 3, label: '3 Times Table', table: 3 },
        { level: 4, label: '4 Times Table', table: 4 },
        { level: 5, label: '5 Times Table', table: 5 },
        { level: 6, label: '6 Times Table', table: 6 },
        { level: 7, label: '7 Times Table', table: 7 },
        { level: 8, label: '8 Times Table', table: 8 },
        { level: 9, label: '9 Times Table', table: 9 }
    ],
    addition: [
        { level: 1, label: 'Sums to 10', maxSum: 10 },
        { level: 2, label: 'Sums to 15', maxSum: 15 },
        { level: 3, label: 'Sums to 20', maxSum: 20 },
        { level: 4, label: 'Sums to 30', maxSum: 30 },
        { level: 5, label: 'Sums to 40', maxSum: 40 },
        { level: 6, label: 'Sums to 50', maxSum: 50 },
        { level: 7, label: 'Sums to 70', maxSum: 70 },
        { level: 8, label: 'Sums to 85', maxSum: 85 },
        { level: 9, label: 'Sums to 100', maxSum: 100 }
    ],
    subtraction: [
        { level: 1, label: 'Within 10', maxMinuend: 10 },
        { level: 2, label: 'Within 15', maxMinuend: 15 },
        { level: 3, label: 'Within 20', maxMinuend: 20 },
        { level: 4, label: 'Within 30', maxMinuend: 30 },
        { level: 5, label: 'Within 40', maxMinuend: 40 },
        { level: 6, label: 'Within 50', maxMinuend: 50 },
        { level: 7, label: 'Within 70', maxMinuend: 70 },
        { level: 8, label: 'Within 85', maxMinuend: 85 },
        { level: 9, label: 'Within 100', maxMinuend: 100 }
    ],
    division: [
        { level: 1, label: 'Divide by 1', table: 1 },
        { level: 2, label: 'Divide by 2', table: 2 },
        { level: 3, label: 'Divide by 3', table: 3 },
        { level: 4, label: 'Divide by 4', table: 4 },
        { level: 5, label: 'Divide by 5', table: 5 },
        { level: 6, label: 'Divide by 6', table: 6 },
        { level: 7, label: 'Divide by 7', table: 7 },
        { level: 8, label: 'Divide by 8', table: 8 },
        { level: 9, label: 'Divide by 9', table: 9 }
    ],
    mixed: [
        { level: 1, label: 'Easy Mix', difficulty: 'beginner' },
        { level: 2, label: 'Getting Warmer', difficulty: 'beginner' },
        { level: 3, label: 'Nice Mix', difficulty: 'beginner' },
        { level: 4, label: 'Stepping Up', difficulty: 'intermediate' },
        { level: 5, label: 'Challenge Mix', difficulty: 'intermediate' },
        { level: 6, label: 'Brain Buster', difficulty: 'intermediate' },
        { level: 7, label: 'Expert Mix', difficulty: 'advanced' },
        { level: 8, label: 'Master Mix', difficulty: 'advanced' },
        { level: 9, label: 'Ultimate Mix', difficulty: 'advanced' }
    ]
};

// Get difficulty tier for any operation and level
function getOperationDifficultyTier(operation, level) {
    if (level <= 3) return DIFFICULTY_TIERS.beginner;
    if (level <= 6) return DIFFICULTY_TIERS.intermediate;
    return DIFFICULTY_TIERS.advanced;
}

// Build a full level config for game engine
function buildLevelConfig(operation, level) {
    const opLevels = OPERATION_LEVELS[operation];
    const levelDef = opLevels ? opLevels.find(l => l.level === level) : null;
    const tier = getOperationDifficultyTier(operation, level);

    return {
        operation,
        level,
        label: levelDef ? levelDef.label : `Level ${level}`,
        table: (levelDef && levelDef.table) || level,
        ...tier,
        // Spread any level-specific overrides
        ...(levelDef || {})
    };
}

// Get progress key for an operation level (used in storage)
function getProgressKey(operation, level) {
    const prefixes = {
        multiplication: 'mul',
        addition: 'add',
        subtraction: 'sub',
        division: 'div',
        mixed: 'mix'
    };
    return `${prefixes[operation] || operation}_${level}`;
}

// Check if an operation level is unlocked
function isOperationLevelUnlocked(operation, level, progressData) {
    // First 3 levels of each operation always unlocked
    if (level <= 3) return true;

    // Check previous level progress
    const prevKey = getProgressKey(operation, level - 1);
    const prevProgress = progressData[prevKey];

    if (!prevProgress) return false;

    return (
        prevProgress.accuracy >= UNLOCK_CRITERIA.MIN_ACCURACY ||
        prevProgress.gamesPlayed >= UNLOCK_CRITERIA.MIN_GAMES
    );
}
