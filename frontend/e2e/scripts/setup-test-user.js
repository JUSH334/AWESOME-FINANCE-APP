// frontend/e2e/scripts/setup-test-user.js
// Run this script to create a test user before running E2E tests
// Usage: node e2e/scripts/setup-test-user.js

const API_BASE_URL = "http://localhost:8080/api";

const testUser = {
  username: 'testuser',
  email: 'testuser@example.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User'
};

async function setupTestUser() {
  console.log('🚀 Setting up test user...');
  
  try {
    // Try to register the test user
    const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    if (registerResponse.ok) {
      console.log('✅ Test user created successfully!');
      console.log('📧 Check backend logs for email verification link (if required)');
      
      const data = await registerResponse.json();
      console.log('User ID:', data.id);
      console.log('Username:', testUser.username);
      console.log('Email:', testUser.email);
      console.log('Password:', testUser.password);
      
      return true;
    } else {
      const error = await registerResponse.json();
      
      if (error.message && error.message.includes('already exists')) {
        console.log('ℹ️  Test user already exists - you can proceed with testing');
        console.log('Username:', testUser.username);
        console.log('Password:', testUser.password);
        return true;
      } else {
        console.error('❌ Failed to create test user:', error.message || error);
        return false;
      }
    }
  } catch (error) {
    console.error('❌ Error connecting to backend:', error.message);
    console.log('\n💡 Make sure the backend server is running on http://localhost:8080');
    return false;
  }
}

async function verifyTestUser() {
  console.log('\n🔍 Verifying test user can login...');
  
  try {
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUser.username,
        password: testUser.password
      })
    });

    if (loginResponse.ok) {
      console.log('✅ Test user login successful!');
      const data = await loginResponse.json();
      console.log('JWT Token received:', data.token ? 'Yes ✓' : 'No ✗');
      return true;
    } else {
      const error = await loginResponse.json();
      console.error('❌ Test user login failed:', error.message || error);
      
      if (error.message && error.message.includes('verify your email')) {
        console.log('\n⚠️  Email verification required!');
        console.log('Check backend logs for verification link or use backend admin panel');
      }
      
      return false;
    }
  } catch (error) {
    console.error('❌ Error during login verification:', error.message);
    return false;
  }
}

async function main() {
  console.log('════════════════════════════════════════');
  console.log('  Playwright E2E Test User Setup');
  console.log('════════════════════════════════════════\n');
  
  const setupSuccess = await setupTestUser();
  
  if (setupSuccess) {
    await verifyTestUser();
    
    console.log('\n════════════════════════════════════════');
    console.log('  Setup Complete! Ready to run tests 🎉');
    console.log('════════════════════════════════════════');
    console.log('\nRun tests with:');
    console.log('  npx playwright test');
    console.log('  npx playwright test --ui (recommended)');
    console.log('  npx playwright test --headed (see browser)');
  } else {
    console.log('\n════════════════════════════════════════');
    console.log('  Setup Failed ❌');
    console.log('════════════════════════════════════════');
    console.log('\nTroubleshooting:');
    console.log('1. Make sure backend is running: go run main.go');
    console.log('2. Backend should be on: http://localhost:8080');
    console.log('3. Check backend logs for errors');
    process.exit(1);
  }
}

main();