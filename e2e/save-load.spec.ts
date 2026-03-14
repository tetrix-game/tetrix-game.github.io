/**
 * E2E tests for save/load functionality
 *
 * Prerequisites:
 * - Install Playwright: npm install -D @playwright/test
 * - Add to package.json scripts: "test:e2e": "playwright test"
 * - Create playwright.config.ts with baseURL: 'http://localhost:5173'
 *
 * Run tests:
 * - npm run test:e2e
 * - npm run test:e2e -- --headed (to see browser)
 * - npm run test:e2e -- --debug (to debug)
 */

import { test, expect, Page } from '@playwright/test';

/**
 * Helper function to place a shape on the board
 */
async function placeShape(page: Page, shapeIndex: number, row: number, col: number) {
  // Click on the shape in the queue
  await page.locator(`[data-testid="shape-${shapeIndex}"]`).click();

  // Click on the target position on the board
  await page.locator(`[data-testid="tile-R${row}C${col}"]`).click();
}

/**
 * Helper function to get the current score
 */
async function getScore(page: Page): Promise<number> {
  const scoreText = await page.locator('[data-testid="score"]').textContent();
  return parseInt(scoreText || '0', 10);
}

/**
 * Helper function to check if a tile is filled
 */
async function isTileFilled(page: Page, row: number, col: number): Promise<boolean> {
  const tile = page.locator(`[data-testid="tile-R${row}C${col}"]`);
  const classes = await tile.getAttribute('class');
  return classes?.includes('filled') || false;
}

/**
 * Helper function to get queue slots
 */
async function getQueueSlots(page: Page): Promise<number> {
  return await page.locator('[data-testid^="shape-"]').count();
}

test.describe('Save/Load Game State', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the game
    await page.goto('/');

    // Wait for the game to load
    await page.waitForSelector('[data-testid="game-board"]');

    // Clear any existing saved data
    await page.evaluate(() => {
      indexedDB.deleteDatabase('tetrix-game-db');
      localStorage.clear();
    });

    // Reload to start fresh
    await page.reload();
    await page.waitForSelector('[data-testid="game-board"]');
  });

  test('should save and restore game state after placing shapes', async ({ page }) => {
    // Verify initial state
    const initialScore = await getScore(page);
    expect(initialScore).toBe(0);

    // Place 5 shapes on the board
    for (let i = 0; i < 5; i++) {
      await placeShape(page, 0, 1, i + 1);
      // Wait for animation
      await page.waitForTimeout(500);
    }

    // Get the score after placing shapes
    const scoreAfterPlacement = await getScore(page);
    expect(scoreAfterPlacement).toBeGreaterThan(0);

    // Verify tiles are filled
    for (let i = 1; i <= 5; i++) {
      const filled = await isTileFilled(page, 1, i);
      expect(filled).toBe(true);
    }

    // Refresh the page
    await page.reload();
    await page.waitForSelector('[data-testid="game-board"]');

    // Verify state is restored
    const scoreAfterReload = await getScore(page);
    expect(scoreAfterReload).toBe(scoreAfterPlacement);

    // Verify tiles are still filled
    for (let i = 1; i <= 5; i++) {
      const filled = await isTileFilled(page, 1, i);
      expect(filled).toBe(true);
    }
  });

  test('should restore unlocked slots after purchase', async ({ page }) => {
    // Check initial queue slots (should be 1)
    const initialSlots = await getQueueSlots(page);
    expect(initialSlots).toBe(1);

    // Earn enough points to purchase slot 2 (500 points needed)
    // Place shapes to earn points...
    // (This would require game-specific logic)

    // Click on purchasable slot 2
    await page.locator('[data-testid="purchasable-slot-2"]').click();

    // Verify slot 2 is now a shape slot
    const slotsAfterPurchase = await getQueueSlots(page);
    expect(slotsAfterPurchase).toBe(2);

    // Refresh the page
    await page.reload();
    await page.waitForSelector('[data-testid="game-board"]');

    // Verify slot 2 is still unlocked
    const slotsAfterReload = await getQueueSlots(page);
    expect(slotsAfterReload).toBe(2);

    // Verify no purchasable slot 2 appears
    const purchasableSlot2 = await page.locator('[data-testid="purchasable-slot-2"]').count();
    expect(purchasableSlot2).toBe(0);
  });

  test('should clear saved shape after placement', async ({ page }) => {
    // Place a shape
    await placeShape(page, 0, 1, 1);
    await page.waitForTimeout(500);

    // Save a shape
    await page.locator('[data-testid="save-shape-button"]').click();

    // Verify saved shape exists
    const savedShapeExists = await page.locator('[data-testid="saved-shape"]').count();
    expect(savedShapeExists).toBe(1);

    // Use the saved shape
    await page.locator('[data-testid="saved-shape"]').click();
    await page.locator('[data-testid="tile-R2C1"]').click();

    // Refresh the page
    await page.reload();
    await page.waitForSelector('[data-testid="game-board"]');

    // Verify saved shape is cleared
    const savedShapeAfterReload = await page.locator('[data-testid="saved-shape"]').count();
    expect(savedShapeAfterReload).toBe(0);
  });

  test('should detect game over on load with full board', async ({ page }) => {
    // Fill the board completely
    // (This would require specific game logic to fill all tiles)

    // Place shapes until the board is nearly full...
    // (Implementation details omitted for brevity)

    // Verify game is not over yet
    const gameOverBefore = await page.locator('[data-testid="game-over-dialog"]').count();
    expect(gameOverBefore).toBe(0);

    // Make the final move that triggers game over
    // (Place a shape that makes no more moves possible)

    // Refresh the page
    await page.reload();
    await page.waitForSelector('[data-testid="game-board"]');

    // Verify game over is detected on load
    const gameOverAfter = await page.locator('[data-testid="game-over-dialog"]').count();
    expect(gameOverAfter).toBe(1);
  });

  test('should preserve stats across hub mode transitions', async ({ page }) => {
    // Place some shapes to build up stats
    for (let i = 0; i < 3; i++) {
      await placeShape(page, 0, 1, i + 1);
      await page.waitForTimeout(500);
    }

    const scoreBeforeHub = await getScore(page);

    // Navigate to hub mode
    await page.locator('[data-testid="hub-mode-button"]').click();
    await page.waitForTimeout(500);

    // Navigate back to game
    await page.locator('[data-testid="play-button"]').click();
    await page.waitForTimeout(500);

    // Verify board is cleared
    const tilesAfterHub = await page.locator('[data-testid*="tile-"][class*="filled"]').count();
    expect(tilesAfterHub).toBe(0);

    // Verify stats are preserved (check all-time stats)
    await page.locator('[data-testid="stats-button"]').click();
    const allTimeScore = await page.locator('[data-testid="all-time-score"]').textContent();
    expect(parseInt(allTimeScore || '0', 10)).toBeGreaterThanOrEqual(scoreBeforeHub);
  });

  test('should start fresh game when old save is incompatible', async ({ page }) => {
    // Inject an old version save directly into IndexedDB
    await page.evaluate(() => {
      const request = indexedDB.open('tetrix-game-db', 1);
      request.onsuccess = (event: any) => {
        const db = event.target.result;
        const transaction = db.transaction(['game_state'], 'readwrite');
        const store = transaction.objectStore('game_state');

        // Save with old version
        const oldSave = {
          version: '0.0.1', // Old version
          score: 1000,
          tiles: [],
          nextQueue: [],
          savedShape: null,
          totalLinesCleared: 10,
          shapesUsed: 5,
          hasPlacedFirstShape: true,
          stats: {},
          lastUpdated: Date.now(),
        };

        store.put(oldSave, 'current');
      };
    });

    // Refresh the page
    await page.reload();
    await page.waitForSelector('[data-testid="game-board"]');

    // Verify game starts fresh (score is 0)
    const score = await getScore(page);
    expect(score).toBe(0);

    // Verify no tiles are filled
    const filledTiles = await page.locator('[data-testid*="tile-"][class*="filled"]').count();
    expect(filledTiles).toBe(0);

    // Verify no error dialog appears
    const errorDialog = await page.locator('[data-testid="error-dialog"]').count();
    expect(errorDialog).toBe(0);
  });
});

test.describe('Queue Restoration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="game-board"]');

    // Clear any existing data
    await page.evaluate(() => {
      indexedDB.deleteDatabase('tetrix-game-db');
      localStorage.clear();
    });

    await page.reload();
    await page.waitForSelector('[data-testid="game-board"]');
  });

  test('should restore queue with purchasable slots correctly', async ({ page }) => {
    // Initial state: slot 1 unlocked, slots 2-4 are purchasable

    // Refresh and verify queue structure
    await page.reload();
    await page.waitForSelector('[data-testid="game-board"]');

    // Count shapes and purchasable slots
    const shapeSlots = await page.locator('[data-testid^="shape-"]').count();
    const purchasableSlots = await page.locator('[data-testid^="purchasable-slot-"]').count();

    expect(shapeSlots).toBe(1); // Only slot 1 has a shape
    expect(purchasableSlots).toBe(3); // Slots 2, 3, 4 are purchasable
  });

  test('should handle queue with mixed shapes and purchasable slots', async ({ page }) => {
    // Purchase slot 2 (would require earning 500 points first)
    // ... purchase logic ...

    // Now we have: [shape, shape, purchasable-3, purchasable-4]

    // Refresh
    await page.reload();
    await page.waitForSelector('[data-testid="game-board"]');

    // Verify queue is restored correctly
    const queue = await page.locator('[data-testid="queue-container"] > *').all();
    expect(queue.length).toBe(4);

    // Verify slot types
    const slot1Type = await queue[0].getAttribute('data-testid');
    const slot2Type = await queue[1].getAttribute('data-testid');
    const slot3Type = await queue[2].getAttribute('data-testid');
    const slot4Type = await queue[3].getAttribute('data-testid');

    expect(slot1Type).toContain('shape-');
    expect(slot2Type).toContain('shape-');
    expect(slot3Type).toBe('purchasable-slot-3');
    expect(slot4Type).toBe('purchasable-slot-4');
  });
});

test.describe('Version Mismatch Handling', () => {
  test('should handle version mismatch gracefully', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="game-board"]');

    // Inject save with wrong version
    await page.evaluate(() => {
      const request = indexedDB.open('tetrix-game-db', 1);
      request.onsuccess = (event: any) => {
        const db = event.target.result;
        const transaction = db.transaction(['game_state'], 'readwrite');
        const store = transaction.objectStore('game_state');

        const wrongVersionSave = {
          version: '99.99.99',
          score: 5000,
          tiles: [{ position: 'R1C1', isFilled: true, color: 'blue' }],
          nextQueue: [],
          savedShape: null,
          totalLinesCleared: 50,
          shapesUsed: 100,
          hasPlacedFirstShape: true,
          stats: {},
          lastUpdated: Date.now(),
        };

        store.put(wrongVersionSave, 'current');
      };
    });

    // Refresh
    await page.reload();
    await page.waitForSelector('[data-testid="game-board"]');

    // Verify fresh game starts (old save rejected)
    const score = await getScore(page);
    expect(score).toBe(0);

    // Verify no crash occurred
    const errorDialog = await page.locator('[data-testid="error-dialog"]').count();
    expect(errorDialog).toBe(0);
  });
});

test.describe('Corruption Recovery', () => {
  test('should handle corrupted tiles data', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="game-board"]');

    // Inject corrupted save with invalid tile data
    await page.evaluate(() => {
      const request = indexedDB.open('tetrix-game-db', 1);
      request.onsuccess = (event: any) => {
        const db = event.target.result;
        const transaction = db.transaction(['game_state'], 'readwrite');
        const store = transaction.objectStore('game_state');

        const corruptedSave = {
          version: '1.6.0',
          score: 100,
          tiles: [
            { position: 'R1C1', isFilled: true, color: 'INVALID_COLOR' },
            { position: 'INVALID_POSITION', isFilled: true, color: 'blue' },
          ],
          nextQueue: [],
          savedShape: null,
          totalLinesCleared: 0,
          shapesUsed: 0,
          hasPlacedFirstShape: false,
          stats: {},
          lastUpdated: Date.now(),
        };

        store.put(corruptedSave, 'current');
      };
    });

    // Refresh
    await page.reload();
    await page.waitForSelector('[data-testid="game-board"]');

    // Verify game loads (with sanitization or rejection)
    // Should either start fresh or load with sanitized data
    const boardExists = await page.locator('[data-testid="game-board"]').count();
    expect(boardExists).toBe(1);

    // No crash
    const errorDialog = await page.locator('[data-testid="error-dialog"]').count();
    expect(errorDialog).toBe(0);
  });

  test('should handle corrupted nextQueue data', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="game-board"]');

    // Inject corrupted queue
    await page.evaluate(() => {
      const request = indexedDB.open('tetrix-game-db', 1);
      request.onsuccess = (event: any) => {
        const db = event.target.result;
        const transaction = db.transaction(['game_state'], 'readwrite');
        const store = transaction.objectStore('game_state');

        const corruptedSave = {
          version: '1.6.0',
          score: 0,
          tiles: [],
          nextQueue: [
            { type: 'INVALID_TYPE', shape: null },
            { type: 'purchasable-slot', cost: -1, slotNumber: 999 },
          ],
          savedShape: null,
          totalLinesCleared: 0,
          shapesUsed: 0,
          hasPlacedFirstShape: false,
          stats: {},
          lastUpdated: Date.now(),
        };

        store.put(corruptedSave, 'current');
      };
    });

    // Refresh
    await page.reload();
    await page.waitForSelector('[data-testid="game-board"]');

    // Verify game handles gracefully
    const boardExists = await page.locator('[data-testid="game-board"]').count();
    expect(boardExists).toBe(1);

    const errorDialog = await page.locator('[data-testid="error-dialog"]').count();
    expect(errorDialog).toBe(0);
  });
});
