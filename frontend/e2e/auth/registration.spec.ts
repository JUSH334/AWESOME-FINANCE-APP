// tests/e2e/auth/registration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/register');
  });

  test('should display registration form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
    await expect(page.getByPlaceholder(/username/i)).toBeVisible();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/first name/i)).toBeVisible();
    await expect(page.getByPlaceholder(/last name/i)).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.getByText(/username is required/i)).toBeVisible();
    await expect(page.getByText(/email/i)).toBeVisible();
  });

  test('should show error for invalid email', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test('should show error for weak password', async ({ page }) => {
    await page.fill('input[placeholder*="password"]:not([placeholder*="Confirm"])', '123');
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
  });

  test('should show password strength indicator', async ({ page }) => {
    await page.fill('input[placeholder*="password"]:not([placeholder*="Confirm"])', 'Test123!@#');
    await expect(page.getByText(/password strength/i)).toBeVisible();
  });

  test('should show error when passwords do not match', async ({ page }) => {
    await page.fill('input[placeholder*="password"]:not([placeholder*="Confirm"])', 'TestPassword123!');
    await page.fill('input[placeholder*="Confirm"]', 'DifferentPassword123!');
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test('should show success indicator when passwords match', async ({ page }) => {
    const password = 'TestPassword123!';
    await page.fill('input[placeholder*="password"]:not([placeholder*="Confirm"])', password);
    await page.fill('input[placeholder*="Confirm"]', password);
    await expect(page.getByText(/passwords match/i)).toBeVisible();
  });

  test('should successfully register new user', async ({ page }) => {
    const timestamp = Date.now();
    await page.fill('input[placeholder*="username"]', `testuser${timestamp}`);
    await page.fill('input[type="email"]', `test${timestamp}@example.com`);
    await page.fill('input[placeholder*="first name"]', 'Test');
    await page.fill('input[placeholder*="last name"]', 'User');
    await page.fill('input[placeholder*="password"]:not([placeholder*="Confirm"])', 'TestPassword123!');
    await page.fill('input[placeholder*="Confirm"]', 'TestPassword123!');
    
    await page.click('button[type="submit"]');
    await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 10000 });
  });

  test('should show error for duplicate username', async ({ page }) => {
    const username = 'existinguser';
    // First registration
    await page.fill('input[placeholder*="username"]', username);
    await page.fill('input[type="email"]', 'test1@example.com');
    await page.fill('input[placeholder*="first name"]', 'Test');
    await page.fill('input[placeholder*="last name"]', 'User');
    await page.fill('input[placeholder*="password"]:not([placeholder*="Confirm"])', 'TestPassword123!');
    await page.fill('input[placeholder*="Confirm"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Try again with same username
    await page.goto('http://localhost:5173/register');
    await page.fill('input[placeholder*="username"]', username);
    await page.fill('input[type="email"]', 'test2@example.com');
    await page.fill('input[placeholder*="first name"]', 'Test');
    await page.fill('input[placeholder*="last name"]', 'User');
    await page.fill('input[placeholder*="password"]:not([placeholder*="Confirm"])', 'TestPassword123!');
    await page.fill('input[placeholder*="Confirm"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    await expect(page.getByText(/username.*taken|already exists/i)).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('input[placeholder*="password"]:not([placeholder*="Confirm"])');
    const toggleButton = passwordInput.locator('..').locator('button');
    
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should navigate to login page', async ({ page }) => {
    await page.click('text=/sign in/i');
    await expect(page).toHaveURL(/.*login/);
  });
});