class Target {
    constructor(container, type = 'basic', x, y) {
        this.container = container;
        this.type = type;
        this.element = null;
        this.isActive = true;
        this.speed = this.getSpeedByType();
        this.size = this.getSizeByType();
        this.points = this.getPointsByType();
        this.direction = this.getRandomDirection();
        this.createTarget(x, y);
        this.startMovement();
    }

    getSpeedByType() {
        const speeds = {
            basic: 1,
            bonus: 0.8,
            speed: 2.5,
            mini: 1.8
        };
        return speeds[this.type] || 1;
    }

    getSizeByType() {
        const sizes = {
            basic: 60,
            bonus: 80,
            speed: 50,
            mini: 35
        };
        return sizes[this.type] || 60;
    }

    getPointsByType() {
        const points = {
            basic: 10,
            bonus: 50,
            speed: 20,
            mini: 30
        };
        return points[this.type] || 10;
    }

    getRandomDirection() {
        const angle = Math.random() * Math.PI * 2;
        return {
            x: Math.cos(angle),
            y: Math.sin(angle)
        };
    }

    createTarget(x, y) {
        this.element = document.createElement('div');
        this.element.className = `target ${this.type}`;
        this.element.style.width = `${this.size}px`;
        this.element.style.height = `${this.size}px`;
        
        // Position target
        const containerRect = this.container.getBoundingClientRect();
        this.x = x !== undefined ? x : Math.random() * (containerRect.width - this.size);
        this.y = y !== undefined ? y : Math.random() * (containerRect.height - this.size);
        
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
        
        // Add target content based on type
        this.element.innerHTML = this.getTargetContent();
        
        // Add click event
        this.element.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hit();
        });
        
        this.container.appendChild(this.element);
    }

    getTargetContent() {
        const content = {
            basic: this.points.toString(),
            bonus: '💰',
            speed: '⚡',
            mini: '•'
        };
        return content[this.type] || this.points.toString();
    }

    startMovement() {
        this.moveInterval = setInterval(() => {
            if (!this.isActive) return;
            this.move();
        }, 16); // ~60 FPS
    }

    move() {
        if (!this.isActive) return;

        const containerRect = this.container.getBoundingClientRect();
        const maxX = containerRect.width - this.size;
        const maxY = containerRect.height - this.size;

        // Update position
        this.x += this.direction.x * this.speed;
        this.y += this.direction.y * this.speed;

        // Bounce off walls
        if (this.x <= 0 || this.x >= maxX) {
            this.direction.x *= -1;
            this.x = Math.max(0, Math.min(maxX, this.x));
        }
        if (this.y <= 0 || this.y >= maxY) {
            this.direction.y *= -1;
            this.y = Math.max(0, Math.min(maxY, this.y));
        }

        // Apply position
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }

    hit() {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.element.classList.add('hit');
        
        // Trigger hit event
        const event = new CustomEvent('targetHit', {
            detail: {
                target: this,
                points: this.points,
                type: this.type,
                x: this.x + this.size / 2,
                y: this.y + this.size / 2
            }
        });
        this.container.dispatchEvent(event);
        
        // Remove after animation
        setTimeout(() => {
            this.destroy();
        }, 300);
    }

    destroy() {
        if (this.moveInterval) {
            clearInterval(this.moveInterval);
        }
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.isActive = false;
    }

    applySlowMotion(factor = 0.3) {
        this.speed *= factor;
    }

    removeSlowMotion(originalFactor = 0.3) {
        this.speed /= originalFactor;
    }
}

class TargetManager {
    constructor(container) {
        this.container = container;
        this.targets = [];
        this.spawnInterval = null;
        this.difficulty = 'medium';
        this.maxTargets = 3;
        this.spawnRate = 2000; // milliseconds
        this.isSlowMotionActive = false;
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        
        const settings = {
            easy: { maxTargets: 2, spawnRate: 3000 },
            medium: { maxTargets: 3, spawnRate: 2000 },
            hard: { maxTargets: 5, spawnRate: 1200 }
        };
        
        const setting = settings[difficulty] || settings.medium;
        this.maxTargets = setting.maxTargets;
        this.spawnRate = setting.spawnRate;
    }

    start() {
        this.spawnTarget(); // Spawn initial target
        this.spawnInterval = setInterval(() => {
            this.spawnTarget();
        }, this.spawnRate);
    }

    stop() {
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
            this.spawnInterval = null;
        }
        this.clearAllTargets();
    }

    spawnTarget() {
        if (this.targets.length >= this.maxTargets) return;

        const targetType = this.getRandomTargetType();
        const target = new Target(this.container, targetType);
        
        // Apply slow motion if active
        if (this.isSlowMotionActive) {
            target.applySlowMotion();
        }
        
        this.targets.push(target);

        // Listen for target hit
        this.container.addEventListener('targetHit', (e) => {
            this.removeTarget(e.detail.target);
        }, { once: true });
    }

    getRandomTargetType() {
        const random = Math.random();
        
        // Probability distribution based on difficulty
        const probabilities = {
            easy: [
                { type: 'basic', chance: 0.7 },
                { type: 'bonus', chance: 0.9 },
                { type: 'speed', chance: 0.95 },
                { type: 'mini', chance: 1.0 }
            ],
            medium: [
                { type: 'basic', chance: 0.6 },
                { type: 'bonus', chance: 0.8 },
                { type: 'speed', chance: 0.9 },
                { type: 'mini', chance: 1.0 }
            ],
            hard: [
                { type: 'basic', chance: 0.5 },
                { type: 'bonus', chance: 0.7 },
                { type: 'speed', chance: 0.85 },
                { type: 'mini', chance: 1.0 }
            ]
        };

        const difficultyProbs = probabilities[this.difficulty] || probabilities.medium;
        
        for (let prob of difficultyProbs) {
            if (random < prob.chance) {
                return prob.type;
            }
        }
        
        return 'basic';
    }

    removeTarget(target) {
        const index = this.targets.indexOf(target);
        if (index > -1) {
            this.targets.splice(index, 1);
        }
    }

    clearAllTargets() {
        this.targets.forEach(target => target.destroy());
        this.targets = [];
    }

    activateSlowMotion(duration = 3000) {
        if (this.isSlowMotionActive) return;
        
        this.isSlowMotionActive = true;
        this.targets.forEach(target => target.applySlowMotion());
        
        setTimeout(() => {
            this.deactivateSlowMotion();
        }, duration);
    }

    deactivateSlowMotion() {
        if (!this.isSlowMotionActive) return;
        
        this.isSlowMotionActive = false;
        this.targets.forEach(target => target.removeSlowMotion());
    }

    spawnMultipleTargets(count = 3) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                if (this.targets.length < this.maxTargets + 2) { // Allow temporary overflow
                    this.spawnTarget();
                }
            }, i * 200);
        }
    }

    updateLevel(level) {
        // Increase difficulty with level
        const newSpawnRate = Math.max(800, this.spawnRate - (level * 100));
        const newMaxTargets = Math.min(6, this.maxTargets + Math.floor(level / 3));
        
        this.spawnRate = newSpawnRate;
        this.maxTargets = newMaxTargets;
        
        // Restart spawning with new settings
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
            this.spawnInterval = setInterval(() => {
                this.spawnTarget();
            }, this.spawnRate);
        }
    }
}