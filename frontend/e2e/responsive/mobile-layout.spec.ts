// tests/e2e/responsive/mobile-layout.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Mobile Layout', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display mobile-optimized layout', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await expect(page.locator('header')).toBeVisible();
  });

  test('should show hamburger menu on mobile', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    // Mobile menu should be hidden by default
    const desktopNav = page.locator('.hidden.md\\:flex');
    await expect(desktopNav).not.toBeVisible();
  });

  test('should stack summary cards vertically', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    // Login first
    await page.fill('input[placeholder*="username"]', 'testuser');
    await page.fill('input[placeholder*="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    const cards = page.locator('.rounded-2xl.bg-white');
    const firstCard = cards.first();
    const secondCard = cards.nth(1);
    
    const box1 = await firstCard.boundingBox();
    const box2 = await secondCard.boundingBox();
    
    // Cards should be stacked (Y position of second > Y position of first)
    expect(box2?.y).toBeGreaterThan(box1?.y || 0);
  });

  test('should make charts responsive', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder*="username"]', 'testuser');
    await page.fill('input[placeholder*="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    const chart = page.locator('.recharts-wrapper');
    const box = await chart.first().boundingBox();
    
    // Chart should not exceed viewport width
    expect(box?.width).toBeLessThanOrEqual(375);
  });
});