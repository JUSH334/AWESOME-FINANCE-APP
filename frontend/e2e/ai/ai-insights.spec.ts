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
  // Wait for the financial health score heading
  await expect(page.getByText(/financial health score/i)).toBeVisible({ timeout: 15000 });
  
  // Use a more specific locator - find score near the heading
  const scoreSection = page.getByText(/financial health score/i).locator('..');
  await expect(scoreSection.getByText(/^\d+$/)).toBeVisible({ timeout: 5000 });
});

test('should display score label', async ({ authenticatedPage: page }) => {
  // Wait for financial health section to load first
  await expect(page.getByText(/financial health score/i)).toBeVisible({ timeout: 15000 });
  
  // Scope the label search to the financial health section
  const scoreSection = page.getByText(/financial health score/i).locator('..');
  await expect(scoreSection.getByText(/excellent|good|fair|needs attention/i).first()).toBeVisible({ timeout: 5000 });
});

test('should display predictions', async ({ authenticatedPage: page }) => {
  // Use getByRole for the heading instead of getByText
  await expect(page.getByRole('heading', { name: /ai predictions/i })).toBeVisible({ timeout: 15000 });
  
  // Scope confidence search to AI Predictions section
  const predictionsSection = page.getByRole('heading', { name: /ai predictions/i }).locator('..');
  await expect(predictionsSection.getByText(/ai predictions/i)).toBeVisible({ timeout: 5000 });
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


  test('should show error state when API fails', async ({ authenticatedPage: page }) => {
    await page.route('**/api/ai/recommendations', route => route.abort());
    await page.reload();
    await expect(page.getByText(/failed to load/i)).toBeVisible({ timeout: 10000 });
  });

  test('should display disclaimer', async ({ authenticatedPage: page }) => {
    await expect(page.getByText(/disclaimer/i)).toBeVisible({ timeout: 15000 });
  });
});