// tests/e2e/integration/data-flow.spec.ts
import { test, expect } from '../setup';

test.describe('Data Flow Integration', () => {
  test('should sync data across all pages', async ({ authenticatedPage: page }) => {
    const timestamp = Date.now();
    const accountName = `Integration Account ${timestamp}`;
    
    // 1. Create an account
    await page.click('text=/add data/i');
    await page.click('button:has-text("Add Account")');
    await page.fill('input[placeholder*="Chase Checking"]', accountName);
    await page.selectOption('select', 'checking');
    await page.fill('input[placeholder="0.00"]', '5000.00');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/account created successfully/i)).toBeVisible({ timeout: 5000 });

    // 2. Verify account appears in accounts page
    await page.click('a[href="/accounts"]');
    await expect(page.getByText(accountName)).toBeVisible();
    await expect(page.getByText(/\$5,000/)).toBeVisible();

    // 3. Add a transaction to this account
    await page.click('text=/add data/i');
    await page.click('button:has-text("Add Transaction")');
    await page.fill('input[placeholder="0.00"]', '100.00');
    await page.selectOption('select:has-text("Expense")', 'out');
    await page.selectOption('select:has-text("Other")', 'Groceries');
    await page.fill('input[placeholder*="Walmart"]', 'Test Store');
    await page.click('button:has-text("Add Transaction")');
    await expect(page.getByText(/transaction added successfully/i)).toBeVisible({ timeout: 5000 });

    // 4. Verify transaction appears in accounts page
    await page.click('a[href="/accounts"]');
    await expect(page.getByText('Groceries')).toBeVisible();
    await expect(page.getByText('Test Store')).toBeVisible();

    // 5. Create a budget for the same category
    await page.click('a[href="/budgets"]');
    await page.click('button:has-text("Add Budget")');
    await page.selectOption('select', 'Groceries');
    await page.fill('input[placeholder="1000.00"]', '500.00');
    await page.click('button:has-text("Create Budget")');
    await expect(page.getByText(/budget created successfully/i)).toBeVisible({ timeout: 5000 });

    // 6. Verify budget shows spent amount from transaction
    await expect(page.getByText('Groceries')).toBeVisible();
    await expect(page.getByText(/\$100/)).toBeVisible(); // Spent amount
    await expect(page.getByText(/\$500/)).toBeVisible(); // Total budget

    // 7. Verify data appears in dashboard
    await page.click('a[href="/dashboard"]');
    await expect(page.getByText(/\$5,000/)).toBeVisible(); // Total balance
    await page.waitForTimeout(2000); // Wait for charts to render

    // 8. Verify AI insights can access the data
    await page.click('a[href="/ai-insights"]');
    await expect(page.getByText(/financial health score/i)).toBeVisible({ timeout: 15000 });
  });

  test('should handle concurrent operations', async ({ authenticatedPage: page }) => {
    // Create multiple accounts rapidly
    for (let i = 0; i < 3; i++) {
      await page.click('text=/add data/i');
      await page.click('button:has-text("Add Account")');
      await page.fill('input[placeholder*="Chase Checking"]', `Concurrent Account ${i}`);
      await page.selectOption('select', 'checking');
      await page.fill('input[placeholder="0.00"]', `${(i + 1) * 1000}.00`);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }

    // Verify all accounts exist
    await page.click('a[href="/accounts"]');
    for (let i = 0; i < 3; i++) {
      await expect(page.getByText(`Concurrent Account ${i}`)).toBeVisible();
    }
  });

  test('should maintain data integrity after updates', async ({ authenticatedPage: page }) => {
    // Create account
    await page.click('text=/add data/i');
    await page.click('button:has-text("Add Account")');
    await page.fill('input[placeholder*="Chase Checking"]', 'Update Test Account');
    await page.selectOption('select', 'checking');
    await page.fill('input[placeholder="0.00"]', '1000.00');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Add transaction
    await page.click('button:has-text("Add Transaction")');
    await page.fill('input[placeholder="0.00"]', '50.00');
    await page.selectOption('select:has-text("Expense")', 'out');
    await page.selectOption('select:has-text("Other")', 'Gas');
    await page.click('button:has-text("Add Transaction")');
    await page.waitForTimeout(1000);

    // Update account balance
    await page.click('a[href="/accounts"]');
    await page.click('button[title="Edit Account"]:first');
    await page.fill('input[type="number"]', '2000.00');
    await page.click('button:has-text("Save Changes")');
    await expect(page.getByText(/updated successfully/i)).toBeVisible();

    // Verify transaction still exists
    await expect(page.getByText('Gas')).toBeVisible();
    await expect(page.getByText(/\$50/)).toBeVisible();

    // Verify dashboard reflects changes
    await page.click('a[href="/dashboard"]');
    await page.waitForTimeout(2000);
    await expect(page.getByText(/\$2,000/)).toBeVisible();
  });
});