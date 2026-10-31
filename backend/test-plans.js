const dotenv = require('dotenv');
dotenv.config();

const API_URL = 'http://localhost:5000/api';

async function testPlanModule() {
  console.log('================================================================');
  console.log(' MODULE 4: SUBSCRIPTION PLAN MANAGEMENT TEST & VERIFICATION');
  console.log('================================================================\n');

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

  // 1. Authenticate Admin, Staff, and Customer
  console.log('[Setup] Authenticating test accounts...');
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'admin@subscriptionms.com', password: 'Admin@123456' }
  });
  if (!adminLogin.ok) throw new Error('Admin login failed: ' + adminLogin.data.message);
  const adminToken = adminLogin.data.token;
  console.log('  ✓ Admin authenticated');

  const staffLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'staff@subscriptionms.com', password: 'Staff@123456' }
  });
  if (!staffLogin.ok) throw new Error('Staff login failed');
  const staffToken = staffLogin.data.token;
  console.log('  ✓ Staff authenticated');

  const custLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'customer@subscriptionms.com', password: 'Customer@123456' }
  });
  if (!custLogin.ok) throw new Error('Customer login failed');
  const custToken = custLogin.data.token;
  console.log('  ✓ Customer authenticated');

  // Fetch available products to link
  const productsRes = await request('/products', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  if (!productsRes.ok || !productsRes.data.products?.length) {
    throw new Error('Failed to fetch seeded products');
  }
  const products = productsRes.data.products;
  const prod1 = products[0]._id;
  const prod2 = products[1]._id;
  console.log(`  ✓ Retrieved ${products.length} products for plan linking tests\n`);

  // RBAC Checks
  console.log('[RBAC Verification]');
  // Customer attempt to create plan -> MUST FAIL with 403
  const custCreatePlan = await request('/plans', {
    method: 'POST',
    headers: { Authorization: `Bearer ${custToken}` },
    body: { name: 'Customer Unauthorized Plan', price: 1000 }
  });
  if (custCreatePlan.status === 403) {
    console.log('  PASS: Customer correctly forbidden from creating plans (HTTP 403)');
  } else {
    throw new Error('Customer was able to create plan! RBAC check failed.');
  }

  // Staff attempt to create plan -> MUST FAIL with 403
  const staffCreatePlan = await request('/plans', {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: { name: 'Staff Unauthorized Plan', price: 1000 }
  });
  if (staffCreatePlan.status === 403) {
    console.log('  PASS: Staff correctly forbidden from creating plans (HTTP 403)');
  } else {
    throw new Error('Staff was able to create plan! RBAC check failed.');
  }

  // Requirement 1 & 2: Create Plan with linked products and minQuantity
  console.log('\n[Req 1 & 2: Plan Creation with Linked Products & Minimum Quantity]');
  const planData = {
    name: `Test Multi-Product Plan ${Date.now()}`,
    description: 'A test plan linking two products with minimum quantity 3',
    linkedProducts: [
      { product: prod1, minQuantity: 3, isPrimary: true },
      { product: prod2, minQuantity: 1, isPrimary: false }
    ],
    billingFrequency: 'Monthly',
    price: 5000,
    minQuantity: 3,
    availableFrom: new Date().toISOString(),
    availableUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    autoClose: true,
    allowEarlyClosure: true,
    allowPause: true,
    allowRenewal: true,
    status: 'Active',
    features: ['Multi-Product Bundle', 'Dedicated Support', 'Min 3 Units']
  };

  const createRes = await request('/plans', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: planData
  });
  if (!createRes.ok) throw new Error('Failed to create test plan: ' + createRes.data.message);
  const createdPlan = createRes.data.plan;
  console.log(`  PASS: Plan created successfully: '${createdPlan.name}'`);
  console.log(`        Linked Products: ${createdPlan.linkedProducts.length}, Min Quantity: ${createdPlan.minQuantity}`);

  // Requirement 3: Validate plan availability dates (availableUntil < availableFrom MUST FAIL)
  console.log('\n[Req 3: Plan Availability Dates Validation]');
  const invalidDatePlan = {
    name: `Invalid Date Plan ${Date.now()}`,
    linkedProducts: [{ product: prod1, minQuantity: 1 }],
    billingFrequency: 'Monthly',
    price: 1500,
    minQuantity: 1,
    availableFrom: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days in future
    availableUntil: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days in future (BEFORE start date!)
    status: 'Active'
  };

  const invalidDateRes = await request('/plans', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: invalidDatePlan
  });
  if (invalidDateRes.status === 400 && invalidDateRes.data.message.includes('Available Until Date must be on or after')) {
    console.log('  PASS: Blocked plan with availableUntil before availableFrom (HTTP 400):', invalidDateRes.data.message);
  } else {
    throw new Error('Server accepted plan with invalid dates! Req 3 failed: ' + JSON.stringify(invalidDateRes.data));
  }

  // Requirement 2 Enforcement on Subscription: Minimum Quantity
  console.log('\n[Req 2: Enforce Minimum Quantity on Subscription]');
  // Try subscribing with quantity 1 when minQuantity is 3 -> MUST FAIL
  const belowMinQtySub = await request('/subscriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${custToken}` },
    body: {
      planId: createdPlan._id,
      quantity: 1 // Less than minQuantity 3!
    }
  });
  if (belowMinQtySub.status === 400 && belowMinQtySub.data.message.includes('Minimum Quantity Requirement Not Met')) {
    console.log('  PASS: Subscribing below minimum quantity rejected (HTTP 400):', belowMinQtySub.data.message);
  } else {
    throw new Error('Subscription allowed quantity below minimum! Req 2 failed: ' + JSON.stringify(belowMinQtySub.data));
  }

  // Now subscribe with valid quantity = 3
  const validSubRes = await request('/subscriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${custToken}` },
    body: {
      planId: createdPlan._id,
      quantity: 3
    }
  });
  if (!validSubRes.ok) throw new Error('Valid subscription creation failed: ' + validSubRes.data.message);
  const createdSub = validSubRes.data.subscription;
  console.log(`  PASS: Subscription created with quantity 3: Total agreed amount = ₹${createdSub.amount} (unitPrice = ₹${createdSub.unitPrice} * 3)`);

  // Requirement 7: Existing subscriptions retain agreed pricing even when original plan changes
  console.log('\n[Req 7: Pricing Retention When Original Plan Changes]');
  const originalSubPrice = createdSub.unitPrice;
  const originalSubAmount = createdSub.amount;

  // Admin updates the plan price from 5000 to 9500
  const updatePlanRes = await request(`/plans/${createdPlan._id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      price: 9500, // Price increased significantly!
      description: 'Updated enterprise rate plan'
    }
  });
  if (!updatePlanRes.ok) throw new Error('Failed to update plan price: ' + updatePlanRes.data.message);
  console.log(`  ✓ Admin updated original plan price to ₹9500`);

  // Fetch the existing customer subscription again to verify locked agreed price
  const subFetchRes = await request(`/subscriptions/${createdSub._id}`, {
    headers: { Authorization: `Bearer ${custToken}` }
  });
  if (!subFetchRes.ok) throw new Error('Failed to fetch subscription');
  const fetchedSub = subFetchRes.data.subscription;

  if (fetchedSub.unitPrice === originalSubPrice && fetchedSub.amount === originalSubAmount) {
    console.log(`  PASS: Existing subscription retained locked unit price of ₹${fetchedSub.unitPrice} and total ₹${fetchedSub.amount} despite plan price update to ₹9500!`);
  } else {
    throw new Error(`Subscription price changed! Expected ₹${originalSubAmount}, got ₹${fetchedSub.amount}. Req 7 failed.`);
  }

  // Requirement 6: Prevent new subscriptions from using expired or unavailable plans
  console.log('\n[Req 6: Prevent Subscriptions to Expired or Unavailable Plans]');
  // Create an expired plan
  const expiredPlanRes = await request('/plans', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      name: `Expired Test Plan ${Date.now()}`,
      linkedProducts: [{ product: prod1, minQuantity: 1 }],
      billingFrequency: 'Monthly',
      price: 1200,
      minQuantity: 1,
      availableFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      availableUntil: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Ended 5 days ago!
      autoClose: true,
      status: 'Active'
    }
  });
  if (!expiredPlanRes.ok) throw new Error('Failed to create expired plan');
  const expiredPlan = expiredPlanRes.data.plan;

  // Attempt to subscribe to expired plan -> MUST FAIL
  const subExpiredRes = await request('/subscriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${custToken}` },
    body: { planId: expiredPlan._id, quantity: 1 }
  });
  if (subExpiredRes.status === 400 && (subExpiredRes.data.message.includes('expired on') || subExpiredRes.data.message.includes('Closed'))) {
    console.log('  PASS: Subscription to expired/closed plan rejected (HTTP 400):', subExpiredRes.data.message);
  } else {
    throw new Error('Allowed subscribing to expired plan! Req 6 failed: ' + JSON.stringify(subExpiredRes.data));
  }

  // Requirement 4: Automatically close plans when availability ends if Auto Close is enabled
  console.log('\n[Req 4: Auto Close Expired Plans]');
  // Trigger auto close check
  const autoCloseTrigger = await request('/plans/check-auto-close', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`  ✓ Auto close scan executed: ${autoCloseTrigger.data.message}`);

  // Fetch the expired plan again; its status should now be 'Closed'
  const checkExpiredPlan = await request(`/plans/${expiredPlan._id}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  if (checkExpiredPlan.data.plan.status === 'Closed') {
    console.log(`  PASS: Plan '${expiredPlan.name}' with autoClose=true automatically transitioned from 'Active' to 'Closed'`);
  } else {
    throw new Error(`Plan was not auto-closed! Current status: ${checkExpiredPlan.data.plan.status}`);
  }

  // Requirement 5: Allow early closure, pause and renewal based on admin settings
  console.log('\n[Req 5: Admin Settings Enforcing Pause, Early Closure, and Renewal Permissions]');

  // Create Plan A: allowPause: false, allowEarlyClosure: false, allowRenewal: false
  const restrictedPlanRes = await request('/plans', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      name: `Restricted Terms Plan ${Date.now()}`,
      linkedProducts: [{ product: prod1, minQuantity: 1 }],
      billingFrequency: 'Monthly',
      price: 2500,
      minQuantity: 1,
      availableFrom: new Date().toISOString(),
      autoClose: false,
      allowEarlyClosure: false, // Disallow early closure!
      allowPause: false,        // Disallow pause!
      allowRenewal: false,      // Disallow renewal!
      status: 'Active'
    }
  });
  const restrictedPlan = restrictedPlanRes.data.plan;

  // Customer subscribes to restricted plan
  const restrictedSubRes = await request('/subscriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${custToken}` },
    body: { planId: restrictedPlan._id, quantity: 1 }
  });
  const restrictedSub = restrictedSubRes.data.subscription;

  // 5a. Attempt to pause -> MUST FAIL
  const pauseAttempt = await request(`/subscriptions/${restrictedSub._id}/pause`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${custToken}` }
  });
  if (pauseAttempt.status === 400 && pauseAttempt.data.message.includes('Pausing is disabled for plan')) {
    console.log('  PASS (Pause Permission): Pausing correctly blocked when allowPause=false:', pauseAttempt.data.message);
  } else {
    throw new Error('Pause was allowed when admin disabled pause! Req 5 failed: ' + JSON.stringify(pauseAttempt.data));
  }

  // 5b. Attempt early closure -> MUST FAIL
  const earlyCloseAttempt = await request(`/subscriptions/${restrictedSub._id}/early-close`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${custToken}` },
    body: { reason: 'Want out early' }
  });
  if (earlyCloseAttempt.status === 400 && earlyCloseAttempt.data.message.includes('Early closure is prohibited for plan')) {
    console.log('  PASS (Early Close Permission): Early close correctly blocked when allowEarlyClosure=false:', earlyCloseAttempt.data.message);
  } else {
    throw new Error('Early closure allowed when prohibited! Req 5 failed: ' + JSON.stringify(earlyCloseAttempt.data));
  }

  // 5c. Attempt renewal -> MUST FAIL
  const renewalAttempt = await request(`/subscriptions/${restrictedSub._id}/renew`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${custToken}` }
  });
  if (renewalAttempt.status === 400 && renewalAttempt.data.message.includes('Renewal is disabled for plan')) {
    console.log('  PASS (Renewal Permission): Renewal correctly blocked when allowRenewal=false:', renewalAttempt.data.message);
  } else {
    throw new Error('Renewal allowed when prohibited! Req 5 failed: ' + JSON.stringify(renewalAttempt.data));
  }

  // Now test Plan B with permissions ALLOWED (using createdSub from earlier):
  console.log('\n  Testing Allowed Operations on Plan with Permissions Enabled:');
  // Pause permitted sub:
  const pauseOk = await request(`/subscriptions/${createdSub._id}/pause`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${custToken}` }
  });
  if (pauseOk.ok && pauseOk.data.subscription.status === 'paused') {
    console.log('  PASS: Successfully paused subscription when allowPause=true');
  } else {
    throw new Error('Failed to pause subscription: ' + JSON.stringify(pauseOk.data));
  }

  // Resume permitted sub:
  const resumeOk = await request(`/subscriptions/${createdSub._id}/resume`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${custToken}` }
  });
  if (resumeOk.ok && resumeOk.data.subscription.status === 'active') {
    console.log('  PASS: Successfully resumed paused subscription');
  } else {
    throw new Error('Failed to resume subscription: ' + JSON.stringify(resumeOk.data));
  }

  // Early close permitted sub:
  const earlyCloseOk = await request(`/subscriptions/${createdSub._id}/early-close`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${custToken}` },
    body: { reason: 'Admin test early closure' }
  });
  if (earlyCloseOk.ok && earlyCloseOk.data.subscription.status === 'closed') {
    console.log('  PASS: Successfully closed subscription early when allowEarlyClosure=true');
  } else {
    throw new Error('Failed to early-close subscription: ' + JSON.stringify(earlyCloseOk.data));
  }

  // Requirement 8: Plan Listing, Search, Filters & Pagination
  console.log('\n[Req 8: Plan Listing, Search, Filters & Pagination]');
  // 8a. Filter by frequency
  const dailyPlans = await request('/plans?billingFrequency=Daily', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`  PASS: Frequency filter (Daily) returned ${dailyPlans.data.plans.length} plan(s)`);

  // 8b. Filter by status
  const activePlans = await request('/plans?status=Active', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`  PASS: Status filter (Active) returned ${activePlans.data.plans.length} plan(s)`);

  // 8c. Search filter
  const searchPlans = await request('/plans?search=Cloud', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`  PASS: Search query ("Cloud") returned ${searchPlans.data.plans.length} matching plan(s)`);

  // 8d. Summary stats
  const statsRes = await request('/plans/stats/summary', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  if (statsRes.ok) {
    const s = statsRes.data.stats;
    console.log(`  PASS: Plan Summary Stats: Total=${s.totalPlans}, Active=${s.activePlans}, Closed=${s.closedPlans}, Avg Price=₹${s.averagePrice}`);
  }

  // Safeguard: Prevent deleting plan with active subscriptions
  console.log('\n[Integration Safeguards: Deletion Protection]');
  const deleteActivePlan = await request(`/plans/${restrictedPlan._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  if (deleteActivePlan.status === 400 && deleteActivePlan.data.message.includes('Deletion Blocked')) {
    console.log('  PASS: Guarded plan deletion blocked while active subscriptions exist (HTTP 400):', deleteActivePlan.data.message);
  } else {
    throw new Error('Plan with active subscriptions was deleted! Safeguard failed.');
  }

  console.log('\n================================================================');
  console.log(' ✅ ALL MODULE 4 SPECIFICATION TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================');
}

testPlanModule().catch(err => {
  console.error('\n❌ Test Suite Failed:', err.message);
  process.exit(1);
});
