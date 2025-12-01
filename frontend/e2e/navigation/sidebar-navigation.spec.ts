// tests/e2e/navigation/sidebar-navigation.spec.ts
import { test, expect } from '../setup';

test.describe('Sidebar Navigation', () => {
  test('should navigate to accounts', async ({ authenticatedPage: page }) => {
    await page.click('a[href="/accounts"]');
    await expect(page).toHaveURL(/.*accounts/);
    await expect(page.locator('a[href="/accounts"]')).toHaveClass(/bg-green-600/);
  });

  test('should navigate to budgets', async ({ authenticatedPage: page }) => {
    await page.click('a[href="/budgets"]');
    await expect(page).toHaveURL(/.*budgets/);
    await expect(page.locator('a[href="/budgets"]')).toHaveClass(/bg-green-600/);
  });

  test('should navigate to AI insights', async ({ authenticatedPage: page }) => {
    await page.click('a[href="/ai-insights"]');
    await expect(page).toHaveURL(/.*ai-insights/);
    await expect(page.locator('a[href="/ai-insights"]')).toHaveClass(/bg-green-600/);
  });

  test('should navigate to profile', async ({ authenticatedPage: page }) => {
    await page.click('a[href="/profile"]');
    await expect(page).toHaveURL(/.*profile/);
    await expect(page.locator('a[href="/profile"]')).toHaveClass(/bg-green-600/);
  });

  test('should display app logo and name', async ({ authenticatedPage: page }) => {
    await expect(page.getByText(/awesome finance/i)).toBeVisible();
  });

  test('should display current page in sidebar', async ({ authenticatedPage: page }) => {
    await page.click('a[href="/budgets"]');
    await expect(page.getByText(/budgets/i).first()).toBeVisible();
  });

  test('should show version number', async ({ authenticatedPage: page }) => {
    await expect(page.getByText(/v\d+\.\d+/i)).toBeVisible();
  });
});