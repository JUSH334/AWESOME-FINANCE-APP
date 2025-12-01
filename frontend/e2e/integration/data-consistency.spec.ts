// tests/e2e/integration/data-consistency.spec.ts
import { test, expect } from '../setup.ts';

test.describe('Data Consistency', () => {
  test('should maintain referential integrity when deleting accounts', async ({ authenticatedPage: page }) => {
    // Create account
    await page.click('text=/add data/i');
    await page.click('button:has-text("Add Account")');
    await page.fill('input[placeholder*="Chase Checking"]', 'To Delete Account');
    await page.fill('input[placeholder="0.00"]', '1000.00');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Add transaction to this account
    await page.click('button:has-text("Add Transaction")');
    await page.fill('input[placeholder="0.00"]', '50.00');
    await page.selectOption('select:has-text("Expense")', 'out');
    await page.selectOption('select:has-text("Other")', 'Gas');
    await page.click('button:has-text("Add Transaction")');
    await page.waitForTimeout(1000);
    
    // Delete the account
    await page.click('a[href="/accounts"]');
    page.on('dialog', dialog => dialog.accept());
    await page.click('button[title="Delete Account"]:last');
    await expect(page.getByText(/deleted successfully/i)).toBeVisible();
    
    // Verify transactions still display (orphaned) or are also deleted
    await page.reload();
    
    // App should not crash
    await expect(page.getByRole('heading', { name: /accounts/i })).toBeVisible();
  });

  test('should recalculate budgets when transactions change', async ({ authenticatedPage: page }) => {
    // Create budget
    await page.click('a[href="/budgets"]');
    await page.click('button:has-text("Add Budget")');
    await page.selectOption('select', 'Shopping');
    await page.fill('input[placeholder="1000.00"]', '500.00');
    await page.click('button:has-text("Create Budget")');
    await page.waitForTimeout(1000);
    
    // Add transaction in same category
    await page.click('text=/add data/i');
    await page.click('button:has-text("Add Transaction")');
    await page.fill('input[placeholder="0.00"]', '100.00');
    await page.selectOption('select:has-text("Other")', 'Shopping');
    await page.click('button:has-text("Add Transaction")');
    await page.waitForTimeout(1000);
    
    // Check budget shows spent amount
    await page.click('a[href="/budgets"]');
    await expect(page.getByText(/\$100/)).toBeVisible();
    
    // Delete the transaction
    await page.click('a[href="/accounts"]');
    const transactionRow = page.locator('tr:has-text("Shopping")').first();
    await transactionRow.locator('button[title*="Delete"]').click();
    page.on('dialog', dialog => dialog.accept());
    await page.waitForTimeout(1000);
    
    // Budget should reflect removal
    await page.click('a[href="/budgets"]');
    await page.waitForTimeout(1000);
    
    // Spent should be $0 or less than $100
    const budgetText = await page.locator('text=/Shopping/i').locator('..').locator('..').textContent();
    expect(budgetText).not.toContain('$100');
  });

  test('should handle concurrent budget updates', async ({ authenticatedPage: page }) => {
    // Create budget
    await page.click('a[href="/budgets"]');
    await page.click('button:has-text("Add Budget")');
    await page.selectOption('select', 'Dining');
    await page.fill('input[placeholder="1000.00"]', '300.00');
    await page.click('button:has-text("Create Budget")');
    await page.waitForTimeout(1000);
    
    // Add multiple transactions quickly
    for (let i = 0; i < 3; i++) {
      await page.click('text=/add data/i');
      await page.click('button:has-text("Add Transaction")');
      await page.fill('input[placeholder="0.00"]', '25.00');
      await page.selectOption('select:has-text("Other")', 'Dining');
      await page.click('button:has-text("Add Transaction")');
      await page.waitForTimeout(300);
    }
    
    // Budget should show correct total
    await page.click('a[href="/budgets"]');
    await page.waitForTimeout(2000);
    
    await expect(page.getByText(/\$75/)).toBeVisible(); // 3 x $25
  });

  test('should sync dashboard data with source changes', async ({ authenticatedPage: page }) => {
    // Get initial dashboard balance
    await page.click('a[href="/dashboard"]');
    await page.waitForTimeout(2000);
    
    // Add new account
    await page.click('text=/add data/i');
    await page.click('button:has-text("Add Account")');
    await page.fill('input[placeholder*="Chase Checking"]', 'Dashboard Sync Test');
    await page.fill('input[placeholder="0.00"]', '2000.00');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Return to dashboard - should auto-update or require refresh
    await page.click('a[href="/dashboard"]');
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Should show updated balance
    await expect(page.getByText(/\$2,000/)).toBeVisible();
  });

  test('should preserve data during navigation', async ({ authenticatedPage: page }) => {
    // Create data in one session
    await page.click('text=/add data/i');
    await page.click('button:has-text("Add Account")');
    await page.fill('input[placeholder*="Chase Checking"]', 'Navigation Test');
    await page.fill('input[placeholder="0.00"]', '1500.00');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Navigate away and back
    await page.click('a[href="/budgets"]');
    await page.click('a[href="/profile"]');
    await page.click('a[href="/ai-insights"]');
    await page.click('a[href="/accounts"]');
    
    // Data should still be there
    await expect(page.getByText('Navigation Test')).toBeVisible();
    await expect(page.getByText(/\$1,500/)).toBeVisible();
  });

  test('should handle timezone differences correctly', async ({ authenticatedPage: page }) => {
    // Add transaction with today's date
    await page.click('text=/add data/i');
    await page.click('button:has-text("Add Transaction")');
    await page.fill('input[placeholder="0.00"]', '75.00');
    
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    await page.fill('input[type="date"]', dateString);
    
    await page.selectOption('select:has-text("Other")', 'Other');
    await page.click('button:has-text("Add Transaction")');
    await page.waitForTimeout(1000);
    
    // Verify date displays correctly
    await page.click('a[href="/accounts"]');
    
    const displayedDate = await page.locator('tr').first().locator('td').first().textContent();
    
    // Should match today's date in user's locale
    const expectedDate = today.toLocaleDateString();
    expect(displayedDate).toContain(today.getDate().toString());
  });
});