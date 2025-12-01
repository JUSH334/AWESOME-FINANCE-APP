// tests/e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByPlaceholder(/username or email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
  });

test('should show validation errors', async ({ page }) => {
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page.getByText(/username or email is required/i)).toBeVisible({ timeout: 5000 });
});

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[placeholder*="username"]', 'wronguser');
    await page.fill('input[placeholder*="password"]', 'wrongpass');
     await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/invalid.*credentials/i)).toBeVisible({ timeout: 5000 });
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // Assumes test user exists from setup
    await page.fill('input[placeholder*="username"]', 'testuser');
    await page.fill('input[placeholder*="password"]', 'TestPassword123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
  });

  test('should respect remember me checkbox', async ({ page }) => {
    await page.fill('input[placeholder*="username"]', 'testuser');
    await page.fill('input[placeholder*="password"]', 'TestPassword123!');
    
    // Uncheck remember me
    const rememberCheckbox = page.locator('input[type="checkbox"]');
    await rememberCheckbox.uncheck();
    
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/.*dashboard/);
    
    // Check sessionStorage instead of localStorage
    const sessionToken = await page.evaluate(() => sessionStorage.getItem('myfin.session.jwt'));
    expect(sessionToken).toBeTruthy();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('input[placeholder*="password"]');
    const toggleButton = passwordInput.locator('..').locator('button');
    
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

test('should navigate to register page', async ({ page }) => {
  await page.getByRole('link', { name: /create one/i }).click();
  await expect(page).toHaveURL(/.*register/, { timeout: 5000 });
});

  test('should navigate to forgot password page', async ({ page }) => {
    await page.click('text=/forgot password/i');
    await expect(page).toHaveURL(/.*reset-password/);
  });

  test('should navigate to change username page', async ({ page }) => {
    await page.click('text=/change username/i');
    await expect(page).toHaveURL(/.*change-username/);
  });
});