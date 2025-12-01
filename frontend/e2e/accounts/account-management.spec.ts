// tests/e2e/accounts/account-management.spec.ts
import { test, expect } from '../setup';

test.describe('Account Management', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.click('a[href="/accounts"]');
    await expect(page).toHaveURL(/.*accounts/);
  });

  test('should display accounts page', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /accounts.*transactions/i })).toBeVisible();
  });

  test('should create new account', async ({ authenticatedPage: page }) => {
    await page.click('text=/add data/i');
    await page.waitForURL(/.*add-data/);
    
    await page.click('button:has-text("Add Account")');
    await page.fill('input[placeholder*="Chase Checking"]', 'Test Checking');
    await page.selectOption('select', 'checking');
    await page.fill('input[placeholder="0.00"]', '1000.00');
    await page.fill('input[placeholder*="Chase Bank"]', 'Test Bank');
    
    await page.click('button[type="submit"]');
    await expect(page.getByText(/account created successfully/i)).toBeVisible({ timeout: 5000 });
  });

  test('should edit account', async ({ authenticatedPage: page }) => {
    // Assuming at least one account exists
    await page.click('button[title="Edit Account"]:first');
    await page.fill('input[value*=""]', 'Updated Account Name');
    await page.click('button:has-text("Save Changes")');
    await expect(page.getByText(/updated successfully/i)).toBeVisible();
  });

  test('should delete account', async ({ authenticatedPage: page }) => {
    // Create account first
    await page.click('text=/add data/i');
    await page.click('button:has-text("Add Account")');
    await page.fill('input[placeholder*="Chase Checking"]', 'Account To Delete');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    await page.click('a[href="/accounts"]');
    
    // Set up dialog handler before clicking delete
    page.on('dialog', dialog => dialog.accept());
    await page.click('button[title="Delete Account"]:last');
    await expect(page.getByText(/deleted successfully/i)).toBeVisible();
  });

  test('should display account card with details', async ({ authenticatedPage: page }) => {
    const accountCard = page.locator('[style*="backgroundColor"]').first();
    await expect(accountCard).toBeVisible();
    await expect(accountCard.getByText(/available balance/i)).toBeVisible();
  });

  test('should filter accounts by search', async ({ authenticatedPage: page }) => {
    await page.fill('input[placeholder*="Search"]', 'Checking');
    await page.waitForTimeout(500);
    // Should show only checking accounts
    await expect(page.getByText(/checking/i)).toBeVisible();
  });
});