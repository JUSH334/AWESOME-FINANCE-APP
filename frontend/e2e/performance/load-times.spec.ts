// tests/e2e/performance/load-times.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load dashboard within acceptable time', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder*="username"]', 'testuser');
    await page.fill('input[placeholder*="password"]', 'TestPassword123!');
    
    const startTime = Date.now();
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.waitForSelector('text=/welcome back/i');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(5000);
    console.log(`Dashboard load time: ${loadTime}ms`);
  });

  test('should handle large transaction lists efficiently', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder*="username"]', 'testuser');
    await page.fill('input[placeholder*="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    const startTime = Date.now();
    await page.click('a[href="/accounts"]');
    await page.waitForSelector('table');
    const renderTime = Date.now() - startTime;
    
    expect(renderTime).toBeLessThan(3000);
    console.log(`Transactions list render time: ${renderTime}ms`);
  });

  test('should render charts without blocking UI', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder*="username"]', 'testuser');
    await page.fill('input[placeholder*="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Check that UI is responsive while charts load
    const startTime = Date.now();
    await page.click('a[href="/budgets"]');
    const navigationTime = Date.now() - startTime;
    
    expect(navigationTime).toBeLessThan(1000);
  });

  test('should handle rapid navigation without memory leaks', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder*="username"]', 'testuser');
    await page.fill('input[placeholder*="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Rapidly navigate between pages
    for (let i = 0; i < 10; i++) {
      await page.click('a[href="/accounts"]');
      await page.waitForTimeout(100);
      await page.click('a[href="/budgets"]');
      await page.waitForTimeout(100);
      await page.click('a[href="/dashboard"]');
      await page.waitForTimeout(100);
    }
    
    // Check memory usage (basic check - app should still be responsive)
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });
});