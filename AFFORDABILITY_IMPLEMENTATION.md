# Game Over Affordability Check - Implementation Summary

## What Was Implemented

Extended the game over bug fix to include **affordability checking** for rotation unlocks.

## The Problem

The game over logic only checked if rotation menus were already unlocked (`openRotationMenus[i] === true`), but didn't consider whether the player had enough points to unlock them.

**Example scenario:**
- Player has 5 points
- Board is nearly full
- Horizontal line shape won't fit in current orientation
- BUT it would fit if rotated (costs 1 point to unlock rotation)
- **Old behavior:** Game over (rotation menu not unlocked)
- **New behavior:** NOT game over (player can afford to unlock rotation)

## The Solution

### Core Logic Change

**File:** `/src/gameOverUtils/index.ts`

Added `currentScore` parameter and affordability check:

```typescript
export function checkGameOver(
  tiles: TilesSet,
  shapes: Shape[],
  openRotationMenus: boolean[],
  gameMode: GameMode = 'infinite',
  currentScore: number = 0,  // NEW PARAMETER
): boolean {
  // For each shape, determine rotation checks:
  const isRotationUnlocked = openRotationMenus[i];
  const canAffordRotation = currentScore >= 1; // Rotation costs 1 point

  // Check all 4 rotations if EITHER unlocked OR affordable
  const rotationsToCheck = (isRotationUnlocked || canAffordRotation) ? 4 : 1;
}
```

### Decision Logic

For each shape, the number of rotations checked depends on:

| Menu Unlocked | Score >= 1 | Rotations Checked | Reason |
|---------------|-----------|-------------------|---------|
| ✅ Yes | ✅ Yes | 4 | Already paid for rotation |
| ✅ Yes | ❌ No | 4 | Already paid for rotation (score doesn't matter) |
| ❌ No | ✅ Yes | 4 | **Can afford to unlock if needed** |
| ❌ No | ❌ No | 1 | Cannot afford rotation |

## Updated Call Sites

### 1. `/src/tileReducer/index.ts` (COMPLETE_PLACEMENT)

```typescript
isGameOver = checkGameOver(
  lineClearResult.tiles,
  plainShapes,
  plainShapesMenuStates,
  state.gameMode,
  newScore,  // Pass score AFTER points earned from line clears
);
```

### 2. `/src/gameStateReducer/index.ts` (LOAD_GAME_STATE)

```typescript
actuallyGameOver = checkGameOver(
  tilesMap,
  plainShapesForCheck,
  plainShapesMenuStates,
  state.gameMode,
  gameData.score,  // Pass loaded score from saved game
);
```

## Test Coverage

### New Test Suite Section

**7 new affordability tests added** to `/src/test/gameOverInfiniteMode.test.ts`:

1. ✅ **Check all 4 rotations when score >= 1** (can afford)
2. ✅ **Check only 1 rotation when score = 0** (cannot afford)
3. ✅ **Always check all 4 rotations when menu unlocked** (regardless of score)
4. ✅ **Mixed scenarios** (some shapes affordable, some not)
5. ✅ **Game over when score = 0** and no shapes fit without rotation
6. ✅ **Check all rotations with score > 1** (more than enough)
7. ✅ **Boundary case: exactly 1 point**

### Test Results

```
✅ 32 tests passed (25 original + 7 new affordability tests)
✅ 0 tests failed
✅ TypeScript compilation successful
✅ Build completes without errors
```

## Rotation Unlock Cost

**Current cost:** 1 point (defined in `/src/scoringReducer/index.ts`)

```typescript
case 'SPEND_COIN': {
  if (state.score <= 0) {
    return { ...state, insufficientFundsError: Date.now() };
  }
  const newScore = Math.max(0, state.score - 1); // Cost is 1 point
  const newOpenRotationMenus = [...state.openRotationMenus];
  newOpenRotationMenus[shapeIndex] = true; // Unlock rotation menu
  // ...
}
```

**⚠️ Important:** If rotation cost changes in the future, update the hardcoded value `1` in:
- `/src/gameOverUtils/index.ts` line: `const canAffordRotation = currentScore >= 1;`

## Example Scenarios

### Scenario 1: Player Has Points, Can Escape Game Over

**Setup:**
- Score: 5 points
- Board: Nearly full, only vertical space remains
- Shape: Horizontal line (doesn't fit)
- Rotation menu: Closed (not unlocked yet)

**Old Behavior:** ❌ Game Over (rotation menu not unlocked)
**New Behavior:** ✅ Continue Playing (player can afford to unlock rotation)

### Scenario 2: Player Has 0 Points, True Game Over

**Setup:**
- Score: 0 points
- Board: Nearly full, only vertical space remains
- Shape: Horizontal line (doesn't fit)
- Rotation menu: Closed

**Old Behavior:** ❌ Game Over
**New Behavior:** ❌ Game Over (correct - cannot afford rotation)

### Scenario 3: Rotation Already Unlocked, Score Doesn't Matter

**Setup:**
- Score: 0 points (spent earlier)
- Board: Nearly full, only vertical space remains
- Shape: Horizontal line (doesn't fit in current orientation)
- Rotation menu: **Unlocked** (paid 1 point earlier)

**Old Behavior:** ✅ Continue Playing (rotation unlocked)
**New Behavior:** ✅ Continue Playing (rotation unlocked, score irrelevant)

## Manual Testing Checklist

### Test A: Affordability Saves Player from Game Over

1. Start new game
2. Play until score = 5
3. Fill board leaving only vertical spaces
4. Get horizontal line shape
5. **Expected:** Game continues (can afford rotation)
6. Actually rotate the shape (spend 1 point)
7. Place the rotated shape

### Test B: Zero Score Triggers Game Over

1. Start new game
2. Spend all points on rotations until score = 0
3. Fill board leaving only vertical spaces
4. Get horizontal line shape (not rotated)
5. **Expected:** Game over (cannot afford rotation)

### Test C: Unlocked Rotation Works with Zero Score

1. Start new game
2. Unlock rotation for first shape (score becomes 0)
3. Fill board leaving only vertical spaces
4. Have the unlocked shape as only option
5. **Expected:** Game continues (rotation already unlocked)

## Backward Compatibility

✅ **Fully backward compatible**
- `currentScore` parameter is optional (defaults to 0)
- Existing calls without score parameter still work
- Old saved games load correctly
- No breaking changes to public APIs

## Performance Impact

✅ **Minimal impact**
- Single integer comparison per shape: `currentScore >= 1`
- No additional loops or iterations
- Same time complexity as before

## Edge Cases Handled

1. ✅ Score exactly 1 (boundary case)
2. ✅ Score > 1 (more than enough)
3. ✅ Score = 0 (cannot afford)
4. ✅ Negative scores (treated as 0, cannot afford)
5. ✅ Menu already unlocked + score = 0 (rotation still available)
6. ✅ Mixed queue with multiple shapes at different affordability levels

## Future Considerations

### If Rotation Cost Changes

If `SPEND_COIN` cost is updated in `/src/scoringReducer/index.ts`, update:

```typescript
// In /src/gameOverUtils/index.ts
const ROTATION_UNLOCK_COST = 1; // Update this constant
const canAffordRotation = currentScore >= ROTATION_UNLOCK_COST;
```

Consider extracting this constant to a shared config file.

### Potential Enhancements

- Progressive rotation costs (first unlock: 1 point, subsequent: 2 points, etc.)
- Dynamic rotation costs based on shape complexity
- "Rotation tokens" separate from main score
- Bulk unlock (unlock all shapes at once for discount)

None of these are currently implemented - the cost is fixed at 1 point per shape.
