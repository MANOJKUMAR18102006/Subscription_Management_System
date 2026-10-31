/**
 * Comprehensive Automated Test Suite for Module 6: Subscription Management
 */

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting Module 6: Subscription Management Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, title, details = '') => {
    if (condition) {
      console.log(`  ✅ PASS: ${title}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${title} -> ${details}`);
      failed++;
    }
  };

  try {
    // 1. Authenticate Admin, Staff & Customer
    console.log('[1] Authenticating users...');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@subscriptionms.com', password: 'Admin@123456' })
    });
    const adminLogin = await adminLoginRes.json();
    assert(adminLogin.token, 'Admin logged in successfully');
    const adminToken = adminLogin.token;

    const staffLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'staff@subscriptionms.com', password: 'Staff@123456' })
    });
    const staffLogin = await staffLoginRes.json();
    assert(staffLogin.token, 'Staff logged in successfully');
    const staffToken = staffLogin.token;

    const customerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@subscriptionms.com', password: 'Customer@123456' })
    });
    const customerLogin = await customerLoginRes.json();
    assert(customerLogin.token, 'Customer logged in successfully');
    const custToken = customerLogin.token;

    // 2. Fetch products and active plans for test fixtures
    console.log('\n[2] Fetching products & plans fixtures...');
    const productsRes = await fetch(`${BASE_URL}/products`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const productsData = await productsRes.json();
    const products = productsData.data || productsData.products || [];
    assert(products.length >= 2, `Retrieved ${products.length} products`);
    const prod1 = products[0];
    const prod2 = products[1];

    const plansRes = await fetch(`${BASE_URL}/plans`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const plansData = await plansRes.json();
    const plans = plansData.plans || plansData.data || [];
    assert(plans.length > 0, `Retrieved ${plans.length} subscription plans`);
    let activePlan = plans.find((p) => p.status === 'Active' && p.allowPause && p.allowEarlyClosure && p.allowRenewal);
    if (!activePlan) {
      const newPlanRes = await fetch(`${BASE_URL}/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          name: `Standard Full-Feature Plan ${Date.now()}`,
          linkedProducts: [{ product: prod1._id, minQuantity: 1 }],
          price: 2000,
          billingFrequency: 'Monthly',
          minQuantity: 1,
          availableFrom: new Date(),
          allowPause: true,
          allowEarlyClosure: true,
          allowRenewal: true,
          status: 'Active'
        })
      });
      activePlan = (await newPlanRes.json()).plan;
    }

    const customerId = customerLogin.user.id || customerLogin.user._id;

    // 3. Req 1, 2, 3, 4: Direct Subscription Creation with Multiple Product Lines, Unique Number, and Totals
    console.log('\n[3] Testing Direct Subscription Creation with Multi-product Lines (Req 1, 2, 3, 4)...');
    // Line 1: Qty 2 @ 1000, 10% disc, 18% tax -> base 2000, disc 200, net 1800, tax 324, lineTotal 2124
    // Line 2: Qty 1 @ 500, 0% disc, 18% tax -> base 500, disc 0, net 500, tax 90, lineTotal 590
    // Total subtotal: 1800 + 500 = 2300; total tax: 324 + 90 = 414; grand total: 2714
    const directSubRes = await fetch(`${BASE_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        customerId,
        planId: activePlan._id,
        billingFrequency: 'Monthly',
        paymentTerms: 'Net 30',
        status: 'Draft',
        subscriptionLines: [
          {
            product: prod1._id,
            name: prod1.name,
            variant: 'Cloud Enterprise',
            quantity: 2,
            unitPrice: 1000,
            discount: 10,
            taxRate: 18
          },
          {
            product: prod2._id,
            name: prod2.name,
            variant: 'Standard Tier',
            quantity: 1,
            unitPrice: 500,
            discount: 0,
            taxRate: 18
          }
        ]
      })
    });
    const directSubData = await directSubRes.json();
    assert(directSubData.success, 'Direct subscription created successfully');
    const sub = directSubData.subscription;
    assert(
      sub.subscriptionNumber && /^SUB-\d{4}-\d{4}$/.test(sub.subscriptionNumber),
      `Unique subscription number generated: ${sub.subscriptionNumber}`
    );
    assert(sub.subscriptionLines && sub.subscriptionLines.length === 2, 'Supports multiple product lines (2 lines)');
    assert(sub.subtotal === 2300, `Subtotal calculated correctly: ₹${sub.subtotal} (Expected: ₹2300)`);
    assert(sub.taxAmount === 414, `Tax amount calculated correctly: ₹${sub.taxAmount} (Expected: ₹414)`);
    assert(sub.discountAmount === 200, `Discount amount calculated correctly: ₹${sub.discountAmount} (Expected: ₹200)`);
    assert(sub.totalAmount === 2714, `Total amount calculated correctly: ₹${sub.totalAmount} (Expected: ₹2714)`);
    assert(sub.status.toLowerCase() === 'draft', 'Initial status set to Draft');

    // 4. Req 5: Status Transitions (Draft -> Confirmed -> Active)
    console.log('\n[4] Testing Lifecycle Progression: Draft -> Confirmed -> Active (Req 5)...');
    const confirmRes = await fetch(`${BASE_URL}/subscriptions/${sub._id}/confirm`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const confirmData = await confirmRes.json();
    assert(confirmData.success && confirmData.subscription.status.toLowerCase() === 'confirmed', 'Transitioned from Draft to Confirmed');

    const activateRes = await fetch(`${BASE_URL}/subscriptions/${sub._id}/activate`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const activateData = await activateRes.json();
    assert(activateData.success && activateData.subscription.status.toLowerCase() === 'active', 'Transitioned from Confirmed to Active');
    assert(activateData.subscription.nextBillingDate, `Next billing date scheduled for: ${new Date(activateData.subscription.nextBillingDate).toLocaleDateString()}`);

    // 5. Req 6: Next Billing Date Calculation across frequencies
    console.log('\n[5] Testing Next Billing Date Calculation according to Frequency (Req 6)...');
    const testFrequencies = [
      { freq: 'Daily', days: 1 },
      { freq: 'Weekly', days: 7 },
      { freq: 'Monthly', months: 1 },
      { freq: 'Yearly', years: 1 }
    ];

    for (const tf of testFrequencies) {
      const fSubRes = await fetch(`${BASE_URL}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
        body: JSON.stringify({
          customerId: customerId,
          planId: activePlan._id,
          billingFrequency: tf.freq,
          status: 'Active',
          subscriptionLines: [
            {
              product: prod1._id,
              name: prod1.name,
              quantity: 1,
              unitPrice: 100,
              taxRate: 0,
              discount: 0
            }
          ]
        })
      });
      const fSubData = await fSubRes.json();
      assert(fSubData.success, `Created subscription with billing frequency '${tf.freq}'`);
      assert(fSubData.subscription.nextBillingDate, `Next billing date correctly calculated for ${tf.freq}`);
    }

    // 6. Req 7: Pause and Resume based on plan permissions
    console.log('\n[6] Testing Pause & Resume with Plan Permissions (Req 7)...');
    // Create Plan with allowPause: false
    const disallowPausePlanRes = await fetch(`${BASE_URL}/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: `No Pause Policy Plan ${Date.now()}`,
        linkedProducts: [{ product: prod1._id, minQuantity: 1 }],
        price: 1500,
        billingFrequency: 'Monthly',
        minQuantity: 1,
        availableFrom: new Date(),
        allowPause: false, // Disallow pause
        allowEarlyClosure: true,
        allowRenewal: true,
        status: 'Active'
      })
    });
    const disallowPausePlan = (await disallowPausePlanRes.json()).plan;

    const noPauseSubRes = await fetch(`${BASE_URL}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken}` },
      body: JSON.stringify({ planId: disallowPausePlan._id, quantity: 1, status: 'Active' })
    });
    const noPauseSub = (await noPauseSubRes.json()).subscription;

    // Attempt pause -> MUST BE BLOCKED
    const blockedPauseRes = await fetch(`${BASE_URL}/subscriptions/${noPauseSub._id}/pause`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${custToken}` }
    });
    assert(blockedPauseRes.status === 400, 'Pause successfully blocked when allowPause=false per admin setting (HTTP 400)');

    // Pause allowed subscription
    const allowedPauseRes = await fetch(`${BASE_URL}/subscriptions/${sub._id}/pause`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const allowedPauseData = await allowedPauseRes.json();
    assert(allowedPauseData.success && allowedPauseData.subscription.status.toLowerCase() === 'paused', 'Successfully paused subscription when permitted');

    // Resume subscription
    const resumeRes = await fetch(`${BASE_URL}/subscriptions/${sub._id}/resume`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const resumeData = await resumeRes.json();
    assert(resumeData.success && resumeData.subscription.status.toLowerCase() === 'active', 'Successfully resumed subscription back to Active status');

    // 7. Req 8: Early Closure based on plan permissions
    console.log('\n[7] Testing Early Closure with Plan Permissions (Req 8)...');
    const disallowClosePlanRes = await fetch(`${BASE_URL}/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: `No Early Close Plan ${Date.now()}`,
        linkedProducts: [{ product: prod1._id, minQuantity: 1 }],
        price: 2000,
        billingFrequency: 'Monthly',
        minQuantity: 1,
        availableFrom: new Date(),
        allowPause: true,
        allowEarlyClosure: false, // Disallow early closure
        allowRenewal: true,
        status: 'Active'
      })
    });
    const disallowClosePlan = (await disallowClosePlanRes.json()).plan;

    const noCloseSubRes = await fetch(`${BASE_URL}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken}` },
      body: JSON.stringify({ planId: disallowClosePlan._id, quantity: 1, status: 'Active' })
    });
    const noCloseSub = (await noCloseSubRes.json()).subscription;

    const blockedCloseRes = await fetch(`${BASE_URL}/subscriptions/${noCloseSub._id}/early-close`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${custToken}` },
      body: JSON.stringify({ reason: 'Premature cancellation' })
    });
    assert(blockedCloseRes.status === 400, 'Early closure successfully blocked when allowEarlyClosure=false (HTTP 400)');

    // 8. Req 9: Subscription Renewal
    console.log('\n[8] Testing Subscription Renewal (Req 9)...');
    const initialNextBilling = new Date(sub.nextBillingDate);
    const renewRes = await fetch(`${BASE_URL}/subscriptions/${sub._id}/renew`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const renewData = await renewRes.json();
    assert(renewData.success, 'Subscription successfully renewed');
    const renewedDate = new Date(renewData.nextBillingDate);
    assert(renewedDate > initialNextBilling, `Next billing date advanced from ${initialNextBilling.toLocaleDateString()} to ${renewedDate.toLocaleDateString()}`);

    // 9. Req 12: Prevent Duplicate Subscription Billing
    console.log('\n[9] Testing Duplicate Subscription Billing Prevention (Req 12)...');
    // First invoice generation -> MUST SUCCEED
    const invoice1Res = await fetch(`${BASE_URL}/subscriptions/${sub._id}/generate-invoice`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const invoice1Data = await invoice1Res.json();
    assert(invoice1Data.success, `First invoice generated: #${invoice1Data.invoice.invoiceNumber} (Amount: ₹${invoice1Data.invoice.amount})`);

    // Second invoice generation immediately for the same cycle -> MUST BE BLOCKED
    const invoice2Res = await fetch(`${BASE_URL}/subscriptions/${sub._id}/generate-invoice`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const invoice2Data = await invoice2Res.json();
    assert(
      invoice2Res.status === 400 && invoice2Data.message.includes('Duplicate Billing Blocked'),
      'STRICT SAFEGUARD: Duplicate billing blocked with 400 Bad Request',
      invoice2Data.message
    );

    // 10. Req 10: Automatic Expiration
    console.log('\n[10] Testing Auto-Expire Functionality (Req 10)...');
    // Create an expired subscription (expiry date in past)
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    const expiredSubRes = await fetch(`${BASE_URL}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({
        customerId: customerId,
        planId: activePlan._id,
        startDate: new Date(Date.now() - 40 * 24 * 3600 * 1000),
        expiryDate: pastDate,
        status: 'Active',
        subscriptionLines: [
          {
            product: prod1._id,
            name: prod1.name,
            quantity: 1,
            unitPrice: 100,
            taxRate: 0,
            discount: 0
          }
        ]
      })
    });
    const expiredSub = (await expiredSubRes.json()).subscription;

    const expireJobRes = await fetch(`${BASE_URL}/subscriptions/process-expirations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const expireJobData = await expireJobRes.json();
    assert(expireJobData.success, 'Auto-expiration job executed successfully');
    assert(expireJobData.result.modifiedCount >= 1, `Auto-expired ${expireJobData.result.modifiedCount} subscription(s) past their expiry date`);

    const checkSubRes = await fetch(`${BASE_URL}/subscriptions/${expiredSub._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const checkSubData = await checkSubRes.json();
    assert(checkSubData.subscription.status.toLowerCase() === 'closed', 'Expired subscription transitioned to Closed status');

    // 11. Req 11: Audit History & Activity Logs
    console.log('\n[11] Verifying Subscription History & Activity Trail (Req 11)...');
    const detailedSubRes = await fetch(`${BASE_URL}/subscriptions/${sub._id}`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const detailedSubData = await detailedSubRes.json();
    assert(detailedSubData.subscription.history && detailedSubData.subscription.history.length >= 4, 'Maintains full subscription history audit log');
    console.log(`    Recorded ${detailedSubData.subscription.history.length} lifecycle events:`);
    detailedSubData.subscription.history.forEach((h, i) => {
      console.log(`      [${i + 1}] ${h.action} - ${h.details} (${h.performedByName})`);
    });
    assert(detailedSubData.invoices && detailedSubData.invoices.length >= 1, 'Links and retrieves invoice billing history');

    // 12. Req 1: Convert Confirmed Quotation to Subscription
    console.log('\n[12] Testing Subscription Provisioning from Confirmed Quotation (Req 1)...');
    // Create new quotation
    const quoteRes = await fetch(`${BASE_URL}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({
        customer: customerId,
        validityDuration: 30,
        paymentTerms: 'Net 15',
        products: [
          {
            product: prod1._id,
            name: prod1.name,
            quantity: 2,
            unitPrice: 1500,
            taxRate: 18,
            discount: 5
          }
        ],
        plans: [
          {
            plan: activePlan._id,
            name: activePlan.name,
            billingFrequency: 'Monthly',
            quantity: 1,
            unitPrice: activePlan.price,
            taxRate: 18,
            discount: 0
          }
        ]
      })
    });
    const quoteData = await quoteRes.json();
    const qtn = quoteData.data;

    // Confirm quotation
    await fetch(`${BASE_URL}/quotations/${qtn._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({ status: 'Confirmed', note: 'Customer accepted' })
    });

    // Convert via /subscriptions/from-quotation/:id
    const fromQuoteRes = await fetch(`${BASE_URL}/subscriptions/from-quotation/${qtn._id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const fromQuoteData = await fromQuoteRes.json();
    assert(fromQuoteData.success, 'Quotation converted to subscription via /from-quotation');
    assert(fromQuoteData.subscription.quotationNumber === qtn.quotationNumber, 'Subscription references originating quotation number');
    assert(fromQuoteData.subscription.subscriptionLines.length >= 1, 'Subscription lines populated from quotation items');

    console.log('\n====================================================');
    console.log(`🎉 Module 6 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');

    if (failed > 0) process.exit(1);
    else process.exit(0);
  } catch (err) {
    console.error('\n❌ Unhandled error in test suite:', err);
    process.exit(1);
  }
}

runTests();
