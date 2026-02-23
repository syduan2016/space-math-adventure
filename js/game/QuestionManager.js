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
    }

    // Generate a new question
    generateQuestion() {
        const question = this.generator.generate();

        // Apply adaptive weighting if available
        if (this.adaptiveManager) {
            const weights = this.adaptiveManager.getQuestionWeights(this.operation, this.table || this.levelConfig.level);
            // Potentially regenerate if this fact is already strong and there are weak ones
            if (weights && weights[question.factKey] !== undefined && Math.random() < 0.5) {
                const weakFacts = this.adaptiveManager.getWeakestFacts(this.operation, 3);
                if (weakFacts.length > 0 && !weakFacts.some(f => f.factKey === question.factKey)) {
                    // Try to get a question for a weak fact - but don't infinite loop
                    const retry = this.generator.generate();
                    if (weakFacts.some(f => f.factKey === retry.factKey)) {
                        return this._setCurrentQuestion(retry);
                    }
                }
            }
        }

        return this._setCurrentQuestion(question);
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
