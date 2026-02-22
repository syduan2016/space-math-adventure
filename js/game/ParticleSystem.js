// Particle System - Creates explosions and visual effects

class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
    }

    // Create explosion at position
    createExplosion(x, y, color = COLORS.accent, count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = randomFloat(2, 6);

            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: randomFloat(2, 6),
                color,
                life: 1.0,
                decay: randomFloat(0.015, 0.025)
            });
        }
    }

    // Create success particles (correct answer)
    createSuccessEffect(x, y) {
        this.createExplosion(x, y, COLORS.success, 30);

        // Add extra sparkles
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x + randomFloat(-20, 20),
                y: y + randomFloat(-20, 20),
                vx: 0,
                vy: randomFloat(-3, -1),
                size: randomFloat(3, 8),
                color: COLORS.accent,
                life: 1.0,
                decay: 0.02,
                sparkle: true
            });
        }
    }

    // Create error particles (wrong answer)
    createErrorEffect(x, y) {
        this.createExplosion(x, y, COLORS.error, 15);
    }

    // Create star collection effect
    createStarEffect(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = randomFloat(0, Math.PI * 2);
            const speed = randomFloat(1, 4);

            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2, // Upward bias
                size: randomFloat(4, 8),
                color: COLORS.accent,
                life: 1.0,
                decay: 0.015,
                star: true
            });
        }
    }

    // Create trail effect
    createTrail(x, y, color = COLORS.primary) {
        this.particles.push({
            x,
            y,
            vx: randomFloat(-0.5, 0.5),
            vy: randomFloat(0.5, 2),
            size: randomFloat(2, 4),
            color,
            life: 1.0,
            decay: 0.05
        });
    }

    // Update all particles
    update(deltaTime) {
        this.particles = this.particles.filter(particle => {
            // Update position
            particle.x += particle.vx * (deltaTime / 16);
            particle.y += particle.vy * (deltaTime / 16);

            // Apply gravity to some particles
            if (!particle.star) {
                particle.vy += 0.15;
            }

            // Fade out
            particle.life -= particle.decay;

            // Remove dead particles
            return particle.life > 0;
        });
    }

    // Render all particles
    render() {
        const ctx = this.ctx;

        this.particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.life;

            if (particle.sparkle || particle.star) {
                // Draw as a star shape
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
                    const x = particle.x + Math.cos(angle) * particle.size;
                    const y = particle.y + Math.sin(angle) * particle.size;
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
                ctx.fill();
            } else {
                // Draw as circle
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        });
    }

    // Get particle count
    getCount() {
        return this.particles.length;
    }

    // Clear all particles
    clear() {
        this.particles = [];
    }
}
