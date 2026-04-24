# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: authentication.spec.ts >> Authentication Flow >> should show login button when not authenticated
- Location: e2e/authentication.spec.ts:21:3

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
            - generic [ref=e438]:
              - img [ref=e440]
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
            - generic [ref=e477]:
              - img [ref=e479]
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
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | /**
  4   |  * Authentication E2E Tests
  5   |  *
  6   |  * Tests user registration, login, logout, and session persistence.
  7   |  * Also verifies game state is saved to backend and syncs across devices.
  8   |  */
  9   | 
  10  | // Generate unique test user for each test run
  11  | const generateTestEmail = () => `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
  12  | const TEST_PASSWORD = 'TestPass123';
  13  | 
  14  | test.describe('Authentication Flow', () => {
  15  |   test.beforeEach(async ({ page }) => {
  16  |     await page.goto('/');
  17  |     // Wait for app to initialize
> 18  |     await page.waitForSelector('[data-testid="game-grid"]', { timeout: 10000 });
      |                ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  19  |   });
  20  | 
  21  |   test('should show login button when not authenticated', async ({ page }) => {
  22  |     // Check that login button is visible
  23  |     const loginButton = page.locator('button[aria-label="Login"]');
  24  |     await expect(loginButton).toBeVisible();
  25  | 
  26  |     // Check that user menu is not visible
  27  |     const userMenu = page.locator('.user-menu');
  28  |     await expect(userMenu).not.toBeVisible();
  29  |   });
  30  | 
  31  |   test('should open login overlay when login button clicked', async ({ page }) => {
  32  |     const loginButton = page.locator('button[aria-label="Login"]');
  33  |     await loginButton.click();
  34  | 
  35  |     // Verify overlay opened
  36  |     const overlay = page.locator('[role="dialog"][aria-label="Login"]');
  37  |     await expect(overlay).toBeVisible();
  38  | 
  39  |     // Verify form fields present
  40  |     await expect(page.locator('input[type="email"]')).toBeVisible();
  41  |     await expect(page.locator('input[type="password"]')).toBeVisible();
  42  |     await expect(page.locator('button[type="submit"]')).toBeVisible();
  43  |   });
  44  | 
  45  |   test('should register new user successfully', async ({ page }) => {
  46  |     const testEmail = generateTestEmail();
  47  | 
  48  |     // Open login overlay
  49  |     await page.locator('button[aria-label="Login"]').click();
  50  | 
  51  |     // Switch to register mode
  52  |     await page.locator('button:has-text("Create Account")').click();
  53  | 
  54  |     // Fill registration form
  55  |     await page.locator('input[type="email"]').fill(testEmail);
  56  |     await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
  57  |     await page.locator('input[type="password"]').last().fill(TEST_PASSWORD);
  58  | 
  59  |     // Submit form
  60  |     await page.locator('button[type="submit"]').click();
  61  | 
  62  |     // Wait for overlay to close (successful registration)
  63  |     await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
  64  | 
  65  |     // Verify user menu appears
  66  |     const userMenu = page.locator('.user-menu');
  67  |     await expect(userMenu).toBeVisible();
  68  |     await expect(page.locator('.user-email')).toHaveText(testEmail);
  69  |   });
  70  | 
  71  |   test('should show validation error for mismatched passwords', async ({ page }) => {
  72  |     // Open login overlay and switch to register
  73  |     await page.locator('button[aria-label="Login"]').click();
  74  |     await page.locator('button:has-text("Create Account")').click();
  75  | 
  76  |     // Fill form with mismatched passwords
  77  |     await page.locator('input[type="email"]').fill(generateTestEmail());
  78  |     await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
  79  |     await page.locator('input[type="password"]').last().fill('DifferentPass123');
  80  | 
  81  |     // Submit form
  82  |     await page.locator('button[type="submit"]').click();
  83  | 
  84  |     // Verify error message appears
  85  |     const errorMessage = page.locator('.login-error');
  86  |     await expect(errorMessage).toBeVisible();
  87  |     await expect(errorMessage).toContainText('Passwords do not match');
  88  |   });
  89  | 
  90  |   test('should login existing user successfully', async ({ page }) => {
  91  |     const testEmail = generateTestEmail();
  92  | 
  93  |     // First, register the user
  94  |     await page.locator('button[aria-label="Login"]').click();
  95  |     await page.locator('button:has-text("Create Account")').click();
  96  |     await page.locator('input[type="email"]').fill(testEmail);
  97  |     await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
  98  |     await page.locator('input[type="password"]').last().fill(TEST_PASSWORD);
  99  |     await page.locator('button[type="submit"]').click();
  100 |     await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
  101 | 
  102 |     // Logout
  103 |     await page.locator('button.logout-button').click();
  104 |     await expect(page.locator('.user-menu')).not.toBeVisible();
  105 | 
  106 |     // Login again
  107 |     await page.locator('button[aria-label="Login"]').click();
  108 |     await page.locator('input[type="email"]').fill(testEmail);
  109 |     await page.locator('input[type="password"]').fill(TEST_PASSWORD);
  110 |     await page.locator('button[type="submit"]').click();
  111 | 
  112 |     // Verify logged in
  113 |     await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
  114 |     await expect(page.locator('.user-menu')).toBeVisible();
  115 |     await expect(page.locator('.user-email')).toHaveText(testEmail);
  116 |   });
  117 | 
  118 |   test('should show error for invalid credentials', async ({ page }) => {
```