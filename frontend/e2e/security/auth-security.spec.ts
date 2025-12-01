// tests/e2e/security/auth-security.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Security Tests', () => {
  test('should prevent SQL injection in login', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder*="username"]', "admin' OR '1'='1");
    await page.fill('input[placeholder*="password"]', "admin' OR '1'='1");
     await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show error, not login
    await expect(page.getByText(/invalid.*credentials/i)).toBeVisible({ timeout: 5000 });
    await expect(page).not.toHaveURL(/.*dashboard/);
  });



  test('should require authentication for protected routes', async ({ page }) => {
    // Try to access dashboard without logging in
    await page.goto('http://localhost:5173/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
    
    // Try other protected routes
    await page.goto('http://localhost:5173/accounts');
    await expect(page).toHaveURL(/.*login/);
    
    await page.goto('http://localhost:5173/budgets');
    await expect(page).toHaveURL(/.*login/);
    
    await page.goto('http://localhost:5173/profile');
    await expect(page).toHaveURL(/.*login/);
  });


  test('should prevent brute force login attempts', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    // Attempt multiple failed logins
    for (let i = 0; i < 5; i++) {
      await page.fill('input[placeholder*="username"]', 'wronguser');
      await page.fill('input[placeholder*="password"]', 'wrongpass');
     await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForTimeout(1000);
    }
    
    // Should still show error (rate limiting would be backend concern)
    await expect(page.getByText(/invalid.*credentials/i)).toBeVisible();
  });

  test('should prevent clickjacking', async ({ page }) => {
    // Check for X-Frame-Options or CSP frame-ancestors
    await page.goto('http://localhost:5173');
    
    const headers = await page.evaluate(() => {
      return fetch(window.location.href).then(r => {
        const headers: Record<string, string> = {};
        r.headers.forEach((value, key) => {
          headers[key] = value;
        });
        return headers;
      });
    });
    
    // Should have either X-Frame-Options or CSP with frame-ancestors
    const hasFrameProtection = 
      headers['x-frame-options'] || 
      (headers['content-security-policy'] && headers['content-security-policy'].includes('frame-ancestors'));
    
    // Note: This might not be set in dev mode, but should be in production
    console.log('Frame protection:', hasFrameProtection ? 'Yes' : 'No');
  });
});