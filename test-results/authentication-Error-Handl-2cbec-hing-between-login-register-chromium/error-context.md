# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: authentication.spec.ts >> Error Handling >> should clear errors when switching between login/register
- Location: e2e/authentication.spec.ts:322:3

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('[data-testid="game-grid"]') to be visible

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - generic "Click to view stats" [ref=e6] [cursor=pointer]:
      - img [ref=e8]
      - generic [ref=e15]: "0"
    - generic [ref=e16]:
      - button "Login" [ref=e17] [cursor=pointer]:
        - img [ref=e18]
      - button "Open menu" [ref=e21] [cursor=pointer]
  - generic [ref=e27]:
    - generic [ref=e28]:
      - img [ref=e31]
      - img [ref=e35]
      - img [ref=e39]
      - img [ref=e43]
      - img [ref=e47]
      - img [ref=e51]
      - img [ref=e55]
      - img [ref=e59]
      - img [ref=e63]
      - img [ref=e67]
      - img [ref=e71]
      - img [ref=e75]
      - img [ref=e79]
      - img [ref=e83]
      - img [ref=e87]
      - img [ref=e91]
      - img [ref=e95]
      - img [ref=e99]
      - img [ref=e103]
      - img [ref=e107]
      - img [ref=e111]
      - img [ref=e115]
      - img [ref=e119]
      - img [ref=e123]
      - img [ref=e127]
      - img [ref=e131]
      - img [ref=e135]
      - img [ref=e139]
      - img [ref=e143]
      - img [ref=e147]
      - img [ref=e151]
      - img [ref=e155]
      - img [ref=e159]
      - img [ref=e163]
      - img [ref=e167]
      - img [ref=e171]
      - img [ref=e175]
      - img [ref=e179]
      - img [ref=e183]
      - img [ref=e187]
      - img [ref=e191]
      - img [ref=e195]
      - img [ref=e199]
      - img [ref=e203]
      - img [ref=e207]
      - img [ref=e211]
      - img [ref=e215]
      - img [ref=e219]
      - img [ref=e223]
      - img [ref=e227]
      - img [ref=e231]
      - img [ref=e235]
      - img [ref=e239]
      - img [ref=e243]
      - img [ref=e247]
      - img [ref=e251]
      - img [ref=e255]
      - img [ref=e259]
      - img [ref=e263]
      - img [ref=e267]
      - img [ref=e271]
      - img [ref=e275]
      - img [ref=e279]
      - img [ref=e283]
      - img [ref=e287]
      - img [ref=e291]
      - img [ref=e295]
      - img [ref=e299]
      - img [ref=e303]
      - img [ref=e307]
      - img [ref=e311]
      - img [ref=e315]
      - img [ref=e319]
      - img [ref=e323]
      - img [ref=e327]
      - img [ref=e331]
      - img [ref=e335]
      - img [ref=e339]
      - img [ref=e343]
      - img [ref=e347]
      - img [ref=e351]
      - img [ref=e355]
      - img [ref=e359]
      - img [ref=e363]
      - img [ref=e367]
      - img [ref=e371]
      - img [ref=e375]
      - img [ref=e379]
      - img [ref=e383]
      - img [ref=e387]
      - img [ref=e391]
      - img [ref=e395]
      - img [ref=e399]
      - img [ref=e403]
      - img [ref=e407]
      - img [ref=e411]
      - img [ref=e415]
      - img [ref=e419]
      - img [ref=e423]
      - img [ref=e427]
    - generic [ref=e429]:
      - generic [ref=e430]:
        - generic [ref=e432]:
          - generic [ref=e435] [cursor=pointer]:
            - generic [ref=e441]:
              - img [ref=e443]
              - generic:
                - img
            - generic [ref=e451]:
              - img [ref=e453]
              - generic:
                - img
            - generic [ref=e464]:
              - img [ref=e466]
              - generic:
                - img
            - generic [ref=e474]:
              - img [ref=e476]
              - generic:
                - img
          - generic [ref=e490]:
            - generic [ref=e491]: 🔒
            - generic [ref=e492]:
              - generic [ref=e493]: "500"
              - generic [ref=e494]: 💎
          - generic [ref=e497]:
            - generic [ref=e498]: 🔒
            - generic [ref=e499]:
              - generic [ref=e500]: 1.5k
              - generic [ref=e501]: 💎
          - generic [ref=e504]:
            - generic [ref=e505]: 🔒
            - generic [ref=e506]:
              - generic [ref=e507]: 5k
              - generic [ref=e508]: 💎
        - button "Infinite queue mode" [disabled] [ref=e509]:
          - generic [ref=e510]: ∞
      - generic [ref=e511]:
        - button "↻ -2" [ref=e512] [cursor=pointer]:
          - generic [ref=e513]: ↻
          - generic [ref=e514]: "-2"
        - button "↻↻ -3" [ref=e515] [cursor=pointer]:
          - generic [ref=e516]: ↻↻
          - generic [ref=e517]: "-3"
        - button "↺ -2" [ref=e518] [cursor=pointer]:
          - generic [ref=e519]: ↺
          - generic [ref=e520]: "-2"
  - button "Enter Full Screen" [ref=e521] [cursor=pointer]:
    - generic [ref=e522]: +
  - generic [ref=e524]:
    - generic [ref=e525]: Try fullscreen mode!
    - button "Dismiss call to action" [ref=e526] [cursor=pointer]: ✕
```

# Test source

```ts
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
  277 |       await page1.waitForSelector('[data-testid="game-grid"]', { timeout: 10000 });
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
> 324 |     await page.waitForSelector('[data-testid="game-grid"]', { timeout: 10000 });
      |                ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
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