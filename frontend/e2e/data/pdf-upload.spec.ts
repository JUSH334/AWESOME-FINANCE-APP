// tests/e2e/data/pdf-upload.spec.ts
import { test, expect } from '../setup';
import path from 'path';

test.describe('PDF Upload', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.click('text=/add data/i');
    await page.click('button:has-text("Upload Statement")');
  });

  test('should display upload form', async ({ authenticatedPage: page }) => {
    await expect(page.getByText(/upload.*statement/i)).toBeVisible();
    await expect(page.locator('input[type="file"]')).toBeAttached();
  });

  test('should upload PDF file', async ({ authenticatedPage: page }) => {
    const filePath = path.join(__dirname, '../../fixtures/sample-statement.pdf');
    await page.setInputFiles('input[type="file"]', filePath);
    
    await expect(page.getByText(/sample-statement.pdf/i)).toBeVisible();
    await page.click('button:has-text("Parse Statement")');
    
    await expect(page.getByText(/successfully parsed/i)).toBeVisible({ timeout: 15000 });
  });

  test('should show error for non-PDF files', async ({ authenticatedPage: page }) => {
    const filePath = path.join(__dirname, '../../fixtures/sample.txt');
    await page.setInputFiles('input[type="file"]', filePath);
    await expect(page.getByText(/valid pdf/i)).toBeVisible();
  });

  test('should display parsed transactions', async ({ authenticatedPage: page }) => {
    // Upload and parse
    const filePath = path.join(__dirname, '../../fixtures/sample-statement.pdf');
    await page.setInputFiles('input[type="file"]', filePath);
    await page.click('button:has-text("Parse Statement")');
    await page.waitForTimeout(2000);
    
    await expect(page.getByText(/transactions.*selected/i)).toBeVisible();
  });

  test('should edit parsed transaction', async ({ authenticatedPage: page }) => {
    // Upload and parse first
    const filePath = path.join(__dirname, '../../fixtures/sample-statement.pdf');
    await page.setInputFiles('input[type="file"]', filePath);
    await page.click('button:has-text("Parse Statement")');
    await page.waitForTimeout(2000);
    
    await page.click('button[title="Edit"]:first');
    await page.fill('input[value*=""]', '99.99');
    await page.click('button[title="Save"]');
  });

  test('should select/deselect transactions', async ({ authenticatedPage: page }) => {
    const filePath = path.join(__dirname, '../../fixtures/sample-statement.pdf');
    await page.setInputFiles('input[type="file"]', filePath);
    await page.click('button:has-text("Parse Statement")');
    await page.waitForTimeout(2000);
    
    // Deselect first transaction
    await page.click('input[type="checkbox"]:first');
    await expect(page.getByText(/\d+ of \d+ selected/)).not.toContainText('0');
  });

  test('should import selected transactions', async ({ authenticatedPage: page }) => {
    const filePath = path.join(__dirname, '../../fixtures/sample-statement.pdf');
    await page.setInputFiles('input[type="file"]', filePath);
    await page.click('button:has-text("Parse Statement")');
    await page.waitForTimeout(2000);
    
    await page.click('button:has-text("Import Selected")');
    await expect(page.getByText(/successfully imported/i)).toBeVisible({ timeout: 10000 });
  });

  test('should cancel import', async ({ authenticatedPage: page }) => {
    const filePath = path.join(__dirname, '../../fixtures/sample-statement.pdf');
    await page.setInputFiles('input[type="file"]', filePath);
    await page.click('button:has-text("Parse Statement")');
    await page.waitForTimeout(2000);
    
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('input[type="file"]')).toBeVisible();
  });
});