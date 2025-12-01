// tests/e2e/transactions/transaction-management.spec.ts
import { test, expect } from '../setup';

test.describe('Transaction Management', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.click('a[href="/accounts"]');
  });

  test('should create new transaction', async ({ authenticatedPage: page }) => {
    await page.click('text=/add data/i');
    await page.click('button:has-text("Add Transaction")');
    
    await page.fill('input[placeholder="0.00"]', '50.00');
    await page.selectOption('select:has-text("Expense")', 'out');
    await page.selectOption('select:has-text("Other")', 'Groceries');
    await page.fill('input[placeholder*="Walmart"]', 'Test Store');
    await page.fill('textarea', 'Test transaction note');
    
    await page.click('button:has-text("Add Transaction")');
    await expect(page.getByText(/transaction added successfully/i)).toBeVisible();
  });

  test('should edit transaction', async ({ authenticatedPage: page }) => {
    await page.click('button[title="Edit Transaction"]:first');
    await page.fill('input[type="number"]', '75.00');
    await page.click('button:has-text("Save Changes")');
    await expect(page.getByText(/updated successfully/i)).toBeVisible();
  });

  test('should delete transaction', async ({ authenticatedPage: page }) => {
    page.on('dialog', dialog => dialog.accept());
    await page.click('button[title="Delete Transaction"]:first');
    await expect(page.getByText(/deleted successfully/i)).toBeVisible();
  });

  test('should filter transactions by category', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Filters")');
    await page.selectOption('select:has-text("All Categories")', 'Groceries');
    await expect(page.getByText(/groceries/i)).toBeVisible();
  });

  test('should filter transactions by date range', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Filters")');
    await page.fill('input[type="date"]:first', '2025-01-01');
    await page.fill('input[type="date"]:last', '2025-12-31');
    // Transactions should be filtered
    await page.waitForTimeout(500);
  });

  test('should filter transactions by amount', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Filters")');
    await page.fill('input[placeholder="0.00"]:first', '10');
    await page.fill('input[placeholder="0.00"]:last', '100');
    await page.waitForTimeout(500);
  });

  test('should sort transactions', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Date")');
    await page.waitForTimeout(500);
    // Should toggle sort direction
    await page.click('button:has-text("Date")');
    await page.waitForTimeout(500);
  });

  test('should clear all filters', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Filters")');
    await page.selectOption('select:has-text("All Categories")', 'Groceries');
    await page.click('text=/clear.*filters/i');
    await expect(page.locator('select')).toHaveValue('all');
  });

  test('should bulk delete transactions', async ({ authenticatedPage: page }) => {
    // Select multiple transactions
    await page.click('input[type="checkbox"]:first');
    await page.click('input[type="checkbox"]:nth(2)');
    
    page.on('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Delete Selected")');
    await expect(page.getByText(/deleted.*successfully/i)).toBeVisible();
  });

  test('should select all transactions', async ({ authenticatedPage: page }) => {
    await page.click('th input[type="checkbox"]');
    const checkboxes = await page.locator('td input[type="checkbox"]').count();
    const checkedBoxes = await page.locator('td input[type="checkbox"]:checked').count();
    expect(checkboxes).toBe(checkedBoxes);
  });
});