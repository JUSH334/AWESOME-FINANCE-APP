// tests/e2e/error-handling/validation-errors.spec.ts
import { test, expect } from '../setup';

test.describe('Form Validation', () => {
  test('should validate required fields in account form', async ({ authenticatedPage: page }) => {
    await page.click('text=/add data/i');
    await page.click('button:has-text("Add Account")');
    await page.click('button[type="submit"]');
    
    await expect(page.getByText(/required/i).first()).toBeVisible();
  });

  test('should validate required fields in transaction form', async ({ authenticatedPage: page }) => {
    await page.click('text=/add data/i');
    await page.click('button:has-text("Add Transaction")');
    await page.click('button[type="submit"]');
    
    await expect(page.getByText(/required/i).first()).toBeVisible();
  });

  test('should validate required fields in budget form', async ({ authenticatedPage: page }) => {
    await page.click('a[href="/budgets"]');
    await page.click('button:has-text("Add Budget")');
    await page.click('button[type="submit"]');
    
    await expect(page.getByText(/required/i).first()).toBeVisible();
  });

  test('should validate number inputs', async ({ authenticatedPage: page }) => {
    await page.click('text=/add data/i');
    await page.click('button:has-text("Add Transaction")');
    await page.fill('input[placeholder="0.00"]', 'invalid');
    
    const value = await page.locator('input[placeholder="0.00"]').inputValue();
    expect(value).toBe('');
  });

  test('should validate date inputs', async ({ authenticatedPage: page }) => {
    await page.click('text=/add data/i');
    await page.click('button:has-text("Add Transaction")');
    await page.fill('input[type="date"]', 'invalid-date');
    
    const value = await page.locator('input[type="date"]').inputValue();
    expect(value).toBe('');
  });
});