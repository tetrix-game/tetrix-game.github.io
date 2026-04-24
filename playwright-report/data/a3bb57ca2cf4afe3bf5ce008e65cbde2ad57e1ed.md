# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: production.spec.ts >> Production Deployment Tests >> email must be unique
- Location: tests/production.spec.ts:285:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 409
Received: 200
```

# Test source

```ts
  214 | 
  215 |     await page.click('button:has-text("Create Account")');
  216 |     await page.waitForTimeout(2000);
  217 | 
  218 |     // First API request should succeed
  219 |     const response1 = await context.request.get(`/api/leaderboard/user`);
  220 |     expect(response1.ok()).toBeTruthy();
  221 | 
  222 |     // Immediate second request should be rate limited
  223 |     const response2 = await context.request.get(`/api/leaderboard/user`);
  224 |     expect(response2.status()).toBe(429);
  225 | 
  226 |     const data = await response2.json();
  227 |     expect(data.error).toContain('Too many requests');
  228 | 
  229 |     await context.close();
  230 |   });
  231 | 
  232 |   test('password reset flow validates token', async ({ request }) => {
  233 |     // Test with invalid token
  234 |     const response = await request.post(`/api/auth/reset-password`, {
  235 |       data: {
  236 |         token: 'invalid-token-12345',
  237 |         newPassword: 'NewPassword123',
  238 |       },
  239 |     });
  240 | 
  241 |     expect(response.status()).toBe(400);
  242 |     const data = await response.json();
  243 |     expect(data.error).toContain('Invalid or expired');
  244 |   });
  245 | 
  246 |   test('game state requires authentication', async ({ request }) => {
  247 |     const response = await request.get(`/api/game/state`);
  248 |     expect(response.status()).toBe(401);
  249 |   });
  250 | 
  251 |   test('username must be unique', async ({ request }) => {
  252 |     const timestamp = Date.now();
  253 |     const randomSuffix = Math.random().toString(36).substring(7);
  254 |     const testUser = {
  255 |       username: `unique${randomSuffix}`,
  256 |       email: `unique1${timestamp}${randomSuffix}@example.com`,
  257 |       password: 'TestPassword123',
  258 |     };
  259 | 
  260 |     // Register first user
  261 |     const response1 = await request.post(`/api/auth/register`, {
  262 |       data: testUser,
  263 |     });
  264 | 
  265 |     if (!response1.ok()) {
  266 |       const error = await response1.json();
  267 |       console.error('Registration failed:', error);
  268 |     }
  269 |     expect(response1.ok()).toBeTruthy();
  270 | 
  271 |     // Try to register with same username but different email
  272 |     const response2 = await request.post(`/api/auth/register`, {
  273 |       data: {
  274 |         username: testUser.username,
  275 |         email: `unique2${timestamp}${randomSuffix}@example.com`,
  276 |         password: 'TestPassword123',
  277 |       },
  278 |     });
  279 | 
  280 |     expect(response2.status()).toBe(409);
  281 |     const data = await response2.json();
  282 |     expect(data.error).toContain('already taken');
  283 |   });
  284 | 
  285 |   test('email must be unique', async ({ request }) => {
  286 |     const timestamp = Date.now();
  287 |     const randomSuffix = Math.random().toString(36).substring(7);
  288 |     const testEmail = `emailtest${timestamp}${randomSuffix}@example.com`;
  289 | 
  290 |     // Register first user
  291 |     const response1 = await request.post(`/api/auth/register`, {
  292 |       data: {
  293 |         username: `emailuser1${randomSuffix}`,
  294 |         email: testEmail,
  295 |         password: 'TestPassword123',
  296 |       },
  297 |     });
  298 | 
  299 |     if (!response1.ok()) {
  300 |       const error = await response1.json();
  301 |       console.error('Registration failed:', error);
  302 |     }
  303 |     expect(response1.ok()).toBeTruthy();
  304 | 
  305 |     // Try to register with same email but different username
  306 |     const response2 = await request.post(`/api/auth/register`, {
  307 |       data: {
  308 |         username: `emailuser2${randomSuffix}`,
  309 |         email: testEmail,
  310 |         password: 'TestPassword123',
  311 |       },
  312 |     });
  313 | 
> 314 |     expect(response2.status()).toBe(409);
      |                                ^ Error: expect(received).toBe(expected) // Object.is equality
  315 |     const data = await response2.json();
  316 |     expect(data.error).toContain('already registered');
  317 |   });
  318 | });
  319 | 
```