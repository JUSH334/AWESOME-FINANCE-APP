// tests/e2e/integration/pdf-upload-flow.spec.ts
import { test, expect } from '../setup';
import path from 'path';

test.describe('PDF Upload Integration', () => {
  test('complete PDF statement processing workflow', async ({ authenticatedPage: page }) => {
    // 1. Upload PDF
    await page.click('text=/add data/i');
    await page.click('button:has-text("Upload Statement")');
    
    const filePath = path.join(__dirname, '../../fixtures/sample-statement.pdf');
    await page.setInputFiles('input[type="file"]', filePath);
    await expect(page.getByText(/sample-statement.pdf/i)).toBeVisible();
    
    // 2. Parse statement
    await page.click('button:has-text("Parse Statement")');
    await expect(page.getByText(/successfully parsed/i)).toBeVisible({ timeout: 15000 });
    
    // 3. Review parsed transactions
    await expect(page.getByText(/transactions.*selected/i)).toBeVisible();
    
    // 4. Edit a transaction
    await page.click('button[title="Edit"]:first');
    await page.fill('input[type="number"]', '75.00');
    await page.click('button[title="Save"]');
    
    // 5. Deselect some transactions
    await page.click('input[type="checkbox"]:nth(2)');
    
    // 6. Import selected transactions
    const selectedCount = await page.locator('input[type="checkbox"]:checked').count();
    await page.click('button:has-text("Import Selected")');
    await expect(page.getByText(/successfully imported/i)).toBeVisible({ timeout: 10000 });
    
    // 7. Verify transactions appear in accounts
    await page.click('a[href="/accounts"]');
    await page.waitForTimeout(2000);
    
    // Should see imported transactions
    const transactionRows = await page.locator('tbody tr').count();
    expect(transactionRows).toBeGreaterThan(0);
    
    // 8. Verify budgets auto-update if categories match
    await page.click('a[href="/budgets"]');
    // Should see spending reflected if budgets exist for those categories
  });

  test('should handle PDF upload errors gracefully', async ({ authenticatedPage: page }) => {
    await page.click('text=/add data/i');
    await page.click('button:has-text("Upload Statement")');
    
    // Try to upload non-PDF file
    const txtFile = path.join(__dirname, '../../fixtures/sample.txt');
    await page.setInputFiles('input[type="file"]', txtFile);
    
    await expect(page.getByText(/valid pdf/i)).toBeVisible();
  });

  test('should allow re-upload after cancellation', async ({ authenticatedPage: page }) => {
    await page.click('text=/add data/i');
    await page.click('button:has-text("Upload Statement")');
    
    const filePath = path.join(__dirname, '../../fixtures/sample-statement.pdf');
    await page.setInputFiles('input[type="file"]', filePath);
    await page.click('button:has-text("Parse Statement")');
    await page.waitForTimeout(2000);
    
    // Cancel import
    await page.click('button:has-text("Cancel")');
    
    // Should be able to upload again
    await expect(page.locator('input[type="file"]')).toBeVisible();
    await page.setInputFiles('input[type="file"]', filePath);
    await page.click('button:has-text("Parse Statement")');
    await expect(page.getByText(/successfully parsed/i)).toBeVisible({ timeout: 15000 });
  });
});