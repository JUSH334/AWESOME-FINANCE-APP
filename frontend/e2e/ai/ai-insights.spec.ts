// tests/e2e/ai/ai-insights.spec.ts
import { test, expect } from '../setup';

test.describe('AI Insights', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.click('a[href="/ai-insights"]');
  });

  test('should display AI insights page', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /ai insights/i })).toBeVisible();
  });

  test('should display financial health score', async ({ authenticatedPage: page }) => {
    await expect(page.getByText(/financial health score/i)).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=/\\d+/')).toBeVisible();
  });

  test('should display score label', async ({ authenticatedPage: page }) => {
    await expect(page.getByText(/excellent|good|fair|needs attention/i)).toBeVisible({ timeout: 15000 });
  });

  test('should display predictions', async ({ authenticatedPage: page }) => {
    await expect(page.getByText(/ai predictions/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/confidence/i)).toBeVisible();
  });

  test('should display insights', async ({ authenticatedPage: page }) => {
    await expect(page.getByText(/key insights/i)).toBeVisible({ timeout: 15000 });
  });

  test('should display recommendations', async ({ authenticatedPage: page }) => {
    await expect(page.getByText(/personalized recommendations/i)).toBeVisible({ timeout: 15000 });
  });

  test('should refresh insights', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Refresh")');
    await expect(page.locator('text=/analyzing/i')).toBeVisible();
    await expect(page.locator('text=/analyzing/i')).not.toBeVisible({ timeout: 20000 });
  });

  test('should display savings goal in header', async ({ authenticatedPage: page }) => {
    await expect(page.getByText(/your savings goal/i)).toBeVisible({ timeout: 15000 });
  });

  test('should show error state when API fails', async ({ authenticatedPage: page }) => {
    await page.route('**/api/ai/recommendations', route => route.abort());
    await page.reload();
    await expect(page.getByText(/failed to load/i)).toBeVisible({ timeout: 10000 });
  });

  test('should display disclaimer', async ({ authenticatedPage: page }) => {
    await expect(page.getByText(/disclaimer/i)).toBeVisible({ timeout: 15000 });
  });

  test('should display quick stats', async ({ authenticatedPage: page }) => {
    await expect(page.getByText(/savings rate/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/monthly expenses/i)).toBeVisible();
  });

  test('should show prediction confidence bars', async ({ authenticatedPage: page }) => {
    const confidenceBars = page.locator('.bg-emerald-600').filter({ hasText: /confidence/i });
    await expect(confidenceBars.first()).toBeVisible({ timeout: 15000 });
  });

  test('should display insight icons', async ({ authenticatedPage: page }) => {
    await expect(page.locator('svg[class*="lucide"]')).toHaveCount({ min: 3 });
  });
});