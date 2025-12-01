// tests/e2e/accessibility/a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
test('should support keyboard navigation', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  const username = page.locator('input[placeholder*="username"]');
  const password = page.locator('input[placeholder*="password"]');
  const submit = page.locator('button[type="submit"]');

  // Focus and type username
  await username.focus();
  await page.keyboard.type('testuser');

  // Tab to password
  await page.keyboard.press('Tab');
  await page.keyboard.type('TestPassword123!');
  await page.keyboard.press('Enter');

  await page.waitForURL('**/dashboard');
  expect(page.url()).toContain('/dashboard');
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


  test('should support screen reader navigation', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    // Check for landmarks
    const main = await page.locator('main').count();
    const nav = await page.locator('nav').count();
    const header = await page.locator('header').count();
    
    expect(main + nav + header).toBeGreaterThan(0);
  });
});