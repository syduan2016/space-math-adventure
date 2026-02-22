// Sound Manager - Handles audio playback using Web Audio API

class SoundManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.settings = storageManager.getSettings();
        this.initialized = false;
    }

    // Initialize audio context (must be called after user interaction)
    async init() {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            console.log('SoundManager initialized');
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }
    }

    // Play a beep tone
    playBeep(frequency = 440, duration = 0.1, type = 'sine') {
        if (!this.initialized || !this.settings.sfxEnabled) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = type;

            gainNode.gain.setValueAtTime(this.settings.sfxVolume * 0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (error) {
            console.warn('Error playing beep:', error);
        }
    }

    // Play success sound (correct answer)
    playCorrect() {
        if (!this.initialized) return;

        // Happy ascending notes
        this.playBeep(523.25, 0.1, 'sine'); // C5
        setTimeout(() => this.playBeep(659.25, 0.1, 'sine'), 50); // E5
        setTimeout(() => this.playBeep(783.99, 0.15, 'sine'), 100); // G5
    }

    // Play error sound (wrong answer)
    playWrong() {
        if (!this.initialized) return;

        // Descending notes
        this.playBeep(400, 0.15, 'square');
        setTimeout(() => this.playBeep(300, 0.2, 'square'), 100);
    }

    // Play laser sound
    playLaser() {
        if (!this.initialized || !this.settings.sfxEnabled) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Laser sweep down
            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.1);
            oscillator.type = 'sawtooth';

            gainNode.gain.setValueAtTime(this.settings.sfxVolume * 0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.1);
        } catch (error) {
            console.warn('Error playing laser:', error);
        }
    }

    // Play explosion sound
    playExplosion() {
        if (!this.initialized || !this.settings.sfxEnabled) return;

        try {
            const bufferSize = this.audioContext.sampleRate * 0.3;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);

            // Generate white noise that fades out
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
            }

            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();

            source.buffer = buffer;
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            gainNode.gain.setValueAtTime(this.settings.sfxVolume * 0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

            source.start(this.audioContext.currentTime);
        } catch (error) {
            console.warn('Error playing explosion:', error);
        }
    }

    // Play click sound
    playClick() {
        this.playBeep(600, 0.05, 'sine');
    }

    // Play achievement unlock sound
    playAchievement() {
        if (!this.initialized) return;

        // Triumphant fanfare
        const notes = [
            { freq: 523.25, time: 0 },    // C5
            { freq: 659.25, time: 0.1 },  // E5
            { freq: 783.99, time: 0.2 },  // G5
            { freq: 1046.50, time: 0.3 }  // C6
        ];

        notes.forEach(note => {
            setTimeout(() => this.playBeep(note.freq, 0.2, 'sine'), note.time * 1000);
        });
    }

    // Play star collect sound
    playStar() {
        this.playBeep(1000, 0.1, 'sine');
    }

    // Play combo sound (higher pitch for higher combos)
    playCombo(comboCount) {
        if (!this.initialized) return;

        const baseFreq = 400;
        const frequency = baseFreq + (comboCount * 50);
        this.playBeep(Math.min(frequency, 1500), 0.08, 'triangle');
    }

    // Update settings
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }

    // Resume audio context (for browsers that suspend it)
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}

// Create global instance
const soundManager = new SoundManager();

// Initialize on first user interaction
document.addEventListener('click', () => {
    if (!soundManager.initialized) {
        soundManager.init();
    }
}, { once: true });
