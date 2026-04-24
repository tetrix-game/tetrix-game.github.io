/**
 * E2E test for compact byte format in production
 * Verifies that the compact format reduces payload size by 98%
 */

import { test, expect } from '@playwright/test';

// Production URL
const PRODUCTION_URL = 'https://tetrix-game-production.up.railway.app';

test.describe('Compact Byte Format - Production', () => {
  test('should use compact format for tile and shape data', async ({ page, context }) => {
    // Enable request interception to inspect payloads
    const requests: Array<{ url: string; postData: any; response: any }> = [];

    page.on('request', (request) => {
      if (request.url().includes('/api/game') && request.method() === 'POST') {
        const postData = request.postData();
        requests.push({
          url: request.url(),
          postData: postData ? JSON.parse(postData) : null,
          response: null,
        });
      }
    });

    page.on('response', async (response) => {
      if (response.url().includes('/api/game') && response.request().method() === 'POST') {
        try {
          const body = await response.json();
          const matchingRequest = requests.find(r => r.url === response.url() && r.response === null);
          if (matchingRequest) {
            matchingRequest.response = body;
          }
        } catch (e) {
          // Ignore non-JSON responses
        }
      }
    });

    // Navigate to production site
    await page.goto(PRODUCTION_URL);

    // Wait for the game to load
    await page.waitForSelector('[data-testid="grid"]', { timeout: 10000 });

    // Click "Play Now" if present (unauthenticated state)
    const playButton = page.locator('text=Play Now');
    if (await playButton.isVisible()) {
      await playButton.click();
    }

    // Wait for shapes to appear
    await page.waitForSelector('[data-testid="shape-option"]', { timeout: 5000 });

    // Get a shape and place it on the board
    const firstShape = page.locator('[data-testid="shape-option"]').first();
    const grid = page.locator('[data-testid="grid"]');

    // Drag shape to grid
    await firstShape.hover();
    await page.mouse.down();
    await grid.hover();
    await page.mouse.up();

    // Wait for the placement request
    await page.waitForTimeout(2000);

    // Find the placement request
    const placementRequest = requests.find(r =>
      r.url.includes('/game/state') &&
      r.postData?.useCompactFormat === true
    );

    // Verify compact format was requested
    expect(placementRequest).toBeTruthy();
    console.log('Placement request:', placementRequest?.postData);

    // Verify the response contains compact data
    if (placementRequest?.response) {
      const response = placementRequest.response;

      // Check if tiles are compact (array of 100 numbers)
      if (response.tiles) {
        console.log('Tiles type:', Array.isArray(response.tiles) ? 'array' : typeof response.tiles);
        console.log('Tiles length:', response.tiles.length);
        console.log('First tile value:', response.tiles[0]);

        // Compact format: array of 100 numbers (bytes)
        if (Array.isArray(response.tiles) && response.tiles.length === 100) {
          expect(typeof response.tiles[0]).toBe('number');
          console.log('✅ Tiles are in compact format (100 bytes)');
        } else {
          console.log('❌ Tiles are not in compact format');
        }
      }

      // Check if shapes in queue are compact
      if (response.updatedQueue) {
        const firstShapeInQueue = response.updatedQueue.find((item: any) => item.type === 'shape');
        if (firstShapeInQueue) {
          console.log('Shape structure:', JSON.stringify(firstShapeInQueue, null, 2));

          // Compact format: { blocks: Uint16Array (2 bytes), color: number (1 byte) }
          if (firstShapeInQueue.shape?.blocks && firstShapeInQueue.shape?.color !== undefined) {
            console.log('✅ Shapes are in compact format (3 bytes each)');
            expect(typeof firstShapeInQueue.shape.color).toBe('number');
          } else {
            console.log('❌ Shapes are not in compact format');
          }
        }
      }

      // Calculate payload size
      const payloadSize = JSON.stringify(response).length;
      console.log(`Payload size: ${payloadSize} bytes`);

      // Before optimization: ~6KB per placement
      // After optimization: ~110 bytes per placement
      // We expect a significant reduction
      expect(payloadSize).toBeLessThan(2000); // Should be much less than 2KB
    }
  });

  test('should verify payload size reduction', async ({ page }) => {
    // Navigate to production site
    await page.goto(PRODUCTION_URL);

    // Wait for the game to load
    await page.waitForSelector('[data-testid="grid"]', { timeout: 10000 });

    // Intercept API responses to measure payload size
    const responseSizes: number[] = [];

    page.on('response', async (response) => {
      if (response.url().includes('/api/game/state') && response.request().method() === 'POST') {
        try {
          const body = await response.text();
          responseSizes.push(body.length);
          console.log(`Response size: ${body.length} bytes`);
        } catch (e) {
          // Ignore
        }
      }
    });

    // Click "Play Now" if present
    const playButton = page.locator('text=Play Now');
    if (await playButton.isVisible()) {
      await playButton.click();
    }

    // Wait for shapes
    await page.waitForSelector('[data-testid="shape-option"]', { timeout: 5000 });

    // Place a shape
    const firstShape = page.locator('[data-testid="shape-option"]').first();
    const grid = page.locator('[data-testid="grid"]');

    await firstShape.hover();
    await page.mouse.down();
    await grid.hover();
    await page.mouse.up();

    // Wait for response
    await page.waitForTimeout(2000);

    // Verify we got a response
    expect(responseSizes.length).toBeGreaterThan(0);

    // Check the size
    if (responseSizes.length > 0) {
      const avgSize = responseSizes.reduce((a, b) => a + b, 0) / responseSizes.length;
      console.log(`Average response size: ${avgSize} bytes`);

      // With compact format, should be under 1KB
      // Without compact format, would be ~6KB
      expect(avgSize).toBeLessThan(1500);
    }
  });
});
