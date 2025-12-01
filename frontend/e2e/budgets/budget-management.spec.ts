// tests/e2e/budgets/budget-management.spec.ts
import { test, expect } from '../setup';

test.describe('Budget Management', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.click('a[href="/budgets"]');
  });

  test('should display budgets page', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /budgets.*calculator/i })).toBeVisible();
  });

  test('should create new budget', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Add Budget")');
    await page.selectOption('select', 'Groceries');
    await page.fill('input[placeholder="1000.00"]', '500.00');
    await page.selectOption('select:has-text("Monthly")', 'monthly');
    await page.click('button:has-text("Create Budget")');
    await expect(page.getByText(/budget created successfully/i)).toBeVisible();
  });

  test('should edit budget', async ({ authenticatedPage: page }) => {
    await page.click('button[title*="Edit"]:first');
    await page.fill('input[type="number"]', '600.00');
    await page.click('button:has-text("Update Budget")');
    await expect(page.getByText(/updated successfully/i)).toBeVisible();
  });

  test('should delete budget', async ({ authenticatedPage: page }) => {
    page.on('dialog', dialog => dialog.accept());
    await page.click('button[title*="Delete"]:first');
    await expect(page.getByText(/deleted successfully/i)).toBeVisible();
  });

  test('should display budget progress', async ({ authenticatedPage: page }) => {
    await expect(page.getByText(/% used/i)).toBeVisible();
    await expect(page.getByText(/remaining/i)).toBeVisible();
  });

  test('should show budget status indicators', async ({ authenticatedPage: page }) => {
    // Should show different status colors
    await expect(page.locator('.bg-emerald-100, .bg-amber-100, .bg-rose-100')).toHaveCount({ min: 1 });
  });

  test('should sort budgets by name', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Name")');
    await page.waitForTimeout(500);
  });

  test('should sort budgets by usage', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Usage")');
    await page.waitForTimeout(500);
  });

  test('should switch to calculator tab', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Savings Calculator")');
    await expect(page.getByText(/monthly income/i)).toBeVisible();
    await expect(page.getByText(/savings goal/i)).toBeVisible();
  });

  test('should calculate savings', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Savings Calculator")');
    await page.fill('input[placeholder="5000"]', '5000');
    await page.fill('input[placeholder="12000"]', '10000');
    
    // Move slider
    const slider = page.locator('input[type="range"]');
    await slider.fill('20');
    
    await expect(page.getByText(/\$1,000/)).toBeVisible(); // 20% of 5000
  });

  test('should save savings goal', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Savings Calculator")');
    await page.fill('input[placeholder="12000"]', '15000');
    await page.click('button:has-text("Save Savings Goal")');
    await expect(page.getByText(/saved successfully/i)).toBeVisible();
  });

  test('should display time to reach goal', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Savings Calculator")');
    await expect(page.getByText(/time to reach goal/i)).toBeVisible();
  });
});