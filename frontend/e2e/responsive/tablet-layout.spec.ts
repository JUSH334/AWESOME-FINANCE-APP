// tests/e2e/responsive/tablet-layout.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Tablet Layout', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('should display tablet-optimized layout', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await expect(page.locator('header')).toBeVisible();
  });

  test('should show 2-column grid for cards', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder*="username"]', 'testuser');
    await page.fill('input[placeholder*="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    const gridContainer = page.locator('.grid.grid-cols-1.sm\\:grid-cols-2');
    await expect(gridContainer).toBeVisible();
  });
});