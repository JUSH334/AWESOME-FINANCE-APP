// tests/e2e/setup.ts
import { test as base, expect } from '@playwright/test';

// Extend base test with custom fixtures
export const test = base.extend({
  // Authenticated context
  authenticatedPage: async ({ page }, use) => {
    // Register and login
    await page.goto('http://localhost:5173/register');
    const timestamp = Date.now();
    const testUser = {
      username: `testuser${timestamp}`,
      email: `test${timestamp}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      password: 'TestPassword123!'
    };
    
    await page.fill('input[placeholder*="username"]', testUser.username);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[placeholder*="first name"]', testUser.firstName);
    await page.fill('input[placeholder*="last name"]', testUser.lastName);
    await page.fill('input[placeholder*="password"]:not([placeholder*="Confirm"])', testUser.password);
    await page.fill('input[placeholder*="Confirm"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for success page and extract verification token from email mock
    await page.waitForURL('**/register', { timeout: 5000 });
    
    // Mock email verification by directly calling the API
    const response = await page.request.post('http://localhost:8080/api/auth/verify-email', {
      params: { token: 'mock-token' }
    });
    
    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder*="username"]', testUser.username);
    await page.fill('input[placeholder*="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    await use(page);
  }
});

export { expect };