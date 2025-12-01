// tests/e2e/integration/error-recovery.spec.ts
import { test, expect } from '../setup';

test.describe('Error Recovery', () => {
  test('should recover from network failures', async ({ authenticatedPage: page }) => {
    // Simulate network failure during operation
    await page.route('**/api/data/accounts', route => route.abort());
    await page.click('a[href="/accounts"]');
    
    // Should show error message
    await expect(page.getByText(/error|failed|unavailable/i)).toBeVisible({ timeout: 10000 });

    // Restore network
    await page.unroute('**/api/data/accounts');
    
    // Retry operation
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Should work now
    await expect(page.getByRole('heading', { name: /accounts.*transactions/i })).toBeVisible();
  });

  test('should handle partial data loss', async ({ authenticatedPage: page }) => {
    // Create account and transaction
    await page.click('text=/add data/i');
    await page.click('button:has-text("Add Account")');
    await page.fill('input[placeholder*="Chase Checking"]', 'Recovery Test');
    await page.fill('input[placeholder="0.00"]', '1000.00');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    await page.click('button:has-text("Add Transaction")');
    await page.fill('input[placeholder="0.00"]', '50.00');
    await page.click('button:has-text("Add Transaction")');
    await page.waitForTimeout(1000);

    // Delete account
    await page.click('a[href="/accounts"]');
    page.on('dialog', dialog => dialog.accept());
    await page.click('button[title="Delete Account"]:first');
    await expect(page.getByText(/deleted successfully/i)).toBeVisible();

    // Verify orphaned transactions don't crash the app
    await page.reload();
    await page.click('a[href="/dashboard"]');
    await page.waitForTimeout(2000);
    
    // App should still function
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('should handle session expiration', async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder*="username"]', 'testuser');
    await page.fill('input[placeholder*="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Clear token to simulate expiration
    await page.evaluate(() => {
      localStorage.removeItem('myfin.jwt');
      sessionStorage.removeItem('myfin.session.jwt');
    });

    // Try to access protected page
    await page.click('a[href="/accounts"]');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
  });

  test('should handle duplicate data gracefully', async ({ authenticatedPage: page }) => {
    const accountName = `Duplicate Test ${Date.now()}`;

    // Create account
    await page.click('text=/add data/i');
    await page.click('button:has-text("Add Account")');
    await page.fill('input[placeholder*="Chase Checking"]', accountName);
    await page.fill('input[placeholder="0.00"]', '1000.00');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Try to create account with same name
    await page.click('button:has-text("Add Account")');
    await page.fill('input[placeholder*="Chase Checking"]', accountName);
    await page.fill('input[placeholder="0.00"]', '2000.00');
    await page.click('button[type="submit"]');
    
    // Should either show error or allow (depending on business logic)
    // App shouldn't crash
    await page.waitForTimeout(1000);
    await page.click('a[href="/accounts"]');
    await expect(page.getByRole('heading', { name: /accounts/i })).toBeVisible();
  });
});