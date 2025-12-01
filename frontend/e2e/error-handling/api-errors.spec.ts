// tests/e2e/error-handling/api-errors.spec.ts
import { test, expect } from '../setup';

test.describe('API Error Handling', () => {
  test('should handle network errors gracefully', async ({ authenticatedPage: page }) => {
    await page.route('**/api/**', route => route.abort());
    await page.reload();
    
    // Should show error message or fallback UI
    await expect(page.getByText(/error|failed|unavailable/i)).toBeVisible({ timeout: 10000 });
  });

  test('should handle 500 errors', async ({ authenticatedPage: page }) => {
    await page.route('**/api/data/accounts', route => {
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'Internal Server Error' }) });
    });
    await page.reload();
    
    await expect(page.getByText(/error|failed/i)).toBeVisible();
  });

  test('should handle 404 errors', async ({ authenticatedPage: page }) => {
    await page.goto('http://localhost:5173/nonexistent-page');
    await expect(page.getByText(/not found|404/i)).toBeVisible();
  });

  test('should handle unauthorized errors', async ({ page }) => {
    await page.goto('http://localhost:5173/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should retry failed requests', async ({ authenticatedPage: page }) => {
    let callCount = 0;
    await page.route('**/api/ai/recommendations', route => {
      callCount++;
      if (callCount === 1) {
        route.abort();
      } else {
        route.continue();
      }
    });
    
    await page.click('a[href="/ai-insights"]');
    await page.waitForTimeout(2000);
    
    // Should eventually succeed after retry
    await expect(page.getByText(/financial health score/i)).toBeVisible({ timeout: 20000 });
  });
});