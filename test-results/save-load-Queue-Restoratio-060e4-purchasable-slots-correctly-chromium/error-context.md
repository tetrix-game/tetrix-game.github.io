# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: save-load.spec.ts >> Queue Restoration >> should restore queue with purchasable slots correctly
- Location: e2e/save-load.spec.ts:272:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 3
Received: 0
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
            - generic [ref=e448]:
              - img [ref=e450]
              - generic:
                - img
            - generic [ref=e460]:
              - img [ref=e462]
              - generic:
                - img
            - generic [ref=e473]:
              - img [ref=e475]
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
  184 | 
  185 |   test('should preserve stats across hub mode transitions', async ({ page }) => {
  186 |     // Place some shapes to build up stats
  187 |     for (let i = 0; i < 3; i++) {
  188 |       await placeShape(page, 0, 1, i + 1);
  189 |       await page.waitForTimeout(500);
  190 |     }
  191 | 
  192 |     const scoreBeforeHub = await getScore(page);
  193 | 
  194 |     // Navigate to hub mode
  195 |     await page.locator('[data-testid="hub-mode-button"]').click();
  196 |     await page.waitForTimeout(500);
  197 | 
  198 |     // Navigate back to game
  199 |     await page.locator('[data-testid="play-button"]').click();
  200 |     await page.waitForTimeout(500);
  201 | 
  202 |     // Verify board is cleared
  203 |     const tilesAfterHub = await page.locator('[data-testid*="tile-"][class*="filled"]').count();
  204 |     expect(tilesAfterHub).toBe(0);
  205 | 
  206 |     // Verify stats are preserved (check all-time stats)
  207 |     await page.locator('[data-testid="stats-button"]').click();
  208 |     const allTimeScore = await page.locator('[data-testid="all-time-score"]').textContent();
  209 |     expect(parseInt(allTimeScore || '0', 10)).toBeGreaterThanOrEqual(scoreBeforeHub);
  210 |   });
  211 | 
  212 |   test('should start fresh game when old save is incompatible', async ({ page }) => {
  213 |     // Inject an old version save directly into IndexedDB
  214 |     await page.evaluate(() => {
  215 |       const request = indexedDB.open('tetrix-game-db', 1);
  216 |       request.onsuccess = (event: any) => {
  217 |         const db = event.target.result;
  218 |         const transaction = db.transaction(['game_state'], 'readwrite');
  219 |         const store = transaction.objectStore('game_state');
  220 | 
  221 |         // Save with old version
  222 |         const oldSave = {
  223 |           version: '0.0.1', // Old version
  224 |           score: 1000,
  225 |           tiles: [],
  226 |           nextQueue: [],
  227 |           savedShape: null,
  228 |           totalLinesCleared: 10,
  229 |           shapesUsed: 5,
  230 |           hasPlacedFirstShape: true,
  231 |           stats: {},
  232 |           lastUpdated: Date.now(),
  233 |         };
  234 | 
  235 |         store.put(oldSave, 'current');
  236 |       };
  237 |     });
  238 | 
  239 |     // Refresh the page
  240 |     await page.reload();
  241 |     await page.waitForSelector('[data-testid="game-board"]');
  242 | 
  243 |     // Verify game starts fresh (score is 0)
  244 |     const score = await getScore(page);
  245 |     expect(score).toBe(0);
  246 | 
  247 |     // Verify no tiles are filled
  248 |     const filledTiles = await page.locator('[data-testid*="tile-"][class*="filled"]').count();
  249 |     expect(filledTiles).toBe(0);
  250 | 
  251 |     // Verify no error dialog appears
  252 |     const errorDialog = await page.locator('[data-testid="error-dialog"]').count();
  253 |     expect(errorDialog).toBe(0);
  254 |   });
  255 | });
  256 | 
  257 | test.describe('Queue Restoration', () => {
  258 |   test.beforeEach(async ({ page }) => {
  259 |     await page.goto('/');
  260 |     await page.waitForSelector('[data-testid="game-board"]');
  261 | 
  262 |     // Clear any existing data
  263 |     await page.evaluate(() => {
  264 |       indexedDB.deleteDatabase('tetrix-game-db');
  265 |       localStorage.clear();
  266 |     });
  267 | 
  268 |     await page.reload();
  269 |     await page.waitForSelector('[data-testid="game-board"]');
  270 |   });
  271 | 
  272 |   test('should restore queue with purchasable slots correctly', async ({ page }) => {
  273 |     // Initial state: slot 1 unlocked, slots 2-4 are purchasable
  274 | 
  275 |     // Refresh and verify queue structure
  276 |     await page.reload();
  277 |     await page.waitForSelector('[data-testid="game-board"]');
  278 | 
  279 |     // Count shapes and purchasable slots
  280 |     const shapeSlots = await page.locator('[data-testid^="shape-"]').count();
  281 |     const purchasableSlots = await page.locator('[data-testid^="purchasable-slot-"]').count();
  282 | 
  283 |     expect(shapeSlots).toBe(1); // Only slot 1 has a shape
> 284 |     expect(purchasableSlots).toBe(3); // Slots 2, 3, 4 are purchasable
      |                              ^ Error: expect(received).toBe(expected) // Object.is equality
  285 |   });
  286 | 
  287 |   test('should handle queue with mixed shapes and purchasable slots', async ({ page }) => {
  288 |     // Purchase slot 2 (would require earning 500 points first)
  289 |     // ... purchase logic ...
  290 | 
  291 |     // Now we have: [shape, shape, purchasable-3, purchasable-4]
  292 | 
  293 |     // Refresh
  294 |     await page.reload();
  295 |     await page.waitForSelector('[data-testid="game-board"]');
  296 | 
  297 |     // Verify queue is restored correctly
  298 |     const queue = await page.locator('[data-testid="queue-container"] > *').all();
  299 |     expect(queue.length).toBe(4);
  300 | 
  301 |     // Verify slot types
  302 |     const slot1Type = await queue[0].getAttribute('data-testid');
  303 |     const slot2Type = await queue[1].getAttribute('data-testid');
  304 |     const slot3Type = await queue[2].getAttribute('data-testid');
  305 |     const slot4Type = await queue[3].getAttribute('data-testid');
  306 | 
  307 |     expect(slot1Type).toContain('shape-');
  308 |     expect(slot2Type).toContain('shape-');
  309 |     expect(slot3Type).toBe('purchasable-slot-3');
  310 |     expect(slot4Type).toBe('purchasable-slot-4');
  311 |   });
  312 | });
  313 | 
  314 | test.describe('Version Mismatch Handling', () => {
  315 |   test('should handle version mismatch gracefully', async ({ page }) => {
  316 |     await page.goto('/');
  317 |     await page.waitForSelector('[data-testid="game-board"]');
  318 | 
  319 |     // Inject save with wrong version
  320 |     await page.evaluate(() => {
  321 |       const request = indexedDB.open('tetrix-game-db', 1);
  322 |       request.onsuccess = (event: any) => {
  323 |         const db = event.target.result;
  324 |         const transaction = db.transaction(['game_state'], 'readwrite');
  325 |         const store = transaction.objectStore('game_state');
  326 | 
  327 |         const wrongVersionSave = {
  328 |           version: '99.99.99',
  329 |           score: 5000,
  330 |           tiles: [{ position: 'R1C1', isFilled: true, color: 'blue' }],
  331 |           nextQueue: [],
  332 |           savedShape: null,
  333 |           totalLinesCleared: 50,
  334 |           shapesUsed: 100,
  335 |           hasPlacedFirstShape: true,
  336 |           stats: {},
  337 |           lastUpdated: Date.now(),
  338 |         };
  339 | 
  340 |         store.put(wrongVersionSave, 'current');
  341 |       };
  342 |     });
  343 | 
  344 |     // Refresh
  345 |     await page.reload();
  346 |     await page.waitForSelector('[data-testid="game-board"]');
  347 | 
  348 |     // Verify fresh game starts (old save rejected)
  349 |     const score = await getScore(page);
  350 |     expect(score).toBe(0);
  351 | 
  352 |     // Verify no crash occurred
  353 |     const errorDialog = await page.locator('[data-testid="error-dialog"]').count();
  354 |     expect(errorDialog).toBe(0);
  355 |   });
  356 | });
  357 | 
  358 | test.describe('Corruption Recovery', () => {
  359 |   test('should handle corrupted tiles data', async ({ page }) => {
  360 |     await page.goto('/');
  361 |     await page.waitForSelector('[data-testid="game-board"]');
  362 | 
  363 |     // Inject corrupted save with invalid tile data
  364 |     await page.evaluate(() => {
  365 |       const request = indexedDB.open('tetrix-game-db', 1);
  366 |       request.onsuccess = (event: any) => {
  367 |         const db = event.target.result;
  368 |         const transaction = db.transaction(['game_state'], 'readwrite');
  369 |         const store = transaction.objectStore('game_state');
  370 | 
  371 |         const corruptedSave = {
  372 |           version: '1.6.0',
  373 |           score: 100,
  374 |           tiles: [
  375 |             { position: 'R1C1', isFilled: true, color: 'INVALID_COLOR' },
  376 |             { position: 'INVALID_POSITION', isFilled: true, color: 'blue' },
  377 |           ],
  378 |           nextQueue: [],
  379 |           savedShape: null,
  380 |           totalLinesCleared: 0,
  381 |           shapesUsed: 0,
  382 |           hasPlacedFirstShape: false,
  383 |           stats: {},
  384 |           lastUpdated: Date.now(),
```