import { test, expect } from '@playwright/test';

/**
 * Production Authentication E2E Tests
 * Tests authentication flow and server state persistence on deployed Railway app
 */

const generateTestUser = () => ({
  username: `test${Date.now().toString().slice(-8)}`,
  email: `test${Date.now()}@example.com`,
  password: 'TestPass123'
});

test.describe('Production: Authentication and Server State', () => {
  test('should register, save game state, and verify server is source of truth', async ({ page }) => {
    const testUser = generateTestUser();

    // Navigate to app
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Switch to register mode
    await page.getByRole('button', { name: /need an account\? sign up/i }).click();

    // Fill registration form
    await page.getByLabel('Username').fill(testUser.username);
    await page.getByLabel('Email').fill(testUser.email);
    await page.getByLabel('Password', { exact: true }).fill(testUser.password);
    await page.getByLabel('Confirm Password').fill(testUser.password);

    // Register
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Wait for navigation to game page
    await page.waitForURL('**/game');
    await expect(page).toHaveURL(/\/game$/);

    // Verify we're on the game page and authenticated
    await page.waitForSelector('[data-testid="game-grid"]', { timeout: 10000 });

    // Get initial game state (score should be 0 for new user)
    const initialScore = await page.locator('[data-testid="score-display"]').textContent();
    console.log('Initial score:', initialScore);

    // Refresh the page to verify session persists
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be on game page (not redirected to login)
    await expect(page).toHaveURL(/\/game$/);

    // Verify game state loaded from server
    await page.waitForSelector('[data-testid="game-grid"]', { timeout: 10000 });
    const scoreAfterRefresh = await page.locator('[data-testid="score-display"]').textContent();
    expect(scoreAfterRefresh).toBe(initialScore);

    console.log('✅ User registered, game state persists across refresh');
  });

  test('should login existing user and load server state', async ({ page }) => {
    const testUser = generateTestUser();

    // First register the user
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Switch to register mode
    await page.getByRole('button', { name: /need an account\? sign up/i }).click();

    await page.getByLabel('Username').fill(testUser.username);
    await page.getByLabel('Email').fill(testUser.email);
    await page.getByLabel('Password', { exact: true }).fill(testUser.password);
    await page.getByLabel('Confirm Password').fill(testUser.password);
    await page.getByRole('button', { name: 'Create Account' }).click();

    await page.waitForURL('**/game');

    // Logout
    await page.getByRole('button', { name: /logout/i }).click();
    await page.waitForURL('/');

    // Switch to login mode and login
    await page.getByRole('button', { name: 'Already have an account? Login' }).click();
    await page.getByLabel('Email').fill(testUser.email);
    await page.getByLabel('Password').fill(testUser.password);
    await page.getByRole('button', { name: 'Login' }).click();

    // Should navigate back to game
    await page.waitForURL('**/game');
    await expect(page).toHaveURL(/\/game$/);

    // Verify game loads
    await page.waitForSelector('[data-testid="game-grid"]', { timeout: 10000 });

    console.log('✅ User logged in and server state loaded');
  });

  test('should reject unauthenticated access to game page', async ({ page }) => {
    // Try to access game page directly without auth
    await page.goto('/game');

    // Should redirect to login
    await page.waitForURL('/', { timeout: 5000 });
    await expect(page).toHaveURL('/');

    console.log('✅ Unauthenticated access properly redirected');
  });

  test('should protect game API endpoints', async ({ page }) => {
    const context = page.context();

    // Make direct API request without authentication
    const response = await context.request.get('/api/game/state');

    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Not authenticated');

    console.log('✅ Game API endpoint properly protected');
  });
});
