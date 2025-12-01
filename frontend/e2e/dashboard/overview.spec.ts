// tests/e2e/dashboard/overview.spec.ts
import { test, expect } from '../setup';

test.describe('Dashboard Overview', () => {
  test('should display all summary cards', async ({ authenticatedPage: page }) => {
    await expect(page.getByText(/total balance/i)).toBeVisible();
    await expect(page.getByText(/monthly income/i)).toBeVisible();
    await expect(page.getByText(/monthly expenses/i)).toBeVisible();
    await expect(page.getByText(/savings goal/i)).toBeVisible();
  });

  test('should display spending over time chart', async ({ authenticatedPage: page }) => {
    await expect(page.getByText(/spending over time/i)).toBeVisible();
    // Check for chart container
    const chartContainer = page.locator('#spending-chart');
    await expect(chartContainer).toBeVisible();
  });

  test('should display spending by category chart', async ({ authenticatedPage: page }) => {
    await expect(page.getByText(/spending by category/i)).toBeVisible();
    const chartContainer = page.locator('#category-chart');
    await expect(chartContainer).toBeVisible();
  });

  test('should allow customizing spending chart', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Customize"):first');
    await expect(page.getByText(/chart type/i)).toBeVisible();
    await expect(page.getByText(/time range/i)).toBeVisible();
    await expect(page.getByText(/aggregation/i)).toBeVisible();
  });

  test('should change chart type', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Customize"):first');
    await page.selectOption('select[value*="area"]', 'bar');
    // Wait for chart to re-render
    await page.waitForTimeout(500);
    await expect(page.locator('#spending-chart')).toBeVisible();
  });

  test('should filter by time range', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Customize"):first');
    await page.selectOption('text=Time Range', '30d');
    await expect(page.getByText(/last 30 days/i)).toBeVisible();
  });

  test('should filter by category', async ({ authenticatedPage: page }) => {
    await page.click('button:has-text("Customize"):first');
    // Click a category filter
    await page.click('button:has-text("Groceries")');
    await expect(page.locator('button:has-text("Groceries")')).toHaveClass(/emerald/);
  });

  test('should display welcome message', async ({ authenticatedPage: page }) => {
    await expect(page.getByText(/welcome back/i)).toBeVisible();
  });

  test('should show empty state when no data', async ({ page }) => {
    // Login with new account
    const timestamp = Date.now();
    await page.goto('http://localhost:5173/register');
    // ... register new user ...
    await page.goto('http://localhost:5173/dashboard');
    await expect(page.getByText(/get started/i)).toBeVisible();
  });
});