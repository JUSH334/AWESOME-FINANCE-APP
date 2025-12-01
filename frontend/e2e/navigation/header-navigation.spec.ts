// tests/e2e/navigation/header-navigation.spec.ts
import { test, expect } from '../setup';

test.describe('Header Navigation', () => {
  test('should display page title', async ({ authenticatedPage: page }) => {
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display sign out button', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
  });

  test('should sign out user', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Sign Out")');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should display welcome message on dashboard', async ({ authenticatedPage: page }) => {
    await page.click('a[href="/dashboard"]');
    await expect(page.getByText(/welcome back/i)).toBeVisible();
  });

  test('should display subtitle for each page', async ({ authenticatedPage: page }) => {
    await page.click('a[href="/accounts"]');
    await expect(page.getByText(/view and manage/i)).toBeVisible();
    
    await page.click('a[href="/budgets"]');
    await expect(page.getByText(/manage your spending/i)).toBeVisible();
  });

  test('should clear localStorage on sign out', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Sign Out")');
    const token = await page.evaluate(() => localStorage.getItem('myfin.jwt'));
    expect(token).toBeNull();
  });
});