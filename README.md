# Space Math Adventure

A fun, interactive space shooter game designed to help kids learn multiplication tables (1-9) through engaging gameplay!

## Overview

Space Math Adventure combines the excitement of a space shooter with educational multiplication practice. Players control a spaceship, answer multiplication questions to destroy asteroids, and earn achievements as they master their times tables.

Perfect for children ages 7-10 learning multiplication!

## Features

### Core Gameplay
- **Interactive space shooter** - Move your spaceship with mouse/touch controls
- **Smart question generation** - Educational wrong answers that teach common mistakes
- **Adaptive difficulty** - 3 difficulty tiers with unlockable tables
- **Auto-shooting lasers** - Focus on math, not reflexes
- **Visual feedback** - Particle explosions, animations, and screen effects

### Progress Tracking
- **Mastery system** - Tables progress from Learning 🥉 → Good 🥈 → Mastered 🥇
- **Persistent saves** - All progress automatically saved to localStorage
- **Session history** - Track the last 50 games played
- **Best scores** - Personal records for each multiplication table

### Rewards & Achievements
- **11 unique achievements** across 4 categories:
  - Learning Milestones (Blast Off!, Table Champion, Grand Master)
  - Speed & Skill (Speed Demon, Combo King, Sharpshooter)
  - Persistence (Dedicated Student, Centurion, Knowledge Seeker)
  - Accuracy (Ace Student)
- **Star collection** - Earn 1-3 stars per game based on performance
- **Achievement rewards** - Unlock achievements to earn bonus stars

### Educational Design
- **Tables 1-9** - Complete multiplication tables coverage
- **Smart unlock system** - Complete easier tables to unlock harder ones
- **Weak area tracking** - Game identifies which tables need practice
- **Progress visualization** - Parents can see learning trends

## How to Play

### Getting Started
1. Open `index.html` in any modern web browser
2. Click "Start Mission" from the main menu
3. Choose a multiplication table (1x, 2x, 3x, etc.)
4. Get ready to answer multiplication questions!

### Controls
- **Mouse/Touch** - Move spaceship by moving your cursor or finger
- **Answer Buttons** - Click the correct answer to destroy the asteroid
- **Auto-Shoot** - Lasers fire automatically (just for visual effect)

### Gameplay Tips
- Answer quickly (under 3 seconds) for speed bonuses
- Build combos by getting multiple answers correct in a row
- Watch your lives (hearts) - wrong answers cost lives!
- Complete all questions to finish the game

### Scoring
- **Base points**: 100 per correct answer
- **Speed bonus**: +50 if answered in < 3 seconds
- **Combo multipliers**: ×1.5 (3 streak), ×2.0 (5 streak), ×3.0 (10 streak)
- **Perfect round bonus**: +1000 for 100% accuracy

### Star Ratings
- ⭐ (1 star): 60%+ accuracy
- ⭐⭐ (2 stars): 80%+ accuracy
- ⭐⭐⭐ (3 stars): 100% accuracy (Perfect!)

## Technical Details

### Technologies Used
- **HTML5 Canvas** - For game rendering and animations
- **Vanilla JavaScript (ES6+)** - No frameworks, pure performance
- **CSS3** - Modern styling and animations
- **Web Audio API** - Procedural sound generation
- **localStorage API** - Progress persistence

### Browser Support
Works on all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

### File Structure
```
/ccproject/
├── index.html              # Main entry point
├── css/
│   ├── main.css           # Base styles
│   ├── ui.css             # UI components
│   ├── game.css           # Game screen styles
│   └── animations.css     # Keyframe animations
├── js/
│   ├── app.js             # Main app controller
│   ├── game/
│   │   ├── GameEngine.js  # Core game loop
│   │   ├── Player.js      # Spaceship
│   │   ├── Enemy.js       # Asteroids
│   │   ├── Projectile.js  # Lasers
│   │   ├── ParticleSystem.js  # Visual effects
│   │   └── QuestionManager.js # Question generation
│   ├── managers/
│   │   ├── StorageManager.js  # Data persistence
│   │   ├── ProgressManager.js # Progress tracking
│   │   ├── RewardManager.js   # Achievements
│   │   └── SoundManager.js    # Audio
│   ├── ui/
│   │   ├── [UI Controllers]
│   └── utils/
│       ├── constants.js   # Game configuration
│       └── helpers.js     # Utility functions
└── README.md
```

## For Parents

### Tracking Progress
1. Click "View Progress" from the main menu
2. See overall stats (games played, accuracy, stars earned)
3. View mastery levels for each multiplication table
4. Check unlocked achievements

### Understanding Mastery Levels
- **Learning (🥉)**: Just starting, keep practicing!
- **Good (🥈)**: 70%+ accuracy over 3 games
- **Mastered (🥇)**: 90%+ accuracy over 5 games

### Data Privacy
- All progress is saved locally on your device
- No data is sent to any server
- No accounts or personal information required
- Data can be exported/imported via Settings

### Resetting Progress
If you want to start fresh:
1. Go to Settings
2. Click "Reset All Progress"
3. Confirm the reset

## Customization

### Difficulty Settings
Located in `js/utils/constants.js`:

```javascript
const DIFFICULTY_TIERS = {
    beginner: {
        tables: [1, 2, 3],
        enemySpeed: 1,
        answerChoices: 3,
        questionsPerGame: 12,
        lives: 5
    },
    // ... more tiers
};
```

### Scoring System
Modify in `js/utils/constants.js`:

```javascript
const SCORING = {
    BASE_POINTS: 100,
    SPEED_BONUS: 50,
    PERFECT_ROUND_BONUS: 1000,
    COMBO_MULTIPLIERS: {
        3: 1.5,
        5: 2.0,
        10: 3.0
    }
};
```

### Sound Settings
Adjust volume in-game via Settings menu or modify defaults in `js/utils/constants.js`:

```javascript
const DEFAULT_SETTINGS = {
    musicEnabled: true,
    sfxEnabled: true,
    musicVolume: 0.5,
    sfxVolume: 0.8
};
```

## Development

### Running Locally
Simply open `index.html` in a web browser. No build process required!

### Testing
1. Play through different multiplication tables
2. Test on mobile devices (tablets recommended)
3. Check progress saving by refreshing the page
4. Try earning different achievements

### Troubleshooting
- **Sounds not playing**: Click anywhere on the page first (browser autoplay restriction)
- **Progress not saving**: Check if localStorage is enabled in browser settings
- **Performance issues**: Try closing other tabs or use a modern browser

## Credits

Created with Claude Code for an 8-year-old learning multiplication tables.

### Asset Sources
- Fonts: Google Fonts (Fredoka)
- Sounds: Procedurally generated using Web Audio API
- Graphics: Programmatically rendered using HTML5 Canvas

## License

This project is created for educational purposes. Feel free to use and modify for personal use.

## Future Enhancements

Potential additions:
- [ ] Division, addition, and subtraction modes
- [ ] Multiplayer race mode
- [ ] Boss battles for extra challenge
- [ ] Story mode with narrative progression
- [ ] Printable progress reports
- [ ] More visual themes and spaceship skins

---

**Have fun learning multiplication! 🚀⭐**
