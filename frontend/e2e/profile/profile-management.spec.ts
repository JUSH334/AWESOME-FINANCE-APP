// tests/e2e/profile/profile-management.spec.ts
import { test, expect } from '../setup';

test.describe('Profile Management', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.click('a[href="/profile"]');
  });

  test('should display profile page', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /profile settings/i })).toBeVisible();
  });

  test('should display profile tab by default', async ({ authenticatedPage: page }) => {
    await expect(page.getByText(/personal information/i)).toBeVisible();
  });

  test('should update first and last name', async ({ authenticatedPage: page }) => {
    await page.fill('input[placeholder*="John"]', 'UpdatedFirst');
    await page.fill('input[placeholder*="Doe"]', 'UpdatedLast');
    await page.click('button:has-text("Save Changes")');
    await expect(page.getByText(/updated successfully/i)).toBeVisible();
  });

  test('should update email address', async ({ authenticatedPage: page }) => {
    const newEmail = `newemail${Date.now()}@example.com`;
    await page.fill('input[type="email"]', newEmail);
    await page.click('button:has-text("Save Changes")');
    await expect(page.getByText(/verification email has been sent/i)).toBeVisible();
  });

  test('should not allow username change in profile', async ({ authenticatedPage: page }) => {
    const usernameInput = page.locator('input[disabled]').first();
    await expect(usernameInput).toBeDisabled();
  });

  test('should switch to security tab', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Security")');
    await expect(page.getByText(/change password/i)).toBeVisible();
  });

  test('should change password successfully', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Security")');
    await page.fill('input[placeholder*="current"]', 'TestPassword123!');
    await page.fill('input[placeholder*="new password"]', 'NewPassword123!');
    await page.fill('input[placeholder*="confirm"]', 'NewPassword123!');
    await page.click('button:has-text("Update Password")');
    await expect(page.getByText(/password changed successfully/i)).toBeVisible();
  });

  test('should show error for wrong current password', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Security")');
    await page.fill('input[placeholder*="current"]', 'WrongPassword123');
    await page.fill('input[placeholder*="new password"]', 'NewPassword123!');
    await page.fill('input[placeholder*="confirm"]', 'NewPassword123!');
    await page.click('button:has-text("Update Password")');
    await expect(page.getByText(/incorrect|invalid/i)).toBeVisible();
  });

  test('should show error when new passwords do not match', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Security")');
    await page.fill('input[placeholder*="current"]', 'TestPassword123!');
    await page.fill('input[placeholder*="new password"]', 'NewPassword123!');
    await page.fill('input[placeholder*="confirm"]', 'DifferentPassword123!');
    await page.click('button:has-text("Update Password")');
    await expect(page.getByText(/do not match/i)).toBeVisible();
  });

  test('should toggle password visibility', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Security")');
    const passwordInput = page.locator('input[placeholder*="current"]');
    const toggleButton = passwordInput.locator('..').locator('button[type="button"]');
    
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('should switch to data tab', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Data")');
    await expect(page.getByText(/export data/i)).toBeVisible();
  });

  test('should export data as CSV', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Data")');
    await page.selectOption('select', 'csv');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export All Data")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('should export data as JSON', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Data")');
    await page.selectOption('select', 'json');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export All Data")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.json$/);
  });

  test('should show delete account section', async ({ authenticatedPage: page }) => {
    await expect(page.getByText(/delete account/i)).toBeVisible();
    await expect(page.getByText(/permanently delete/i)).toBeVisible();
  });

  test('should show delete confirmation', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Delete Account")');
    await expect(page.getByText(/absolutely sure/i)).toBeVisible();
  });

  test('should cancel account deletion', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Delete Account")');
    await page.clic