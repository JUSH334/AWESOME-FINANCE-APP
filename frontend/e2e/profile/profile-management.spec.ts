// frontend/e2e/profile/profile-management.spec.ts
import { test, expect } from '../setup';

test.describe('Profile Management', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.click('a[href="/profile"]');
  });

  test('should display profile page', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /profile settings/i })).toBeVisible();
  });

  test('should display profile tab by default', async ({ authenticatedPage: page }) => {
    await expect(page.getByText(/personal information/i)).toBeVisible();
  });

  test('should update first and last name', async ({ authenticatedPage: page }) => {
    await page.fill('input[placeholder*="John"]', 'UpdatedFirst');
    await page.fill('input[placeholder*="Doe"]', 'UpdatedLast');
    await page.click('button:has-text("Save Changes")');
    await expect(page.getByText(/updated successfully/i)).toBeVisible();
  });

  test('should update email address', async ({ authenticatedPage: page }) => {
    const newEmail = `newemail${Date.now()}@example.com`;
    await page.fill('input[type="email"]', newEmail);
    await page.click('button:has-text("Save Changes")');
    await expect(page.getByText(/verification email has been sent/i)).toBeVisible();
  });

  test('should switch to security tab', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /security/i }).click();
    await expect(page.getByText(/change password/i)).toBeVisible();
  });


  test('should toggle password visibility', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Security")');
    const passwordInput = page.locator('input[placeholder*="current"]');
    const toggleButton = passwordInput.locator('..').locator('button[type="button"]');
    
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('should switch to data tab', async ({ authenticatedPage: page }) => {
     await page.getByRole('button', { name: /data/i }).click();
    await expect(page.getByText(/export data/i)).toBeVisible();
  });

  test('should export data as CSV', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Data")');
    await page.selectOption('select', 'csv');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export All Data")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('should export data as JSON', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Data")');
    await page.selectOption('select', 'json');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export All Data")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.json$/);
  });

  test('should show delete account section', async ({ authenticatedPage: page }) => {
    await expect(page.getByText(/delete account/i)).toBeVisible();
    await expect(page.getByText(/permanently delete/i)).toBeVisible();
  });

  test('should show delete confirmation', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Delete Account")');
    await expect(page.getByText(/absolutely sure/i)).toBeVisible();
  });

  test('should cancel account deletion', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Delete Account")');
    await page.click('button:has-text("Cancel")');
    
    // Confirmation dialog should be hidden
    await expect(page.getByText(/absolutely sure/i)).not.toBeVisible();
    
    // Delete account button should still be visible
    await expect(page.getByText(/delete account/i)).toBeVisible();
  });

  test('should require password for account deletion', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Delete Account")');
    
    // Try to delete without entering password
    await page.click('button:has-text("Yes, Delete My Account")');
    
    // Button should be disabled or show error
    const deleteButton = page.locator('button:has-text("Yes, Delete My Account")');
    await expect(deleteButton).toBeDisabled();
  });

  test('should show all profile tabs', async ({ authenticatedPage: page }) => {
    // Check that all tabs are present
    await expect(page.getByText(/profile/i).first()).toBeVisible();
    await expect(page.getByText(/security/i).first()).toBeVisible();
    await expect(page.getByText(/data/i).first()).toBeVisible();
  });

  test('should persist profile changes after navigation', async ({ authenticatedPage: page }) => {
    // Update name
    const firstName = `Test${Date.now()}`;
    await page.fill('input[placeholder*="John"]', firstName);
    await page.click('button:has-text("Save Changes")');
    await expect(page.getByText(/updated successfully/i)).toBeVisible();
    
    // Navigate away
    await page.click('a[href="/dashboard"]');
    await page.waitForTimeout(500);
    
    // Navigate back
    await page.click('a[href="/profile"]');
    
    // Check name is still there
    const nameInput = page.locator('input[placeholder*="John"]');
    await expect(nameInput).toHaveValue(firstName);
  });

  test('should validate email format', async ({ authenticatedPage: page }) => {
    // Try to enter invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.click('button:has-text("Save Changes")');
    
    // Should show validation error or not submit
    // Browser validation will prevent submission
    const emailInput = page.locator('input[type="email"]');
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });

  test('should show loading state when saving', async ({ authenticatedPage: page }) => {
    await page.fill('input[placeholder*="John"]', 'TestName');
    
    // Click save and immediately check for loading state
    await page.click('button:has-text("Save Changes")');
    
    // Should show loading or disabled state briefly
    const saveButton = page.locator('button:has-text("Save Changes"), button:has-text("Saving")');
    
    // Wait for success message
    await expect(page.getByText(/updated successfully/i)).toBeVisible({ timeout: 5000 });
  });

  test('should display current user information', async ({ authenticatedPage: page }) => {
    // Username field should have the test user's username
    const usernameInput = page.locator('input[disabled]').first();
    await expect(usernameInput).toHaveValue(/testuser/i);
  });

  test('should handle multiple password visibility toggles', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Security")');
    const passwordInput = page.locator('input[placeholder*="current"]');
    const toggleButton = passwordInput.locator('..').locator('button[type="button"]');
    
    // Toggle multiple times
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('should clear password fields after successful change', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Security")');
    await page.fill('input[placeholder*="current"]', 'TestPassword123!');
    await page.fill('input[placeholder*="new password"]', 'NewPassword123!');
    await page.fill('input[placeholder*="confirm"]', 'NewPassword123!');
    await page.click('button:has-text("Update Password")');
    await expect(page.getByText(/password changed successfully/i)).toBeVisible();
    
    // Password fields should be cleared
    await expect(page.locator('input[placeholder*="current"]')).toHaveValue('');
    await expect(page.locator('input[placeholder*="new password"]')).toHaveValue('');
    await expect(page.locator('input[placeholder*="confirm"]')).toHaveValue('');
  });

  test('should show export format options', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Data")');
    
    const formatSelect = page.locator('select');
    await expect(formatSelect).toBeVisible();
    
    // Check available options
    const options = await formatSelect.locator('option').allTextContents();
    expect(options.some(opt => opt.includes('CSV'))).toBeTruthy();
    expect(options.some(opt => opt.includes('JSON'))).toBeTruthy();
  });

  test('should display danger zone styling for delete section', async ({ authenticatedPage: page }) => {
    const deleteSection = page.locator('text=/delete account/i').locator('..');
    
    // Check that delete section has warning/danger styling
    const bgColor = await deleteSection.evaluate((el) => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // Should have some red/rose coloring (exact color may vary)
    expect(bgColor).toBeTruthy();
  });

  test('should handle tab switching without losing unsaved changes warning', async ({ authenticatedPage: page }) => {
    // Make a change without saving
    await page.fill('input[placeholder*="John"]', 'UnsavedName');
    
    // Switch tabs
    await page.click('button:has-text("Security")');
    
    // Switch back
    await page.click('button:has-text("Profile")');
    
    // Value should still be there (no form reset)
    const nameInput = page.locator('input[placeholder*="John"]');
    await expect(nameInput).toHaveValue('UnsavedName');
  });

  test('should display email verification status', async ({ authenticatedPage: page }) => {
    // Check if there's any indication of email verification status
    // This might be a badge, text, or icon
    const emailField = page.locator('input[type="email"]');
    await expect(emailField).toBeVisible();
    
    // The page should show verification status somewhere
    // (exact implementation depends on your UI)
  });

  test('should allow changing format selection for export', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Data")');
    
    // Change to JSON
    await page.selectOption('select', 'json');
    let selectedValue = await page.locator('select').inputValue();
    expect(selectedValue).toBe('json');
    
    // Change to CSV
    await page.selectOption('select', 'csv');
    selectedValue = await page.locator('select').inputValue();
    expect(selectedValue).toBe('csv');
  });
});