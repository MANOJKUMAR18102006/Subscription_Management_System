/**
 * Comprehensive Automated Test Suite for Module 5: Quotation Management
 */

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting Module 5: Quotation Management Test Suite');
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
    const customerToken = customerLogin.token;
    const customerId = customerLogin.user.id || customerLogin.user._id;

    // 2. Templates verification
    console.log('\n[2] Testing Quotation Templates...');
    const templatesRes = await fetch(`${BASE_URL}/quotation-templates`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    const templatesData = await templatesRes.json();
    assert(templatesData.success && templatesData.data.length >= 3, 'Staff retrieved quotation templates list', `Count: ${templatesData.data?.length}`);

    const selectedTemplate = templatesData.data[0];
    console.log(`    Selected Template: "${selectedTemplate.name}" (Validity: ${selectedTemplate.validityDuration} days)`);

    // 3. Create Quotation from Template
    console.log('\n[3] Testing Quotation Creation from Template...');
    const createQuoteRes = await fetch(`${BASE_URL}/quotations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        customerId,
        quotationTemplateId: selectedTemplate._id,
        validityDuration: 30,
        paymentTerms: 'Net 30',
        status: 'Draft',
        notes: 'Test quote generated from automated suite'
      })
    });
    const createQuoteData = await createQuoteRes.json();
    assert(createQuoteData.success && createQuoteData.data.quotationNumber, 'Quotation created with unique number', createQuoteData.message);
    const newQuote = createQuoteData.data;
    console.log(`    Quotation Number: ${newQuote.quotationNumber}, Status: ${newQuote.status}, Total: ₹${newQuote.totalAmount}`);

    // Check automatic calculations
    assert(newQuote.subtotal > 0, 'Subtotal automatically calculated', `Subtotal: ${newQuote.subtotal}`);
    assert(newQuote.taxAmount > 0, 'Tax amount automatically calculated', `Tax: ${newQuote.taxAmount}`);
    assert(newQuote.totalAmount === Number((newQuote.subtotal + newQuote.taxAmount).toFixed(2)), 'Total amount matches Subtotal + Tax');
    assert(newQuote.expiryDate, 'Expiry date automatically calculated', `Expiry: ${newQuote.expiryDate}`);

    // 4. Edit Quotation Lines
    console.log('\n[4] Testing Editing Quotation Lines...');
    const editRes = await fetch(`${BASE_URL}/quotations/${newQuote._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        validityDuration: 45,
        paymentTerms: 'Net 60',
        products: [
          {
            product: newQuote.products[0].product._id || newQuote.products[0].product,
            name: 'Custom Server Add-on',
            quantity: 3,
            unitPrice: 1000,
            taxRate: 18,
            discount: 10
          }
        ],
        plans: []
      })
    });
    const editData = await editRes.json();
    assert(editData.success, 'Quotation lines updated successfully');
    // 3 * 1000 = 3000, 10% disc = 300 -> net subtotal = 2700. 18% tax = 486. Total = 3186.
    assert(editData.data.subtotal === 2700, 'Subtotal accurately recalculated after line edit', `Subtotal: ${editData.data.subtotal}`);
    assert(editData.data.taxAmount === 486, 'Tax accurately recalculated (18% of 2700 = 486)', `Tax: ${editData.data.taxAmount}`);
    assert(editData.data.totalAmount === 3186, 'Total accurately recalculated (2700 + 486 = 3186)', `Total: ${editData.data.totalAmount}`);
    assert(editData.data.validityDuration === 45, 'Validity duration updated to 45 days');

    // 5. Test Transition from Draft to Quotation
    console.log('\n[5] Testing Status Transition (Draft -> Quotation)...');
    const toQuotationRes = await fetch(`${BASE_URL}/quotations/${newQuote._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({ status: 'Quotation', note: 'Sent official quote to customer' })
    });
    const toQuotationData = await toQuotationRes.json();
    assert(toQuotationData.success && toQuotationData.data.status === 'Quotation', 'Status changed to "Quotation"');

    // 6. Test Expiry Guard Requirement: Prevent expired quotation from being confirmed
    console.log('\n[6] Testing Expiry Guard: Prevent Expired Quotation from Confirmation...');
    // Find QTN-2026-0004 which is expired in seed data
    const listRes = await fetch(`${BASE_URL}/quotations?search=QTN-2026-0004`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const listData = await listRes.json();
    const expiredQuote = listData.data.find((q) => q.quotationNumber === 'QTN-2026-0004');

    if (expiredQuote) {
      console.log(`    Found expired quotation: ${expiredQuote.quotationNumber} (Expiry: ${expiredQuote.expiryDate})`);
      const confirmExpiredRes = await fetch(`${BASE_URL}/quotations/${expiredQuote._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staffToken}`
        },
        body: JSON.stringify({ status: 'Confirmed' })
      });
      const confirmExpiredData = await confirmExpiredRes.json();
      assert(
        confirmExpiredRes.status === 400 && confirmExpiredData.isExpired === true,
        'STRICT GUARD PASSED: Expired quotation confirmation blocked with 400 Bad Request',
        confirmExpiredData.message
      );
    } else {
      console.warn('    Could not locate QTN-2026-0004 to test expiry guard');
    }

    // 7. Confirm Valid Quotation
    console.log('\n[7] Testing Valid Quotation Confirmation...');
    const confirmValidRes = await fetch(`${BASE_URL}/quotations/${newQuote._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      },
      body: JSON.stringify({ status: 'Confirmed', note: 'Customer accepted terms' })
    });
    const confirmValidData = await confirmValidRes.json();
    assert(confirmValidData.success && confirmValidData.data.status === 'Confirmed', 'Valid quotation transitioned to "Confirmed"');

    // 8. Convert Confirmed Quotation into Active Subscription
    console.log('\n[8] Testing Converting Confirmed Quotation into Active Subscription...');
    const convertRes = await fetch(`${BASE_URL}/quotations/${newQuote._id}/convert-to-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`
      }
    });
    const convertData = await convertRes.json();
    assert(convertData.success, 'Quotation successfully converted into Subscription');
    assert(convertData.data.quotation.status === 'Active', 'Quotation status updated to "Active"');
    assert(convertData.data.subscription && convertData.data.subscription.status === 'active', 'Subscription created in active status', `Sub ID: ${convertData.data.subscription?._id}`);
    assert(convertData.data.quotation.subscriptionId.toString() === convertData.data.subscription._id.toString(), 'Quotation links to new subscription ID');

    // 9. Verify History Trail
    console.log('\n[9] Testing Audit History Trail...');
    const detailRes = await fetch(`${BASE_URL}/quotations/${newQuote._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const detailData = await detailRes.json();
    assert(detailData.data.history.length >= 4, 'Audit history contains all lifecycle events', `Events count: ${detailData.data.history.length}`);
    console.log('    History events:');
    detailData.data.history.forEach((h, idx) => {
      console.log(`      [${idx + 1}] ${h.action} - ${h.details} (${new Date(h.timestamp).toLocaleTimeString()})`);
    });

    // 10. Customer Access Permissions
    console.log('\n[10] Testing Customer Role RBAC...');
    const customerViewOwnRes = await fetch(`${BASE_URL}/quotations/${newQuote._id}`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const customerViewOwn = await customerViewOwnRes.json();
    assert(customerViewOwn.success, 'Customer can view their own quotation');

    // Customer attempt to edit should be blocked
    const customerEditRes = await fetch(`${BASE_URL}/quotations/${newQuote._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify({ notes: 'Hacked by customer' })
    });
    assert(customerEditRes.status === 403, 'Customer forbidden from editing quotations (403)');

    console.log('\n====================================================');
    console.log(`🎉 Module 5 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');
  } catch (err) {
    console.error('Fatal test execution error:', err);
  }
}

runTests();

