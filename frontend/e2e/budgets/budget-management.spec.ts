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
  await expect(page.getByRole('heading', { name: /groceries/i, level: 3 })).toBeVisible({ timeout: 5000 });
  
  // Based on page snapshot, the edit button appears to be around the 7th-8th button
  // Try different nth values if needed: 6, 7, 8
  const editButton = page.locator('button').nth(6);
  await editButton.click();

  await page.fill('input[type="number"]', '600.00');
  await page.click('button:has-text("Update Budget")');
  await expect(page.getByText(/updated successfully/i)).toBeVisible({ timeout: 5000 });
});

test('should delete budget', async ({ authenticatedPage: page }) => {
  await expect(page.getByRole('heading', { name: /groceries/i, level: 3 })).toBeVisible({ timeout: 5000 });
  
  page.on('dialog', dialog => dialog.accept());
  
  // Delete is typically the second button in the action group
  await page.locator('button').nth(7).click(); // Adjust index as needed
  
  await expect(page.getByText(/deleted successfully/i)).toBeVisible({ timeout: 5000 });
});

test('should display budget progress', async ({ authenticatedPage: page }) => {
  // The "Remaining" summary card is always visible (shown in snapshot)
  await expect(page.getByText(/remaining/i).first()).toBeVisible();
  
  // Create a budget first to see progress indicators
  await page.click('button:has-text("Add Budget")');
  await page.selectOption('select', 'Groceries');
  await page.fill('input[placeholder="1000.00"]', '500.00');
  await page.selectOption('select:has-text("Monthly")', 'monthly');
  await page.click('button:has-text("Create Budget")');
  
  // Now the "% used" indicator should appear in the budget card
  await expect(page.getByText(/% used/i)).toBeVisible();
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
    await expect(page.getByText(/savings goal/i).first()).toBeVisible();
  });

  test('should calculate savings', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Savings Calculator")');
    await page.fill('input[placeholder="5000"]', '5000');
    await page.fill('input[placeholder="12000"]', '10000');
    
    // Move slider
    const slider = page.locator('input[type="range"]');
    await slider.fill('20');
    
    await expect(page.getByText(/\$1,000.00/).first()).toBeVisible(); // 20% of 5000
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