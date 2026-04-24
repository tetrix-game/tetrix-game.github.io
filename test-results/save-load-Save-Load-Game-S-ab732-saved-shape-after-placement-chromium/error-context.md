# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: save-load.spec.ts >> Save/Load Game State >> should clear saved shape after placement
- Location: e2e/save-load.spec.ts:137:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('[data-testid="shape-0"]')

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
  1   | /**
  2   |  * E2E tests for save/load functionality
  3   |  *
  4   |  * Prerequisites:
  5   |  * - Install Playwright: npm install -D @playwright/test
  6   |  * - Add to package.json scripts: "test:e2e": "playwright test"
  7   |  * - Create playwright.config.ts with baseURL: 'http://localhost:5173'
  8   |  *
  9   |  * Run tests:
  10  |  * - npm run test:e2e
  11  |  * - npm run test:e2e -- --headed (to see browser)
  12  |  * - npm run test:e2e -- --debug (to debug)
  13  |  */
  14  | 
  15  | import { test, expect, Page } from '@playwright/test';
  16  | 
  17  | /**
  18  |  * Helper function to place a shape on the board
  19  |  */
  20  | async function placeShape(page: Page, shapeIndex: number, row: number, col: number) {
  21  |   // Click on the shape in the queue
> 22  |   await page.locator(`[data-testid="shape-${shapeIndex}"]`).click();
      |                                                             ^ Error: locator.click: Test timeout of 30000ms exceeded.
  23  | 
  24  |   // Click on the target position on the board
  25  |   await page.locator(`[data-testid="tile-R${row}C${col}"]`).click();
  26  | }
  27  | 
  28  | /**
  29  |  * Helper function to get the current score
  30  |  */
  31  | async function getScore(page: Page): Promise<number> {
  32  |   const scoreText = await page.locator('[data-testid="score"]').textContent();
  33  |   return parseInt(scoreText || '0', 10);
  34  | }
  35  | 
  36  | /**
  37  |  * Helper function to check if a tile is filled
  38  |  */
  39  | async function isTileFilled(page: Page, row: number, col: number): Promise<boolean> {
  40  |   const tile = page.locator(`[data-testid="tile-R${row}C${col}"]`);
  41  |   const classes = await tile.getAttribute('class');
  42  |   return classes?.includes('filled') || false;
  43  | }
  44  | 
  45  | /**
  46  |  * Helper function to get queue slots
  47  |  */
  48  | async function getQueueSlots(page: Page): Promise<number> {
  49  |   return await page.locator('[data-testid^="shape-"]').count();
  50  | }
  51  | 
  52  | test.describe('Save/Load Game State', () => {
  53  |   test.beforeEach(async ({ page }) => {
  54  |     // Navigate to the game
  55  |     await page.goto('/');
  56  | 
  57  |     // Wait for the game to load
  58  |     await page.waitForSelector('[data-testid="game-board"]');
  59  | 
  60  |     // Clear any existing saved data
  61  |     await page.evaluate(() => {
  62  |       indexedDB.deleteDatabase('tetrix-game-db');
  63  |       localStorage.clear();
  64  |     });
  65  | 
  66  |     // Reload to start fresh
  67  |     await page.reload();
  68  |     await page.waitForSelector('[data-testid="game-board"]');
  69  |   });
  70  | 
  71  |   test('should save and restore game state after placing shapes', async ({ page }) => {
  72  |     // Verify initial state
  73  |     const initialScore = await getScore(page);
  74  |     expect(initialScore).toBe(0);
  75  | 
  76  |     // Place 5 shapes on the board
  77  |     for (let i = 0; i < 5; i++) {
  78  |       await placeShape(page, 0, 1, i + 1);
  79  |       // Wait for animation
  80  |       await page.waitForTimeout(500);
  81  |     }
  82  | 
  83  |     // Get the score after placing shapes
  84  |     const scoreAfterPlacement = await getScore(page);
  85  |     expect(scoreAfterPlacement).toBeGreaterThan(0);
  86  | 
  87  |     // Verify tiles are filled
  88  |     for (let i = 1; i <= 5; i++) {
  89  |       const filled = await isTileFilled(page, 1, i);
  90  |       expect(filled).toBe(true);
  91  |     }
  92  | 
  93  |     // Refresh the page
  94  |     await page.reload();
  95  |     await page.waitForSelector('[data-testid="game-board"]');
  96  | 
  97  |     // Verify state is restored
  98  |     const scoreAfterReload = await getScore(page);
  99  |     expect(scoreAfterReload).toBe(scoreAfterPlacement);
  100 | 
  101 |     // Verify tiles are still filled
  102 |     for (let i = 1; i <= 5; i++) {
  103 |       const filled = await isTileFilled(page, 1, i);
  104 |       expect(filled).toBe(true);
  105 |     }
  106 |   });
  107 | 
  108 |   test('should restore unlocked slots after purchase', async ({ page }) => {
  109 |     // Check initial queue slots (should be 1)
  110 |     const initialSlots = await getQueueSlots(page);
  111 |     expect(initialSlots).toBe(1);
  112 | 
  113 |     // Earn enough points to purchase slot 2 (500 points needed)
  114 |     // Place shapes to earn points...
  115 |     // (This would require game-specific logic)
  116 | 
  117 |     // Click on purchasable slot 2
  118 |     await page.locator('[data-testid="purchasable-slot-2"]').click();
  119 | 
  120 |     // Verify slot 2 is now a shape slot
  121 |     const slotsAfterPurchase = await getQueueSlots(page);
  122 |     expect(slotsAfterPurchase).toBe(2);
```