# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: authentication.spec.ts >> Game State Persistence >> should save and load game state when authenticated
- Location: e2e/authentication.spec.ts:182:3

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
            - generic [ref=e442]:
              - img [ref=e444]
              - generic:
                - img
            - generic [ref=e452]:
              - img [ref=e454]
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
  119 |     // Open login overlay
  120 |     await page.locator('button[aria-label="Login"]').click();
  121 | 
  122 |     // Try to login with non-existent user
  123 |     await page.locator('input[type="email"]').fill('nonexistent@example.com');
  124 |     await page.locator('input[type="password"]').fill('WrongPassword123');
  125 |     await page.locator('button[type="submit"]').click();
  126 | 
  127 |     // Verify error message appears
  128 |     const errorMessage = page.locator('.login-error');
  129 |     await expect(errorMessage).toBeVisible();
  130 |   });
  131 | 
  132 |   test('should logout successfully', async ({ page }) => {
  133 |     const testEmail = generateTestEmail();
  134 | 
  135 |     // Register and login
  136 |     await page.locator('button[aria-label="Login"]').click();
  137 |     await page.locator('button:has-text("Create Account")').click();
  138 |     await page.locator('input[type="email"]').fill(testEmail);
  139 |     await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
  140 |     await page.locator('input[type="password"]').last().fill(TEST_PASSWORD);
  141 |     await page.locator('button[type="submit"]').click();
  142 |     await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
  143 | 
  144 |     // Logout
  145 |     await page.locator('button.logout-button').click();
  146 | 
  147 |     // Verify logged out
  148 |     await expect(page.locator('.user-menu')).not.toBeVisible();
  149 |     await expect(page.locator('button[aria-label="Login"]')).toBeVisible();
  150 |   });
  151 | });
  152 | 
  153 | test.describe('Session Persistence', () => {
  154 |   test('should persist session across page refreshes', async ({ page }) => {
  155 |     const testEmail = generateTestEmail();
  156 | 
  157 |     // Register user
  158 |     await page.goto('/');
  159 |     await page.waitForSelector('[data-testid="game-grid"]', { timeout: 10000 });
  160 |     await page.locator('button[aria-label="Login"]').click();
  161 |     await page.locator('button:has-text("Create Account")').click();
  162 |     await page.locator('input[type="email"]').fill(testEmail);
  163 |     await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
  164 |     await page.locator('input[type="password"]').last().fill(TEST_PASSWORD);
  165 |     await page.locator('button[type="submit"]').click();
  166 |     await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
  167 | 
  168 |     // Verify logged in
  169 |     await expect(page.locator('.user-email')).toHaveText(testEmail);
  170 | 
  171 |     // Refresh page
  172 |     await page.reload();
  173 |     await page.waitForSelector('[data-testid="game-grid"]', { timeout: 10000 });
  174 | 
  175 |     // Verify still logged in after refresh
  176 |     await expect(page.locator('.user-menu')).toBeVisible();
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
> 187 |     await page.waitForSelector('[data-testid="game-grid"]', { timeout: 10000 });
      |                ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
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
```