// Utility Helper Functions

// Random number between min and max (inclusive)
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random float between min and max
function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

// Choose random element from array
function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Clamp value between min and max
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Linear interpolation
function lerp(start, end, t) {
    return start + (end - start) * t;
}

// Map value from one range to another
function mapRange(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

// Distance between two points
function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

// Check collision between two rectangles
function rectCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
    return (
        x1 < x2 + w2 &&
        x1 + w1 > x2 &&
        y1 < y2 + h2 &&
        y1 + h1 > y2
    );
}

// Check collision between two circles
function circleCollision(x1, y1, r1, x2, y2, r2) {
    const dist = distance(x1, y1, x2, y2);
    return dist < r1 + r2;
}

// Format number with commas (1000 -> 1,000)
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Format time in seconds to MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Format date to readable string
function formatDate(dateString) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Calculate percentage
function percentage(value, total) {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
}

// Debounce function (prevents rapid-fire function calls)
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function (limits function execution rate)
function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

// Deep clone object
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Check if object is empty
function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

// Get random color
function randomColor() {
    return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
}

// Convert hex color to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16)
          }
        : null;
}

// Convert RGB to hex color
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

// Ease in-out function for smooth animations
function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Ease out function
function easeOut(t) {
    return t * (2 - t);
}

// Ease in function
function easeIn(t) {
    return t * t;
}

// Check if value is within range
function inRange(value, min, max) {
    return value >= min && value <= max;
}

// Wait for specified milliseconds (async)
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Create element with classes and attributes
function createElement(tag, classes = [], attrs = {}) {
    const element = document.createElement(tag);

    if (classes.length) {
        element.classList.add(...classes);
    }

    Object.entries(attrs).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });

    return element;
}

// Play sound with error handling
function playSound(audioElement) {
    if (!audioElement) return;

    try {
        audioElement.currentTime = 0;
        const playPromise = audioElement.play();

        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn('Audio playback failed:', error);
            });
        }
    } catch (error) {
        console.warn('Error playing sound:', error);
    }
}

// Request fullscreen
function requestFullscreen(element = document.documentElement) {
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
}

// Exit fullscreen
function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}

// Check if device is mobile
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Check if device is touch-enabled
function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Get canvas position adjusted for DPI
function getCanvasPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
    };
}

// Download data as file
function downloadFile(data, filename, type = 'text/plain') {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

// Copy text to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
    }
}

// Vibrate device (if supported)
function vibrate(duration = 100) {
    if ('vibrate' in navigator) {
        navigator.vibrate(duration);
    }
}

// Calculate combo multiplier based on streak
function getComboMultiplier(streak) {
    if (streak >= 10) return SCORING.COMBO_MULTIPLIERS[10];
    if (streak >= 5) return SCORING.COMBO_MULTIPLIERS[5];
    if (streak >= 3) return SCORING.COMBO_MULTIPLIERS[3];
    return 1;
}

// Calculate stars based on accuracy
function calculateStars(accuracy) {
    if (accuracy >= STAR_THRESHOLDS.THREE_STARS) return 3;
    if (accuracy >= STAR_THRESHOLDS.TWO_STARS) return 2;
    if (accuracy >= STAR_THRESHOLDS.ONE_STAR) return 1;
    return 0;
}

// Generate multiplication question distractors (wrong answers)
function generateDistractors(correctAnswer, count = 3) {
    const distractors = new Set();

    // Add common mistake answers
    distractors.add(correctAnswer + 1);
    distractors.add(correctAnswer - 1);
    distractors.add(correctAnswer + 2);
    distractors.add(correctAnswer - 2);

    // Add answers from nearby multiplication tables
    if (correctAnswer >= 10) {
        distractors.add(correctAnswer + 10);
        distractors.add(correctAnswer - 10);
    }

    // Remove the correct answer if it was added
    distractors.delete(correctAnswer);

    // Remove negative numbers
    const validDistractors = Array.from(distractors).filter(d => d > 0);

    // Shuffle and take the required count
    return shuffleArray(validDistractors).slice(0, count);
}
