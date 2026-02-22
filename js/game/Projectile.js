// Projectile - Laser bullets fired by the player

class Projectile {
    constructor(x, y, canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Position and size
        this.width = GAME_CONFIG.PROJECTILE_WIDTH;
        this.height = GAME_CONFIG.PROJECTILE_HEIGHT;
        this.x = x - this.width / 2;
        this.y = y;

        // Movement
        this.speed = GAME_CONFIG.PROJECTILE_SPEED;

        // State
        this.isActive = true;
        this.color = GAME_CONFIG.PROJECTILE_COLOR;
    }

    // Update projectile position
    update(deltaTime) {
        if (!this.isActive) return;

        // Move upward
        this.y -= this.speed * (deltaTime / 16); // Normalize for 60fps

        // Deactivate if off-screen
        if (this.y + this.height < 0) {
            this.isActive = false;
        }
    }

    // Render the projectile
    render() {
        if (!this.isActive) return;

        const ctx = this.ctx;

        ctx.save();

        // Draw laser beam
        const gradient = ctx.createLinearGradient(
            this.x + this.width / 2,
            this.y,
            this.x + this.width / 2,
            this.y + this.height
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'rgba(0, 217, 255, 0.3)');

        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Add glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

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
        if (!this.isActive) return false;

        const bounds = this.getBounds();
        const objBounds = object.getBounds();

        return rectCollision(
            bounds.x, bounds.y, bounds.width, bounds.height,
            objBounds.x, objBounds.y, objBounds.width, objBounds.height
        );
    }

    // Deactivate the projectile
    destroy() {
        this.isActive = false;
    }
}
