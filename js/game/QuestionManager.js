// Question Manager - Generates questions and validates answers using operation-specific generators

class QuestionManager {
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
            this.config = levelConfig;
            this.operation = levelConfig.operation || 'multiplication';
        }

        // Create the appropriate generator
        this.generator = createQuestionGenerator(this.operation, {
            ...this.config,
            table: this.table,
            level: this.levelConfig.level || this.table
        });

        this.currentQuestion = null;
        this.questionHistory = [];
        this.usedQuestions = new Set();
        this.adaptiveManager = null; // Set externally if adaptive mode is on
        this.recentFacts = []; // Ring buffer for anti-repeat (size 5)
    }

    // Generate a new question
    generateQuestion() {
        // Use weighted selection if adaptive manager has enough data
        if (this.adaptiveManager && this.adaptiveManager.getTotalAttempts() >= 10) {
            return this._selectWeightedQuestion();
        }

        // Otherwise: uniform random from generator
        const question = this.generator.generate();
        return this._setCurrentQuestion(question);
    }

    // Weighted question selection using adaptive mastery data
    _selectWeightedQuestion() {
        // Generate pool of 20 candidate questions
        const candidates = [];
        const seenKeys = new Set();

        for (let i = 0; i < 20; i++) {
            const q = this.generator.generate();
            // Normalize the factKey for dedup
            const parsed = FactTracker.parseFactKey(q.factKey);
            const normalizedKey = parsed
                ? FactTracker.normalizeFactKey(parsed.operation, parsed.operands[0], parsed.operands[1])
                : q.factKey;

            if (!seenKeys.has(normalizedKey)) {
                seenKeys.add(normalizedKey);
                candidates.push({ question: q, normalizedKey });
            }
        }

        if (candidates.length === 0) {
            return this._setCurrentQuestion(this.generator.generate());
        }

        // Assign weight per candidate
        const weighted = candidates.map(c => {
            const mastery = this.adaptiveManager.getMasteryLevel(c.normalizedKey);
            let weight = FACT_WEIGHT_MAP[mastery] || FACT_WEIGHT_MAP.new;

            // Recency bonus: 1.5x if not in recent facts
            if (!this.recentFacts.includes(c.normalizedKey)) {
                weight *= 1.5;
            }

            return { ...c, weight };
        });

        // Weighted random selection
        const totalWeight = weighted.reduce((sum, c) => sum + c.weight, 0);
        let roll = Math.random() * totalWeight;

        let selected = weighted[0];
        for (const c of weighted) {
            roll -= c.weight;
            if (roll <= 0) {
                selected = c;
                break;
            }
        }

        // Add to recent facts ring buffer
        this._addToRecentFacts(selected.normalizedKey);

        return this._setCurrentQuestion(selected.question);
    }

    _addToRecentFacts(factKey) {
        this.recentFacts.push(factKey);
        if (this.recentFacts.length > 5) {
            this.recentFacts.shift();
        }
    }

    _setCurrentQuestion(question) {
        this.currentQuestion = {
            ...question,
            answeredAt: null,
            isCorrect: null,
            responseTime: null
        };
        return this.currentQuestion;
    }

    // Generate answer choices (1 correct + distractors)
    generateAnswerChoices(correctAnswer) {
        const numChoices = this.config.answerChoices || 4;
        return this.generator.generateAnswerChoices(correctAnswer, numChoices);
    }

    // Check if an answer is correct
    checkAnswer(answer, startTime) {
        if (!this.currentQuestion) return false;

        const isCorrect = answer === this.currentQuestion.correctAnswer;
        const responseTime = Date.now() - startTime;

        // Update question data
        this.currentQuestion.answeredAt = Date.now();
        this.currentQuestion.isCorrect = isCorrect;
        this.currentQuestion.responseTime = responseTime;

        // Add to history
        this.questionHistory.push({ ...this.currentQuestion });

        // Record for adaptive difficulty
        if (this.adaptiveManager) {
            this.adaptiveManager.recordAttempt(
                this.currentQuestion.factKey,
                this.operation,
                isCorrect,
                responseTime
            );
        }

        return {
            isCorrect,
            responseTime,
            correctAnswer: this.currentQuestion.correctAnswer,
            earnedSpeedBonus: responseTime < (this.config.timeBonus || 3000),
            question: this.currentQuestion
        };
    }

    // Get current question
    getCurrentQuestion() {
        return this.currentQuestion;
    }

    // Get statistics for the session
    getSessionStats() {
        if (this.questionHistory.length === 0) {
            return {
                questionsAnswered: 0,
                correctAnswers: 0,
                accuracy: 0,
                averageTime: 0,
                speedBonuses: 0
            };
        }

        const correctAnswers = this.questionHistory.filter(q => q.isCorrect).length;
        const totalTime = this.questionHistory.reduce((sum, q) => sum + (q.responseTime || 0), 0);
        const speedBonuses = this.questionHistory.filter(
            q => q.isCorrect && q.responseTime < (this.config.timeBonus || 3000)
        ).length;

        return {
            questionsAnswered: this.questionHistory.length,
            correctAnswers,
            accuracy: percentage(correctAnswers, this.questionHistory.length),
            averageTime: Math.round(totalTime / this.questionHistory.length),
            speedBonuses
        };
    }

    // Get wrong answers from this session
    getWrongAnswers() {
        return this.questionHistory.filter(q => !q.isCorrect);
    }

    // Reset for new session
    reset() {
        this.currentQuestion = null;
        this.questionHistory = [];
        this.usedQuestions.clear();
        this.recentFacts = [];
        this.generator.resetUsed();
    }

    // Get a hint for the current question
    getHint() {
        if (!this.currentQuestion) return null;
        return this.generator.getHint(this.currentQuestion);
    }

    // Check if session is complete
    isSessionComplete() {
        return this.questionHistory.length >= (this.config.questionsPerGame || 12);
    }

    // Get questions remaining
    getQuestionsRemaining() {
        return Math.max(0, (this.config.questionsPerGame || 12) - this.questionHistory.length);
    }
}
