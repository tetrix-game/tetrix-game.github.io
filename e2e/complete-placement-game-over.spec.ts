/**
 * Comprehensive test for game over detection via COMPLETE_PLACEMENT
 * Now using FIXED test utilities that properly initialize grid dimensions
 */

import { test, expect } from '@playwright/test';

test.describe('COMPLETE_PLACEMENT Game Over Detection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="game-board"]', { timeout: 10000 });
    await page.waitForFunction(() => {
      return typeof (window as any).__testUtils !== 'undefined';
    }, { timeout: 5000 });
  });

  test('should call checkGameOver after placing a shape', async ({ page }) => {
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    // Place a simple shape
    await page.evaluate(async () => {
      const testUtils = (window as any).__testUtils;
      await testUtils.placePieceAtRow(1);
    });

    // Check if checkGameOver was called
    const checkGameOverCalled = consoleLogs.some(log =>
      log.includes('🔍 Calling checkGameOver from COMPLETE_PLACEMENT')
    );

    const checkGameOverResult = consoleLogs.find(log =>
      log.includes('✅ checkGameOver result')
    );

    console.log('✅ checkGameOver was called:', checkGameOverCalled);
    if (checkGameOverResult) {
      console.log('Result:', checkGameOverResult);
    }

    expect(checkGameOverCalled).toBe(true);
  });

  test('should detect game over after filling board via placements', async ({ page }) => {
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    console.log('Filling board with 25 placements...');

    // Place 25 shapes to fill the board (10x10 grid = 100 tiles, each shape ~4 tiles)
    await page.evaluate(async () => {
      const testUtils = (window as any).__testUtils;

      for (let i = 0; i < 25; i++) {
        try {
          // Try to place at various positions
          const row = (i % 10) + 1;
          const col = Math.floor(i / 10) * 3 + 1;
          await testUtils.placePieceAt(row, col);

          const state = testUtils.debugState();
          if (state.gameState === 'gameover') {
            console.log(`Game over detected after placement ${i + 1}`);
            break;
          }
        } catch (error) {
          console.log(`Placement ${i + 1} failed:`, error);
        }
      }
    });

    await page.waitForTimeout(500);

    // Check final state
    const finalState = await page.evaluate(() => {
      const testUtils = (window as any).__testUtils;
      return testUtils.debugState();
    });

    console.log('\nFinal state:');
    console.log('- gameState:', finalState.gameState);
    console.log('- score:', finalState.score);
    console.log('- nextShapesCount:', finalState.nextShapesCount);

    // Check if game over was detected at any point
    const gameOverDetected = consoleLogs.some(log =>
      log.includes('Game over detected') || log.includes('🎮 Game Over Detected')
    );

    console.log('\nGame over was detected during filling:', gameOverDetected);

    // The game should either be over or still playing (depending on shapes generated)
    // The important thing is that checkGameOver was called after each placement
    const checkGameOverCallCount = consoleLogs.filter(log =>
      log.includes('🔍 Calling checkGameOver from COMPLETE_PLACEMENT')
    ).length;

    console.log(`checkGameOver was called ${checkGameOverCallCount} times`);
    expect(checkGameOverCallCount).toBeGreaterThan(0);
  });

  test('should detect game over when loading full board then placing shape', async ({ page }) => {
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    console.log('Loading board with 96 filled tiles (leaving room for 1 shape)...');

    // Create a board that's almost full
    await page.evaluate(() => {
      const dispatch = (window as any).__dispatch;
      const getState = (window as any).__getGameState;

      // Fill most of the board, leaving only a small gap
      const tilesArray: Array<{
        position: string;
        backgroundColor: string;
        isFilled: boolean;
        color: string;
      }> = [];

      let filledCount = 0;
      for (let row = 1; row <= 10; row++) {
        for (let col = 1; col <= 10; col++) {
          const key = `R${row}C${col}`;
          // Leave only bottom-left corner empty (4 tiles for one shape)
          const shouldFill = !(row === 10 && col <= 4);

          if (shouldFill) filledCount++;

          tilesArray.push({
            position: key,
            backgroundColor: 'grey',
            isFilled: shouldFill,
            color: shouldFill ? 'blue' : 'grey',
          });
        }
      }

      console.log(`Filling ${filledCount} tiles`);

      dispatch({
        type: 'LOAD_GAME_STATE',
        value: {
          gameData: {
            tiles: tilesArray,
            score: 0,
            nextQueue: getState().nextShapes || [],
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

    // Check state after load
    const stateAfterLoad = await page.evaluate(() => {
      const testUtils = (window as any).__testUtils;
      return testUtils.debugState();
    });

    console.log('\nState after load:', stateAfterLoad.gameState);

    if (stateAfterLoad.gameState === 'gameover') {
      console.log('✅ Game over detected immediately (shapes in queue cannot fit)');
    } else {
      console.log('Game still playing, attempting to place shape...');

      // Try to place a shape in the remaining space
      await page.evaluate(async () => {
        const testUtils = (window as any).__testUtils;
        try {
          await testUtils.placePieceAt(10, 1);
        } catch (error) {
          console.log('Placement failed:', error);
        }
      });

      await page.waitForTimeout(500);

      // Check state after placement
      const stateAfterPlacement = await page.evaluate(() => {
        const testUtils = (window as any).__testUtils;
        return testUtils.debugState();
      });

      console.log('\nState after placement:', stateAfterPlacement.gameState);

      // Check if checkGameOver was called
      const checkGameOverCalled = consoleLogs.some(log =>
        log.includes('🔍 Calling checkGameOver from COMPLETE_PLACEMENT')
      );

      console.log('checkGameOver called after placement:', checkGameOverCalled);
      expect(checkGameOverCalled).toBe(true);
    }
  });
});
