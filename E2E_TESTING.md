# E2E Testing Guide

## Overview

This project includes comprehensive E2E testing capabilities using Playwright. Test utilities are exposed via `window.__testUtils` for programmatic game manipulation in tests.

## Running Tests

```bash
# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test e2e/game-over-bug.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in debug mode
npx playwright test --debug
```

## Available Tests

### `e2e/game-over-bug.spec.ts`
Tests game over detection when loading a board state with no valid moves. Verifies:
- Board state can be loaded via `LOAD_GAME_STATE`
- Game over is detected when shapes cannot fit
- Game over overlay is displayed

### `e2e/complete-placement-game-over.spec.ts`
Tests game over detection through the `COMPLETE_PLACEMENT` action flow. Verifies:
- `checkGameOver` is called after each shape placement
- Game over detection works during normal gameplay
- Board can be filled via multiple placements

## Test Utilities API

## How to Use Fixed Utilities

### In E2E Tests

```typescript
// Simple placement - uses first shape in queue
await page.evaluate(async () => {
  const testUtils = (window as any).__testUtils;
  await testUtils.placePieceAtRow(1);  // Place at row 1
});

// Placement at specific location
await page.evaluate(async () => {
  const testUtils = (window as any).__testUtils;
  await testUtils.placePieceAt(5, 7);  // Place at row 5, column 7
});

// Place specific shape from queue
await page.evaluate(async () => {
  const testUtils = (window as any).__testUtils;
  await testUtils.placeShapeAtIndex(0, 10, 1);  // Place shape at index 0
});

// Manual grid initialization (optional - done automatically)
await page.evaluate(() => {
  const testUtils = (window as any).__testUtils;
  testUtils.initializeGridDimensions();
});

// Debug current state
const state = await page.evaluate(() => {
  const testUtils = (window as any).__testUtils;
  return testUtils.debugState();
});
console.log('Current state:', state);
```

### Available Functions

| Function | Description |
|----------|-------------|
| `initializeGridDimensions()` | Initialize grid dimensions (auto-called if needed) |
| `placePieceAtRow(row, col?)` | Place first shape at specified row |
| `placePieceAtColumn(col, row?)` | Place first shape at specified column |
| `placePieceAt(row, col)` | Place first shape at specific location |
| `placeShapeAtIndex(index, row, col)` | Place specific queue shape |
| `fillBoard()` | Fill entire board (triggers board clear) |
| `getScore()` | Get current score |
| `getBoardClearCount()` | Get board clear count |
| `clearBoard()` | Reset game |
| `debugState()` | Get current game state details |

## Conclusion

The test utilities are now fully functional and can be used to:
- Test the COMPLETE_PLACEMENT code path
- Verify game over detection
- Simulate full gameplay sequences
- Test edge cases with specific board configurations

All E2E tests can now properly test game logic including:
- Shape placement
- Line clearing
- Game over detection
- Score calculation
- Board clear events
