// tests/e2e/integration/user-journey.spec.ts
import { test, expect } from '../setup';

test.describe('Complete User Journey', () => {
  test('new user onboarding flow', async ({ page }) => {
    const timestamp = Date.now();
    const testUser = {
      username: `journey${timestamp}`,
      email: `journey${timestamp}@example.com`,
      password: 'JourneyTest123!'
    };

    // 1. Register
    await page.goto('http://localhost:5173/register');
    await page.fill('input[placeholder*="username"]', testUser.username);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[placeholder*="first name"]', 'Journey');
    await page.fill('input[placeholder*="last name"]', 'User');
    await page.fill('input[placeholder*="password"]:not([placeholder*="Confirm"])', testUser.password);
    await page.fill('input[placeholder*="Confirm"]', testUser.password);
    await page.click('button[type="submit"]');
    await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 10000 });

    // 2. Login (skip email verification)
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder*="username"]', testUser.username);
    await page.fill('input[placeholder*="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // 3. View empty dashboard
    await expect(page.getByText(/get started/i)).toBeVisible();

    // 4. Add first account
    await page.click('text=/add data/i');
    await page.click('button:has-text("Add Account")');
    await page.fill('input[placeholder*="Chase Checking"]', 'My First Account');
    await page.selectOption('select', 'checking');
    await page.fill('input[placeholder="0.00"]', '3000.00');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/account created successfully/i)).toBeVisible();

    // 5. Add first transaction
    await page.click('button:has-text("Add Transaction")');
    await page.fill('input[placeholder="0.00"]', '200.00');
    await page.selectOption('select:has-text("Expense")', 'out');
    await page.selectOption('select:has-text("Other")', 'Shopping');
    await page.fill('input[placeholder*="Walmart"]', 'Amazon');
    await page.click('button:has-text("Add Transaction")');
    await expect(page.getByText(/transaction added successfully/i)).toBeVisible();

    // 6. Create first budget
    await page.click('a[href="/budgets"]');
    await page.click('button:has-text("Add Budget")');
    await page.selectOption('select', 'Shopping');
    await page.fill('input[placeholder="1000.00"]', '1000.00');
    await page.click('button:has-text("Create Budget")');
    await expect(page.getByText(/budget created successfully/i)).toBeVisible();

    // 7. Set savings goal
    await page.click('button:has-text("Savings Calculator")');
    await page.fill('input[placeholder="12000"]', '10000');
    await page.click('button:has-text("Save Savings Goal")');
    await expect(page.getByText(/saved successfully/i)).toBeVisible();

    // 8. Get AI insights
    await page.click('a[href="/ai-insights"]');
    await expect(page.getByText(/financial health score/i)).toBeVisible({ timeout: 15000 });

    // 9. Update profile
    await page.click('a[href="/profile"]');
    await page.fill('input[placeholder*="John"]', 'Journey');
    await page.fill('input[placeholder*="Doe"]', 'User');
    await page.click('button:has-text("Save Changes")');
    await expect(page.getByText(/updated successfully/i)).toBeVisible();

    // 10. Verify all data persists on dashboard
    await page.click('a[href="/dashboard"]');
    await expect(page.getByText(/\$3,000/)).toBeVisible();
    await expect(page.getByText(/Journey User/i)).toBeVisible();
  });

  test('experienced user workflow', async ({ authenticatedPage: page }) => {
    // Simulate user with existing data performing daily tasks

    // 1. Quick check dashboard
    await expect(page.getByText(/welcome back/i)).toBeVisible();

    // 2. Add today's transactions in bulk
    const transactions = [
      { amount: '45.50', category: 'Groceries', merchant: 'Whole Foods' },
      { amount: '12.00', category: 'Dining', merchant: 'Starbucks' },
      { amount: '60.00', category: 'Gas', merchant: 'Shell' }
    ];

    for (const txn of transactions) {
      await page.click('text=/add data/i');
      await page.click('button:has-text("Add Transaction")');
      await page.fill('input[placeholder="0.00"]', txn.amount);
      await page.selectOption('select:has-text("Other")', txn.category);
      await page.fill('input[placeholder*="Walmart"]', txn.merchant);
      await page.click('button:has-text("Add Transaction")');
      await page.waitForTimeout(500);
    }

    // 3. Review spending by category
    await page.click('a[href="/accounts"]');
    await page.click('button:has-text("Filters")');
    await page.selectOption('select:has-text("All Categories")', 'Groceries');
    await expect(page.getByText('Whole Foods')).toBeVisible();

    // 4. Check budget status
    await page.click('a[href="/budgets"]');
    await expect(page.getByText(/% used/i)).toBeVisible();

    // 5. Get updated AI insights
    await page.click('a[href="/ai-insights"]');
    await page.click('button:has-text("Refresh")');
    await expect(page.locator('text=/analyzing/i')).toBeVisible();
    await expect(page.locator('text=/analyzing/i')).not.toBeVisible({ timeout: 20000 });
  });
});