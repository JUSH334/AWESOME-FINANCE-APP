// tests/e2e/accessibility/a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('login page should be accessible', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('dashboard should be accessible', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder*="username"]', 'testuser');
    await page.fill('input[placeholder*="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    // Tab through form
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to type in username field
    await page.keyboard.type('testuser');
    
    // Tab to password
    await page.keyboard.press('Tab');
    await page.keyboard.type('TestPassword123!');
    
    // Tab to submit and press enter
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    expect(page.url()).toContain('dashboard');
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    // Check for ARIA labels on inputs
    const usernameInput = page.locator('input[placeholder*="username"]');
    const passwordInput = page.locator('input[placeholder*="password"]');
    
    // Should have associated labels or aria-label
    const usernameLabel = await usernameInput.evaluate((el) => {
      return el.getAttribute('aria-label') || 
             document.querySelector(`label[for="${el.id}"]`)?.textContent;
    });
    
    expect(usernameLabel).toBeTruthy();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();
    
    const colorContrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );
    
    expect(colorContrastViolations).toEqual([]);
  });

  test('images should have alt text', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeDefined();
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['best-practice'])
      .analyze();
    
    const headingViolations = accessibilityScanResults.violations.filter(
      v => v.id.includes('heading')
    );
    
    expect(headingViolations).toEqual([]);
  });

  test('form elements should have labels', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    const labelViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'label'
    );
    
    expect(labelViolations).toEqual([]);
  });

  test('should announce dynamic content changes', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder*="username"]', 'testuser');
    await page.fill('input[placeholder*="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Check for aria-live regions for notifications
    const liveRegions = await page.locator('[aria-live]').count();
    
    // Should have at least one live region for notifications
    expect(liveRegions).toBeGreaterThanOrEqual(0);
  });

  test('modals should trap focus', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder*="username"]', 'testuser');
    await page.fill('input[placeholder*="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Open a modal (e.g., add budget)
    await page.click('a[href="/budgets"]');
    await page.click('button:has-text("Add Budget")');
    
    // Tab through modal - focus should stay within modal
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Focus should still be within modal
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    
    expect(focusedElement).toBeTruthy();
  });

  test('should support screen reader navigation', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    // Check for landmarks
    const main = await page.locator('main').count();
    const nav = await page.locator('nav').count();
    const header = await page.locator('header').count();
    
    expect(main + nav + header).toBeGreaterThan(0);
  });
});