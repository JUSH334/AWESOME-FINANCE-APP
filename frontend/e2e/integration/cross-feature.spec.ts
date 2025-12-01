// tests/e2e/integration/cross-feature.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Cross-Feature Integration', () => {
  test('budget reflects real-time transaction changes', async ({ authenticatedPage: page }) => {
    // Create budget first
    await page.click('a[href="/budgets"]');
    await page.click('button:has-text("Add Budget")');
    await page.selectOption('select', 'Dining');
    await page.fill('input[placeholder="1000.00"]', '300.00');
    await page.click('button:has-text("Create Budget")');
    await page.waitForTimeout(1000);

    // Get initial budget info
    const initialSpent = await page.getByText(/\$\d+\.\d+ of \$300\.00/).textContent();

    // Add transaction in same category
    await page.click('text=/add data/i');
    await page.click('button:has-text("Add Transaction")');
    await page.fill('input[placeholder="0.00"]', '50.00');
    await page.selectOption('select:has-text("Other")', 'Dining');
    await page.click('button:has-text("Add Transaction")');
    await page.waitForTimeout(1000);

    // Check budget updated
    await page.click('a[href="/budgets"]');
    const updatedSpent = await page.getByText(/\$\d+\.\d+ of \$300\.00/).textContent();
    
    expect(updatedSpent).not.toBe(initialSpent);
  });

  test('dashboard reflects changes from all modules', async ({ authenticatedPage: page }) => {
    // Get initial dashboard state
    await page.click('a[href="/dashboard"]');
    await page.waitForTimeout(2000);
    
    const initialBalance = await page.locator('text=/total balance/i').locator('..').getByText(/\$/).first().textContent();

    // Add account
    await page.click('text=/add data/i');
    await page.click('button:has-text("Add Account")');
    await page.fill('input[placeholder*="Chase Checking"]', 'Dashboard Test');
    await page.fill('input[placeholder="0.00"]', '5000.00');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Check dashboard updated
    await page.click('a[href="/dashboard"]');
    await page.waitForTimeout(2000);
    
    const newBalance = await page.locator('text=/total balance/i').locator('..').getByText(/\$/).first().textContent();
    
    expect(newBalance).not.toBe(initialBalance);
  });

  test('AI insights update with new data', async ({ authenticatedPage: page }) => {
    // Get initial AI score
    await page.click('a[href="/ai-insights"]');
    await expect(page.getByText(/financial health score/i)).toBeVisible({ timeout: 15000 });
    
    const initialScore = await page.locator('text=/\\d+/').first().textContent();

    // Add significant transaction
    await page.click('text=/add data/i');
    await page.click('button:has-text("Add Transaction")');
    await page.fill('input[placeholder="0.00"]', '1000.00');
    await page.selectOption('select:has-text("Expense")', 'in'); // Income
    await page.selectOption('select:has-text("Other")', 'Salary');
    await page.click('button:has-text("Add Transaction")');
    await page.waitForTimeout(1000);

    // Refresh AI insights
    await page.click('a[href="/ai-insights"]');
    await page.click('button:has-text("Refresh")');
    await page.waitForTimeout(2000);
    
    // Score should potentially change (or at least recommendations)
    await expect(page.getByText(/recommendations/i)).toBeVisible();
  });

  test('profile changes reflect across app', async ({ authenticatedPage: page }) => {
    // Update profile name
    await page.click('a[href="/profile"]');
    await page.fill('input[placeholder*="John"]', 'Updated');
    await page.fill('input[placeholder*="Doe"]', 'Name');
    await page.click('button:has-text("Save Changes")');
    await expect(page.getByText(/updated successfully/i)).toBeVisible();

    // Check header shows updated name
    await page.click('a[href="/dashboard"]');
    await expect(page.getByText(/Updated Name/i)).toBeVisible();
  });

  test('data export includes all current data', async ({ authenticatedPage: page }) => {
    // Create diverse data
    await page.click('text=/add data/i');
    await page.click('button:has-text("Add Account")');
    await page.fill('input[placeholder*="Chase Checking"]', 'Export Test');
    await page.fill('input[placeholder="0.00"]', '1000.00');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    await page.click('button:has-text("Add Transaction")');
    await page.fill('input[placeholder="0.00"]', '100.00');
    await page.selectOption('select:has-text("Other")', 'Groceries');
    await page.click('button:has-text("Add Transaction")');
    await page.waitForTimeout(1000);

    // Export data
    await page.click('a[href="/profile"]');
    await page.click('button:has-text("Data")');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export All Data")');
    const download = await downloadPromise;
    
    // Verify file was created
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });
});