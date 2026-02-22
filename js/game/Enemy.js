// Enemy - Asteroids/aliens carrying multiplication questions

class Enemy {
    constructor(x, y, question, speed, canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Position and size
        this.width = GAME_CONFIG.ENEMY_WIDTH;
        this.height = GAME_CONFIG.ENEMY_HEIGHT;
        this.x = x - this.width / 2;
        this.y = y;

        // Movement
        this.speed = speed || 1;
        this.rotationSpeed = randomFloat(-0.02, 0.02);
        this.rotation = 0;

        // Question data
        this.question = question;

        // State
        this.isActive = true;
        this.isDestroyed = false;

        // Visual
        this.type = getRandomEnemyType();
        this.color = this.type.color;
    }

    // Update enemy position
    update(deltaTime) {
        if (!this.isActive || this.isDestroyed) return;

        // Move downward
        this.y += this.speed * (deltaTime / 16); // Normalize for 60fps

        // Rotate for visual effect
        this.rotation += this.rotationSpeed;

        // Deactivate if off-screen (bottom)
        if (this.y > this.canvas.height) {
            this.isActive = false;
        }
    }

    // Render the enemy
    render() {
        if (!this.isActive) return;

        const ctx = this.ctx;
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);

        // Draw based on type
        if (this.type.shape === 'circle') {
            this.drawAsteroid(ctx);
        } else if (this.type.shape === 'triangle') {
            this.drawAlien(ctx);
        } else {
            this.drawUFO(ctx);
        }

        ctx.restore();

        // Draw question text
        this.drawQuestionText(ctx, centerX, centerY);
    }

    // Draw asteroid shape
    drawAsteroid(ctx) {
        const radius = this.width / 2;

        // Draw irregular circle (asteroid)
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const r = radius + Math.sin(angle * 3) * 5;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();

        // Fill with gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'rgba(107, 114, 128, 0.6)');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Stroke
        ctx.strokeStyle = COLORS.border;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Draw alien ship shape
    drawAlien(ctx) {
        const size = this.width / 2;

        ctx.beginPath();
        ctx.moveTo(0, -size); // Top
        ctx.lineTo(-size, size); // Bottom left
        ctx.lineTo(size, size); // Bottom right
        ctx.closePath();

        const gradient = ctx.createLinearGradient(0, -size, 0, size);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0.6)');
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = COLORS.border;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Add details
        ctx.beginPath();
        ctx.arc(0, 0, size / 3, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.accent;
        ctx.fill();
    }

    // Draw UFO shape
    drawUFO(ctx) {
        const width = this.width / 2;
        const height = this.height / 3;

        ctx.beginPath();
        ctx.ellipse(0, 0, width, height, 0, 0, Math.PI * 2);

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, width);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.6)');
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = COLORS.border;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw dome
        ctx.beginPath();
        ctx.arc(0, -height / 2, width / 2, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.accent;
        ctx.globalAlpha = 0.5;
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // Draw question text on enemy
    drawQuestionText(ctx, x, y) {
        ctx.save();

        ctx.font = 'bold 18px ' + getComputedStyle(document.documentElement).getPropertyValue('--font-family');
        ctx.fillStyle = COLORS.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.fillText(this.question.questionText, x, y);

        ctx.restore();
    }

    // Get bounding box for collision detection
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            centerX: this.x + this.width / 2,
            centerY: this.y + this.height / 2
        };
    }

    // Check collision with another object
    collidesWith(object) {
        if (!this.isActive || this.isDestroyed) return false;

        const bounds = this.getBounds();
        const objBounds = object.getBounds();

        return rectCollision(
            bounds.x, bounds.y, bounds.width, bounds.height,
            objBounds.x, objBounds.y, objBounds.width, objBounds.height
        );
    }

    // Destroy the enemy
    destroy() {
        this.isDestroyed = true;
        this.isActive = false;
    }

    // Check if enemy reached the bottom (escaped)
    hasEscaped() {
        return this.y > this.canvas.height && this.isActive;
    }

    // Get position for particle effects
    getPosition() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }
}
