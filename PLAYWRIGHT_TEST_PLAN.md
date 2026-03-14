# Playwright Testing Plan - Game Over Logic

## Overview

This document outlines comprehensive testing procedures to verify the game over bug fixes using both manual browser testing and automated approaches.

## Fixes Being Tested

1. **Array Alignment Fix**: Ensures `plainShapes` and rotation menu states arrays are properly aligned when purchasable slots exist in the queue
2. **Affordability Check**: Game over logic now considers whether player can afford to unlock rotation (1 point cost)

## Test Scenarios

### Scenario 1: Affordability Check - Player Has Points

**Setup:**
1. Open http://localhost:5173
2. Clear browser storage (DevTools > Application > Clear storage)
3. Reload page to start fresh game
4. Play normally until score = 5 points

**Actions:**
1. Fill the board leaving only vertical spaces (rows 3-6, column 5)
2. Wait for horizontal line shape to appear
3. Verify rotation menu is NOT already unlocked (no open circle icon)

**Expected Result:**
- ✅ Game should NOT be over (player has 5 points, can afford rotation)
- ✅ Player can click rotation button, spend 1 point, and rotate shape
- ✅ Player can place the rotated shape in vertical space

**Old Behavior (Bug):**
- ❌ Game over would trigger incorrectly (rotation not considered)

**How to Verify:**
```javascript
// In browser console:
// 1. Check current score
document.querySelector('[class*="score"]')?.textContent
// Should show "5" or similar

// 2. Check game state
// If "Game Over" modal appears, the bug still exists
// If game continues, the fix works correctly
```

---

### Scenario 2: Affordability Check - Player Has 0 Points

**Setup:**
1. Start fresh game (clear storage)
2. Play until score reaches 3 points
3. Spend all 3 points unlocking rotations
4. Score should now be 0

**Actions:**
1. Fill board leaving only vertical spaces
2. Wait for horizontal line shape (not rotated)
3. Verify rotation menu is closed

**Expected Result:**
- ✅ Game over SHOULD trigger (score = 0, cannot afford rotation)
- ✅ "Game Over" modal appears
- ✅ Cannot continue playing

**Old Behavior:**
- Would also trigger game over (correct in this case)

**How to Verify:**
```javascript
// In browser console before game over:
document.querySelector('[class*="score"]')?.textContent
// Should show "0"

// Game over modal should appear
document.querySelector('[class*="game-over"]') !== null
// Should be true
```

---

### Scenario 3: Rotation Already Unlocked (Score = 0)

**Setup:**
1. Start fresh game
2. Get first shape, unlock rotation (spend 1 point, score = 0)
3. Fill board leaving only vertical spaces

**Actions:**
1. Have the shape with unlocked rotation menu active
2. Verify rotation menu shows as unlocked (open circle icon)

**Expected Result:**
- ✅ Game should NOT be over (rotation already unlocked, score doesn't matter)
- ✅ Player can rotate the shape using the rotation menu
- ✅ Player can place the rotated shape

**Old Behavior:**
- Would continue correctly (rotation menu state was checked)

**How to Verify:**
```javascript
// Check if rotation menu is unlocked for active shape
// Look for visual indicator (open circle icon)
// Should be able to rotate without spending more points
```

---

### Scenario 4: Array Alignment with Purchasable Slots

**Setup:**
1. Start fresh game (1 slot unlocked)
2. Earn at least 10 points
3. Purchase slot 2 (costs points)
4. A purchasable slot should appear in the queue

**Actions:**
1. Fill board leaving limited space
2. Place a shape (triggers game over check)
3. Queue now has: [shape, shape, purchasable-slot, shape]

**Expected Result:**
- ✅ Game over check should work correctly
- ✅ No index mismatch errors in console
- ✅ Correct rotation states checked for each shape
- ✅ No false game over when valid moves exist

**Old Behavior (Bug):**
- ❌ Array mismatch: `plainShapes.length` !== `menusAfterRemoval.length`
- ❌ Wrong rotation state accessed for shapes after purchasable slot
- ❌ False game over or missed game over

**How to Verify:**
```javascript
// Open browser DevTools console
// Should see NO errors like:
// "Cannot read property at index X"
// or similar array access errors

// Game should continue if moves are possible
// Game should end only when truly no moves remain
```

---

### Scenario 5: Mixed Queue with Multiple Purchasable Slots

**Setup:**
1. Unlock all 4 shape slots
2. Purchase slots 2, 3, and 4 at different times
3. Queue becomes: [shape, purchasable, shape, purchasable, shape]

**Actions:**
1. Fill board nearly full
2. Place shapes sequentially
3. Each placement triggers game over check with different queue configurations

**Expected Result:**
- ✅ Game over checks work correctly at each step
- ✅ Array alignment maintained throughout
- ✅ Correct rotation states used for each shape
- ✅ No console errors

**Old Behavior (Bug):**
- ❌ High chance of array mismatch
- ❌ Incorrect game over detection

**How to Verify:**
```javascript
// Monitor console for errors during gameplay
// Watch for any array access errors
// Verify game over triggers at correct time
```

---

## Automated Testing with Playwright

### Test File Location
`/Users/tannerbrobers/dev/tetrix-game/e2e/gameOver.spec.ts` (to be created)

### Sample Test Code

```typescript
import { test, expect } from '@playwright/test';

test.describe('Game Over - Affordability Checks', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    // Clear storage
    await page.evaluate(() => {
      localStorage.clear();
      indexedDB.deleteDatabase('TetrixDB');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should not trigger game over when player has points for rotation', async ({ page }) => {
    // TODO: Implement game state manipulation
    // This requires either:
    // 1. Exposing test utilities on window object
    // 2. Using direct state injection
    // 3. Playing through the game to reach desired state

    // For now, manual testing is more practical
    expect(true).toBe(true); // Placeholder
  });

  test('should trigger game over when player has 0 points', async ({ page }) => {
    // TODO: Implement
    expect(true).toBe(true); // Placeholder
  });

  test('should handle purchasable slots in queue correctly', async ({ page }) => {
    // TODO: Implement
    expect(true).toBe(true); // Placeholder
  });
});
```

---

## Manual Test Execution Checklist

### Pre-Testing
- [ ] Build the latest code: `npm run build`
- [ ] Start dev server: `npm run dev`
- [ ] Open browser to http://localhost:5173
- [ ] Open DevTools console

### Test Execution
- [ ] Execute Scenario 1: Affordability with points ✅
- [ ] Execute Scenario 2: Affordability without points ✅
- [ ] Execute Scenario 3: Rotation already unlocked ✅
- [ ] Execute Scenario 4: Array alignment with slots ✅
- [ ] Execute Scenario 5: Mixed queue ✅

### Results Documentation
For each scenario, record:
- ✅ Pass / ❌ Fail
- Screenshots of key moments
- Console errors (if any)
- Actual vs Expected behavior

---

## Debug Utilities

### Access Game State in Console

```javascript
// Find React root
const root = document.querySelector('#root');
const reactKey = Object.keys(root).find(k => k.startsWith('__react'));
const fiber = root[reactKey];

// Navigate fiber tree to find state
// (This is a hack for debugging, not recommended for production)
```

### Inject Test State

```javascript
// If test utilities are exposed:
window.__TETRIX_TEST__.setState({
  score: 0,
  nextShapes: [/* shapes */],
  openRotationMenus: [false, false, false]
});
```

### Monitor Game Over Checks

```javascript
// Add breakpoint in gameOverUtils/index.ts
// Or add console.log:
export function checkGameOver(tiles, shapes, openRotationMenus, gameMode, currentScore) {
  console.log('Game Over Check:', {
    shapesCount: shapes.length,
    currentScore,
    menusState: openRotationMenus
  });
  // ... rest of function
}
```

---

## Success Criteria

All scenarios must pass with these results:

1. ✅ Affordability correctly prevents false game over when score >= 1
2. ✅ Game over triggers correctly when score = 0 and rotation needed
3. ✅ Rotation menu state always respected regardless of score
4. ✅ No array index errors with purchasable slots
5. ✅ Correct rotation states used for all shapes in queue
6. ✅ No console errors during gameplay
7. ✅ Game over triggers only when truly no moves remain

---

## Troubleshooting

### Issue: Game doesn't load
- Check console for errors
- Verify dev server is running
- Clear browser cache
- Try incognito mode

### Issue: Can't reproduce specific board state
- Use debug menu (if available)
- Manually place shapes to create desired pattern
- Consider adding test utilities to inject state

### Issue: Unclear if test passed
- Add console.log statements
- Use browser debugger breakpoints
- Take screenshots at each step
- Compare with expected behavior from test plan

---

## Future Improvements

1. **Expose Test API**: Add `window.__TETRIX_TEST__` object with utilities:
   - `setState(partialState)`: Inject game state
   - `fillBoard(pattern)`: Create specific board patterns
   - `addShape(shapeType)`: Add specific shape to queue
   - `setScore(amount)`: Set player score

2. **E2E Test Framework**: Full Playwright test suite with state injection

3. **Visual Regression**: Screenshot comparison for game over modal

4. **Performance Tests**: Verify game over check performance with large queues

---

## Notes

- Rotation unlock cost: 1 point (defined in `scoringReducer/index.ts`)
- If cost changes, update tests accordingly
- Game over logic in: `gameOverUtils/index.ts`
- State managed by: `tileReducer/index.ts` and `gameStateReducer/index.ts`
