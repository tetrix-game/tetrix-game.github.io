/**
 * E2E test to reproduce the game over detection bug
 *
 * Bug scenario:
 * - Only 1 shape slot unlocked
 * - Board nearly full (66 tiles filled)
 * - Place a shape, new S-piece appears
 * - S-piece has no valid placement
 * - Game over should be detected but isn't
 *
 * This test uses the __testUtils API to programmatically create the exact board state.
 */

import { test, expect, type Page, type ConsoleMessage } from '@playwright/test';

test.describe('Game Over Bug Reproduction', () => {
  let consoleLogs: ConsoleMessage[] = [];

  test.beforeEach(async ({ page }) => {
    // Capture all console messages
    consoleLogs = [];
    page.on('console', (msg) => {
      consoleLogs.push(msg);
    });

    // Navigate to the game
    await page.goto('/');

    // Wait for the game to load
    await page.waitForSelector('[data-testid="game-board"]', { timeout: 10000 });

    // Clear any existing saved data
    await page.evaluate(() => {
      indexedDB.deleteDatabase('tetrix-game-db');
      localStorage.clear();
    });

    // Reload to start fresh
    await page.reload();
    await page.waitForSelector('[data-testid="game-board"]', { timeout: 10000 });

    // Wait for test utils to be available
    await page.waitForFunction(() => {
      return typeof (window as any).__testUtils !== 'undefined';
    }, { timeout: 5000 });
  });

  test('should detect game over when S-piece has no valid placement', async ({ page }) => {
    console.log('Starting game over bug reproduction test...');

    // Step 1: Create the exact board state from bug report
    // Board pattern (0=empty, 1=filled):
    // 0011000000  (row 1) - 2 filled
    // 0111111110  (row 2) - 8 filled
    // 0111111111  (row 3) - 9 filled
    // 0111111011  (row 4) - 8 filled
    // 0111111011  (row 5) - 8 filled
    // 0111111011  (row 6) - 8 filled
    // 0111111001  (row 7) - 7 filled
    // 0111111010  (row 8) - 7 filled
    // 0111111010  (row 9) - 7 filled
    // 0100000010  (row 10) - 2 filled
    // Total: 66 tiles filled

    console.log('Filling board to create bug scenario...');

    await page.evaluate(() => {
      const dispatch = (window as any).__dispatch;
      const getState = (window as any).__getGameState;

      if (!dispatch || !getState) {
        throw new Error('Test utils not available');
      }

      // Define the exact board pattern
      const boardPattern = [
        '0011000000',
        '0111111110',
        '0111111111',
        '0111111011',
        '0111111011',
        '0111111011',
        '0111111001',
        '0111111010',
        '0111111010',
        '0100000010',
      ];

      // Convert pattern to filled positions
      const filledPositions: Array<{ row: number; column: number }> = [];

      boardPattern.forEach((rowPattern, rowIdx) => {
        const row = rowIdx + 1; // 1-indexed
        rowPattern.split('').forEach((cell, colIdx) => {
          const col = colIdx + 1; // 1-indexed
          if (cell === '1') {
            filledPositions.push({ row, column: col });
          }
        });
      });

      console.log(`Setting board with ${filledPositions.length} filled tiles`);

      // Get current state
      const state = getState();

      // Create tiles array in the format expected by LOAD_GAME_STATE
      // Note: LOAD_GAME_STATE expects flat tile format with isFilled and color properties
      const tilesArray: Array<{
        position: string;
        backgroundColor: string;
        isFilled: boolean;
        color: string;
      }> = [];

      // Add all grid positions
      for (let row = 1; row <= 10; row++) {
        for (let col = 1; col <= 10; col++) {
          const key = `R${row}C${col}`;
          const isFilled = filledPositions.some(pos => pos.row === row && pos.column === col);

          tilesArray.push({
            position: key,
            backgroundColor: 'grey',
            isFilled: isFilled,
            color: isFilled ? 'blue' : 'grey',
          });
        }
      }

      dispatch({
        type: 'LOAD_GAME_STATE',
        value: {
          gameData: {
            tiles: tilesArray,
            score: 0,
            nextQueue: state.nextShapes || [],
            savedShape: null,
            totalLinesCleared: 0,
            shapesUsed: 0,
            hasPlacedFirstShape: true,
            queueMode: 'infinite',
            queueColorProbabilities: [],
            queueHiddenShapes: [],
            queueSize: -1,
          },
          stats: null,
        },
      });
    });

    // Wait for board to be set
    await page.waitForTimeout(500);

    // Verify the board has 66 filled tiles
    const filledTileCount = await page.evaluate(() => {
      const tiles = document.querySelectorAll('[data-testid^="tile-"]');
      let count = 0;
      tiles.forEach((tile) => {
        if (tile.classList.contains('filled')) {
          count++;
        }
      });
      return count;
    });

    console.log(`Board has ${filledTileCount} filled tiles (expected 66)`);

    // Step 2: Get the current game state before placement
    const stateBeforePlacement = await page.evaluate(() => {
      return (window as any).__getGameState();
    });

    console.log('State before placement:', {
      nextShapesLength: stateBeforePlacement.nextShapes?.length,
      openRotationMenusLength: stateBeforePlacement.openRotationMenus?.length,
      score: stateBeforePlacement.score,
      gameState: stateBeforePlacement.gameState,
    });

    // Step 3: Place a shape to trigger the new shape generation
    // We need to place the current shape somewhere valid

    const canPlaceShape = await page.evaluate(async () => {
      const testUtils = (window as any).__testUtils;

      // Try to find any valid position to place the current shape
      // We'll try bottom-left corner (row 10, col 1) which is empty
      try {
        await testUtils.placePieceAt(10, 1);
        return true;
      } catch (error) {
        console.error('Failed to place shape:', error);
        return false;
      }
    });

    if (!canPlaceShape) {
      console.log('Could not place initial shape, trying alternative approach...');

      // Alternative: Try to manually trigger COMPLETE_PLACEMENT
      await page.evaluate(() => {
        const dispatch = (window as any).__dispatch;
        if (dispatch) {
          dispatch({ type: 'COMPLETE_PLACEMENT' });
        }
      });
    }

    // Wait for animation and state update
    await page.waitForTimeout(1000);

    // Step 4: Check console logs for debug messages
    console.log('\n=== Console Logs ===');

    const bugDetected = consoleLogs.some((msg) =>
      msg.text().includes('🐛 GAME OVER BUG DETECTED')
    );

    const arrayMismatch = consoleLogs.some((msg) =>
      msg.text().includes('🐛 ARRAY MISMATCH IN COMPLETE_PLACEMENT')
    );

    const unexpectedGameMode = consoleLogs.some((msg) =>
      msg.text().includes('🐛 UNEXPECTED GAME MODE')
    );

    const settingGameOver = consoleLogs.some((msg) =>
      msg.text().includes('🚨 SETTING GAME STATE TO GAMEOVER')
    );

    const gameOverDetected = consoleLogs.some((msg) =>
      msg.text().includes('🎮 Game Over Detected')
    );

    const checkGameOverCall = consoleLogs.filter((msg) =>
      msg.text().includes('🔍 Calling checkGameOver')
    );

    const checkGameOverResult = consoleLogs.filter((msg) =>
      msg.text().includes('✅ checkGameOver result')
    );

    // Print relevant console messages
    consoleLogs.forEach((msg) => {
      const text = msg.text();
      if (
        text.includes('🐛') ||
        text.includes('🚨') ||
        text.includes('⚠️') ||
        text.includes('🎮') ||
        text.includes('🔍') ||
        text.includes('✅')
      ) {
        console.log(text);
      }
    });

    console.log('\n=== Debug Results ===');
    console.log('Bug detected (array mismatch):', bugDetected);
    console.log('Array mismatch in filtering:', arrayMismatch);
    console.log('Unexpected game mode:', unexpectedGameMode);
    console.log('Setting game state to gameover:', settingGameOver);
    console.log('Game over detected:', gameOverDetected);
    console.log('checkGameOver called:', checkGameOverCall.length, 'times');
    console.log('checkGameOver results:', checkGameOverResult.length);

    // Step 5: Check the current game state
    const stateAfterPlacement = await page.evaluate(() => {
      return (window as any).__getGameState();
    });

    console.log('\n=== State After Placement ===');
    console.log('Game state:', stateAfterPlacement.gameState);
    console.log('Next shapes length:', stateAfterPlacement.nextShapes?.length);
    console.log('Open rotation menus length:', stateAfterPlacement.openRotationMenus?.length);
    console.log('Score:', stateAfterPlacement.score);

    // Step 6: Check if game over overlay is displayed
    const gameOverOverlayVisible = await page.locator('[data-testid="game-over-dialog"]').isVisible().catch(() => false);
    console.log('Game over overlay visible:', gameOverOverlayVisible);

    // Step 7: Assertions

    // If bug is detected, report it
    if (bugDetected || arrayMismatch || unexpectedGameMode) {
      console.log('\n🐛 BUG DETECTED IN CONSOLE LOGS!');

      // Extract the error details
      const errorLogs = consoleLogs.filter((msg) =>
        msg.text().includes('🐛')
      );

      errorLogs.forEach((msg) => {
        console.log('ERROR:', msg.text());
      });

      // Fail the test with detailed information
      expect(bugDetected || arrayMismatch || unexpectedGameMode).toBe(false);
    }

    // Check if game over was properly detected
    if (gameOverDetected) {
      console.log('\n✅ Game over was detected in checkGameOver');

      // But was the game state actually set?
      if (stateAfterPlacement.gameState !== 'gameover') {
        console.log('\n🐛 BUG: checkGameOver returned true, but gameState is not "gameover"!');
        console.log('Current gameState:', stateAfterPlacement.gameState);

        expect(stateAfterPlacement.gameState).toBe('gameover');
      }

      // And is the overlay showing?
      if (!gameOverOverlayVisible) {
        console.log('\n🐛 BUG: gameState is "gameover", but overlay is not visible!');
        expect(gameOverOverlayVisible).toBe(true);
      }
    } else {
      console.log('\n🐛 BUG: Game over was NOT detected!');
      console.log('This means checkGameOver was either:');
      console.log('1. Not called at all');
      console.log('2. Called but returned false');
      console.log('3. Called in a different code path');

      // Check if it was called
      if (checkGameOverCall.length === 0) {
        console.log('\ncheckGameOver was NEVER CALLED!');
      } else {
        console.log(`\ncheckGameOver was called ${checkGameOverCall.length} time(s)`);
        checkGameOverResult.forEach((msg) => {
          console.log('Result:', msg.text());
        });
      }

      // This is the bug - game should be over but isn't
      throw new Error('Game over was not detected when it should have been');
    }

    console.log('\n=== Test Complete ===');
  });

  test('should log detailed state when game over fails to detect', async ({ page }) => {
    // Simpler test that just captures everything

    console.log('Creating board state and capturing all logs...');

    // Create board state
    await page.evaluate(() => {
      const dispatch = (window as any).__dispatch;
      const getState = (window as any).__getGameState;

      const boardPattern = [
        '0011000000',
        '0111111110',
        '0111111111',
        '0111111011',
        '0111111011',
        '0111111011',
        '0111111001',
        '0111111010',
        '0111111010',
        '0100000010',
      ];

      const filledPositions: Array<{ row: number; column: number }> = [];

      boardPattern.forEach((rowPattern, rowIdx) => {
        const row = rowIdx + 1;
        rowPattern.split('').forEach((cell, colIdx) => {
          const col = colIdx + 1;
          if (cell === '1') {
            filledPositions.push({ row, column: col });
          }
        });
      });

      const state = getState();

      // Create tiles array in the format expected by LOAD_GAME_STATE
      const tilesArray: Array<{
        position: string;
        backgroundColor: string;
        isFilled: boolean;
        color: string;
      }> = [];

      // Add all grid positions
      for (let row = 1; row <= 10; row++) {
        for (let col = 1; col <= 10; col++) {
          const key = `R${row}C${col}`;
          const isFilled = filledPositions.some(pos => pos.row === row && pos.column === col);

          tilesArray.push({
            position: key,
            backgroundColor: 'grey',
            isFilled: isFilled,
            color: isFilled ? 'blue' : 'grey',
          });
        }
      }

      dispatch({
        type: 'LOAD_GAME_STATE',
        value: {
          gameData: {
            tiles: tilesArray,
            score: 0,
            nextQueue: state.nextShapes || [],
            savedShape: null,
            totalLinesCleared: 0,
            shapesUsed: 0,
            hasPlacedFirstShape: true,
            queueMode: 'infinite',
            queueColorProbabilities: [],
            queueHiddenShapes: [],
            queueSize: -1,
          },
          stats: null,
        },
      });
    });

    await page.waitForTimeout(500);

    // Try to place a shape
    await page.evaluate(async () => {
      const testUtils = (window as any).__testUtils;
      try {
        await testUtils.placePieceAt(10, 1);
      } catch (error) {
        console.error('Placement error:', error);
      }
    });

    await page.waitForTimeout(1000);

    // Dump all console logs
    console.log('\n=== ALL CONSOLE LOGS ===');
    consoleLogs.forEach((msg, index) => {
      console.log(`[${index}] ${msg.type()}: ${msg.text()}`);
    });

    // Dump final state
    const finalState = await page.evaluate(() => {
      return (window as any).__getGameState();
    });

    console.log('\n=== FINAL STATE ===');
    console.log(JSON.stringify(finalState, null, 2));

    // This test doesn't assert, it just logs everything for analysis
  });
});
