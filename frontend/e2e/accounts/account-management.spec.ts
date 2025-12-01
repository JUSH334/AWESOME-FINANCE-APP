// tests/e2e/accounts/account-management.spec.ts
import { test, expect } from '../setup';

test.describe('Account Management', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.click('a[href="/accounts"]');
    await expect(page).toHaveURL(/.*accounts/);
    await expect(
    page.getByRole('heading', {  name: /transactions/i, level: 2})
  ).toBeVisible({ timeout: 10000 });

  });

  test('should display accounts page', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /accounts.*transactions/i })).toBeVisible();
  });

  test('should create new account', async ({ authenticatedPage: page }) => {
    await page.click('text=/add data/i');
    await page.waitForURL(/.*add-data/);
    
    await page.click('button:has-text("Add Account")');
    await page.fill('input[placeholder*="Chase Checking"]', 'Account Test Checking');
    await page.selectOption('select', 'checking');
    await page.fill('input[placeholder="0.00"]', '1000.00');
    await page.fill('input[placeholder*="Chase Bank"]', 'Test Bank');
    
    await page.click('button[type="submit"]');
    await expect(page.getByText(/account created successfully/i)).toBeVisible({ timeout: 5000 });
  });

test('should edit account', async ({ authenticatedPage: page }) => {
  // Navigate to Accounts page and wait for subheading
  await page.click('a[href="/accounts"]');
  await expect(
    page.getByRole('heading', { name: /accounts.*transactions/i })
  ).toBeVisible({ timeout: 10000 });

  // Click the first Edit Account button
  const editButton = page.getByRole('button', { name: /edit account/i }).first();
  await expect(editButton).toBeVisible({ timeout: 5000 });
  await editButton.click();

  // Wait for edit modal to appear
  await expect(page.getByRole('heading', { name: /edit account/i })).toBeVisible({ timeout: 5000 });

  // Get all textboxes and select the one after the search box (2nd overall)
  const accountNameInput = page.getByRole('textbox').nth(1);
  await expect(accountNameInput).toBeVisible({ timeout: 5000 });

  // Fill in the updated account name
  await accountNameInput.fill('Updated Account Name');

  // Click Save Changes
  const saveButton = page.getByRole('button', { name: /save changes/i });
  await expect(saveButton).toBeVisible({ timeout: 5000 });
  await saveButton.click();

  // Verify success message
  await expect(page.getByText(/updated successfully/i)).toBeVisible({ timeout: 5000 });
});

test('should delete account', async ({ authenticatedPage: page }) => {
  // Create account first
  await page.click('text=/add data/i');
  await page.click('button:has-text("Add Account")');
  await page.fill('input[placeholder*="Chase Checking"]', 'Account To Delete');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);
  
  // Navigate back to accounts page
  await page.click('a[href="/accounts"]');
  
  // Wait for accounts page to load
  await expect(
    page.getByRole('heading', { name: /accounts.*transactions/i })
  ).toBeVisible({ timeout: 10000 });
  
  // Set up dialog handler before clicking delete
  page.on('dialog', dialog => dialog.accept());
  
  // Use getByRole instead of CSS selector with :last pseudo-class
  await page.getByRole('button', { name: /delete account/i }).last().click();
  
  await expect(page.getByText(/deleted successfully/i)).toBeVisible({ timeout: 5000 });
});


});