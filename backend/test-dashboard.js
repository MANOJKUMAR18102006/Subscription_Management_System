const dotenv = require('dotenv');
dotenv.config();

const API_URL = 'http://localhost:5000/api';

async function testDashboardSuite() {
  console.log('--- Testing Module 2 Dashboard APIs & MongoDB Aggregations ---\n');

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

  // 1. Authenticate Admin
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'admin@subscriptionms.com', password: 'Admin@123456' }
  });
  if (!adminLogin.ok) throw new Error('Admin login failed: ' + adminLogin.data.message);
  const adminToken = adminLogin.data.token;
  console.log('✓ Admin authenticated');

  // 2. Test Admin Dashboard with various periods
  for (const period of ['today', 'this_month', 'last_month', 'this_year']) {
    const adminDash = await request(`/dashboard/admin?period=${period}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!adminDash.ok) throw new Error(`Admin dashboard failed for period ${period}: ` + adminDash.data.message);
    const m = adminDash.data.metrics;
    console.log(`✓ Admin Dashboard [period: ${period}]:`);
    console.log(`   - Total Customers: ${m.totalCustomers}`);
    console.log(`   - Total Active Subscriptions: ${m.totalActiveSubscriptions}`);
    console.log(`   - Total Revenue: $${m.totalRevenue} (Lifetime: $${m.lifetimeRevenue})`);
    console.log(`   - Pending Payments: count=${m.pendingPayments.count}, amount=$${m.pendingPayments.total}`);
    console.log(`   - Overdue Invoices: count=${m.overdueInvoices.count}, amount=$${m.overdueInvoices.total}`);
    console.log(`   - MRR: $${m.mrr} | ARR: $${m.arr}`);
    console.log(`   - Recent Subscriptions: ${adminDash.data.recentSubscriptions.length} records`);
    console.log(`   - Recent Payments: ${adminDash.data.recentPayments.length} records`);
    console.log(`   - Revenue Chart points: ${adminDash.data.charts.revenueOverview.length} months`);
    console.log(`   - Status Distribution: ${adminDash.data.charts.subscriptionStatusDistribution.map(s => `${s.name}: ${s.count}`).join(', ')}`);
  }

  // 3. Authenticate Staff
  const staffLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'staff@subscriptionms.com', password: 'Staff@123456' }
  });
  if (!staffLogin.ok) throw new Error('Staff login failed');
  const staffToken = staffLogin.data.token;
  console.log('\n✓ Staff authenticated');

  // Test Staff Dashboard
  const staffDash = await request('/dashboard/staff?period=this_month', {
    headers: { Authorization: `Bearer ${staffToken}` }
  });
  if (!staffDash.ok) throw new Error('Staff dashboard failed: ' + staffDash.data.message);
  const sm = staffDash.data.metrics;
  console.log('✓ Staff Dashboard [period: this_month]:');
  console.log(`   - Total Customers: ${sm.totalCustomers}`);
  console.log(`   - Active Subscriptions: ${sm.activeSubscriptions}`);
  console.log(`   - Pending Invoices: count=${sm.pendingInvoices.count}, amount=$${sm.pendingInvoices.total}`);
  console.log(`   - Overdue Invoices: count=${sm.overdueInvoices.count}, amount=$${sm.overdueInvoices.total}`);
  console.log(`   - Recent Customer Activities: ${staffDash.data.recentCustomerActivities.length} items`);

  // Staff should be forbidden from Admin dashboard
  const staffForbidden = await request('/dashboard/admin', {
    headers: { Authorization: `Bearer ${staffToken}` }
  });
  if (staffForbidden.status === 403) {
    console.log('✓ Staff forbidden from Admin dashboard (HTTP 403)');
  } else {
    throw new Error('Staff was able to access Admin dashboard!');
  }

  // 4. Authenticate Customer
  const custLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'customer@subscriptionms.com', password: 'Customer@123456' }
  });
  if (!custLogin.ok) throw new Error('Customer login failed');
  const custToken = custLogin.data.token;
  console.log('\n✓ Customer authenticated');

  // Test Customer Dashboard
  const custDash = await request('/dashboard/customer?period=this_month', {
    headers: { Authorization: `Bearer ${custToken}` }
  });
  if (!custDash.ok) throw new Error('Customer dashboard failed: ' + custDash.data.message);
  const cm = custDash.data.metrics;
  console.log('✓ Customer Dashboard [period: this_month]:');
  console.log(`   - My Active Subscriptions: ${cm.activeSubscriptionsCount}`);
  console.log(`   - Next Billing Date: ${cm.nextBillingDate}`);
  console.log(`   - Outstanding Invoices: count=${cm.outstandingInvoices.count}, amount=$${cm.outstandingInvoices.total}`);
  console.log(`   - Total Payments: count=${cm.totalPayments.count}, amount=$${cm.totalPayments.total}`);
  console.log(`   - Recent Invoices: ${custDash.data.recentInvoices.length} invoices`);
  console.log(`   - Payment History: ${custDash.data.paymentHistory.length} payments`);

  // Customer should be forbidden from Admin and Staff dashboards
  const custForbiddenAdmin = await request('/dashboard/admin', {
    headers: { Authorization: `Bearer ${custToken}` }
  });
  const custForbiddenStaff = await request('/dashboard/staff', {
    headers: { Authorization: `Bearer ${custToken}` }
  });
  if (custForbiddenAdmin.status === 403 && custForbiddenStaff.status === 403) {
    console.log('✓ Customer forbidden from Admin and Staff dashboards (HTTP 403)');
  } else {
    throw new Error('Customer was able to access privileged dashboards!');
  }

  console.log('\n======================================================');
  console.log('All Module 2 Dashboard APIs & Aggregations passed 100%!');
  console.log('======================================================');
}

testDashboardSuite().catch(err => {
  console.error('\nTest failed:', err.message);
  process.exit(1);
});

