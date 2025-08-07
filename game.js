class Game {
    constructor() {
        this.score = 0;
        this.timeLeft = 30;
        this.level = 1;
        this.targetsHit = 0;
        this.totalClicks = 0;
        this.combo = 1;
        this.maxCombo = 1;
        this.isRunning = false;
        this.difficulty = 'medium';
        this.gameTimer = null;
        this.targetManager = null;
        
        // Power-ups
        this.powerUps = {
            slowMotion: { cooldown: 0, maxCooldown: 15000 },
            multiShot: { cooldown: 0, maxCooldown: 20000 }
        };
        
        this.initializeElements();
        this.bindEvents();
        this.updateDisplay();
    }

    initializeElements() {
        // Screens
        this.startScreen = document.getElementById('startScreen');
        this.gameScreen = document.getElementById('gameScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        
        // Game elements
        this.gameArea = document.getElementById('gameArea');
        this.targetsContainer = document.getElementById('targetsContainer');
        
        // UI elements
        this.scoreElement = document.getElementById('score');
        this.timeElement = document.getElementById('time');
        this.levelElement = document.getElementById('level');
        this.accuracyElement = document.getElementById('accuracy');
        this.comboElement = document.getElementById('comboDisplay');
        
        // Buttons
        this.startBtn = document.getElementById('startBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.difficultyBtns = document.querySelectorAll('.difficulty-btn');
        
        // Power-up elements
        this.slowMotionBtn = document.getElementById('slowMotion');
        this.multiShotBtn = document.getElementById('multiShot');
        
        // Final stats elements
        this.finalScoreElement = document.getElementById('finalScore');
        this.targetsHitElement = document.getElementById('targetsHit');
        this.finalAccuracyElement = document.getElementById('finalAccuracy');
        this.maxComboElement = document.getElementById('maxCombo');
        this.performanceRatingElement = document.getElementById('performanceRating');
    }

    bindEvents() {
        // Start button
        this.startBtn.addEventListener('click', () => this.startGame());
        
        // Restart button
        this.restartBtn.addEventListener('click', () => this.restartGame());
        
        // Difficulty selection
        this.difficultyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.difficultyBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.difficulty = btn.dataset.difficulty;
            });
        });
        
        // Power-ups
        this.slowMotionBtn.addEventListener('click', () => this.usePowerUp('slowMotion'));
        this.multiShotBtn.addEventListener('click', () => this.usePowerUp('multiShot'));
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.isRunning) return;
            
            switch(e.key.toLowerCase()) {
                case 's':
                    this.usePowerUp('slowMotion');
                    break;
                case 'd':
                    this.usePowerUp('multiShot');
                    break;
            }
        });
        
        // Game area clicks (for accuracy tracking)
        this.targetsContainer.addEventListener('click', (e) => {
            if (!this.isRunning) return;
            
            // Only count clicks that don't hit targets
            if (e.target === this.targetsContainer) {
                this.totalClicks++;
                this.combo = 1; // Reset combo on miss
                this.updateDisplay();
                this.showFloatingScore(e.offsetX, e.offsetY, 'MISS', '#ff6b6b');
            }
        });
        
        // Target hit events
        this.targetsContainer.addEventListener('targetHit', (e) => {
            this.handleTargetHit(e.detail);
        });
    }

    startGame() {
        this.resetGame();
        this.isRunning = true;
        
        // Hide start screen, show game screen
        this.startScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        
        // Initialize target manager
        this.targetManager = new TargetManager(this.targetsContainer);
        this.targetManager.setDifficulty(this.difficulty);
        this.targetManager.start();
        
        // Start game timer
        this.startTimer();
        
        // Update display
        this.updateDisplay();
    }

    resetGame() {
        this.score = 0;
        this.timeLeft = 30;
        this.level = 1;
        this.targetsHit = 0;
        this.totalClicks = 0;
        this.combo = 1;
        this.maxCombo = 1;
        
        // Reset power-ups
        this.powerUps.slowMotion.cooldown = 0;
        this.powerUps.multiShot.cooldown = 0;
        
        // Clear any existing intervals
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
        }
        
        // Clear targets
        if (this.targetManager) {
            this.targetManager.stop();
        }
    }

    startTimer() {
        this.gameTimer = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            
            // Level progression
            if (this.timeLeft > 0 && this.timeLeft % 10 === 0) {
                this.levelUp();
            }
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    levelUp() {
        this.level++;
        this.targetManager.updateLevel(this.level);
        this.showFloatingScore(
            this.targetsContainer.offsetWidth / 2,
            this.targetsContainer.offsetHeight / 2,
            `LEVEL ${this.level}!`,
            '#ffd700'
        );
    }

    handleTargetHit(detail) {
        this.totalClicks++;
        this.targetsHit++;
        
        // Calculate score with combo multiplier
        const baseScore = detail.points;
        const comboScore = Math.floor(baseScore * this.combo);
        this.score += comboScore;
        
        // Increase combo
        this.combo = Math.min(this.combo + 0.5, 5); // Max combo of 5x
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        
        // Show floating score
        this.showFloatingScore(detail.x, detail.y, `+${comboScore}`, '#ffd700');
        
        // Special effects for bonus targets
        if (detail.type === 'bonus') {
            this.showFloatingScore(detail.x, detail.y + 30, 'BONUS!', '#ffb347');
        }
        
        this.updateDisplay();
    }

    showFloatingScore(x, y, text, color = '#ffd700') {
        const floatingScore = document.createElement('div');
        floatingScore.className = 'floating-score';
        floatingScore.textContent = text;
        floatingScore.style.left = `${x}px`;
        floatingScore.style.top = `${y}px`;
        floatingScore.style.color = color;
        
        this.targetsContainer.appendChild(floatingScore);
        
        setTimeout(() => {
            if (floatingScore.parentNode) {
                floatingScore.parentNode.removeChild(floatingScore);
            }
        }, 1000);
    }

    usePowerUp(type) {
        if (!this.isRunning || this.powerUps[type].cooldown > 0) return;
        
        switch(type) {
            case 'slowMotion':
                this.activateSlowMotion();
                break;
            case 'multiShot':
                this.activateMultiShot();
                break;
        }
        
        this.powerUps[type].cooldown = this.powerUps[type].maxCooldown;
        this.startCooldown(type);
    }

    activateSlowMotion() {
        this.targetManager.activateSlowMotion(3000);
        this.targetsContainer.classList.add('slow-motion');
        
        setTimeout(() => {
            this.targetsContainer.classList.remove('slow-motion');
        }, 3000);
        
        this.showFloatingScore(
            this.targetsContainer.offsetWidth / 2,
            50,
            'SLOW MOTION!',
            '#00d2ff'
        );
    }

    activateMultiShot() {
        this.targetManager.spawnMultipleTargets(3);
        this.showFloatingScore(
            this.targetsContainer.offsetWidth / 2,
            50,
            'MULTI SHOT!',
            '#ff9ff3'
        );
    }

    startCooldown(type) {
        const powerUpElement = type === 'slowMotion' ? this.slowMotionBtn : this.multiShotBtn;
        const cooldownBar = powerUpElement.querySelector('.cooldown-bar');
        
        powerUpElement.classList.add('cooldown');
        cooldownBar.style.width = '100%';
        
        const cooldownInterval = setInterval(() => {
            this.powerUps[type].cooldown -= 100;
            const percentage = (this.powerUps[type].cooldown / this.powerUps[type].maxCooldown) * 100;
            cooldownBar.style.width = `${percentage}%`;
            
            if (this.powerUps[type].cooldown <= 0) {
                clearInterval(cooldownInterval);
                powerUpElement.classList.remove('cooldown');
                cooldownBar.style.width = '0%';
            }
        }, 100);
    }

    updateDisplay() {
        this.scoreElement.textContent = this.score;
        this.timeElement.textContent = this.timeLeft;
        this.levelElement.textContent = this.level;
        
        // Calculate accuracy
        const accuracy = this.totalClicks > 0 ? 
            Math.round((this.targetsHit / this.totalClicks) * 100) : 100;
        this.accuracyElement.textContent = accuracy;
        
        // Update combo display
        this.comboElement.textContent = `Combo: x${this.combo.toFixed(1)}`;
    }

    endGame() {
        this.isRunning = false;
        
        // Stop game timer
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
        }
        
        // Stop target manager
        if (this.targetManager) {
            this.targetManager.stop();
        }
        
        // Show game over screen
        this.gameScreen.classList.add('hidden');
        this.gameOverScreen.classList.remove('hidden');
        
        // Update final stats
        this.updateFinalStats();
    }

    updateFinalStats() {
        const accuracy = this.totalClicks > 0 ? 
            Math.round((this.targetsHit / this.totalClicks) * 100) : 100;
        
        this.finalScoreElement.textContent = this.score;
        this.targetsHitElement.textContent = this.targetsHit;
        this.finalAccuracyElement.textContent = accuracy;
        this.maxComboElement.textContent = this.maxCombo.toFixed(1);
        
        // Performance rating
        this.updatePerformanceRating(accuracy);
    }

    updatePerformanceRating(accuracy) {
        const ratingText = this.performanceRatingElement.querySelector('.rating-text');
        
        let rating, className;
        
        if (this.score >= 1000 && accuracy >= 90) {
            rating = 'EXCELLENT!';
            className = 'rating-excellent';
        } else if (this.score >= 600 && accuracy >= 80) {
            rating = 'GREAT!';
            className = 'rating-great';
        } else if (this.score >= 300 && accuracy >= 70) {
            rating = 'GOOD!';
            className = 'rating-good';
        } else {
            rating = 'KEEP TRYING!';
            className = 'rating-okay';
        }
        
        ratingText.textContent = rating;
        ratingText.className = `rating-text ${className}`;
    }

    restartGame() {
        // Hide game over screen, show start screen
        this.gameOverScreen.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
        
        // Reset game state
        this.resetGame();
        this.updateDisplay();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});