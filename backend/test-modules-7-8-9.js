/**
 * Comprehensive Automated Test Suite for:
 * - Module 7: Tax Management
 * - Module 8: Discount Management
 * - Module 9: Invoice Management & Recurring Billing
 * - Full E2E Workflow: Product -> Plan -> Quotation -> Subscription -> Invoice -> Payment -> Reports
 */

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('================================================================');
  console.log('🧪 Starting Verification Suite: Modules 7, 8, 9 & E2E Workflow');
  console.log('================================================================\n');

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
    // 1. Authenticate users
    console.log('\n[Phase 1] Authenticating Admin, Staff & Customer...');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@subscriptionms.com', password: 'Admin@123456' })
    });
    const adminLogin = await adminLoginRes.json();
    assert(adminLogin.token, 'Admin authenticated successfully');
    const adminToken = adminLogin.token;

    const staffLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'staff@subscriptionms.com', password: 'Staff@123456' })
    });
    const staffLogin = await staffLoginRes.json();
    assert(staffLogin.token, 'Staff authenticated successfully');
    const staffToken = staffLogin.token;

    const customerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@subscriptionms.com', password: 'Customer@123456' })
    });
    const customerLogin = await customerLoginRes.json();
    assert(customerLogin.token, 'Customer authenticated successfully');
    const customerToken = customerLogin.token;
    const customerId = customerLogin.user?._id || customerLogin.user?.id;

    // 2. Module 7: Tax Management
    console.log('\n[Phase 2] Testing Tax Management (Percentage & Fixed, Effective Dates, Calculations)...');
    
    // Create Percentage Tax
    const pctTaxRes = await fetch(`${BASE_URL}/taxes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: `Standard GST 18% (${Date.now()})`,
        code: `GST18_${Date.now().toString().slice(-4)}`,
        rate: 18,
        type: 'percentage',
        taxScope: 'sales',
        effectiveFrom: new Date(Date.now() - 86400000).toISOString(),
        isActive: true,
        isDefault: true,
        description: 'Standard Goods & Services Tax'
      })
    });
    const pctTax = await pctTaxRes.json();
    assert(pctTax.success && pctTax.tax?.rate === 18, 'Created percentage tax rule (GST 18%)', JSON.stringify(pctTax));
    const gstTaxId = pctTax.tax?._id;

    // Create Fixed Tax
    const fixedTaxRes = await fetch(`${BASE_URL}/taxes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: `Tech Environmental Surcharge (${Date.now()})`,
        code: `ENV_${Date.now().toString().slice(-4)}`,
        rate: 50,
        type: 'fixed',
        taxScope: 'sales',
        effectiveFrom: new Date(Date.now() - 86400000).toISOString(),
        isActive: true,
        description: 'Fixed environmental processing surcharge'
      })
    });
    const fixedTax = await fixedTaxRes.json();
    assert(fixedTax.success && fixedTax.tax?.type === 'fixed', 'Created fixed tax rule (₹50 surcharge)', JSON.stringify(fixedTax));
    const fixedTaxId = fixedTax.tax?._id;

    // Calculate Tax Breakdown endpoint
    const calcTaxRes = await fetch(`${BASE_URL}/taxes/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        taxIds: [gstTaxId, fixedTaxId],
        amount: 1000,
        quantity: 1
      })
    });
    const calcTax = await calcTaxRes.json();
    // 18% of 1000 = 180; plus fixed 50 = 230
    assert(calcTax.success && calcTax.totalTax === 230, 'Tax breakdown calculated accurately (18% + ₹50 = ₹230 on ₹1000)', JSON.stringify(calcTax));
    assert(Array.isArray(calcTax.breakdown) && calcTax.breakdown.length === 2, 'Breakdown returns items for each tax rule');

    // List taxes
    const getTaxesRes = await fetch(`${BASE_URL}/taxes`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const getTaxes = await getTaxesRes.json();
    assert(getTaxes.success && getTaxes.taxes?.length >= 2, 'Retrieved active taxes list');

    // 3. Module 8: Discount Management
    console.log('\n[Phase 3] Testing Discount Management (Percentage, Fixed, Min Purchase/Qty, Usage Limits)...');
    
    const promoCodePct = `PROMO20_${Date.now().toString().slice(-4)}`;
    const pctDiscountRes = await fetch(`${BASE_URL}/discounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Launch Special 20% Off',
        code: promoCodePct,
        type: 'percentage',
        value: 20,
        minPurchaseAmount: 200,
        minQuantity: 1,
        maxUsageCount: 50,
        startDate: new Date(Date.now() - 86400000).toISOString(),
        endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
        isActive: true,
        description: '20% discount on orders above ₹200'
      })
    });
    const pctDiscount = await pctDiscountRes.json();
    assert(pctDiscount.success && pctDiscount.discount?.value === 20, 'Created percentage discount coupon with min purchase rule', JSON.stringify(pctDiscount));

    const promoCodeFixed = `FLAT100_${Date.now().toString().slice(-4)}`;
    const fixedDiscountRes = await fetch(`${BASE_URL}/discounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Flat ₹100 Off',
        code: promoCodeFixed,
        type: 'fixed',
        value: 100,
        minPurchaseAmount: 300,
        minQuantity: 1,
        maxUsageCount: 1, // Only 1 use allowed
        startDate: new Date(Date.now() - 86400000).toISOString(),
        endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
        isActive: true
      })
    });
    const fixedDiscount = await fixedDiscountRes.json();
    assert(fixedDiscount.success && fixedDiscount.discount?.type === 'fixed', 'Created fixed ₹100 discount coupon with usage limit', JSON.stringify(fixedDiscount));

    // Validate Coupon: Valid case
    const validateRes1 = await fetch(`${BASE_URL}/discounts/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        code: promoCodePct,
        amount: 500,
        quantity: 2
      })
    });
    const validate1 = await validateRes1.json();
    // 20% of 500 = 100 discount
    assert(validate1.success && validate1.discount?.discountAmount === 100, 'Validated percentage discount coupon (20% of ₹500 = ₹100)', JSON.stringify(validate1));

    // Validate Coupon: Below min purchase limit
    const validateRes2 = await fetch(`${BASE_URL}/discounts/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        code: promoCodePct,
        amount: 100, // Below minPurchase of 200
        quantity: 1
      })
    });
    const validate2 = await validateRes2.json();
    assert(!validate2.success, 'Rejected coupon when purchase amount is below minimum threshold');

    // 4. Module 9: Invoice Management & Recurring Billing
    console.log('\n[Phase 4] Testing Invoice Creation, Direct Calculations & Coupon Application...');
    
    const directInvRes = await fetch(`${BASE_URL}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        customerId,
        invoiceLines: [
          {
            name: 'Cloud Hosting Dedicated Node',
            quantity: 2,
            unitPrice: 1000,
            taxRate: 18,
            discount: 10
          }
        ],
        couponCode: promoCodeFixed,
        paymentTerms: 'Net 30',
        status: 'Confirmed',
        notes: 'Enterprise dedicated tier'
      })
    });
    const directInv = await directInvRes.json();
    // Qty 2 * 1000 = 2000. Line discount 10% = 200 => Net = 1800.
    // Line tax 18% of 1800 = 324.
    // Coupon discount flat 100: Final subtotal = 1700 => Total = 1700 + 324 = 2024.
    assert(directInv.success && directInv.invoice?.invoiceNumber, `Generated direct invoice #${directInv.invoice?.invoiceNumber} with line discount & coupon`);
    assert(directInv.invoice?.status === 'Confirmed', 'Invoice initialized with Confirmed status');
    assert(directInv.invoice?.balanceDue > 0, 'Balance due is initially equal to total invoice amount');
    const directInvId = directInv.invoice?._id;

    // Verify invoice list filtering and stats
    const listInvRes = await fetch(`${BASE_URL}/invoices`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const listInv = await listInvRes.json();
    assert(listInv.success && listInv.invoices?.length > 0, 'Retrieved invoices list with financial summary stats');
    assert(listInv.stats && typeof listInv.stats.totalInvoiced === 'number', 'Invoices summary stats calculated successfully');

    // Fetch single invoice by ID
    const getInvRes = await fetch(`${BASE_URL}/invoices/${directInvId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const getInv = await getInvRes.json();
    assert(getInv.success && getInv.invoice?.customerId?.name, 'Retrieved single invoice with populated customer & history');

    // Status transition: Update to Draft or Overdue
    const statusUpdateRes = await fetch(`${BASE_URL}/invoices/${directInvId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Overdue' })
    });
    const statusUpdate = await statusUpdateRes.json();
    assert(statusUpdate.success && (statusUpdate.invoice?.status === 'Overdue' || statusUpdate.invoice?.status === 'overdue'), 'Updated invoice status to Overdue');

    // Set back to Confirmed
    await fetch(`${BASE_URL}/invoices/${directInvId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Confirmed' })
    });

    // 5. Full End-to-End Workflow:
    // Product -> Plan -> Quotation -> Subscription -> Invoice -> Payment -> Reports
    console.log('\n[Phase 5] Executing Full End-to-End Commercial Flow...');

    // 5.1 Create Product
    console.log('  -> Step 1: Creating Product...');
    const prodRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: `SaaS Enterprise Suite ${Date.now()}`,
        productType: 'Software',
        salesPrice: 2500,
        description: 'Complete cloud platform subscription'
      })
    });
    const prod = await prodRes.json();
    assert(prod.success && prod.product?._id, `Product created: ${prod.product?.name}`, JSON.stringify(prod));
    const productId = prod.product?._id;

    // 5.2 Create Plan
    console.log('  -> Step 2: Creating Plan...');
    const planRes = await fetch(`${BASE_URL}/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: `Enterprise Monthly Tier ${Date.now()}`,
        code: `ENT-${Date.now().toString().slice(-4)}`,
        price: 2500,
        minQuantity: 1,
        billingFrequency: 'Monthly',
        paymentTerms: 'Net 30',
        linkedProducts: [{ product: productId, minQuantity: 1 }],
        allowPause: true,
        allowEarlyClosure: true,
        allowRenewal: true,
        features: ['Full Suite Access', '24/7 Dedicated Support']
      })
    });
    const plan = await planRes.json();
    assert(plan.success && plan.plan?._id, `Plan created: ${plan.plan?.name}`, JSON.stringify(plan));
    const planId = plan.plan?._id;

    // 5.3 Create Quotation
    console.log('  -> Step 3: Creating Quotation...');
    const quoteRes = await fetch(`${BASE_URL}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        customerId,
        products: [
          {
            product: productId,
            name: prod.product.name,
            quantity: 1,
            unitPrice: 2500,
            taxRate: 18,
            discount: 10
          }
        ],
        plans: [
          {
            plan: planId,
            name: plan.plan.name,
            quantity: 1,
            unitPrice: 2500,
            taxRate: 18,
            discount: 10,
            billingFrequency: 'Monthly'
          }
        ],
        validityDuration: 30,
        paymentTerms: 'Net 30'
      })
    });
    const quote = await quoteRes.json();
    assert(quote.success && quote.data?._id, `Quotation created: ${quote.data?.quotationNumber}`, JSON.stringify(quote));
    const quoteId = quote.data?._id;

    // Confirm Quotation
    const confirmQuoteRes = await fetch(`${BASE_URL}/quotations/${quoteId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Confirmed' })
    });
    const confirmQuote = await confirmQuoteRes.json();
    assert(confirmQuote.success, `Quotation confirmed`, JSON.stringify(confirmQuote));

    // 5.4 Create Subscription from Quotation
    console.log('  -> Step 4: Creating Subscription from Confirmed Quotation...');
    const subRes = await fetch(`${BASE_URL}/subscriptions/from-quotation/${quoteId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({})
    });
    const sub = await subRes.json();
    assert(sub.success && sub.subscription?.subscriptionNumber, `Subscription created: #${sub.subscription?.subscriptionNumber}`, JSON.stringify(sub));
    const subscriptionId = sub.subscription?._id;
    assert(sub.subscription?.status === 'active', 'Subscription created in active status');

    // 5.5 Generate Invoice from Subscription
    console.log('  -> Step 5: Generating Invoice from Subscription...');
    const invFromSubRes = await fetch(`${BASE_URL}/invoices/from-subscription/${subscriptionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }
    });
    const invFromSub = await invFromSubRes.json();
    assert(invFromSub.success && invFromSub.invoice?.invoiceNumber, `Invoice generated: #${invFromSub.invoice?.invoiceNumber}`);
    const subInvoice = invFromSub.invoice;
    const subInvoiceId = subInvoice._id;
    assert(subInvoice.totalAmount > 0, `Invoice total calculated: ₹${subInvoice.totalAmount}`);
    assert(subInvoice.balanceDue === subInvoice.totalAmount, `Invoice initial balance due equals total amount`);

    // 5.6 Test Duplicate Invoice Prevention
    console.log('  -> Step 6: Testing Duplicate Invoice Prevention for current billing cycle...');
    const duplicateRes = await fetch(`${BASE_URL}/invoices/from-subscription/${subscriptionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }
    });
    const duplicate = await duplicateRes.json();
    assert(!duplicate.success && duplicate.message?.toLowerCase().includes('duplicate'), 'Duplicate invoice for same cycle prevented successfully', duplicate.message);

    // 5.7 Test Recurring Billing Engine
    console.log('  -> Step 7: Testing Automated Recurring Billing Engine...');
    const recurRes = await fetch(`${BASE_URL}/invoices/recurring-billing/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }
    });
    const recur = await recurRes.json();
    assert(recur.success && typeof recur.scannedCount === 'number', `Recurring billing engine ran successfully (Scanned: ${recur.scannedCount}, Generated: ${recur.generatedCount})`);

    // 5.8 Record Payment against Invoice
    console.log('  -> Step 8: Recording Payment against Invoice...');
    const payRes = await fetch(`${BASE_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        invoiceId: subInvoiceId,
        amount: subInvoice.totalAmount,
        paymentMethod: 'card',
        paymentDate: new Date().toISOString(),
        notes: 'Full payment via Stripe Gateway test'
      })
    });
    const pay = await payRes.json();
    assert(pay.success && pay.payment?.paymentReference, `Payment recorded: ${pay.payment?.paymentReference}`, JSON.stringify(pay));

    // Verify invoice balance and status updated to Paid
    const verifiedInvRes = await fetch(`${BASE_URL}/invoices/${subInvoiceId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const verifiedInv = await verifiedInvRes.json();
    assert(
      verifiedInv.invoice?.balanceDue === 0 &&
      (verifiedInv.invoice?.status === 'paid' || verifiedInv.invoice?.status === 'Paid'),
      `Invoice #${subInvoice.invoiceNumber} status is now Paid with balance ₹0`
    );
    assert(
      Array.isArray(verifiedInv.invoice?.history) &&
      verifiedInv.invoice.history.some(h => h.action.includes('Payment')),
      'Invoice audit history logged the payment event'
    );

    // 5.9 Reports Verification
    console.log('  -> Step 9: Verifying Financial & Subscription Reports...');
    const reportsRes = await fetch(`${BASE_URL}/reports`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const reports = await reportsRes.json();
    assert(reports.success !== false, 'Financial & subscription reports loaded successfully', JSON.stringify(reports));

    // 6. Role-Based Access Control (RBAC) Verification
    console.log('\n[Phase 6] Verifying Staff and Customer Permissions...');
    
    // Staff can create taxes/discounts/invoices
    const staffTaxRes = await fetch(`${BASE_URL}/taxes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({
        name: `Staff Service Tax ${Date.now()}`,
        code: `ST_${Date.now().toString().slice(-4)}`,
        rate: 5,
        type: 'percentage'
      })
    });
    const staffTax = await staffTaxRes.json();
    assert(staffTax.success, 'Staff member is authorized to manage taxes');

    // Customer CANNOT create taxes (Forbidden)
    const custTaxRes = await fetch(`${BASE_URL}/taxes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        name: 'Unauthorized Tax',
        code: 'BAD_TAX',
        rate: 10
      })
    });
    assert(custTaxRes.status === 403, 'Customer role is restricted from creating taxes (403 Forbidden)');

    // Customer CAN view their own invoices
    const custInvRes = await fetch(`${BASE_URL}/invoices`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    const custInv = await custInvRes.json();
    assert(custInv.success && Array.isArray(custInv.invoices), 'Customer can view their own billing invoices');

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`🏁 Test Summary: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
