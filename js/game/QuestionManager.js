// Question Manager - Generates multiplication questions and validates answers

class QuestionManager {
    constructor(table, config) {
        this.table = table; // Which multiplication table (1-9)
        this.config = config || getDifficultyTier(table);
        this.currentQuestion = null;
        this.questionHistory = [];
        this.usedQuestions = new Set();
    }

    // Generate a new multiplication question
    generateQuestion() {
        const multiplier = randomInt(1, 9);
        const correctAnswer = this.table * multiplier;

        // Avoid repeating questions in the same session
        const questionKey = `${this.table}x${multiplier}`;

        // If we've used all questions, reset
        if (this.usedQuestions.size >= 9) {
            this.usedQuestions.clear();
        }

        // Try to find an unused question
        let attempts = 0;
        let finalMultiplier = multiplier;
        while (this.usedQuestions.has(`${this.table}x${finalMultiplier}`) && attempts < 10) {
            finalMultiplier = randomInt(1, 9);
            attempts++;
        }

        const finalCorrectAnswer = this.table * finalMultiplier;
        this.usedQuestions.add(`${this.table}x${finalMultiplier}`);

        // Generate answer choices
        const answers = this.generateAnswerChoices(finalCorrectAnswer);

        this.currentQuestion = {
            table: this.table,
            multiplier: finalMultiplier,
            questionText: `${this.table} × ${finalMultiplier}`,
            correctAnswer: finalCorrectAnswer,
            answers: answers,
            answeredAt: null,
            isCorrect: null,
            responseTime: null
        };

        return this.currentQuestion;
    }

    // Generate answer choices (1 correct + distractors)
    generateAnswerChoices(correctAnswer) {
        const numChoices = this.config.answerChoices;
        const choices = [correctAnswer];

        // Generate smart distractors
        const distractors = this.generateSmartDistractors(correctAnswer, numChoices - 1);
        choices.push(...distractors);

        // Shuffle the choices
        return shuffleArray(choices);
    }

    // Generate plausible wrong answers
    generateSmartDistractors(correctAnswer, count) {
        const distractors = new Set();

        // Strategy 1: Off-by-one multiplication table
        // e.g., for 6×7=42, include 5×7=35 or 7×7=49
        if (this.table > 1) {
            distractors.add((this.table - 1) * (correctAnswer / this.table));
        }
        if (this.table < 9) {
            distractors.add((this.table + 1) * (correctAnswer / this.table));
        }

        // Strategy 2: Common arithmetic errors
        distractors.add(correctAnswer + this.table); // Add instead of multiply
        distractors.add(correctAnswer - this.table);
        distractors.add(correctAnswer + 1);
        distractors.add(correctAnswer - 1);

        // Strategy 3: Nearby multiples
        if (correctAnswer >= 10) {
            distractors.add(correctAnswer + 10);
            distractors.add(correctAnswer - 10);
        }

        // Strategy 4: Similar-looking numbers
        distractors.add(correctAnswer + this.table * 2);
        distractors.add(correctAnswer - this.table * 2);

        // Remove the correct answer if it somehow got added
        distractors.delete(correctAnswer);

        // Remove negative numbers and zero
        const validDistractors = Array.from(distractors).filter(d => d > 0 && d !== correctAnswer);

        // If we don't have enough, add more random ones
        while (validDistractors.length < count) {
            const randomDistractor = correctAnswer + randomInt(-15, 15);
            if (randomDistractor > 0 && randomDistractor !== correctAnswer && !validDistractors.includes(randomDistractor)) {
                validDistractors.push(randomDistractor);
            }
        }

        // Shuffle and return the required count
        return shuffleArray(validDistractors).slice(0, count);
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

        return {
            isCorrect,
            responseTime,
            correctAnswer: this.currentQuestion.correctAnswer,
            earnedSpeedBonus: responseTime < this.config.timeBonus
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
            q => q.isCorrect && q.responseTime < this.config.timeBonus
        ).length;

        return {
            questionsAnswered: this.questionHistory.length,
            correctAnswers,
            accuracy: percentage(correctAnswers, this.questionHistory.length),
            averageTime: Math.round(totalTime / this.questionHistory.length),
            speedBonuses
        };
    }

    // Reset for new session
    reset() {
        this.currentQuestion = null;
        this.questionHistory = [];
        this.usedQuestions.clear();
    }

    // Get a hint for the current question (for practice mode)
    getHint() {
        if (!this.currentQuestion) return null;

        const { table, multiplier, correctAnswer } = this.currentQuestion;

        // Provide a counting hint
        const hints = [
            `Think: ${table} groups of ${multiplier}`,
            `Count by ${table}s: ${Array.from({ length: multiplier }, (_, i) => table * (i + 1)).join(', ')}`,
            `${table} × ${multiplier} = ${correctAnswer}` // Direct answer as last resort
        ];

        return hints;
    }

    // Check if session is complete
    isSessionComplete() {
        return this.questionHistory.length >= this.config.questionsPerGame;
    }

    // Get questions remaining
    getQuestionsRemaining() {
        return Math.max(0, this.config.questionsPerGame - this.questionHistory.length);
    }
}
