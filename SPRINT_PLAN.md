# Space Math Adventure — Sprint Plan

## Overview

**Project:** Educational space shooter math game for 2nd-4th graders (ages 7-10)
**Current state:** Functional MVP with multiplication tables 1-9 only
**Goal:** Expand to all arithmetic operations, add adaptive learning, gamification (ships/power-ups), and AI tutoring via Claude

**Architecture:** Vanilla JS, HTML5 Canvas, no frameworks, no build system. Express.js backend added in Sprint 7 for AI proxy.

**Parallel tracks:** Sprints 5-6 (ships/power-ups) can run in parallel with Sprints 7-8 (backend/AI) — they have zero dependencies on each other.

---

## Sprint 1: Question System Generalization + Addition & Subtraction

**Goal:** Refactor the question engine to support multiple operations and implement addition and subtraction as the first new operations.

**Demo:** Player selects "Addition" or "Subtraction" from the level select screen, plays a full game with those operations, sees results. Multiplication still works exactly as before.

---

### Ticket 1.1: Define operation constants and configuration

**Description:** Add `OPERATIONS` object to constants with entries for `multiplication`, `addition`, `subtraction`, `division`, `mixed`. Each entry: `{ id, label, symbol, unlockLevel, enabled }`. Add `OPERATION_RANGES` defining min/max operands per operation per difficulty tier. Addition beginner: operands 1-20, sums to 30. Subtraction beginner: operands 1-15, no negatives. Keep existing `DIFFICULTY_TIERS` unchanged.

**Files:** Modify `js/utils/constants.js`

**Validation:**
- Console: `OPERATIONS.addition` and `OPERATION_RANGES.addition.beginner` exist with correct structure
- All existing constants unchanged

**Depends on:** None

---

### Ticket 1.2: Refactor QuestionManager to accept an operation parameter

**Description:** Refactor `QuestionManager` constructor to accept `{ table, operation, difficulty }` options object (default `operation: "multiplication"` for backward compatibility). Extract current multiplication logic into `_generateMultiplicationQuestion()`. Add dispatcher in `generateQuestion()` that routes to the correct generator. Add `operation` field to `questionHistory` entries. Public API (`generateQuestion()` returning `{ questionText, correctAnswer, answers }`) must remain stable.

**Files:** Modify `js/game/QuestionManager.js`

**Validation:**
- `new QuestionManager(5)` (no operation param) — multiplication questions still generate correctly
- `questionHistory` entries include `operation: "multiplication"`
- `getHint()` still works for multiplication

**Depends on:** 1.1

---

### Ticket 1.3: Implement addition question generator

**Description:** Add `_generateAdditionQuestion(difficulty)` to `QuestionManager`. Pick two random operands from `OPERATION_RANGES.addition[difficulty]`, compute sum, generate 3 distractors (correct ± 1-3, one operand-swap trap), shuffle all 4 answers, return `{ questionText: "12 + 7 = ?", correctAnswer: 19, answers: [...], operation: "addition", operands: [12, 7] }`. Implement `_getAdditionHint()` returning "Try counting up from 12 by 7 more."

**Files:** Modify `js/game/QuestionManager.js`

**Validation:**
- Generate 20 addition questions at each difficulty — all have `+` in text, correct sums, 4 unique positive answers
- `getHint()` returns addition-specific hint

**Depends on:** 1.2

---

### Ticket 1.4: Implement subtraction question generator

**Description:** Add `_generateSubtractionQuestion(difficulty)`. Ensure minuend > subtrahend (no negatives). Generate 3 distractors (sum-instead-of-difference trap, ±1-2 near misses). Implement `_getSubtractionHint()` returning "Start at 15 and count back 8."

**Files:** Modify `js/game/QuestionManager.js`

**Validation:**
- Generate 50 subtraction questions at each difficulty — no negative answers, correct differences
- `getHint()` returns subtraction-specific hint

**Depends on:** 1.2

---

### Ticket 1.5: Add operation selection to level select screen

**Description:** Add operation toggle buttons above the level grid in `index.html` ("Multiplication", "Addition", "Subtraction"). Style with space theme (dark buttons, glow on active). In `app.js`, modify `populateLevelSelect()`: "Multiplication" shows existing 1-9 table grid; "Addition"/"Subtraction" show Beginner/Intermediate/Advanced tier buttons. Store selected operation for `navigateToGame()`.

**Files:** Modify `index.html`, `css/ui.css`, `js/app.js`

**Validation:**
- Three operation buttons visible on level select
- Clicking "Addition" swaps grid to difficulty tiers; clicking "Multiplication" restores table grid
- Buttons match space theme visually

**Depends on:** 1.1

---

### Ticket 1.6: Wire operation selection through to GameEngine

**Description:** Modify `navigateToGame()` to pass `{ table, operation, difficulty }` to `GameEngine`. Modify `GameEngine` constructor to accept options object (backward compatible: raw number treated as `{ table: N, operation: "multiplication" }`). Pass operation/difficulty to `QuestionManager`. Ensure enemies display correct operation questions and answer handling works for all operations.

**Files:** Modify `js/game/GameEngine.js`, `js/app.js`

**Validation:**
- Play Addition > Beginner — addition questions on enemies, correct/wrong answers work
- Play Subtraction > Advanced — subtraction questions appear
- Play Multiplication > Table 7 — original flow identical to before

**Depends on:** 1.3, 1.4, 1.5

---

### Ticket 1.7: Update StorageManager for multi-operation progress with migration

**Description:** Restructure progress storage: `operationProgress.multiplication["1"]...["9"]`, `operationProgress.addition.beginner`, etc. Write `_migrateProgressData()` that runs on construction: if old `tableProgress` keys exist, migrate to `operationProgress.multiplication`, delete old keys. Add schema version field. Add `getOperationProgress(operation, key)` and `setOperationProgress(operation, key, data)`.

**Files:** Modify `js/managers/StorageManager.js`

**Validation:**
- Seed localStorage with old-format data, reload — migrates to new structure, old keys removed
- `getOperationProgress("multiplication", "5")` returns migrated data
- `setOperationProgress("addition", "beginner", { score: 100 })` persists across reload
- Fresh install (no old data) works without errors

**Depends on:** 1.1

---

### Ticket 1.8: Update results and progress display for multi-operation

**Description:** Modify `displayResults()` to show operation + difficulty/table in header ("Addition — Beginner" or "Multiplication — Table 7"). Modify `updateProgressDisplay()` to group progress by operation. Update `ProgressManager.getWeakAreas()` and `getRecommendedPractice()` to include `operation` field.

**Files:** Modify `js/app.js`, `js/managers/ProgressManager.js`, `css/ui.css`

**Validation:**
- Complete addition game — results show "Addition — Beginner" with stats
- Complete multiplication game — shows "Multiplication — Table 7" as before
- Progress screen groups by operation

**Depends on:** 1.6, 1.7

---

### Ticket 1.9: Sprint 1 smoke test

**Description:** Create `tests/operations-smoke.html` that loads game scripts, instantiates `QuestionManager` for multiplication, addition, and subtraction at each difficulty, generates 50 questions each, and asserts: no crashes, correct answer always in answers array, no duplicates, operation field matches, no negative numbers in subtraction. Display pass/fail.

**Files:** Create `tests/operations-smoke.html`

**Validation:**
- Open in browser — all tests pass green
- Intentionally break a generator — test catches it red

**Depends on:** 1.3, 1.4

---

## Sprint 2: Division, Mixed Mode & Operation Achievements

**Goal:** Complete all four arithmetic operations plus mixed mode, with achievements for each.

**Demo:** Player can play division and mixed-mode games. Mixed mode interleaves all operations, weighted toward weak areas. New achievements reward operation mastery.

---

### Ticket 2.1: Implement division question generator

**Description:** Add `_generateDivisionQuestion(difficulty)`. Generate as inverse of multiplication: pick a×b, present as (a×b) ÷ b = ?. Beginner: divisors 1-5, quotients 1-9. Intermediate: divisors 1-9, quotients 1-12. Advanced: divisors 2-12, quotients 2-12. Distractors: divisor itself, quotient ±1, nearby multiplication-table answer. Implement `_getDivisionHint()`: "Think: what times 7 equals 42?"

**Files:** Modify `js/game/QuestionManager.js`

**Validation:**
- 100 questions at each tier — all positive integers, no remainders, no division by zero
- No duplicate answers per question
- Hint returns multiplication-based hint

**Depends on:** 1.2

---

### Ticket 2.2: Add division to level select and game flow

**Description:** Add "Division" toggle button. Show difficulty tiers when selected. Wire through `navigateToGame()` and `GameEngine`. Division unlock condition: completed at least one multiplication table at intermediate or above (check via `ProgressManager`). Locked button shows tooltip explaining unlock requirement.

**Files:** Modify `index.html`, `js/app.js`, `js/managers/StorageManager.js`, `js/managers/ProgressManager.js`

**Validation:**
- Fresh profile: division button grayed out with lock icon and tooltip
- Complete multiplication table 2 at intermediate — division unlocks
- Play division game — questions display correctly

**Depends on:** 2.1, 1.5

---

### Ticket 2.3: Implement mixed-mode question generator

**Description:** Add `_generateMixedQuestion(difficulty)`. Randomly select from unlocked operations, delegate to the appropriate generator. Weight toward weak areas: if `weakAreas` array is provided, those operations appear 50% more often. Accept optional `weakAreas` in constructor.

**Files:** Modify `js/game/QuestionManager.js`

**Validation:**
- 200 mixed questions with all unlocked — all four operations appear, ~25% each (±10%)
- With `weakAreas: [{ operation: "subtraction" }]` — subtraction appears ~37%
- Each question's `operation` field matches its symbol

**Depends on:** 2.1

---

### Ticket 2.4: Add mixed mode to level select and game flow

**Description:** Add "Mixed" toggle button. Unlock condition: completed at least one level in 3 different operations. Show difficulty tiers when selected. Gather weak areas from `ProgressManager` and pass to `GameEngine`/`QuestionManager`. Add small operation label in HUD next to each question.

**Files:** Modify `index.html`, `js/app.js`, `js/game/GameEngine.js`, `css/game.css`

**Validation:**
- Fresh profile: Mixed button locked
- After completing 3 operations: Mixed unlocks
- Mixed gameplay cycles operations, HUD shows operation label per question

**Depends on:** 2.3, 2.2

---

### Ticket 2.5: Mixed-mode results breakdown

**Description:** When mixed-mode game ends, show per-operation breakdown table on results screen: questions attempted, correct, incorrect, accuracy per operation. Color code: green >80%, yellow 60-80%, red <60%. Non-mixed games don't show breakdown.

**Files:** Modify `js/app.js`, `css/ui.css`

**Validation:**
- Complete mixed game — breakdown table appears with correct stats and colors
- Complete non-mixed game — no breakdown table

**Depends on:** 2.4

---

### Ticket 2.6: New achievements for operations

**Description:** Add to `RewardManager`: "Addition Ace" (3 stars on all addition difficulties), "Subtraction Star" (same for subtraction), "Division Dynamo" (same for division), "Math Mixer" (10 mixed-mode games), "Operation Master" (3 stars on all operations). Each with id, title, description, icon, condition check, star reward.

**Files:** Modify `js/managers/RewardManager.js`, `js/utils/constants.js`

**Validation:**
- Complete all addition difficulties at 3 stars — "Addition Ace" pops
- Old achievements still function
- Achievement screen shows new achievements

**Depends on:** 2.2, 2.4

---

### Ticket 2.7: End-to-end regression test for all operations

**Description:** Expand `tests/operations-smoke.html` to cover all 4 operations + mixed mode. 50 questions each at every difficulty. Assert: no crashes, correct answers always present, no duplicates, proper operation fields, no negatives in subtraction, no remainders in division.

**Files:** Modify `tests/operations-smoke.html`

**Validation:**
- All tests pass green
- Break a generator — test catches it

**Depends on:** 2.1, 2.3

---

## Sprint 3: Per-Fact Tracking & Adaptive Question Selection

**Goal:** Track individual fact accuracy and use it to weight question selection so students see more of what they struggle with.

**Demo:** After several sessions, the game visibly prioritizes weak facts. Progress screen shows per-fact mastery heat map.

---

### Ticket 3.1: Design FactTracker data model

**Description:** Document the FactTracker data model in code comments at top of new file. Per-fact fields: `factKey` (canonical string like `"mul:3:7"` — sorted operands for commutative ops), `operation`, `operands`, `attempts`, `correct`, `incorrect`, `streak`, `lastSeen` (timestamp), `averageResponseTime`, `masteryLevel` ("new"|"learning"|"familiar"|"mastered"). Mastery thresholds: new (0-2 attempts), learning (<60% with 3+ attempts), familiar (60-85%), mastered (>85% with 5+ attempts).

**Files:** Create `js/managers/FactTracker.js` (data model + constructor + storage methods only)

**Validation:**
- File exists with clear data model documentation
- Constructor initializes from StorageManager
- `_calculateMastery(factData)` returns correct level for edge cases (0 attempts, 100% accuracy, 1 attempt)

**Depends on:** None

---

### Ticket 3.2: Implement FactTracker CRUD methods

**Description:** Add methods: `recordAttempt(factKey, wasCorrect, responseTimeMs)`, `getFactData(factKey)`, `getAllFacts(operation?)`, `getMasteryLevel(factKey)`, `getWeakestFacts(count, operation?)`. Store via `StorageManager` — add `getFactData`/`setFactData` methods to StorageManager. Cache in memory, write to localStorage on `beforeunload` and every 30 seconds (not on every attempt — performance).

**Files:** Modify `js/managers/FactTracker.js`, Modify `js/managers/StorageManager.js`, Modify `index.html` (script tag)

**Validation:**
- `factTracker.recordAttempt("mul:7:8", true, 2500)` x5, then `getFactData("mul:7:8")` — 5 attempts, 100%, "mastered"
- Record 2 correct + 3 incorrect for "add:15:9" — masteryLevel "learning"
- Reload page — data persists
- `getWeakestFacts(5)` returns 5 facts sorted by accuracy ascending

**Depends on:** 3.1

---

### Ticket 3.3: Integrate FactTracker into GameEngine

**Description:** In `handleCorrectAnswer()` (line 140) and `handleWrongAnswer()` (line 181), call `factTracker.recordAttempt()` with fact key, correctness, and response time. Add `this.questionStartTime = Date.now()` in `spawnNextEnemy()` (line 206). Construct factKey from question's operation and operands. Sort operands for commutative operations (multiplication, addition); don't sort for subtraction, division.

**Files:** Modify `js/game/GameEngine.js`

**Validation:**
- Play game, answer 3 questions — FactTracker shows those facts recorded with reasonable response times
- "3 x 7" and "7 x 3" both map to `"mul:3:7"`
- "15 - 9" maps to `"sub:15:9"` (not sorted)

**Depends on:** 3.2

---

### Ticket 3.4: Implement weighted question selection

**Description:** Add `_selectWeightedFact(operation, difficulty)` to `QuestionManager`. Weights: mastered=1, familiar=3, learning=6, new=4. Facts not seen in last 5 questions get 1.5x recency bonus. Use weighted random selection. Maintain `recentFacts` ring buffer (size 5). Fall back to uniform random when FactTracker has <10 total attempts. Wire into all generators as optional path (enabled after 10+ recorded attempts).

**Files:** Modify `js/game/QuestionManager.js`

**Validation:**
- Seed FactTracker with one "learning" fact and several "mastered" — learning fact appears ~25-35% of 50 questions (vs ~5% uniform)
- No fact data — distribution roughly uniform
- No repeats within 5 consecutive questions

**Depends on:** 3.2

---

### Ticket 3.5: Per-fact mastery visualization on progress screen

**Description:** Add "Fact Mastery" section to progress screen. For multiplication: 9x9 grid, rows/columns are factors 1-9, cells color-coded (gray=new, red=learning, yellow=familiar, green=mastered). Hover tooltip: "7 × 8: 60% (5 attempts)". For other operations: sorted list of practiced facts, weakest first. Add color legend.

**Files:** Modify `js/app.js` (in `updateProgressDisplay()`), Modify `css/ui.css`, Modify `index.html` (container div)

**Validation:**
- Play several multiplication games, visit progress — 9x9 grid with correct colors
- Hover cell — tooltip shows fact, accuracy, attempts
- Grid scales on resize

**Depends on:** 3.2, 3.3

---

### Ticket 3.6: Integrate FactTracker with ProgressManager recommendations

**Description:** Modify `ProgressManager.getWeakAreas()` (line 216) to return 10 weakest facts across all operations (sorted by accuracy, min 3 attempts). Modify `getRecommendedPractice()` (line 246) to suggest operation with lowest mastery + specific difficulty tier + 5 weakest facts. Show "Recommended" badge on suggested operation in level select.

**Files:** Modify `js/managers/ProgressManager.js`, Modify `js/app.js`, Modify `css/ui.css`

**Validation:**
- Intentionally fail subtraction — `getRecommendedPractice()` returns subtraction
- Level select shows glowing "Recommended" badge on subtraction

**Depends on:** 3.2, 1.8

---

### Ticket 3.7: FactTracker and weighted selection tests

**Description:** Add tests to `tests/operations-smoke.html` for: empty state (0 attempts), all-mastered state, single-fact state, storage corruption recovery (malformed JSON), and statistical verification that weighted selection produces measurably skewed distribution toward weak facts (chi-square or simple ratio check over 200 samples).

**Files:** Modify `tests/operations-smoke.html`

**Validation:**
- All new tests pass green
- Statistical test confirms weighted selection is not uniform when weak facts exist

**Depends on:** 3.4

---

## Sprint 4: Practice Mode & Review System

**Goal:** Build a dedicated practice mode for drilling weak facts with immediate feedback and no scoring pressure.

**Demo:** Player enters Practice Mode, sees weak facts listed, drills them with immediate correct-answer feedback, sees before/after mastery improvement.

---

### Ticket 4.1: Add Practice Mode screen

**Description:** New screen `<div id="practice-screen" class="screen">` with header "Practice Mode — Focus on Your Weak Spots", list of weak facts from `FactTracker.getWeakestFacts()`, "Start Practice" button, back button. Add "Practice" button to main menu. Add to `showScreen()` (line 185).

**Files:** Modify `index.html`, `js/app.js`, `css/ui.css`

**Validation:**
- Main menu shows "Practice" button
- Click → practice screen with weak facts listed (or "No weak areas found" if all mastered)
- Back button returns to menu

**Depends on:** 3.2, 3.6

---

### Ticket 4.2: Practice Mode game variant in GameEngine

**Description:** Add `mode: "practice"` option to `GameEngine`. In practice mode: no scoring (score hidden), no lives (wrong answers don't reduce health), wrong answers immediately show correct answer highlighted green for 2 seconds, after answering show updated mastery level as floating text. Session draws from `targetFacts` array (weakest 10-15 facts). Ends after all facts answered correctly twice each or after 5 minutes. Add `PRACTICE_MODE` config to constants.

**Files:** Modify `js/game/GameEngine.js`, Modify `js/utils/constants.js`

**Validation:**
- Start practice with known weak facts — only those facts appear
- Wrong answer — no life lost, correct answer shown green for 2 seconds
- Correct answer — "+mastery" floats up
- Session ends after all facts answered correctly twice

**Depends on:** 4.1, 3.4

---

### Ticket 4.3: Practice results screen

**Description:** After practice session, show practice-specific results: each fact with before/after mastery (green arrow up for improved, yellow dash for unchanged), summary "You improved 4 of 8 facts!", "Practice Again" button (re-drills still-weak facts), "Back to Menu" button. If all mastered, hide "Practice Again" and show congratulations.

**Files:** Modify `js/app.js`, Modify `index.html`, Modify `css/ui.css`

**Validation:**
- Complete practice — before/after mastery visible per fact
- Improved facts show green arrow
- "Practice Again" re-drills only still-weak facts
- All mastered → congratulations shown

**Depends on:** 4.2

---

### Ticket 4.4: Simple review scheduling in FactTracker

**Description:** Add `nextReviewDate` to each fact record. After correct answer on mastered fact: review in 7 days. Familiar: 3 days. Learning: 1 day. Incorrect: 10 minutes. Add `getDueForReview(operation?)` returning facts where `now >= nextReviewDate`, sorted by most overdue. Practice mode prioritizes due-for-review over merely weak.

**Files:** Modify `js/managers/FactTracker.js`

**Validation:**
- Correct on mastered → nextReviewDate ~7 days out
- Incorrect → nextReviewDate ~10 minutes out
- `getDueForReview()` returns overdue facts correctly

**Depends on:** 3.2

---

### Ticket 4.5: "Facts due for review" notification

**Description:** On main menu, if `factTracker.getDueForReview().length > 0`, show pulsing orange badge on Practice button with count + message "5 facts ready for review!" Updates whenever main menu is shown.

**Files:** Modify `js/app.js`, Modify `css/ui.css`, Modify `css/animations.css`

**Validation:**
- With due facts: pulsing badge with correct count
- Without: no badge
- Badge count matches `getDueForReview().length`

**Depends on:** 4.4, 4.1

---

### Ticket 4.6: Practice mode achievements

**Description:** Add "Practice Makes Perfect" (10 practice sessions), "Fact Master" (50 facts reach "mastered"). Track practice session count in StorageManager.

**Files:** Modify `js/managers/RewardManager.js`, Modify `js/managers/StorageManager.js`

**Validation:**
- 10 practice sessions → achievement triggers
- 50 mastered facts → achievement triggers

**Depends on:** 4.2, 3.2

---

### Ticket 4.7: Learning progress report screen

**Description:** Add "Progress Report" button to progress screen. Shows a printable/shareable summary: mastery by operation (bar charts using CSS), total facts learned vs total, strongest/weakest areas, total time played. Style for print (`@media print`). Include a "Print Report" button that calls `window.print()`.

**Files:** Modify `js/app.js`, Modify `index.html`, Modify `css/ui.css`

**Validation:**
- Click "Progress Report" — see formatted summary with bars/stats
- Click "Print Report" — browser print dialog opens with clean layout
- Stats are accurate against FactTracker data

**Depends on:** 3.2, 3.5

---

## Sprint 5: Star Economy & Ship Customization

**Goal:** Implement star currency and a ship hangar where players view, unlock, and equip ships with distinct visuals.

**Demo:** Player earns stars from games, visits Ship Hangar, sees 5 visually distinct ships, unlocks and equips one. Equipped ship appears in gameplay with different colors and design.

---

### Ticket 5.1: Implement star economy

**Description:** Add `stars` and `spentStars` to player profile in StorageManager. Methods: `getStars()` (total - spent), `addStars(amount)`, `spendStars(amount)` (returns false if insufficient). Define `STAR_REWARDS` in constants: `{ perfect_game: 50, three_star: 30, two_star: 20, one_star: 10, practice_complete: 15 }`. Integrate earning into `GameEngine` end-of-game flow. Dispatch `'stars-changed'` custom event on any change. Add basic validation: amounts must be positive integers, balance can't go negative.

**Files:** Modify `js/managers/StorageManager.js`, Modify `js/utils/constants.js`, Modify `js/app.js` (results screen star display), Modify `css/animations.css` (counting animation)

**Validation:**
- Complete 3-star game — earn 30 stars, shown on results with counting animation
- `spendStars(1000)` with balance 30 → returns false, balance unchanged
- Balance persists across reload
- `'stars-changed'` event fires on add/spend

**Depends on:** None

---

### Ticket 5.2: Star balance display

**Description:** Show star counter on main menu (top-right), game HUD, and level select header. Star icon (★) + balance. Animate on change (brief scale pulse). Listen to `'stars-changed'` event for reactive updates.

**Files:** Modify `index.html`, `js/app.js`, `css/ui.css`

**Validation:**
- Star count visible on menu, HUD, level select
- Console: `storageManager.addStars(100)` — all counters update immediately

**Depends on:** 5.1

---

### Ticket 5.3: Define ship configurations

**Description:** Add `SHIPS` array to constants with exactly 5 ships:
1. "Star Scout" — free, default, cyan/purple, no ability
2. "Comet Racer" — 50 stars, orange/red + flame trail, +1 starting life
3. "Nova Glider" — 150 stars, white/gold + sparkle trail, 10% faster speed bonus window
4. "Nebula Cruiser" — 300 stars, purple/pink + cosmic dust trail, starts with Shield
5. "Galaxy Commander" — 500 stars, rainbow gradient + star trail, 2x star earnings

Each ship: `{ id, name, description, cost, primaryColor, accentColor, trailColor, shape, ability: { id, name, description, type, params } }`.

**Files:** Modify `js/utils/constants.js`

**Validation:**
- `SHIPS.length === 5`
- `SHIPS[0].cost === 0`
- All ships have required fields
- Costs ascending: 0, 50, 150, 300, 500

**Depends on:** None

---

### Ticket 5.4: Build Ship Hangar screen

**Description:** New `<div id="hangar-screen" class="screen">` with horizontal ship card gallery. Each card: ship name, placeholder visual (colored div), ability description, cost/unlock status, "Select"/"Unlock (★ cost)" button. Locked ships have semi-transparent overlay. Selected ship has highlighted border. "Ship Hangar" button on main menu. Navigation in `app.js`.

**Files:** Modify `index.html`, `js/app.js`, `css/ui.css`

**Validation:**
- Main menu has "Ship Hangar" button
- Hangar shows 5 cards, first is "Selected", others locked with cost
- Back button returns to menu

**Depends on:** 5.3

---

### Ticket 5.5: Ship unlock and selection logic

**Description:** Add to StorageManager: `getUnlockedShips()`, `unlockShip(shipId)`, `getSelectedShip()`, `selectShip(shipId)`. Wire hangar buttons: "Unlock" calls `spendStars(cost)` with confirmation dialog, on success unlocks ship and refreshes display. "Select" on unlocked ship updates highlight. Show insufficient-stars message if needed.

**Files:** Modify `js/managers/StorageManager.js`, Modify `js/app.js`

**Validation:**
- Start with 200 stars, unlock Comet Racer (50) — confirmation, unlock, balance 150
- Try Nebula Cruiser (300) — "Not enough stars"
- Select Comet — shows selected, Star Scout deselected
- Persists across reload

**Depends on:** 5.1, 5.4

---

### Ticket 5.6: Render distinct ship visuals in Player.js

**Description:** Refactor hardcoded ship rendering (lines 61-113) into `_renderShip(ctx, shipConfig)`. Implement 5 distinct Canvas2D designs: (1) Star Scout: current triangle (preserve exactly), (2) Comet Racer: sleek narrow dart, (3) Nova Glider: wide rounded body with swept wings, (4) Nebula Cruiser: bulky hexagonal armored body, (5) Galaxy Commander: large multi-wing command ship. Each uses `primaryColor`/`accentColor` from config. Engine glow particles match `trailColor`.

**Files:** Modify `js/game/Player.js`

**Validation:**
- Set each ship and start game — 5 visually distinct designs
- Colors match config
- Star Scout identical to original (regression check)

**Depends on:** 5.3, 5.5

---

### Ticket 5.7: Ship preview in hangar

**Description:** Replace placeholder divs with mini `<canvas>` (200x200) rendering actual ships using extracted static render method from Player. Ships bob gently. Locked ships render grayscale. Selected ship has subtle glow.

**Files:** Modify `js/app.js`, `js/game/Player.js` (extract static render), `index.html`, `css/ui.css`

**Validation:**
- Hangar shows actual ship renders, not rectangles
- Locked ships desaturated
- No requestAnimationFrame leaks when leaving hangar

**Depends on:** 5.6, 5.4

---

### Ticket 5.8: Ship ability integration

**Description:** When game starts, read selected ship's ability and apply: Star Scout: none. Comet Racer: `+1 life`. Nova Glider: multiply speed bonus threshold by 0.9. Nebula Cruiser: start with `activeShield = true`. Galaxy Commander: multiply star rewards by 2. Show ability name in HUD corner.

**Files:** Modify `js/game/GameEngine.js`, `css/game.css`

**Validation:**
- Comet Racer: start with 4 lives instead of 3
- Nebula Cruiser: shield bubble visible, absorbs first wrong answer
- Galaxy Commander: double star earnings
- HUD shows ability name

**Depends on:** 5.6, 5.5

---

## Sprint 6: Power-ups

**Goal:** Add collectible power-up items during gameplay with visible effects and HUD indicators.

**Demo:** During gameplay, glowing power-up orbs float down. Collecting them triggers effects: time freeze stops the timer, shield absorbs a wrong answer, answer eliminator removes wrong choices. HUD shows active power-ups with cooldown rings.

---

### Ticket 6.1: Create PowerUpManager and define power-ups

**Description:** Define `POWERUPS` in constants: (1) "Shield Bubble" — absorbs one wrong answer, (2) "Time Freeze" — pauses timer 10s, (3) "Answer Eliminator" — removes 2 wrong answers, (4) "Star Magnet" — 2x stars for next 3 correct, (5) "Hint Revealer" — auto-shows hint. Each: `{ id, name, description, icon (emoji), duration, spawnWeight }`. Create `js/game/PowerUpManager.js` with `update(dt)`, `activatePowerUp(id)`, `isActive(id)`, `getActiveEffects()`.

**Files:** Create `js/game/PowerUpManager.js`, Modify `js/utils/constants.js`, Modify `index.html` (script tag)

**Validation:**
- `powerUpManager.activatePowerUp("time_freeze")` → `isActive("time_freeze")` true
- After 10s → false
- `getActiveEffects()` returns current active IDs

**Depends on:** None

---

### Ticket 6.2: Power-up collectible sprites

**Description:** Create `js/game/PowerUpItem.js` — spawns at random x, floats down at 50px/s, renders as glowing orb with emoji icon. Bounding box collision with player ship. Collected: triggers activation + particles. Reaches bottom: disappears. Subtle pulsing glow animation.

**Files:** Create `js/game/PowerUpItem.js`, Modify `index.html` (script tag)

**Validation:**
- Manually spawn item — renders, floats, pulsates
- Move ship into it — collected, power-up activates
- Reaches bottom — disappears silently

**Depends on:** 6.1

---

### Ticket 6.3: Integrate power-up spawning into GameEngine

**Description:** Instantiate PowerUpManager in GameEngine. Add spawn timer: every 45-90s (random), spawn PowerUpItem with weighted random type. Add to `this.powerUpItems` array. Render and update in game loop. Check player collision. No spawns in practice mode.

**Files:** Modify `js/game/GameEngine.js`

**Validation:**
- Play 2+ minutes — power-up spawns and floats
- Collect it — effect activates
- Practice mode — no spawns

**Depends on:** 6.1, 6.2

---

### Ticket 6.4: Implement power-up gameplay effects

**Description:** Wire effects into game systems: (1) Shield: in `handleWrongAnswer()`, if active, negate life loss, consume shield, render bubble on ship. (2) Time Freeze: pause timer bar advancement. (3) Answer Eliminator: remove 2 wrong answer buttons, leaving correct + 1 wrong. (4) Star Magnet: double star reward for next 3 correct. (5) Hint Revealer: call `getHint()` and display as floating text.

**Files:** Modify `js/game/GameEngine.js`, `js/game/PowerUpManager.js`, `js/game/Player.js` (shield bubble)

**Validation:**
- Shield: wrong answer → no life lost, bubble disappears
- Time Freeze: timer bar stops 10s, then resumes
- Answer Eliminator: 2 buttons removed, 2 remain including correct
- Star Magnet: 3 correct = 2x stars each
- Hint Revealer: hint text appears

**Depends on:** 6.3

---

### Ticket 6.5: Power-up HUD indicators

**Description:** Show active power-ups as icon row at top of game screen. Each has emoji + draining cooldown ring. On collect: brief color flash + power-up name as floating text (1s fade). On expire: icon fades out.

**Files:** Modify `js/game/GameEngine.js`, `css/game.css`, `css/animations.css`

**Validation:**
- Collect power-up — flash + name text + icon in HUD
- Cooldown ring drains over duration
- Expire — icon fades
- Multiple power-ups show in row

**Depends on:** 6.4

---

### Ticket 6.6: Power-up balance playtest and tuning

**Description:** Play 10 full games with power-ups enabled. Verify: (1) power-ups don't allow bypassing math learning (Answer Eliminator still requires picking an answer), (2) spawn rate feels right (not too frequent to trivialize, not too rare to forget), (3) Shield doesn't eliminate all challenge, (4) no power-up combination breaks the game. Adjust spawn weights, cooldowns, and durations based on testing. Document final balance values.

**Files:** Modify `js/utils/constants.js` (tuning values only)

**Validation:**
- Document: 10 playtest sessions with notes on each
- No power-up combo trivializes a full game
- Average power-ups per game: 1-3

**Depends on:** 6.4, 6.5

---

### Ticket 6.7: Power-up and ship achievements

**Description:** Add: "Power Collector" (25 total power-ups collected), "Full Arsenal" (all 5 types collected at least once), "Fleet Commander" (unlock all 5 ships), "Star Saver" (1000 lifetime stars). Track power-up collection counts in StorageManager.

**Files:** Modify `js/managers/RewardManager.js`, `js/managers/StorageManager.js`, `js/utils/constants.js`

**Validation:**
- Collect 25 power-ups → achievement
- Unlock all ships → achievement

**Depends on:** 6.3, 5.5

---

### Ticket 6.8: Sound effects for new features

**Description:** Add procedural Web Audio sounds to SoundManager: power-up collect (bright ascending chime), power-up activate (whoosh + sparkle), shield absorb (low thud + shimmer), ship unlock (fanfare), mastery level up (rising scale). Follow existing procedural synthesis pattern.

**Files:** Modify `js/managers/SoundManager.js`

**Validation:**
- Each sound plays distinctly, non-harsh
- Sounds respect mute toggle
- No glitches when overlapping

**Depends on:** 6.3, 5.5

---

## Sprint 7: Express Backend & AI Foundation

**Goal:** Set up a secure Express.js backend that proxies requests to the Claude API with proper authentication, rate limiting, safety filtering, and graceful fallback when unavailable.

**Demo:** Game loads at localhost:3000. A test page demonstrates round-trip AI communication. Game works perfectly with server stopped (graceful degradation).

---

### Ticket 7.1: Initialize Node.js project and Express server with security

**Description:** Create `server/` directory. `npm init`. Install `express`, `cors`, `dotenv`, `helmet`, `express-rate-limit`. Create `server/index.js`: load `.env`, apply helmet, CORS (game origin only), rate limiting (30 req/min/IP), serve static files from parent directory, health endpoint `GET /api/health`. Create `.env.example` with `ANTHROPIC_API_KEY` and `PORT=3000`. Add `server/.env` and `node_modules` to `.gitignore`.

**Files:** Create `server/package.json`, `server/index.js`, `server/.env.example`, `.gitignore`

**Validation:**
- `cd server && npm install && node index.js` — starts, serves game at localhost:3000
- `curl localhost:3000/api/health` → `{"status":"ok"}`
- 35 rapid requests → 31st returns 429
- `.env` in `.gitignore`

**Depends on:** None

---

### Ticket 7.2: Claude API proxy endpoint with authentication

**Description:** Create `server/routes/claude.js` with `POST /api/claude/chat`. Accepts `{ messages, systemPrompt, maxTokens }`. Calls Anthropic API via `fetch` (no SDK — keep dependencies minimal). Response: `{ response, usage: { inputTokens, outputTokens } }`. Add request validation: messages must be array, maxTokens ≤ 500. Add simple app-secret authentication: requests must include `x-app-token` header matching a value from `.env`. Endpoint-specific rate limit: 10 req/min for chat.

**Files:** Create `server/routes/claude.js`, Modify `server/index.js` (mount route), Modify `server/.env.example` (add APP_TOKEN)

**Validation:**
- Valid request with correct token → Claude response
- Missing/wrong token → 401
- Missing API key → 500 with clear error
- `maxTokens: 1000` → 400 validation error

**Depends on:** 7.1

---

### Ticket 7.3: Backend prompt templates

**Description:** Create `server/prompts.js` with template functions: `getTutorChatPrompt(context)`, `getHintPrompt(question, context)`, `getEncouragementPrompt(context)`, `getWordProblemPrompt(operation, difficulty)`. All include guardrails: "You are Commander Cosmo, a friendly robot co-pilot talking to a child aged 7-10. Only discuss math and space. Never give direct answers for hints. Keep responses under 3 sentences. Never ask for personal info. Redirect off-topic questions to math."

**Files:** Create `server/prompts.js`

**Validation:**
- Each function returns non-empty string
- All prompts include age-appropriate guardrails
- Hint prompt includes "never give the answer directly"

**Depends on:** None

---

### Ticket 7.4: Content safety middleware

**Description:** Create `server/middleware/safetyFilter.js`. Input sanitization: strip HTML, limit to 500 chars, block prompt injection patterns (ignore instructions, pretend you are, system prompt, override). Output validation: reject responses containing URLs, emails, phone numbers, profanity. Rejected input → canned safe response. Failed output validation → log + serve fallback. Apply to all AI routes.

**Files:** Create `server/middleware/safetyFilter.js`, Modify `server/routes/claude.js`

**Validation:**
- Send `<script>alert('hi')</script>` → HTML stripped
- Send "ignore your instructions" → rejected with safe response
- Mock Claude returning a URL → filtered out, fallback served

**Depends on:** 7.2

---

### Ticket 7.5: Client-side AIManager with graceful degradation

**Description:** Create `js/managers/AIManager.js`. Methods: `async chat(messages, options)`, `async getHint(question)`, `async getEncouragement(context)`, `async generateWordProblem(operation, difficulty)`. On startup: `checkAvailability()` pings `/api/health` — if unreachable, `this.isAvailable = false` and all methods return static fallbacks. Implement: 5-second timeout, response caching (5min TTL), retry with 1s backoff (max 2 retries). Include `x-app-token` header from constants. All AI UI elements check `aiManager.isAvailable` before showing.

**Files:** Create `js/managers/AIManager.js`, Modify `js/utils/constants.js` (API_BASE_URL, APP_TOKEN), Modify `index.html` (script tag)

**Validation:**
- Server running: `aiManager.getHint(...)` → Claude response
- Server stopped: same call → static fallback, no crash
- Two identical calls within 5min → second is cached (instant)
- Game loads without server → `aiManager.isAvailable === false`, no errors in console

**Depends on:** 7.2

---

### Ticket 7.6: Session context tracking for AI

**Description:** Extend AIManager with `_sessionContext` tracking: current operation, difficulty, last 10 questions+results, current streak, mastery levels of attempted facts. Add `updateContext(data)` called by GameEngine after each question. Include context in AI requests for personalized responses. Cap context to prevent bloated API calls.

**Files:** Modify `js/managers/AIManager.js`

**Validation:**
- Play 5 questions → `_sessionContext` shows all 5 with results
- Context trims to last 10 (not unbounded)
- API requests include context (check network tab)

**Depends on:** 7.5

---

### Ticket 7.7: Automated API tests with mocked responses

**Description:** Create `tests/ai-api-tests.html` that tests AIManager with a mock server (intercept fetch). Test: successful response parsing, timeout handling, retry behavior, malformed response handling, rate limit response, authentication failure, fallback mode when unavailable. Display pass/fail.

**Files:** Create `tests/ai-api-tests.html`

**Validation:**
- All tests pass green
- Tests don't require real API key or running server

**Depends on:** 7.5

---

## Sprint 8: AI Tutor Chat

**Goal:** Build an in-game chat interface where students converse with Commander Cosmo, an AI math tutor.

**Demo:** Player opens chat panel, asks math questions, receives helpful streaming responses. Chat triggers proactively on struggle patterns. "Ask for Help" button appears on wrong answers.

---

### Ticket 8.1: Build chat panel UI

**Description:** Fixed rocket icon button (bottom-right). Clicks open a 320px slide-in panel with: header "Commander Cosmo" + close button, scrollable message area, text input (maxlength=200) + send button, 3 suggestion buttons ("Why is 7×8=56?", "Help me with 6 times table", "Give me a trick!"). Messages as speech bubbles (AI left blue, user right green). Typing indicator (bouncing dots). Opening during gameplay pauses game. Full-width on mobile (<768px). Smooth slide transition.

**Files:** Modify `index.html`, `css/ui.css`, `css/animations.css`

**Validation:**
- Icon visible on all screens
- Panel slides open/close smoothly
- Message area scrollable, input functional
- During gameplay: game pauses when chat opens

**Depends on:** None

---

### Ticket 8.2: Wire chat to AIManager with safety

**Description:** Create `js/ui/ChatPanel.js`. On send: sanitize input (strip HTML, trim), show user bubble, show typing indicator, call `aiManager.chat()`, hide indicator, show AI bubble. Maintain `chatHistory` (max 20 messages FIFO). Welcome message on first open. Input debounce (1s send cooldown). Suggestion buttons send pre-approved prompts. Error → "Commander Cosmo is recharging. Try again in a moment." Chat limit: after 20 messages, show "Cosmo needs to recharge!" and require panel close/reopen.

**Files:** Create `js/ui/ChatPanel.js`, Modify `js/app.js`, Modify `index.html` (script tag)

**Validation:**
- Open chat → welcome message
- Send message → response appears
- Multiple messages → conversation flows with history
- Server offline → friendly error message
- 21st message → "recharge" message

**Depends on:** 8.1, 7.5, 7.4

---

### Ticket 8.3: Contextual chat triggers during gameplay

**Description:** GameEngine triggers proactive AI messages: (1) 3 wrong in a row → "I see you're having trouble with [fact]. Want me to explain?" (2) 10-streak → "[Operation] superstar!" (3) First time playing new operation → tip message. Inject into chat panel. If panel closed, show notification badge on rocket icon. Messages are AI-generated (call `aiManager.getEncouragement()`) with static fallbacks.

**Files:** Modify `js/game/GameEngine.js`, Modify `js/ui/ChatPanel.js`, Modify `css/ui.css`

**Validation:**
- 3 wrong → badge on rocket icon, open chat → see encouragement
- 10-streak → congratulation message
- Messages reference actual facts from the session

**Depends on:** 8.2, 7.6

---

### Ticket 8.4: "Ask for Help" button on wrong answers

**Description:** When player answers incorrectly and correct answer is shown, add "Ask Commander Cosmo" button for 3 seconds. Click opens chat with pre-filled context: "I got [fact] wrong. Can you help me understand?" AI explains using age-appropriate strategy. Button fades after 3s if not clicked.

**Files:** Modify `js/game/GameEngine.js`, Modify `js/ui/ChatPanel.js`, Modify `css/game.css`

**Validation:**
- Wrong answer → button appears 3 seconds
- Click → chat opens, AI explains the fact (pedagogically, not just giving answer)
- No click → button fades, game continues

**Depends on:** 8.2, 7.3

---

### Ticket 8.5: Chat accessibility and keyboard support

**Description:** ARIA: `role="dialog"`, `aria-label="Math tutor chat"`, `role="log"` on messages. Auto-focus input on open. Escape closes panel. Tab order: input → send → close. Auto-scroll to bottom with smooth behavior. Ensure focus trap when panel is open during gameplay.

**Files:** Modify `js/ui/ChatPanel.js`, `css/ui.css`

**Validation:**
- Escape closes panel
- Tab order correct
- Screen reader announces "Math tutor chat dialog"
- Auto-scroll works on new messages

**Depends on:** 8.1

---

### Ticket 8.6: Chat safety integration test

**Description:** Test chat safety end-to-end: off-topic inputs get redirected, prompt injection attempts get deflected, HTML is stripped, rate limits work, profanity is blocked, AI responses don't contain URLs/emails. Document 20 test cases with expected behavior.

**Files:** Create `tests/chat-safety-tests.md` (manual test script), Add tests to `tests/ai-api-tests.html`

**Validation:**
- All 20 manual test cases pass
- Automated safety tests pass green

**Depends on:** 8.2, 7.4

---

## Sprint 9: AI Hints & Encouragement

**Goal:** Replace static hints with AI-generated adaptive hints and add personalized encouragement after each answer.

**Demo:** When stuck, player gets contextual AI hints that escalate from gentle nudge to almost-answer. After each answer, personalized AI encouragement appears. Results screen shows AI-generated session summary.

---

### Ticket 9.1: Replace static hints with AI hints

**Description:** Make `QuestionManager.getHint()` async, call `aiManager.getHint(question)`. Include: question, operation, previous wrong answers, mastery level. Keep old logic as `_getStaticHint()` fallback. Show loading indicator while hint loads. Pre-fetch Level 1 hint when question spawns (ready before player needs it).

**Files:** Modify `js/game/QuestionManager.js`, Modify `js/game/GameEngine.js`

**Validation:**
- Server running: hint is AI-generated, contextual
- Server offline: static hint appears (fallback)
- Hint loads within 3 seconds
- Pre-fetched hint appears instantly

**Depends on:** 7.5, 7.3

---

### Ticket 9.2: Progressive hint system (3 levels)

**Description:** Track `hintLevel` per question (resets on new question). Level 1: gentle nudge. Level 2: strategy walkthrough. Level 3: nearly reveals answer. Send level to AI for calibrated response. After Level 3, reveal answer directly. Max 2 AI hint calls per question (cost control). "Need a hint?" button appears after 5 seconds of no answer.

**Files:** Modify `js/game/QuestionManager.js`, Modify `js/game/GameEngine.js`, Modify `server/prompts.js`, Modify `css/game.css`, Modify `index.html` (hint button + bubble HTML)

**Validation:**
- Level 1 hint: vague strategy suggestion
- Level 2: more specific walkthrough
- Level 3: very close to answer
- 4th wrong: answer revealed
- Each level demonstrably more specific

**Depends on:** 9.1

---

### Ticket 9.3: Dynamic encouragement after answers

**Description:** Create `js/ai/EncouragementManager.js`. After each answer: immediately show static fallback message, fire `aiManager.getEncouragement()` in background. If AI responds within 800ms, crossfade to AI message. If slower, queue for next answer. Overlay renders above question panel for 2.5 seconds. Context includes: correctness, question, response time, combo, accuracy, lives.

**Files:** Create `js/ai/EncouragementManager.js`, Modify `js/game/GameEngine.js`, Modify `index.html` (overlay HTML + script tag), Modify `css/game.css`, Modify `js/utils/constants.js` (static fallback messages)

**Validation:**
- Server running: personalized AI messages appear ("You're getting fast at 7s!")
- Server offline: static messages still appear
- No UI jank — message doesn't block gameplay

**Depends on:** 7.5, 7.6

---

### Ticket 9.4: AI encouragement on results screen

**Description:** After game ends, call `aiManager.getEncouragement(sessionData)` with full session stats. Display in styled quote bubble on results screen. If unavailable, show random static message from predefined list. Message should reference specific facts/patterns from the session.

**Files:** Modify `js/app.js` (in `displayResults()`), Modify `css/ui.css`

**Validation:**
- Server running: personalized summary references specific facts
- Server offline: static encouragement appears
- Visually distinct quote bubble

**Depends on:** 7.5, 7.6

---

### Ticket 9.5: AI prompt quality validation

**Description:** Test each prompt template with 20+ input variations. Verify: age-appropriate language, mathematical correctness of hints, hints don't give away answers at Level 1-2, encouragement is always positive, no off-topic responses. Document prompt versions and test results. Iterate on prompts that produce poor results.

**Files:** Modify `server/prompts.js`, Create `tests/prompt-validation.md` (test results)

**Validation:**
- 20 hint variations: none reveal answer at Level 1
- 20 encouragement variations: all positive and age-appropriate
- Documented test results with pass/fail per variation

**Depends on:** 9.1, 9.3

---

## Sprint 10: AI Word Problems

**Goal:** Add a word problem mode with space-themed AI-generated story problems.

**Demo:** Player enters "Word Problems" from menu, reads fun space stories with embedded math, answers questions, sees AI-generated explanations for wrong answers.

---

### Ticket 10.1: Word Problem game mode UI

**Description:** Add "Word Problems" button to main menu. New screen: story text area (large, readable font), operation selector (which operations to include), difficulty selector, 4 answer buttons. No timer (untimed mode). 10 problems per session. Different visual feel from the shooter mode — calmer, reading-focused.

**Files:** Modify `index.html`, Modify `js/app.js`, Modify `css/game.css`

**Validation:**
- Menu shows "Word Problems" button
- Screen shows story area + answer buttons
- No timer visible
- Operation and difficulty selectable

**Depends on:** None

---

### Ticket 10.2: AI word problem generation

**Description:** Add `POST /api/claude/word-problem` endpoint. Uses word problem prompt template requesting JSON: `{ story, question, correctAnswer, wrongAnswers: [3], explanation }`. Validate JSON structure, retry once on malformed response. Validate math correctness (parse equation, verify answer). In AIManager: `generateWordProblem(operation, difficulty)` pre-generates batch of 3 on screen entry, maintains buffer of 2 ready problems. Static fallback: 10 handwritten word problems per operation.

**Files:** Create `server/routes/wordproblems.js`, Modify `server/index.js`, Modify `server/prompts.js`, Modify `js/managers/AIManager.js`

**Validation:**
- Generated problem has valid JSON with all fields
- `correctAnswer` is mathematically correct for the story
- `wrongAnswers` are plausible but wrong
- Story is space-themed and age-appropriate
- First problem loads instantly (pre-cached)
- Server offline: static fallback problems appear

**Depends on:** 7.5, 7.4, 10.1

---

### Ticket 10.3: Word problem answer flow with explanations

**Description:** Player selects answer → show correct/incorrect feedback. Always show AI-generated explanation from the problem object. Correct: "Great job! [explanation]". Wrong: "[explanation] The answer was [correct]." "Got it!" button proceeds to next problem. Track accuracy.

**Files:** Modify `js/app.js`, Modify `css/game.css`

**Validation:**
- Correct answer → congratulatory explanation
- Wrong answer → teaching explanation + correct answer
- "Got it!" advances to next problem
- Accuracy tracked across session

**Depends on:** 10.2, 10.1

---

### Ticket 10.4: Word problem results and achievements

**Description:** After 10 problems, show results: accuracy, per-problem review, AI encouragement. Track word problem stats in StorageManager. Add achievements: "Storyteller" (10 word problem sessions), "Word Wizard" (100% on a session).

**Files:** Modify `js/app.js`, `js/managers/StorageManager.js`, `js/managers/RewardManager.js`

**Validation:**
- Results show after 10 problems
- Stats persist in storage
- Achievements trigger correctly

**Depends on:** 10.3

---

### Ticket 10.5: Word problem correctness validation

**Description:** Create `tests/word-problem-validation.html`. Generate 50 word problems via the API. For each, parse the equation from `question`, compute the answer independently, compare to `correctAnswer`. Report: match rate, any mismatches with details. Target: >95% correctness. If below, adjust prompts.

**Files:** Create `tests/word-problem-validation.html`

**Validation:**
- >95% of generated problems have mathematically correct answers
- Mismatches documented and prompt adjusted

**Depends on:** 10.2

---

## Sprint 11: Settings, Error Handling & Polish

**Goal:** Add comprehensive settings, error handling, and loading states. Ensure the app handles all edge cases gracefully.

**Demo:** Settings screen with toggles for all features. App handles server failures, storage errors, and edge cases with friendly messages. Loading states throughout.

---

### Ticket 11.1: Settings screen with feature toggles

**Description:** Populate settings screen with toggles: Sound on/off (existing), AI Tutor on/off (hides all AI features), Timer on/off (hides response timer bar), Power-ups on/off (disables spawning), Adaptive difficulty on/off (uses uniform random). Persist in StorageManager.settings. All systems check settings before activating. "Reset Progress" button with confirmation.

**Files:** Modify `index.html`, `js/app.js`, `js/managers/StorageManager.js`, `css/ui.css`

**Validation:**
- AI off → chat icon hidden, word problems hidden, hints static
- Timer off → no timer bar
- Power-ups off → no spawns
- All persist across reload
- Reset → all data cleared

**Depends on:** All feature sprints

---

### Ticket 11.2: Loading states and error boundaries

**Description:** Show spinner during game initialization. Wrap all AI calls in try/catch with child-friendly errors (never raw stack traces). If StorageManager fails (quota exceeded): friendly error + reset offer. If canvas fails: "Your browser doesn't support this game." Global `window.onerror` handler: overlay with "Something went wrong. Click to restart."

**Files:** Modify `js/app.js`, `js/managers/StorageManager.js`, `index.html`, `css/ui.css`

**Validation:**
- Fill localStorage → friendly quota error
- Deliberate JS error → global handler catches, overlay appears
- AI timeout → child-friendly message, not stack trace

**Depends on:** All feature sprints

---

### Ticket 11.3: Offline detection banner

**Description:** On startup, if AIManager's `checkAvailability()` fails, show a non-blocking info banner: "AI features unavailable — game works great without them!" Banner dismissible. AI UI elements hidden. Core game fully functional.

**Files:** Modify `js/app.js`, `css/ui.css`

**Validation:**
- No server → banner appears, all non-AI features work
- Server running → no banner, AI features available
- Banner dismissible

**Depends on:** 7.5

---

### Ticket 11.4: Responsive layout audit

**Description:** Audit all screens at 768px (tablet) and 375px (phone). Fix: level select grid 3-col tablet/2-col phone, ship hangar swipeable, game canvas scales maintaining aspect ratio, chat panel full-height on tablets/full-width on phone, fact mastery grid scales text.

**Files:** Modify `css/ui.css`, `css/game.css`, `css/main.css`

**Validation:**
- iPad (768x1024): all screens usable, no overflow
- iPhone (375x667): canvas fills width, touch targets ≥44px
- Portrait/landscape transition works

**Depends on:** All UI tickets

---

### Ticket 11.5: Accessibility pass

**Description:** Focus indicators (2px outline) on all interactive elements. Color contrast WCAG AA (4.5:1 text, 3:1 UI). Answer buttons keyboard-navigable (arrow keys + Enter). `prefers-reduced-motion` disables particles and animations. ARIA labels on all interactive elements.

**Files:** Modify `css/main.css`, `css/game.css`, `css/animations.css`, `js/app.js`, `js/game/GameEngine.js`

**Validation:**
- Tab through entire app — visible focus rings
- Lighthouse accessibility ≥ 90
- Arrow keys + Enter navigate answer buttons
- Reduced motion preference → particles/animations disabled

**Depends on:** All UI tickets

---

## Sprint 12: Integration Testing & Ship

**Goal:** Comprehensive end-to-end testing and documentation. Verify everything works together.

**Demo:** Full game playthrough demonstrating all features working together. All test suites pass. Documentation complete.

---

### Ticket 12.1: Full integration smoke test

**Description:** Create `tests/integration-smoke.html`: navigate each screen (verify DOM), simulate game per operation (verify questions), verify StorageManager migration, verify FactTracker, verify ship unlock/select, verify power-up activate/deactivate, verify AI fallback, verify chat open/close, verify all achievement conditions callable. Pass/fail dashboard.

**Files:** Create `tests/integration-smoke.html`

**Validation:**
- All tests pass green
- Tests complete within 30 seconds

**Depends on:** All sprints

---

### Ticket 12.2: Performance audit

**Description:** Chrome DevTools profiling. Targets: stable 60fps with 10 enemies + 2 power-ups, no memory leaks over 5 games, no orphaned rAF loops on menu screens, localStorage writes ≤ once per 30s during gameplay, AI requests don't block game loop.

**Files:** Modify as needed based on findings

**Validation:**
- Performance tab: no drops below 45fps
- Memory tab: heap stable over 5 games
- No orphaned animation loops

**Depends on:** All sprints

---

### Ticket 12.3: Server documentation

**Description:** Create `server/README.md`: setup (install, .env, run), all API endpoints with request/response examples and curl commands, rate limiting details, deployment guide (generic for Heroku/Render/Railway).

**Files:** Create `server/README.md`

**Validation:**
- Follow README on clean machine → server starts and serves game
- All curl examples work

**Depends on:** 7.1

---

### Ticket 12.4: End-to-end playthrough validation

**Description:** Manual test: fresh install, play through all operations, build up FactTracker data, enter practice mode, earn stars, unlock all ships, collect all power-up types, use AI chat, play word problems, trigger 5+ achievements, check progress report, toggle settings. Document any bugs found and fix them.

**Files:** Create `tests/e2e-playthrough.md` (test script + results)

**Validation:**
- Complete playthrough with zero blocking bugs
- All features accessible and functional
- Document filed with test results

**Depends on:** All sprints

---

## Summary

| Sprint | Name | Tickets | Key Deliverable |
|--------|------|---------|----------------|
| 1 | Question System + Add/Sub | 9 | Addition & Subtraction playable |
| 2 | Division & Mixed Mode | 7 | All 4 operations + mixed mode |
| 3 | Per-Fact Tracking | 7 | Weighted questions + mastery visualization |
| 4 | Practice Mode & Review | 7 | Practice mode + review scheduling + progress report |
| 5 | Star Economy & Ships | 8 | Star currency + 5 ships in hangar with abilities |
| 6 | Power-ups | 8 | 5 power-ups + HUD + sounds + balance testing |
| 7 | Backend & AI Foundation | 7 | Secure Express server + AIManager with degradation |
| 8 | AI Tutor Chat | 6 | In-game chat with safety + accessibility |
| 9 | AI Hints & Encouragement | 5 | Adaptive hints + personalized encouragement |
| 10 | AI Word Problems | 5 | Word problem mode with AI generation |
| 11 | Settings & Error Handling | 5 | Feature toggles + error boundaries + responsive + a11y |
| 12 | Integration Testing & Ship | 4 | Full test suite + docs + e2e validation |
| **Total** | | **78** | |

## Parallel Tracks

Sprints 5-6 (ships/power-ups) have zero dependency on Sprints 7-8 (backend/AI). With two developers:

```
Developer A: Sprint 1 → 2 → 3 → 4 → 5 → 6 → (merge) → 11 → 12
Developer B:                          7 → 8 → 9 → 10 → (merge) → 11 → 12
```

Sprints 1-4 must complete first (they establish the operation system that everything else builds on). After that, tracks A and B can run in parallel, converging at Sprint 11.
