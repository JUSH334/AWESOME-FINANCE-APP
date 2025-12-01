// frontend/e2e/setup.ts
import { test as base, expect } from '@playwright/test';

// Define the fixture type
type TestFixtures = {
  authenticatedPage: any;
};

// Extend base test with custom fixtures
export const test = base.extend<TestFixtures>({
  // Authenticated context fixture
  authenticatedPage: async ({ page }, use:any) => {
    // Navigate to login page
    await page.goto('http://localhost:5173/login');
    
    // Use a consistent test user (assuming this user exists)
    // You may need to create this user first or modify credentials
    const testCredentials = {
      username: 'testuser',
      password: 'TestPassword123!'
    };
    
    // Fill in login form
    await page.fill('input[placeholder*="username"]', testCredentials.username);
    await page.fill('input[placeholder*="password"]', testCredentials.password);
    
    // Submit login
    const submit = page.getByRole('button', { name: 'Sign in' });
    await submit.click();
    
    // Wait for successful login and navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Verify we're logged in by checking for dashboard elements
    await page.waitForSelector('text=/welcome back/i', { timeout: 5000 });
    
    // Pass the authenticated page to the test
    await use(page);
    
    // Cleanup is automatic - page is disposed after test
  }
});

export { expect };