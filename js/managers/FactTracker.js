// FactTracker - Per-fact performance tracking and adaptive question weighting

const FACT_MASTERY = {
    NEW:      { id: 'new',      name: 'New',      color: '#6b7280' },
    LEARNING: { id: 'learning', name: 'Learning', color: '#ef4444' },
    FAMILIAR: { id: 'familiar', name: 'Familiar', color: '#fbbf24' },
    MASTERED: { id: 'mastered', name: 'Mastered', color: '#22c55e' }
};

const FACT_WEIGHT_MAP = {
    mastered: 1,
    familiar: 3,
    learning: 6,
    new: 4
};

class FactTracker {
    constructor() {
        this._facts = new Map();
        this._loadFromStorage();

        // Periodic flush every 30 seconds
        this._flushInterval = setInterval(() => this._flush(), 30000);

        // Flush on page unload
        this._beforeUnloadHandler = () => this._flush();
        window.addEventListener('beforeunload', this._beforeUnloadHandler);
    }

    // --- Storage ---

    _loadFromStorage() {
        try {
            const stored = storageManager.getFactPerformance();
            if (stored && typeof stored === 'object') {
                Object.keys(stored).forEach(key => {
                    const data = stored[key];
                    if (data && typeof data === 'object' && typeof data.factKey === 'string') {
                        this._facts.set(key, data);
                    }
                });
            }
        } catch (e) {
            console.warn('FactTracker: Failed to load from storage, starting fresh', e);
        }
    }

    _flush() {
        const obj = {};
        this._facts.forEach((value, key) => {
            obj[key] = value;
        });
        storageManager.set(STORAGE_KEYS.FACT_PERFORMANCE, obj);
    }

    destroy() {
        this._flush();
        clearInterval(this._flushInterval);
        window.removeEventListener('beforeunload', this._beforeUnloadHandler);
    }

    // --- Default & Mastery Calculation ---

    _defaultFactData(factKey) {
        const parsed = FactTracker.parseFactKey(factKey);
        return {
            factKey: factKey,
            operation: parsed ? parsed.operation : 'unknown',
            operands: parsed ? parsed.operands : [],
            attempts: 0,
            correct: 0,
            incorrect: 0,
            streak: 0,
            lastSeen: 0,
            averageResponseTime: 0,
            masteryLevel: 'new'
        };
    }

    _calculateMastery(factData) {
        if (factData.attempts < 3) return 'new';
        const accuracy = factData.attempts > 0
            ? (factData.correct / factData.attempts) * 100
            : 0;
        if (factData.attempts >= 5 && accuracy > 85) return 'mastered';
        if (accuracy >= 60) return 'familiar';
        return 'learning';
    }

    // --- Static Helpers ---

    static normalizeFactKey(operation, op1, op2) {
        // Sort operands for commutative operations
        if (operation === 'multiplication' || operation === 'addition') {
            const sorted = [op1, op2].sort((a, b) => a - b);
            const symbol = operation === 'multiplication' ? 'x' : '+';
            return `${sorted[0]}${symbol}${sorted[1]}`;
        }
        // Non-commutative: keep as-is
        const symbol = operation === 'subtraction' ? '-' : '/';
        return `${op1}${symbol}${op2}`;
    }

    static parseFactKey(factKey) {
        if (!factKey || typeof factKey !== 'string') return null;

        const ops = [
            { symbol: 'x', operation: 'multiplication' },
            { symbol: '+', operation: 'addition' },
            { symbol: '-', operation: 'subtraction' },
            { symbol: '/', operation: 'division' }
        ];

        for (const { symbol, operation } of ops) {
            const idx = factKey.indexOf(symbol);
            if (idx > 0) {
                const op1 = parseInt(factKey.substring(0, idx));
                const op2 = parseInt(factKey.substring(idx + 1));
                if (!isNaN(op1) && !isNaN(op2)) {
                    return { operation, operands: [op1, op2] };
                }
            }
        }
        return null;
    }

    // --- CRUD Methods ---

    recordAttempt(factKey, operationOrCorrect, isCorrectOrTime, responseTimeOrUndef) {
        // Handle two call signatures:
        // 1) QuestionManager: (factKey, operation, isCorrect, responseTime)
        // 2) Sprint plan:     (factKey, wasCorrect, responseTimeMs)
        let operation, isCorrect, responseTime;

        if (typeof operationOrCorrect === 'string') {
            // Signature 1: (factKey, operation, isCorrect, responseTime)
            operation = operationOrCorrect;
            isCorrect = !!isCorrectOrTime;
            responseTime = responseTimeOrUndef || 0;
        } else {
            // Signature 2: (factKey, wasCorrect, responseTimeMs)
            isCorrect = !!operationOrCorrect;
            responseTime = isCorrectOrTime || 0;
            const parsed = FactTracker.parseFactKey(factKey);
            operation = parsed ? parsed.operation : 'unknown';
        }

        // Normalize the factKey
        const parsed = FactTracker.parseFactKey(factKey);
        let normalizedKey = factKey;
        if (parsed) {
            normalizedKey = FactTracker.normalizeFactKey(parsed.operation, parsed.operands[0], parsed.operands[1]);
        }

        // Get or create fact data
        let data = this._facts.get(normalizedKey);
        if (!data) {
            data = this._defaultFactData(normalizedKey);
        }

        // Update stats
        data.attempts++;
        if (isCorrect) {
            data.correct++;
            data.streak++;
        } else {
            data.incorrect++;
            data.streak = 0;
        }
        data.lastSeen = Date.now();

        // Running average response time
        if (responseTime > 0) {
            if (data.averageResponseTime === 0) {
                data.averageResponseTime = responseTime;
            } else {
                data.averageResponseTime = Math.round(
                    (data.averageResponseTime * (data.attempts - 1) + responseTime) / data.attempts
                );
            }
        }

        // Ensure operation is set
        if (data.operation === 'unknown' && operation !== 'unknown') {
            data.operation = operation;
        }

        // Recalculate mastery
        data.masteryLevel = this._calculateMastery(data);

        this._facts.set(normalizedKey, data);
    }

    getFactData(factKey) {
        // Try normalized key
        const parsed = FactTracker.parseFactKey(factKey);
        if (parsed) {
            const normalizedKey = FactTracker.normalizeFactKey(parsed.operation, parsed.operands[0], parsed.operands[1]);
            return this._facts.get(normalizedKey) || null;
        }
        return this._facts.get(factKey) || null;
    }

    getAllFacts(operation) {
        const result = [];
        this._facts.forEach(data => {
            if (!operation || data.operation === operation) {
                result.push({ ...data });
            }
        });
        return result;
    }

    getMasteryLevel(factKey) {
        const data = this.getFactData(factKey);
        return data ? data.masteryLevel : 'new';
    }

    getWeakestFacts(arg1, arg2) {
        // Handle both signatures:
        // (count, operation?) and (operation, count)
        let count, operation;

        if (typeof arg1 === 'number') {
            count = arg1;
            operation = arg2 || null;
        } else if (typeof arg1 === 'string') {
            operation = arg1;
            count = arg2 || 5;
        } else {
            count = 5;
            operation = null;
        }

        const facts = this.getAllFacts(operation)
            .filter(f => f.attempts > 0);

        // Sort by accuracy ascending (weakest first)
        facts.sort((a, b) => {
            const accA = a.attempts > 0 ? a.correct / a.attempts : 0;
            const accB = b.attempts > 0 ? b.correct / b.attempts : 0;
            return accA - accB;
        });

        return facts.slice(0, count);
    }

    getTotalAttempts() {
        let total = 0;
        this._facts.forEach(data => {
            total += data.attempts;
        });
        return total;
    }

    getQuestionWeights(operation, level) {
        const weights = {};
        this._facts.forEach((data, key) => {
            if (!operation || data.operation === operation) {
                weights[key] = FACT_WEIGHT_MAP[data.masteryLevel] || FACT_WEIGHT_MAP.new;
            }
        });
        return weights;
    }
}

// Create global instance
const factTracker = new FactTracker();
window.adaptiveDifficultyManager = factTracker;
