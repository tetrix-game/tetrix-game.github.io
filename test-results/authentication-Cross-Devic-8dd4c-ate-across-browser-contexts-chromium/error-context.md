# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: authentication.spec.ts >> Cross-Device Sync Simulation >> should sync game state across browser contexts
- Location: e2e/authentication.spec.ts:264:3

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('[data-testid="game-grid"]') to be visible

```

# Test source

```ts
  177 |     await expect(page.locator('.user-email')).toHaveText(testEmail);
  178 |   });
  179 | });
  180 | 
  181 | test.describe('Game State Persistence', () => {
  182 |   test('should save and load game state when authenticated', async ({ page }) => {
  183 |     const testEmail = generateTestEmail();
  184 | 
  185 |     // Register user
  186 |     await page.goto('/');
  187 |     await page.waitForSelector('[data-testid="game-grid"]', { timeout: 10000 });
  188 |     await page.locator('button[aria-label="Login"]').click();
  189 |     await page.locator('button:has-text("Create Account")').click();
  190 |     await page.locator('input[type="email"]').fill(testEmail);
  191 |     await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
  192 |     await page.locator('input[type="password"]').last().fill(TEST_PASSWORD);
  193 |     await page.locator('button[type="submit"]').click();
  194 |     await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
  195 | 
  196 |     // Get initial score
  197 |     const scoreElement = page.locator('[data-testid="score"]');
  198 |     await expect(scoreElement).toBeVisible();
  199 |     const initialScore = await scoreElement.textContent();
  200 | 
  201 |     // Place a shape (if possible)
  202 |     const shapeButtons = page.locator('[data-testid^="shape-button-"]');
  203 |     const firstShapeButton = shapeButtons.first();
  204 | 
  205 |     if (await firstShapeButton.isVisible()) {
  206 |       // Drag shape to grid
  207 |       const firstGridCell = page.locator('[data-testid="tile-R0C0"]');
  208 |       await firstShapeButton.dragTo(firstGridCell);
  209 | 
  210 |       // Wait for score to update
  211 |       await page.waitForTimeout(500);
  212 |       const newScore = await scoreElement.textContent();
  213 | 
  214 |       // Verify score changed
  215 |       expect(newScore).not.toBe(initialScore);
  216 | 
  217 |       // Refresh page
  218 |       await page.reload();
  219 |       await page.waitForSelector('[data-testid="game-grid"]', { timeout: 10000 });
  220 | 
  221 |       // Verify score persisted
  222 |       const loadedScore = await page.locator('[data-testid="score"]').textContent();
  223 |       expect(loadedScore).toBe(newScore);
  224 |     }
  225 |   });
  226 | 
  227 |   test('should not share state between different users', async ({ page, context }) => {
  228 |     const testEmail1 = generateTestEmail();
  229 |     const testEmail2 = generateTestEmail();
  230 | 
  231 |     // Register and play as user 1
  232 |     await page.goto('/');
  233 |     await page.waitForSelector('[data-testid="game-grid"]', { timeout: 10000 });
  234 |     await page.locator('button[aria-label="Login"]').click();
  235 |     await page.locator('button:has-text("Create Account")').click();
  236 |     await page.locator('input[type="email"]').fill(testEmail1);
  237 |     await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
  238 |     await page.locator('input[type="password"]').last().fill(TEST_PASSWORD);
  239 |     await page.locator('button[type="submit"]').click();
  240 |     await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
  241 | 
  242 |     const user1Score = await page.locator('[data-testid="score"]').textContent();
  243 | 
  244 |     // Logout
  245 |     await page.locator('button.logout-button').click();
  246 | 
  247 |     // Register as user 2
  248 |     await page.locator('button[aria-label="Login"]').click();
  249 |     await page.locator('button:has-text("Create Account")').click();
  250 |     await page.locator('input[type="email"]').fill(testEmail2);
  251 |     await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
  252 |     await page.locator('input[type="password"]').last().fill(TEST_PASSWORD);
  253 |     await page.locator('button[type="submit"]').click();
  254 |     await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
  255 | 
  256 |     const user2Score = await page.locator('[data-testid="score"]').textContent();
  257 | 
  258 |     // User 2 should start with fresh state (score 0)
  259 |     expect(user2Score).toBe(user1Score); // Both should be 0 if no shapes placed
  260 |   });
  261 | });
  262 | 
  263 | test.describe('Cross-Device Sync Simulation', () => {
  264 |   test('should sync game state across browser contexts', async ({ browser }) => {
  265 |     const testEmail = generateTestEmail();
  266 | 
  267 |     // Create two browser contexts (simulating two devices)
  268 |     const context1 = await browser.newContext();
  269 |     const context2 = await browser.newContext();
  270 | 
  271 |     const page1 = await context1.newPage();
  272 |     const page2 = await context2.newPage();
  273 | 
  274 |     try {
  275 |       // Device 1: Register and play
  276 |       await page1.goto('http://localhost:5173');
> 277 |       await page1.waitForSelector('[data-testid="game-grid"]', { timeout: 10000 });
      |                   ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  278 |       await page1.locator('button[aria-label="Login"]').click();
  279 |       await page1.locator('button:has-text("Create Account")').click();
  280 |       await page1.locator('input[type="email"]').fill(testEmail);
  281 |       await page1.locator('input[type="password"]').first().fill(TEST_PASSWORD);
  282 |       await page1.locator('input[type="password"]').last().fill(TEST_PASSWORD);
  283 |       await page1.locator('button[type="submit"]').click();
  284 |       await expect(page1.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
  285 | 
  286 |       const device1Score = await page1.locator('[data-testid="score"]').textContent();
  287 | 
  288 |       // Device 2: Login with same account
  289 |       await page2.goto('http://localhost:5173');
  290 |       await page2.waitForSelector('[data-testid="game-grid"]', { timeout: 10000 });
  291 |       await page2.locator('button[aria-label="Login"]').click();
  292 |       await page2.locator('input[type="email"]').fill(testEmail);
  293 |       await page2.locator('input[type="password"]').fill(TEST_PASSWORD);
  294 |       await page2.locator('button[type="submit"]').click();
  295 |       await expect(page2.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
  296 | 
  297 |       // Device 2 should see same game state
  298 |       const device2Score = await page2.locator('[data-testid="score"]').textContent();
  299 |       expect(device2Score).toBe(device1Score);
  300 |     } finally {
  301 |       await context1.close();
  302 |       await context2.close();
  303 |     }
  304 |   });
  305 | });
  306 | 
  307 | test.describe('Error Handling', () => {
  308 |   test('should handle network errors gracefully', async ({ page }) => {
  309 |     // This test would require mocking network responses
  310 |     // For now, we just verify the error UI exists
  311 |     await page.goto('/');
  312 |     await page.waitForSelector('[data-testid="game-grid"]', { timeout: 10000 });
  313 | 
  314 |     // Open login overlay
  315 |     await page.locator('button[aria-label="Login"]').click();
  316 | 
  317 |     // Verify error container exists in DOM (even if not visible)
  318 |     const errorContainer = page.locator('.login-error');
  319 |     await expect(errorContainer).toHaveCount(0); // Should not be visible initially
  320 |   });
  321 | 
  322 |   test('should clear errors when switching between login/register', async ({ page }) => {
  323 |     await page.goto('/');
  324 |     await page.waitForSelector('[data-testid="game-grid"]', { timeout: 10000 });
  325 | 
  326 |     // Open login overlay
  327 |     await page.locator('button[aria-label="Login"]').click();
  328 | 
  329 |     // Try invalid login to trigger error
  330 |     await page.locator('input[type="email"]').fill('invalid@example.com');
  331 |     await page.locator('input[type="password"]').fill('InvalidPass123');
  332 |     await page.locator('button[type="submit"]').click();
  333 | 
  334 |     // Wait for error
  335 |     await expect(page.locator('.login-error')).toBeVisible({ timeout: 5000 });
  336 | 
  337 |     // Switch to register mode
  338 |     await page.locator('button:has-text("Create Account")').click();
  339 | 
  340 |     // Error should be cleared
  341 |     await expect(page.locator('.login-error')).not.toBeVisible();
  342 |   });
  343 | });
  344 | 
```