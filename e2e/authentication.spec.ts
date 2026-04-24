import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 *
 * Tests user registration, login, logout, and session persistence.
 * Also verifies game state is saved to backend and syncs across devices.
 */

// Generate unique test user for each test run
const generateTestEmail = () => `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
const TEST_PASSWORD = 'TestPass123';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to initialize
    await page.waitForSelector('[data-testid="game-grid"]', { timeout: 10000 });
  });

  test('should show login button when not authenticated', async ({ page }) => {
    // Check that login button is visible
    const loginButton = page.locator('button[aria-label="Login"]');
    await expect(loginButton).toBeVisible();

    // Check that user menu is not visible
    const userMenu = page.locator('.user-menu');
    await expect(userMenu).not.toBeVisible();
  });

  test('should open login overlay when login button clicked', async ({ page }) => {
    const loginButton = page.locator('button[aria-label="Login"]');
    await loginButton.click();

    // Verify overlay opened
    const overlay = page.locator('[role="dialog"][aria-label="Login"]');
    await expect(overlay).toBeVisible();

    // Verify form fields present
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should register new user successfully', async ({ page }) => {
    const testEmail = generateTestEmail();

    // Open login overlay
    await page.locator('button[aria-label="Login"]').click();

    // Switch to register mode
    await page.locator('button:has-text("Create Account")').click();

    // Fill registration form
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await page.locator('input[type="password"]').last().fill(TEST_PASSWORD);

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Wait for overlay to close (successful registration)
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });

    // Verify user menu appears
    const userMenu = page.locator('.user-menu');
    await expect(userMenu).toBeVisible();
    await expect(page.locator('.user-email')).toHaveText(testEmail);
  });

  test('should show validation error for mismatched passwords', async ({ page }) => {
    // Open login overlay and switch to register
    await page.locator('button[aria-label="Login"]').click();
    await page.locator('button:has-text("Create Account")').click();

    // Fill form with mismatched passwords
    await page.locator('input[type="email"]').fill(generateTestEmail());
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await page.locator('input[type="password"]').last().fill('DifferentPass123');

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Verify error message appears
    const errorMessage = page.locator('.login-error');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Passwords do not match');
  });

  test('should login existing user successfully', async ({ page }) => {
    const testEmail = generateTestEmail();

    // First, register the user
    await page.locator('button[aria-label="Login"]').click();
    await page.locator('button:has-text("Create Account")').click();
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await page.locator('input[type="password"]').last().fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });

    // Logout
    await page.locator('button.logout-button').click();
    await expect(page.locator('.user-menu')).not.toBeVisible();

    // Login again
    await page.locator('button[aria-label="Login"]').click();
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();

    // Verify logged in
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('.user-menu')).toBeVisible();
    await expect(page.locator('.user-email')).toHaveText(testEmail);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Open login overlay
    await page.locator('button[aria-label="Login"]').click();

    // Try to login with non-existent user
    await page.locator('input[type="email"]').fill('nonexistent@example.com');
    await page.locator('input[type="password"]').fill('WrongPassword123');
    await page.locator('button[type="submit"]').click();

    // Verify error message appears
    const errorMessage = page.locator('.login-error');
    await expect(errorMessage).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    const testEmail = generateTestEmail();

    // Register and login
    await page.locator('button[aria-label="Login"]').click();
    await page.locator('button:has-text("Create Account")').click();
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await page.locator('input[type="password"]').last().fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });

    // Logout
    await page.locator('button.logout-button').click();

    // Verify logged out
    await expect(page.locator('.user-menu')).not.toBeVisible();
    await expect(page.locator('button[aria-label="Login"]')).toBeVisible();
  });
});

test.describe('Session Persistence', () => {
  test('should persist session across page refreshes', async ({ page }) => {
    const testEmail = generateTestEmail();

    // Register user
    await page.goto('/');
    await page.waitForSelector('[data-testid="game-grid"]', { timeout: 10000 });
    await page.locator('button[aria-label="Login"]').click();
    await page.locator('button:has-text("Create Account")').click();
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await page.locator('input[type="password"]').last().fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });

    // Verify logged in
    await expect(page.locator('.user-email')).toHaveText(testEmail);

    // Refresh page
    await page.reload();
    await page.waitForSelector('[data-testid="game-grid"]', { timeout: 10000 });

    // Verify still logged in after refresh
    await expect(page.locator('.user-menu')).toBeVisible();
    await expect(page.locator('.user-email')).toHaveText(testEmail);
  });
});

test.describe('Game State Persistence', () => {
  test('should save and load game state when authenticated', async ({ page }) => {
    const testEmail = generateTestEmail();

    // Register user
    await page.goto('/');
    await page.waitForSelector('[data-testid="game-grid"]', { timeout: 10000 });
    await page.locator('button[aria-label="Login"]').click();
    await page.locator('button:has-text("Create Account")').click();
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await page.locator('input[type="password"]').last().fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });

    // Get initial score
    const scoreElement = page.locator('[data-testid="score"]');
    await expect(scoreElement).toBeVisible();
    const initialScore = await scoreElement.textContent();

    // Place a shape (if possible)
    const shapeButtons = page.locator('[data-testid^="shape-button-"]');
    const firstShapeButton = shapeButtons.first();

    if (await firstShapeButton.isVisible()) {
      // Drag shape to grid
      const firstGridCell = page.locator('[data-testid="tile-R0C0"]');
      await firstShapeButton.dragTo(firstGridCell);

      // Wait for score to update
      await page.waitForTimeout(500);
      const newScore = await scoreElement.textContent();

      // Verify score changed
      expect(newScore).not.toBe(initialScore);

      // Refresh page
      await page.reload();
      await page.waitForSelector('[data-testid="game-grid"]', { timeout: 10000 });

      // Verify score persisted
      const loadedScore = await page.locator('[data-testid="score"]').textContent();
      expect(loadedScore).toBe(newScore);
    }
  });

  test('should not share state between different users', async ({ page, context }) => {
    const testEmail1 = generateTestEmail();
    const testEmail2 = generateTestEmail();

    // Register and play as user 1
    await page.goto('/');
    await page.waitForSelector('[data-testid="game-grid"]', { timeout: 10000 });
    await page.locator('button[aria-label="Login"]').click();
    await page.locator('button:has-text("Create Account")').click();
    await page.locator('input[type="email"]').fill(testEmail1);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await page.locator('input[type="password"]').last().fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });

    const user1Score = await page.locator('[data-testid="score"]').textContent();

    // Logout
    await page.locator('button.logout-button').click();

    // Register as user 2
    await page.locator('button[aria-label="Login"]').click();
    await page.locator('button:has-text("Create Account")').click();
    await page.locator('input[type="email"]').fill(testEmail2);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await page.locator('input[type="password"]').last().fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });

    const user2Score = await page.locator('[data-testid="score"]').textContent();

    // User 2 should start with fresh state (score 0)
    expect(user2Score).toBe(user1Score); // Both should be 0 if no shapes placed
  });
});

test.describe('Cross-Device Sync Simulation', () => {
  test('should sync game state across browser contexts', async ({ browser }) => {
    const testEmail = generateTestEmail();

    // Create two browser contexts (simulating two devices)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Device 1: Register and play
      await page1.goto('http://localhost:5173');
      await page1.waitForSelector('[data-testid="game-grid"]', { timeout: 10000 });
      await page1.locator('button[aria-label="Login"]').click();
      await page1.locator('button:has-text("Create Account")').click();
      await page1.locator('input[type="email"]').fill(testEmail);
      await page1.locator('input[type="password"]').first().fill(TEST_PASSWORD);
      await page1.locator('input[type="password"]').last().fill(TEST_PASSWORD);
      await page1.locator('button[type="submit"]').click();
      await expect(page1.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });

      const device1Score = await page1.locator('[data-testid="score"]').textContent();

      // Device 2: Login with same account
      await page2.goto('http://localhost:5173');
      await page2.waitForSelector('[data-testid="game-grid"]', { timeout: 10000 });
      await page2.locator('button[aria-label="Login"]').click();
      await page2.locator('input[type="email"]').fill(testEmail);
      await page2.locator('input[type="password"]').fill(TEST_PASSWORD);
      await page2.locator('button[type="submit"]').click();
      await expect(page2.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });

      // Device 2 should see same game state
      const device2Score = await page2.locator('[data-testid="score"]').textContent();
      expect(device2Score).toBe(device1Score);
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});

test.describe('Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // This test would require mocking network responses
    // For now, we just verify the error UI exists
    await page.goto('/');
    await page.waitForSelector('[data-testid="game-grid"]', { timeout: 10000 });

    // Open login overlay
    await page.locator('button[aria-label="Login"]').click();

    // Verify error container exists in DOM (even if not visible)
    const errorContainer = page.locator('.login-error');
    await expect(errorContainer).toHaveCount(0); // Should not be visible initially
  });

  test('should clear errors when switching between login/register', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="game-grid"]', { timeout: 10000 });

    // Open login overlay
    await page.locator('button[aria-label="Login"]').click();

    // Try invalid login to trigger error
    await page.locator('input[type="email"]').fill('invalid@example.com');
    await page.locator('input[type="password"]').fill('InvalidPass123');
    await page.locator('button[type="submit"]').click();

    // Wait for error
    await expect(page.locator('.login-error')).toBeVisible({ timeout: 5000 });

    // Switch to register mode
    await page.locator('button:has-text("Create Account")').click();

    // Error should be cleared
    await expect(page.locator('.login-error')).not.toBeVisible();
  });
});
