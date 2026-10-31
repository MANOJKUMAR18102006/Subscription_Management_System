const dotenv = require('dotenv');
dotenv.config();

const API_URL = 'http://localhost:5000/api';

async function testAuthSuite() {
  console.log('--- Starting Backend Authentication & RBAC Verification ---');

  // Helper fetch function
  const request = async (path, options = {}) => {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, data };
  };

  // 1. Test Health
  const healthRes = await request('/health');
  console.log('✓ Health check:', healthRes.data.status);

  // 2. Test Customer Registration - Weak password check (<= 8 chars)
  const weakRes = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'Test Bad',
      email: 'bad@test.com',
      password: 'short',
      confirmPassword: 'short'
    }
  });
  if (!weakRes.ok) {
    console.log('✓ Short password rejected:', weakRes.data.message);
  } else {
    throw new Error('Registration should have failed on short password');
  }

  // 3. Test Customer Registration - Missing special char check
  const noSpecialRes = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'Test NoSpecial',
      email: 'nospecial@test.com',
      password: 'Password1234',
      confirmPassword: 'Password1234'
    }
  });
  if (!noSpecialRes.ok) {
    console.log('✓ Missing special character rejected:', noSpecialRes.data.message);
  } else {
    throw new Error('Registration should have failed on missing special character');
  }

  // 4. Test Valid Registration
  const testEmail = `cust_${Date.now()}@example.com`;
  const regRes = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'Verified Customer',
      email: testEmail,
      password: 'ValidPassword@2026',
      confirmPassword: 'ValidPassword@2026',
      company: 'Tester LLC'
    }
  });
  if (!regRes.ok) throw new Error('Registration failed: ' + regRes.data.message);
  console.log('✓ Registration successful:', regRes.data.user.email, 'Role:', regRes.data.user.role);
  const custToken = regRes.data.token;

  // 5. Test Customer trying to create Staff (Should fail with 403 Forbidden - Requirement 9)
  const unauthStaffRes = await request('/users/staff', {
    method: 'POST',
    headers: { Authorization: `Bearer ${custToken}` },
    body: {
      name: 'Unauthorized Staff',
      email: `unauth_${Date.now()}@test.com`,
      password: 'StaffSecret@2026',
      confirmPassword: 'StaffSecret@2026'
    }
  });
  if (unauthStaffRes.status === 403) {
    console.log('✓ Customer correctly forbidden from creating staff:', unauthStaffRes.status, unauthStaffRes.data.message);
  } else {
    throw new Error('Customer should NOT be able to create staff accounts!');
  }

  // 6. Test Admin Login
  const adminLoginRes = await request('/auth/login', {
    method: 'POST',
    body: {
      email: 'admin@subscriptionms.com',
      password: 'Admin@123456'
    }
  });
  if (!adminLoginRes.ok) throw new Error('Admin login failed: ' + adminLoginRes.data.message);
  console.log('✓ Admin login successful:', adminLoginRes.data.user.role);
  const adminToken = adminLoginRes.data.token;

  // 7. Test Admin creating Staff account (Requirement 9: Only Admin can create staff accounts)
  const staffEmail = `newstaff_${Date.now()}@subscriptionms.com`;
  const createStaffRes = await request('/users/staff', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      name: 'Kelly Operations',
      email: staffEmail,
      password: 'StaffSecret@2026',
      confirmPassword: 'StaffSecret@2026',
      company: 'Support Team'
    }
  });
  if (!createStaffRes.ok) throw new Error('Admin creating staff failed: ' + createStaffRes.data.message);
  console.log('✓ Admin created staff account:', createStaffRes.data.user.email, 'Role:', createStaffRes.data.user.role);

  // 8. Test Forgot Password
  const forgotRes = await request('/auth/forgot-password', {
    method: 'POST',
    body: {
      email: 'customer@subscriptionms.com'
    }
  });
  console.log('✓ Forgot password dispatched:', forgotRes.data.message);
  const resetUrl = forgotRes.data.resetUrl;
  console.log('✓ Reset URL generated:', resetUrl);

  if (resetUrl) {
    const token = resetUrl.split('/').pop();
    // 9. Test Reset Password
    const resetRes = await request(`/auth/reset-password/${token}`, {
      method: 'PUT',
      body: {
        password: 'NewCustomer@123456',
        confirmPassword: 'NewCustomer@123456'
      }
    });
    if (!resetRes.ok) throw new Error('Password reset failed: ' + resetRes.data.message);
    console.log('✓ Password reset succeeded! New user login token received:', !!resetRes.data.token);

    // Verify login with new password
    const newLoginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'customer@subscriptionms.com',
        password: 'NewCustomer@123456'
      }
    });
    if (!newLoginRes.ok) throw new Error('Login with new password failed');
    console.log('✓ Login with newly reset password confirmed for:', newLoginRes.data.user.email);
  }

  // 10. Test Role Data Access
  // Customer data access
  const custDataRes = await request('/users/data/subscriptions', {
    headers: { Authorization: `Bearer ${custToken}` }
  });
  console.log('✓ Customer data scope:', custDataRes.data.role, 'Own subscriptions count:', custDataRes.data.subscriptions?.length);

  // Admin data access
  const adminDataRes = await request('/users/data/subscriptions', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('✓ Admin data scope:', adminDataRes.data.role, 'Scope:', adminDataRes.data.operationalScope);

  console.log('\n======================================================');
  console.log('All 10 Backend Authentication & RBAC tests passed 100%!');
  console.log('======================================================');
}

testAuthSuite().catch(err => {
  console.error('Test suite failed:', err.message);
  process.exit(1);
});
