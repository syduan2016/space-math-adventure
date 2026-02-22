// Player - Spaceship controlled by the player

class Player {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Position and size
        this.width = GAME_CONFIG.PLAYER_WIDTH;
        this.height = GAME_CONFIG.PLAYER_HEIGHT;
        this.x = GAME_CONFIG.PLAYER_START_X - this.width / 2;
        this.y = GAME_CONFIG.PLAYER_START_Y;

        // Movement
        this.speed = GAME_CONFIG.PLAYER_SPEED;
        this.targetX = this.x;
        this.targetY = this.y;

        // State
        this.lives = 3;
        this.isAlive = true;
        this.invincible = false;
        this.invincibleTime = 0;

        // Visual
        this.color = COLORS.primary;
        this.trailParticles = [];
    }

    // Update player position
    update(deltaTime, mouseX, mouseY) {
        if (!this.isAlive) return;

        // Update invincibility
        if (this.invincible) {
            this.invincibleTime -= deltaTime;
            if (this.invincibleTime <= 0) {
                this.invincible = false;
            }
        }

        // Follow mouse/touch position
        if (mouseX !== undefined && mouseY !== undefined) {
            this.targetX = mouseX - this.width / 2;
            this.targetY = mouseY - this.height / 2;
        }

        // Smooth movement (lerp)
        this.x = lerp(this.x, this.targetX, 0.2);
        this.y = lerp(this.y, this.targetY, 0.2);

        // Keep player within canvas bounds
        this.x = clamp(this.x, 0, this.canvas.width - this.width);
        this.y = clamp(this.y, this.canvas.height / 2, this.canvas.height - this.height);

        // Update trail particles
        this.updateTrail(deltaTime);
    }

    // Render the player
    render() {
        if (!this.isAlive) return;

        // Render trail particles first
        this.renderTrail();

        // Blink when invincible
        if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
            return; // Skip rendering for blink effect
        }

        const ctx = this.ctx;
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        ctx.save();

        // Draw spaceship as a triangle
        ctx.beginPath();
        ctx.moveTo(centerX, this.y); // Top point
        ctx.lineTo(this.x, this.y + this.height); // Bottom left
        ctx.lineTo(this.x + this.width, this.y + this.height); // Bottom right
        ctx.closePath();

        // Fill
        const gradient = ctx.createLinearGradient(centerX, this.y, centerX, this.y + this.height);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, COLORS.secondary);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Stroke
        ctx.strokeStyle = COLORS.text;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw engine glow
        ctx.beginPath();
        ctx.arc(centerX, this.y + this.height, 8, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.accent;
        ctx.shadowBlur = 20;
        ctx.shadowColor = COLORS.accent;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw cockpit
        ctx.beginPath();
        ctx.arc(centerX, centerY - 5, 6, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.accent;
        ctx.fill();

        ctx.restore();
    }

    // Update trail effect
    updateTrail(deltaTime) {
        // Add new trail particle
        if (this.isAlive && Math.random() < 0.3) {
            this.trailParticles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height,
                life: 1.0,
                size: randomFloat(2, 5)
            });
        }

        // Update existing particles
        this.trailParticles = this.trailParticles.filter(particle => {
            particle.life -= deltaTime / 500; // Fade over 500ms
            particle.y += deltaTime / 5; // Move down slowly
            return particle.life > 0;
        });
    }

    // Render trail effect
    renderTrail() {
        const ctx = this.ctx;

        this.trailParticles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.life * 0.6;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.accent;
            ctx.fill();
            ctx.restore();
        });
    }

    // Take damage
    takeDamage() {
        if (this.invincible) return false;

        this.lives--;

        if (this.lives <= 0) {
            this.isAlive = false;
            return true; // Game over
        }

        // Grant temporary invincibility
        this.invincible = true;
        this.invincibleTime = 2000; // 2 seconds

        return false;
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
        const bounds = this.getBounds();
        const objBounds = object.getBounds();

        return rectCollision(
            bounds.x, bounds.y, bounds.width, bounds.height,
            objBounds.x, objBounds.y, objBounds.width, objBounds.height
        );
    }

    // Reset player state
    reset() {
        this.x = GAME_CONFIG.PLAYER_START_X - this.width / 2;
        this.y = GAME_CONFIG.PLAYER_START_Y;
        this.lives = 3;
        this.isAlive = true;
        this.invincible = false;
        this.invincibleTime = 0;
        this.trailParticles = [];
    }

    // Get player state
    getState() {
        return {
            lives: this.lives,
            isAlive: this.isAlive,
            invincible: this.invincible,
            position: { x: this.x, y: this.y }
        };
    }
}
