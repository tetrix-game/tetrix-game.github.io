# E2E Tests for Tetrix Game

## Overview

This directory contains end-to-end tests for the Tetrix game, focusing on save/load functionality after the legacy code cleanup.

## Prerequisites

These tests require Playwright to be installed and configured:

```bash
npm install -D @playwright/test
npx playwright install
```

## Configuration

Create a `playwright.config.ts` in the root directory:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Running Tests

Add scripts to `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

Run tests:

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug

# Run specific test file
npm run test:e2e -- save-load.spec.ts

# Run specific test by name
npm run test:e2e -- -g "should save and restore game state"
```

## Test Files

### `save-load.spec.ts`

Tests for save/load functionality with current format (no legacy code):

- **Basic Save/Load**: Verifies game state persists across page refreshes
- **Queue Restoration**: Tests that shape queue with purchasable slots is restored correctly
- **Unlocked Slots**: Verifies purchased slots remain unlocked after reload
- **Saved Shape**: Tests saved shape is cleared after use and reload
- **Game Over Detection**: Verifies game over state is recalculated on load
- **Hub Mode Transitions**: Tests stats preservation when switching modes
- **Version Mismatch**: Verifies old saves are rejected gracefully
- **Corruption Recovery**: Tests handling of corrupted save data

## Test Data Attributes

The tests assume the following `data-testid` attributes are present in the UI:

```typescript
// Game board
[data-testid="game-board"]

// Tiles
[data-testid="tile-R{row}C{col}"]  // e.g., "tile-R1C1"

// Score
[data-testid="score"]

// Queue
[data-testid="shape-{index}"]          // Shape in queue
[data-testid="purchasable-slot-{n}"]   // Purchasable slot (2, 3, 4)
[data-testid="queue-container"]        // Queue container

// Saved shape
[data-testid="saved-shape"]
[data-testid="save-shape-button"]

// UI elements
[data-testid="game-over-dialog"]
[data-testid="error-dialog"]
[data-testid="hub-mode-button"]
[data-testid="play-button"]
[data-testid="stats-button"]

// Stats
[data-testid="all-time-score"]
```

## Adding Data Attributes to Components

To make the tests work, add these `data-testid` attributes to your React components:

```tsx
// Example for game board
<div data-testid="game-board">
  {/* tiles */}
</div>

// Example for tiles
<div
  data-testid={`tile-R${row}C${col}`}
  className={tile.block.isFilled ? 'filled' : ''}
>
  {/* tile content */}
</div>

// Example for queue shapes
<div data-testid={`shape-${index}`}>
  {/* shape */}
</div>

// Example for purchasable slot
<div data-testid={`purchasable-slot-${slotNumber}`}>
  {/* slot content */}
</div>
```

## Writing New Tests

Follow these patterns:

```typescript
test('should do something', async ({ page }) => {
  // 1. Setup: Navigate and wait for load
  await page.goto('/');
  await page.waitForSelector('[data-testid="game-board"]');

  // 2. Act: Perform actions
  await page.locator('[data-testid="some-button"]').click();

  // 3. Assert: Verify results
  const result = await page.locator('[data-testid="result"]').textContent();
  expect(result).toBe('expected');
});
```

## Debugging Tips

1. **Use headed mode** to see what's happening:
   ```bash
   npm run test:e2e:headed
   ```

2. **Use debug mode** to step through:
   ```bash
   npm run test:e2e:debug
   ```

3. **Add screenshots on failure**:
   ```typescript
   test('my test', async ({ page }) => {
     try {
       // test code
     } catch (error) {
       await page.screenshot({ path: 'failure-screenshot.png' });
       throw error;
     }
   });
   ```

4. **Use console logs**:
   ```typescript
   page.on('console', msg => console.log('PAGE LOG:', msg.text()));
   ```

5. **Check network requests**:
   ```typescript
   page.on('request', request =>
     console.log('>>', request.method(), request.url())
   );
   page.on('response', response =>
     console.log('<<', response.status(), response.url())
   );
   ```

## CI/CD Integration

For continuous integration, add this to your GitHub Actions workflow:

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 30
```

## Coverage

These E2E tests verify:

- ✅ Save/load with current format works correctly
- ✅ Version mismatch rejects old saves
- ✅ Missing required fields are handled gracefully
- ✅ Numeric values are sanitized (NaN, Infinity)
- ✅ isGameOver is never persisted (derived state)
- ✅ Game over state is recalculated on load
- ✅ Purchasable slots in queue are restored correctly
- ✅ UnlockedSlots array converts to Set properly
- ✅ Stats are preserved across mode transitions
- ✅ Corrupted data is handled gracefully
- ✅ No crashes occur with invalid saves

## Next Steps

1. Install Playwright: `npm install -D @playwright/test`
2. Add data-testid attributes to UI components
3. Create `playwright.config.ts`
4. Run tests: `npm run test:e2e`
5. Fix any failing tests
6. Add E2E tests to CI/CD pipeline
