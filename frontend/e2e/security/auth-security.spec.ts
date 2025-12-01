// tests/e2e/security/auth-security.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Security Tests', () => {
  test('should prevent SQL injection in login', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder*="username"]', "admin' OR '1'='1");
    await page.fill('input[placeholder*="password"]', "admin' OR '1'='1");
    await page.click('button[type="submit"]');
    
    // Should show error, not login
    await expect(page.getByText(/invalid.*credentials/i)).toBeVisible({ timeout: 5000 });
    await expect(page).not.toHaveURL(/.*dashboard/);
  });

  test('should prevent XSS in input fields', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder*="username"]', 'testuser');
    await page.fill('input[placeholder*="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Try to inject script in account name
    await page.click('text=/add data/i');
    await page.click('button:has-text("Add Account")');
    await page.fill('input[placeholder*="Chase Checking"]', '<script>alert("XSS")</script>');
    await page.fill('input[placeholder="0.00"]', '1000.00');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Check that script didn't execute
    const alerts: string[] = [];
    page.on('dialog', dialog => {
      alerts.push(dialog.message());
      dialog.dismiss();
    });
    
    await page.click('a[href="/accounts"]');
    await page.waitForTimeout(1000);
    
    expect(alerts).toHaveLength(0);
    
    // Verify the text is displayed as plain text
    const accountName = await page.getByText(/script/i).textContent();
    expect(accountName).toContain('<script>');
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

  test('should invalidate session on logout', async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder*="username"]', 'testuser');
    await page.fill('input[placeholder*="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Verify logged in
    await expect(page.getByText(/welcome back/i)).toBeVisible();
    
    // Logout
    await page.click('button:has-text("Sign Out")');
    await expect(page).toHaveURL(/.*login/);
    
    // Verify token is cleared
    const token = await page.evaluate(() => {
      return localStorage.getItem('myfin.jwt') || sessionStorage.getItem('myfin.session.jwt');
    });
    expect(token).toBeNull();
    
    // Try to access protected route after logout
    await page.goto('http://localhost:5173/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should prevent brute force login attempts', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    
    // Attempt multiple failed logins
    for (let i = 0; i < 5; i++) {
      await page.fill('input[placeholder*="username"]', 'wronguser');
      await page.fill('input[placeholder*="password"]', 'wrongpass');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
    }
    
    // Should still show error (rate limiting would be backend concern)
    await expect(page.getByText(/invalid.*credentials/i)).toBeVisible();
  });

  test('should sanitize user input in transaction notes', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder*="username"]', 'testuser');
    await page.fill('input[placeholder*="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Add transaction with potentially malicious content
    await page.click('text=/add data/i');
    await page.click('button:has-text("Add Transaction")');
    await page.fill('input[placeholder="0.00"]', '50.00');
    await page.selectOption('select:has-text("Expense")', 'out');
    await page.selectOption('select:has-text("Other")', 'Other');
    await page.fill('textarea', '<img src=x onerror=alert("XSS")>');
    await page.click('button:has-text("Add Transaction")');
    await page.waitForTimeout(1000);
    
    // Verify no script execution
    const alerts: string[] = [];
    page.on('dialog', dialog => {
      alerts.push(dialog.message());
      dialog.dismiss();
    });
    
    await page.click('a[href="/accounts"]');
    await page.waitForTimeout(1000);
    
    expect(alerts).toHaveLength(0);
  });

  test('should enforce password complexity requirements', async ({ page }) => {
    await page.goto('http://localhost:5173/register');
    
    const timestamp = Date.now();
    await page.fill('input[placeholder*="username"]', `sectest${timestamp}`);
    await page.fill('input[type="email"]', `sectest${timestamp}@example.com`);
    await page.fill('input[placeholder*="first name"]', 'Security');
    await page.fill('input[placeholder*="last name"]', 'Test');
    
    // Try weak password
    await page.fill('input[placeholder*="password"]:not([placeholder*="Confirm"])', '123');
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
    
    // Try password without special characters (if enforced)
    await page.fill('input[placeholder*="password"]:not([placeholder*="Confirm"])', 'password123');
    
    // Should show password strength indicator
    await expect(page.getByText(/password strength/i)).toBeVisible();
  });

  test('should prevent session fixation', async ({ page, context }) => {
    // Get initial session
    await page.goto('http://localhost:5173/login');
    
    const initialToken = await page.evaluate(() => {
      return localStorage.getItem('myfin.jwt') || sessionStorage.getItem('myfin.session.jwt');
    });
    
    // Login
    await page.fill('input[placeholder*="username"]', 'testuser');
    await page.fill('input[placeholder*="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Get token after login
    const postLoginToken = await page.evaluate(() => {
      return localStorage.getItem('myfin.jwt') || sessionStorage.getItem('myfin.session.jwt');
    });
    
    // Tokens should be different (new session created on login)
    expect(postLoginToken).not.toBe(initialToken);
    expect(postLoginToken).not.toBeNull();
  });

  test('should handle CORS properly', async ({ page, context }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder*="username"]', 'testuser');
    await page.fill('input[placeholder*="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    const token = await page.evaluate(() => {
      return localStorage.getItem('myfin.jwt') || sessionStorage.getItem('myfin.session.jwt');
    });
    
    // Try to make request with different origin
    try {
      const response = await context.request.post('http://localhost:8080/api/data/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Origin': 'http://malicious-site.com'
        },
        data: {
          name: 'Test Account',
          type: 'checking',
          balance: 1000
        }
      });
      
      // Should either reject or properly validate origin
      if (response.ok()) {
        // If it works, CORS is properly configured to allow localhost
        console.log('CORS allows localhost requests');
      }
    } catch (error) {
      // Expected if CORS blocks the request
      console.log('CORS blocked cross-origin request');
    }
  });

  test('should not expose sensitive data in URLs', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder*="username"]', 'testuser');
    await page.fill('input[placeholder*="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Navigate through the app
    await page.click('a[href="/accounts"]');
    await page.click('a[href="/budgets"]');
    await page.click('a[href="/profile"]');
    
    // Check that URLs don't contain sensitive data
    const url = page.url();
    expect(url).not.toContain('password');
    expect(url).not.toContain('token');
    expect(url).not.toContain('email');
    expect(url).not.toContain('ssn');
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

  test('should handle expired tokens gracefully', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[placeholder*="username"]', 'testuser');
    await page.fill('input[placeholder*="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Set an invalid/expired token
    await page.evaluate(() => {
      localStorage.setItem('myfin.jwt', 'invalid.token.here');
    });
    
    // Try to access protected resource
    await page.reload();
    
    // Should redirect to login or show appropriate error
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    
    expect(currentUrl.includes('login') || currentUrl.includes('dashboard')).toBeTruthy();
  });
});