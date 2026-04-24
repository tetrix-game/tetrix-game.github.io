# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke-test.spec.ts >> Production Smoke Tests >> should successfully login with valid credentials and load game state
- Location: tests/smoke-test.spec.ts:26:3

# Error details

```
TimeoutError: page.waitForResponse: Timeout 10000ms exceeded while waiting for event "response"
```

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/game$/
Received string:  "https://tetrix-game-frontend-production.up.railway.app/"
Timeout: 10000ms

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    14 × unexpected value "https://tetrix-game-frontend-production.up.railway.app/"

```

# Page snapshot

```yaml
- generic [ref=e6]:
  - generic [ref=e8]:
    - heading "Tetrix" [level=1] [ref=e9]
    - heading "Login" [level=2] [ref=e10]
    - generic [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]: Email
        - generic [ref=e14]:
          - textbox "Email" [ref=e15]: tannerbroberts@gmail.com
          - group:
            - generic: Email
      - generic [ref=e16]:
        - generic [ref=e17]: Password
        - generic [ref=e18]:
          - textbox "Password" [ref=e19]: 19Brain96
          - group:
            - generic: Password
      - paragraph [ref=e20]: Unexpected token '<', "<!doctype "... is not valid JSON
      - button "Login" [ref=e21] [cursor=pointer]: Login
      - button "Need an account? Sign up" [ref=e22] [cursor=pointer]
      - button "Forgot password?" [ref=e23] [cursor=pointer]
  - generic [ref=e26]:
    - heading "Top Players" [level=3] [ref=e27]
    - paragraph [ref=e28]: No players yet. Be the first!
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | 
  4   | test.describe('Production Smoke Tests', () => {
  5   |   test.beforeEach(async ({ context, page }) => {
  6   |     // Clear all cookies and storage before each test
  7   |     await context.clearCookies();
  8   |     await page.goto('/');
  9   |     await page.evaluate(() => {
  10  |       localStorage.clear();
  11  |       sessionStorage.clear();
  12  |     });
  13  |   });
  14  | 
  15  |   test('should hide game UI until logged in', async ({ page }) => {
  16  |     await page.goto('/');
  17  | 
  18  |     // Should see login form
  19  |     await expect(page.locator('h1')).toContainText('Tetrix');
  20  |     await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  21  | 
  22  |     // Should NOT see game board (game-board is only visible after login)
  23  |     await expect(page.locator('[data-testid="game-board"]')).not.toBeVisible();
  24  |   });
  25  | 
  26  |   test('should successfully login with valid credentials and load game state', async ({ page }) => {
  27  |     await page.goto('/');
  28  | 
  29  |     // Fill login form with test credentials
  30  |     await page.getByLabel('Email').fill('tannerbroberts@gmail.com');
  31  |     await page.getByLabel(/^Password/).fill('19Brain96');
  32  | 
  33  |     // Listen for game state API call
  34  |     const gameStatePromise = page.waitForResponse(
  35  |       response => response.url().includes('/api/game/state') && response.status() === 200,
  36  |       { timeout: 10000 }
  37  |     );
  38  | 
  39  |     // Submit login
  40  |     await page.getByRole('button', { name: 'Login' }).click();
  41  | 
  42  |     // Should redirect to /game
> 43  |     await expect(page).toHaveURL(/\/game$/, { timeout: 10000 });
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  44  | 
  45  |     // Should see game board after login
  46  |     await expect(page.locator('[data-testid="game-board"]')).toBeVisible({ timeout: 10000 });
  47  | 
  48  |     // Verify game state was loaded
  49  |     const gameStateResponse = await gameStatePromise;
  50  |     expect(gameStateResponse.status()).toBe(200);
  51  | 
  52  |     const gameStateData = await gameStateResponse.json();
  53  |     expect(gameStateData).toBeDefined();
  54  |     expect(gameStateData.score).toBeDefined();
  55  |     expect(gameStateData.nextQueue).toBeDefined();
  56  |   });
  57  | 
  58  |   test('should reject login with wrong password', async ({ page }) => {
  59  |     await page.goto('/');
  60  | 
  61  |     // Try to login with wrong password
  62  |     await page.getByLabel('Email').fill('tannerbroberts@gmail.com');
  63  |     await page.getByLabel(/^Password/).fill('WrongPassword123');
  64  |     await page.getByRole('button', { name: 'Login' }).click();
  65  | 
  66  |     // Should see error message
  67  |     await expect(page.locator('text=/invalid/i')).toBeVisible({ timeout: 5000 });
  68  | 
  69  |     // Should NOT redirect to game
  70  |     await expect(page).toHaveURL('/');
  71  |   });
  72  | 
  73  |   test('should reject login with non-existent account', async ({ page }) => {
  74  |     await page.goto('/');
  75  | 
  76  |     // Try to login with non-existent account
  77  |     const timestamp = Date.now();
  78  |     await page.getByLabel('Email').fill(`nonexistent${timestamp}@example.com`);
  79  |     await page.getByLabel(/^Password/).fill('Password123');
  80  |     await page.getByRole('button', { name: 'Login' }).click();
  81  | 
  82  |     // Should see error message
  83  |     await expect(page.locator('text=/invalid/i')).toBeVisible({ timeout: 5000 });
  84  | 
  85  |     // Should NOT redirect to game
  86  |     await expect(page).toHaveURL('/');
  87  |   });
  88  | 
  89  |   test('should successfully place a shape on the board', async ({ page }) => {
  90  |     await page.goto('/');
  91  | 
  92  |     // Login first
  93  |     await page.getByLabel('Email').fill('tannerbroberts@gmail.com');
  94  |     await page.getByLabel(/^Password/).fill('19Brain96');
  95  |     await page.getByRole('button', { name: 'Login' }).click();
  96  | 
  97  |     // Wait for game to load
  98  |     await expect(page).toHaveURL(/\/game$/, { timeout: 10000 });
  99  |     await expect(page.locator('[data-testid="game-board"]')).toBeVisible();
  100 | 
  101 |     // Wait for game state to load
  102 |     await page.waitForResponse(
  103 |       response => response.url().includes('/api/game/state') && response.status() === 200,
  104 |       { timeout: 10000 }
  105 |     );
  106 | 
  107 |     // Wait for shapes to be visible
  108 |     await page.waitForTimeout(1000);
  109 | 
  110 |     // Use test utils if available (like in existing E2E tests)
  111 |     const hasTestUtils = await page.evaluate(() => {
  112 |       return typeof (window as any).__testUtils !== 'undefined';
  113 |     });
  114 | 
  115 |     if (hasTestUtils) {
  116 |       // Use test utilities to place a shape programmatically
  117 |       const placeShapePromise = page.waitForResponse(
  118 |         response => response.url().includes('/api/game/place-shape'),
  119 |         { timeout: 10000 }
  120 |       );
  121 | 
  122 |       await page.evaluate(async () => {
  123 |         const testUtils = (window as any).__testUtils;
  124 |         await testUtils.placePieceAtRow(1);
  125 |       });
  126 | 
  127 |       // Verify placement API was called
  128 |       const placeShapeResponse = await placeShapePromise;
  129 |       expect(placeShapeResponse.status()).toBe(200);
  130 | 
  131 |       const responseData = await placeShapeResponse.json();
  132 |       expect(responseData.valid).toBe(true);
  133 |       expect(responseData.updatedTiles).toBeDefined();
  134 |       expect(Array.isArray(responseData.updatedTiles)).toBe(true);
  135 |       // The stub implementation returns empty array, real implementation should have tiles
  136 |       expect(responseData.updatedTiles.length).toBeGreaterThan(0);
  137 |       expect(responseData.newScore).toBeDefined();
  138 |       expect(typeof responseData.newScore).toBe('number');
  139 |     } else {
  140 |       // Fallback: just verify the game loaded and shapes are present
  141 |       console.log('Test utils not available, skipping shape placement interaction');
  142 | 
  143 |       // At minimum, verify we can see the game UI
```