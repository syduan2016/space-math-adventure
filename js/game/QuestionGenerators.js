// Question Generators - Operation-specific question generation

// Base class for all question generators
class QuestionGenerator {
    constructor(config) {
        this.config = config;
        this.usedQuestions = new Set();
    }

    // Override in subclasses
    generate() {
        throw new Error('generate() must be implemented by subclass');
    }

    // Override in subclasses
    generateDistractors(correctAnswer, count) {
        throw new Error('generateDistractors() must be implemented by subclass');
    }

    // Override in subclasses
    getHint(question) {
        return [`The answer is ${question.correctAnswer}`];
    }

    generateAnswerChoices(correctAnswer, numChoices) {
        const choices = [correctAnswer];
        const distractors = this.generateDistractors(correctAnswer, numChoices - 1);
        choices.push(...distractors);
        return shuffleArray(choices);
    }

    resetUsed() {
        this.usedQuestions.clear();
    }
}

// Multiplication Generator (existing logic extracted)
class MultiplicationGenerator extends QuestionGenerator {
    constructor(config) {
        super(config);
        this.table = config.table || 1;
    }

    generate() {
        if (this.usedQuestions.size >= 9) {
            this.usedQuestions.clear();
        }

        let multiplier = randomInt(1, 9);
        let attempts = 0;
        while (this.usedQuestions.has(multiplier) && attempts < 10) {
            multiplier = randomInt(1, 9);
            attempts++;
        }
        this.usedQuestions.add(multiplier);

        const correctAnswer = this.table * multiplier;
        const answers = this.generateAnswerChoices(correctAnswer, this.config.answerChoices || 4);

        return {
            operation: 'multiplication',
            operand1: this.table,
            operand2: multiplier,
            questionText: `${this.table} \u00d7 ${multiplier}`,
            correctAnswer,
            answers,
            factKey: `${this.table}x${multiplier}`
        };
    }

    generateDistractors(correctAnswer, count) {
        const distractors = new Set();

        // Off-by-one table
        if (this.table > 1) {
            const multiplier = correctAnswer / this.table;
            distractors.add((this.table - 1) * multiplier);
        }
        if (this.table < 9) {
            const multiplier = correctAnswer / this.table;
            distractors.add((this.table + 1) * multiplier);
        }

        // Common arithmetic errors
        distractors.add(correctAnswer + this.table);
        distractors.add(correctAnswer - this.table);
        distractors.add(correctAnswer + 1);
        distractors.add(correctAnswer - 1);

        // Nearby multiples
        if (correctAnswer >= 10) {
            distractors.add(correctAnswer + 10);
            distractors.add(correctAnswer - 10);
        }

        // Similar-looking numbers
        distractors.add(correctAnswer + this.table * 2);
        distractors.add(correctAnswer - this.table * 2);

        return this._filterDistractors(distractors, correctAnswer, count);
    }

    getHint(question) {
        const { operand1, operand2, correctAnswer } = question;
        return [
            `Think: ${operand1} groups of ${operand2}`,
            `Count by ${operand1}s: ${Array.from({ length: operand2 }, (_, i) => operand1 * (i + 1)).join(', ')}`,
            `${operand1} \u00d7 ${operand2} = ${correctAnswer}`
        ];
    }

    _filterDistractors(distractors, correctAnswer, count) {
        distractors.delete(correctAnswer);
        const valid = Array.from(distractors).filter(d => d > 0 && d !== correctAnswer && Number.isInteger(d));

        while (valid.length < count) {
            const r = correctAnswer + randomInt(-15, 15);
            if (r > 0 && r !== correctAnswer && !valid.includes(r)) {
                valid.push(r);
            }
        }

        return shuffleArray(valid).slice(0, count);
    }
}

// Addition Generator
class AdditionGenerator extends QuestionGenerator {
    constructor(config) {
        super(config);
        this.level = config.level || 1;
        this.maxSum = this._getMaxSum();
    }

    _getMaxSum() {
        // Levels 1-3: sums to 20, 4-6: sums to 50, 7-9: sums to 100
        if (this.level <= 3) return 20;
        if (this.level <= 6) return 50;
        return 100;
    }

    generate() {
        const maxSum = this.maxSum;
        let a, b, key;

        let attempts = 0;
        do {
            if (maxSum <= 20) {
                a = randomInt(1, Math.min(this.level * 3 + 2, 10));
                b = randomInt(1, Math.min(maxSum - a, 10));
            } else if (maxSum <= 50) {
                a = randomInt(2, Math.min((this.level - 3) * 10 + 10, 30));
                b = randomInt(2, Math.min(maxSum - a, 25));
            } else {
                a = randomInt(5, 60);
                b = randomInt(5, Math.min(maxSum - a, 50));
            }
            key = `${a}+${b}`;
            attempts++;
        } while (this.usedQuestions.has(key) && attempts < 20);

        this.usedQuestions.add(key);
        const correctAnswer = a + b;
        const answers = this.generateAnswerChoices(correctAnswer, this.config.answerChoices || 4);

        return {
            operation: 'addition',
            operand1: a,
            operand2: b,
            questionText: `${a} + ${b}`,
            correctAnswer,
            answers,
            factKey: key
        };
    }

    generateDistractors(correctAnswer, count) {
        const distractors = new Set();

        // Swap tens/ones digits
        if (correctAnswer >= 10 && correctAnswer < 100) {
            const tens = Math.floor(correctAnswer / 10);
            const ones = correctAnswer % 10;
            if (ones !== tens) distractors.add(ones * 10 + tens);
        }

        // Off by 10
        distractors.add(correctAnswer + 10);
        if (correctAnswer > 10) distractors.add(correctAnswer - 10);

        // Off by 1
        distractors.add(correctAnswer + 1);
        distractors.add(correctAnswer - 1);

        // Off by 2
        distractors.add(correctAnswer + 2);
        distractors.add(correctAnswer - 2);

        return this._filterDistractors(distractors, correctAnswer, count);
    }

    getHint(question) {
        const { operand1, operand2, correctAnswer } = question;
        if (operand1 + operand2 <= 20) {
            return [
                `Start at ${operand1} and count up ${operand2} more`,
                `Break it down: ${operand1} + ${operand2} = ?`,
                `${operand1} + ${operand2} = ${correctAnswer}`
            ];
        }
        const tens1 = Math.floor(operand1 / 10) * 10;
        const ones1 = operand1 % 10;
        return [
            `Try adding the tens first, then the ones`,
            `${tens1} + ${operand2} = ${tens1 + operand2}, then add ${ones1} more`,
            `${operand1} + ${operand2} = ${correctAnswer}`
        ];
    }

    _filterDistractors(distractors, correctAnswer, count) {
        distractors.delete(correctAnswer);
        const valid = Array.from(distractors).filter(d => d > 0 && d !== correctAnswer && Number.isInteger(d));

        while (valid.length < count) {
            const r = correctAnswer + randomInt(-10, 10);
            if (r > 0 && r !== correctAnswer && !valid.includes(r)) {
                valid.push(r);
            }
        }

        return shuffleArray(valid).slice(0, count);
    }
}

// Subtraction Generator
class SubtractionGenerator extends QuestionGenerator {
    constructor(config) {
        super(config);
        this.level = config.level || 1;
        this.maxMinuend = this._getMaxMinuend();
    }

    _getMaxMinuend() {
        if (this.level <= 3) return 20;
        if (this.level <= 6) return 50;
        return 100;
    }

    generate() {
        const maxMinuend = this.maxMinuend;
        let a, b, key;

        let attempts = 0;
        do {
            if (maxMinuend <= 20) {
                a = randomInt(Math.max(2, this.level * 2), maxMinuend);
                b = randomInt(1, a - 1);
            } else if (maxMinuend <= 50) {
                a = randomInt(10, maxMinuend);
                b = randomInt(2, a - 1);
            } else {
                a = randomInt(20, maxMinuend);
                b = randomInt(5, a - 1);
            }
            key = `${a}-${b}`;
            attempts++;
        } while (this.usedQuestions.has(key) && attempts < 20);

        this.usedQuestions.add(key);
        const correctAnswer = a - b;
        const answers = this.generateAnswerChoices(correctAnswer, this.config.answerChoices || 4);

        return {
            operation: 'subtraction',
            operand1: a,
            operand2: b,
            questionText: `${a} \u2212 ${b}`,
            correctAnswer,
            answers,
            factKey: key
        };
    }

    generateDistractors(correctAnswer, count) {
        const distractors = new Set();

        // Show addition result instead (common mistake)
        // If question is a - b = c, show a + b
        distractors.add(correctAnswer + 2 * (this._lastB || 1));

        // Borrowing errors
        distractors.add(correctAnswer + 10);
        if (correctAnswer > 10) distractors.add(correctAnswer - 10);

        // Off by 1
        distractors.add(correctAnswer + 1);
        distractors.add(correctAnswer - 1);

        // Off by 2
        distractors.add(correctAnswer + 2);
        if (correctAnswer > 2) distractors.add(correctAnswer - 2);

        return this._filterDistractors(distractors, correctAnswer, count);
    }

    getHint(question) {
        const { operand1, operand2, correctAnswer } = question;
        if (operand1 <= 20) {
            return [
                `Start at ${operand1} and count back ${operand2}`,
                `Think: what + ${operand2} = ${operand1}?`,
                `${operand1} \u2212 ${operand2} = ${correctAnswer}`
            ];
        }
        return [
            `Try subtracting the tens first, then the ones`,
            `Think: what number plus ${operand2} equals ${operand1}?`,
            `${operand1} \u2212 ${operand2} = ${correctAnswer}`
        ];
    }

    _filterDistractors(distractors, correctAnswer, count) {
        distractors.delete(correctAnswer);
        const valid = Array.from(distractors).filter(d => d >= 0 && d !== correctAnswer && Number.isInteger(d));

        while (valid.length < count) {
            const r = correctAnswer + randomInt(-8, 8);
            if (r >= 0 && r !== correctAnswer && !valid.includes(r)) {
                valid.push(r);
            }
        }

        return shuffleArray(valid).slice(0, count);
    }
}

// Division Generator (exact division only)
class DivisionGenerator extends QuestionGenerator {
    constructor(config) {
        super(config);
        this.divisor = config.table || config.level || 1;
    }

    generate() {
        if (this.usedQuestions.size >= 9) {
            this.usedQuestions.clear();
        }

        let quotient = randomInt(1, 9);
        let attempts = 0;
        while (this.usedQuestions.has(quotient) && attempts < 10) {
            quotient = randomInt(1, 9);
            attempts++;
        }
        this.usedQuestions.add(quotient);

        const dividend = this.divisor * quotient;
        const correctAnswer = quotient;
        const answers = this.generateAnswerChoices(correctAnswer, this.config.answerChoices || 4);

        return {
            operation: 'division',
            operand1: dividend,
            operand2: this.divisor,
            questionText: `${dividend} \u00f7 ${this.divisor}`,
            correctAnswer,
            answers,
            factKey: `${dividend}/${this.divisor}`
        };
    }

    generateDistractors(correctAnswer, count) {
        const distractors = new Set();

        // Adjacent quotients
        distractors.add(correctAnswer + 1);
        if (correctAnswer > 1) distractors.add(correctAnswer - 1);

        // Multiplication confusion (show the product instead)
        distractors.add(correctAnswer * this.divisor);

        // Off by 2
        distractors.add(correctAnswer + 2);
        if (correctAnswer > 2) distractors.add(correctAnswer - 2);

        // Divisor itself
        if (this.divisor !== correctAnswer) distractors.add(this.divisor);

        return this._filterDistractors(distractors, correctAnswer, count);
    }

    getHint(question) {
        const { operand1, operand2, correctAnswer } = question;
        return [
            `Think: ${operand2} times what equals ${operand1}?`,
            `Count by ${operand2}s until you reach ${operand1}: ${Array.from({ length: correctAnswer }, (_, i) => operand2 * (i + 1)).join(', ')}`,
            `${operand1} \u00f7 ${operand2} = ${correctAnswer}`
        ];
    }

    _filterDistractors(distractors, correctAnswer, count) {
        distractors.delete(correctAnswer);
        const valid = Array.from(distractors).filter(d => d > 0 && d !== correctAnswer && Number.isInteger(d));

        while (valid.length < count) {
            const r = randomInt(1, 12);
            if (r !== correctAnswer && !valid.includes(r)) {
                valid.push(r);
            }
        }

        return shuffleArray(valid).slice(0, count);
    }
}

// Mixed Mode Generator
class MixedGenerator extends QuestionGenerator {
    constructor(config) {
        super(config);
        this.level = config.level || 1;
        this.generators = [];
        this._initGenerators(config);
    }

    _initGenerators(config) {
        // Include all operation generators
        this.generators.push(new MultiplicationGenerator({ ...config, table: randomInt(1, 9) }));
        this.generators.push(new AdditionGenerator(config));
        this.generators.push(new SubtractionGenerator(config));
        this.generators.push(new DivisionGenerator({ ...config, table: randomInt(1, 9) }));
    }

    generate() {
        const generator = randomChoice(this.generators);

        // For multiplication/division, randomize the table each time
        if (generator instanceof MultiplicationGenerator) {
            generator.table = randomInt(1, 9);
        } else if (generator instanceof DivisionGenerator) {
            generator.divisor = randomInt(1, 9);
        }

        return generator.generate();
    }

    generateDistractors(correctAnswer, count) {
        // Delegate to whichever generator was last used
        const distractors = new Set();
        distractors.add(correctAnswer + 1);
        distractors.add(correctAnswer - 1);
        distractors.add(correctAnswer + 2);
        if (correctAnswer > 2) distractors.add(correctAnswer - 2);
        if (correctAnswer >= 10) {
            distractors.add(correctAnswer + 10);
            distractors.add(correctAnswer - 10);
        }

        distractors.delete(correctAnswer);
        const valid = Array.from(distractors).filter(d => d > 0 && d !== correctAnswer && Number.isInteger(d));

        while (valid.length < count) {
            const r = correctAnswer + randomInt(-10, 10);
            if (r > 0 && r !== correctAnswer && !valid.includes(r)) {
                valid.push(r);
            }
        }

        return shuffleArray(valid).slice(0, count);
    }

    getHint(question) {
        // Find the right generator for this operation
        for (const gen of this.generators) {
            if (question.operation === 'multiplication' && gen instanceof MultiplicationGenerator) return gen.getHint(question);
            if (question.operation === 'addition' && gen instanceof AdditionGenerator) return gen.getHint(question);
            if (question.operation === 'subtraction' && gen instanceof SubtractionGenerator) return gen.getHint(question);
            if (question.operation === 'division' && gen instanceof DivisionGenerator) return gen.getHint(question);
        }
        return [`The answer is ${question.correctAnswer}`];
    }
}

// Factory function to create the right generator
function createQuestionGenerator(operationType, config) {
    switch (operationType) {
        case 'multiplication':
            return new MultiplicationGenerator(config);
        case 'addition':
            return new AdditionGenerator(config);
        case 'subtraction':
            return new SubtractionGenerator(config);
        case 'division':
            return new DivisionGenerator(config);
        case 'mixed':
            return new MixedGenerator(config);
        default:
            return new MultiplicationGenerator(config);
    }
}
