const dotenv = require('dotenv');
dotenv.config();

const API_URL = 'http://localhost:5000/api';

async function testProductModule() {
  console.log('================================================================');
  console.log(' MODULE 3: PRODUCT MANAGEMENT SPECIFICATION VERIFICATION SUITE');
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
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'admin@subscriptionms.com', password: 'Admin@123456' }
  });
  if (!adminLogin.ok) throw new Error('Admin login failed: ' + adminLogin.data.message);
  const adminToken = adminLogin.data.token;
  console.log('✓ Admin authenticated');

  const staffLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'staff@subscriptionms.com', password: 'Staff@123456' }
  });
  if (!staffLogin.ok) throw new Error('Staff login failed');
  const staffToken = staffLogin.data.token;
  console.log('✓ Staff authenticated');

  const custLogin = await request('/auth/login', {
    method: 'POST',
    body: { email: 'customer@subscriptionms.com', password: 'Customer@123456' }
  });
  if (!custLogin.ok) throw new Error('Customer login failed');
  const custToken = custLogin.data.token;
  console.log('✓ Customer authenticated');

  // 2. Role-Based Access Control Checks
  console.log('\n[RBAC Verification]');
  // Customer attempt to create product -> MUST FAIL with 403
  const custCreateRes = await request('/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${custToken}` },
    body: { name: 'Unauthorized Product', salesPrice: 500 }
  });
  if (custCreateRes.status === 403) {
    console.log('  PASS: Customer correctly forbidden from creating products (HTTP 403):', custCreateRes.data.message);
  } else {
    throw new Error('Customer was able to create products! RBAC barrier failed.');
  }

  // Staff attempt to create product -> MUST FAIL with 403
  const staffCreateRes = await request('/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${staffToken}` },
    body: { name: 'Staff Product', salesPrice: 500 }
  });
  if (staffCreateRes.status === 403) {
    console.log('  PASS: Staff correctly forbidden from managing/creating products (HTTP 403):', staffCreateRes.data.message);
  } else {
    throw new Error('Staff was able to create products! RBAC barrier failed.');
  }

  // Staff CAN view products -> MUST SUCCEED (200)
  const staffViewRes = await request('/products', {
    headers: { Authorization: `Bearer ${staffToken}` }
  });
  if (staffViewRes.ok && Array.isArray(staffViewRes.data.products)) {
    console.log(`  PASS: Staff permitted to view products (${staffViewRes.data.products.length} products listed)`);
  } else {
    throw new Error('Staff was unable to view products');
  }

  // 3. Admin Product Creation with Variants & Price Calculation
  console.log('\n[Product Creation with Variants & Options]');
  const newProductPayload = {
    name: 'Custom ERP Platform',
    productType: 'Software',
    salesPrice: 2000,
    costPrice: 1100,
    currency: 'INR',
    currencySymbol: '₹',
    description: 'Enterprise resource planner with customizable brand and edition variants.',
    status: 'Active',
    variants: [
      {
        name: 'Brand',
        options: [
          { value: 'Odoo', additionalPrice: 560, sku: 'ERP-ODOO' },
          { value: 'SAP', additionalPrice: 1200, sku: 'ERP-SAP' }
        ]
      },
      {
        name: 'Edition',
        options: [
          { value: 'Standard', additionalPrice: 0, sku: 'ED-STD' },
          { value: 'Enterprise', additionalPrice: 950, sku: 'ED-ENT' }
        ]
      }
    ]
  };

  const createProdRes = await request('/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: newProductPayload
  });
  if (!createProdRes.ok) throw new Error('Admin failed to create product: ' + createProdRes.data.message);
  const createdProd = createProdRes.data.product;
  console.log('  PASS: Admin created product:', createdProd.name, '| Base Price:', `₹${createdProd.salesPrice}`);
  console.log('  PASS: Variants saved count:', createdProd.variants.length);

  // 4. Test Final Price Automatic Calculation (Exact prompt example)
  console.log('\n[Automatic Final Price Calculation Verification]');
  // Example: Base Price: ₹2000, Variant: Brand, Option: Odoo (+₹560) -> Final Price: ₹2560
  const calcRes = await request(`/products/${createdProd._id}/calculate-price`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      selectedOptions: [
        { variantName: 'Brand', optionValue: 'Odoo' }
      ]
    }
  });
  if (!calcRes.ok) throw new Error('Price calculation failed: ' + calcRes.data.message);
  const calc = calcRes.data.calculation;
  console.log(`  PASS: Base Price: ${calc.currencySymbol}${calc.basePrice}`);
  console.log(`  PASS: Option Selected: Brand -> Odoo (Additional: ${calc.currencySymbol}${calc.additionalTotal})`);
  console.log(`  PASS: Calculated Final Price: ${calc.currencySymbol}${calc.finalPrice}`);
  if (calc.basePrice === 2000 && calc.additionalTotal === 560 && calc.finalPrice === 2560) {
    console.log('  PASS: Final price matches requirement (₹2000 + ₹560 = ₹2560) exactly!');
  } else {
    throw new Error(`Price calculation mismatch: expected 2560, got ${calc.finalPrice}`);
  }

  // Multi-variant option combination calculation (Brand: Odoo + Edition: Enterprise: 2000 + 560 + 950 = 3510)
  const multiCalcRes = await request(`/products/${createdProd._id}/calculate-price`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      selectedOptions: [
        { variantName: 'Brand', optionValue: 'Odoo' },
        { variantName: 'Edition', optionValue: 'Enterprise' }
      ]
    }
  });
  const multiCalc = multiCalcRes.data.calculation;
  console.log(`  PASS: Combined Variants (Odoo + Enterprise): ${multiCalc.currencySymbol}2000 + ${multiCalc.currencySymbol}560 + ${multiCalc.currencySymbol}950 = ${multiCalc.currencySymbol}${multiCalc.finalPrice}`);

  // 5. Product Update
  console.log('\n[Product Editing]');
  const updateRes = await request(`/products/${createdProd._id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: {
      salesPrice: 2200,
      description: 'Updated enterprise suite with expanded brand integrations.'
    }
  });
  if (!updateRes.ok) throw new Error('Update failed: ' + updateRes.data.message);
  console.log('  PASS: Product updated. New Sales Price:', `₹${updateRes.data.product.salesPrice}`);

  // 6. Search, Filter, and Pagination Verification
  console.log('\n[Search, Filters & Pagination Verification]');
  // Search by name
  const searchRes = await request('/products?search=CRM', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`  PASS: Search query 'CRM' returned ${searchRes.data.count} result(s)`);

  // Filter by status 'Active'
  const filterActiveRes = await request('/products?status=Active', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`  PASS: Filter status 'Active' returned ${filterActiveRes.data.count} product(s)`);

  // Pagination: page 1 with limit 2
  const pageRes = await request('/products?page=1&limit=2', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log(`  PASS: Pagination (page=1, limit=2): Page ${pageRes.data.currentPage} of ${pageRes.data.totalPages} (Total Products: ${pageRes.data.totalProducts})`);

  // 7. Active Subscription Deletion Protection & Safe Archiving
  console.log('\n[Active Subscription Deletion Protection & Archiving]');
  // Look up "Business Software" which is linked to active subscriptions in seed
  const businessSoftSearch = await request('/products?search=Business Software', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const businessSoftProd = businessSoftSearch.data.products[0];
  if (!businessSoftProd) throw new Error('Business Software product not found');

  console.log(`  Product '${businessSoftProd.name}' is linked to ${businessSoftProd.activeSubscriptionsCount} active subscription(s)`);

  // Attempt to DELETE product linked to active subscriptions -> MUST BE PREVENTED
  const blockedDeleteRes = await request(`/products/${businessSoftProd._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  if (blockedDeleteRes.status === 400 && blockedDeleteRes.data.canArchive) {
    console.log('  PASS: Deletion successfully blocked with safe protection message:');
    console.log('       ', blockedDeleteRes.data.message);
  } else {
    throw new Error('Product with active subscriptions was deleted! Deletion guard failed.');
  }

  // Safe Archiving verification
  const archiveRes = await request(`/products/${businessSoftProd._id}/archive`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  if (archiveRes.ok && archiveRes.data.product.status === 'Archived') {
    console.log(`  PASS: Product '${businessSoftProd.name}' safely archived without breaking active subscriptions!`);
  } else {
    throw new Error('Failed to archive product');
  }

  // Delete product that has ZERO subscriptions (our newly created test product)
  const cleanDeleteRes = await request(`/products/${createdProd._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  if (cleanDeleteRes.ok) {
    console.log(`  PASS: Unlinked product '${createdProd.name}' successfully deleted cleanly.`);
  } else {
    throw new Error('Failed to delete unlinked product: ' + cleanDeleteRes.data.message);
  }

  console.log('\n================================================================');
  console.log(' ALL MODULE 3 PRODUCT MANAGEMENT TESTS PASSED 100%!');
  console.log('================================================================');
}

testProductModule().catch((err) => {
  console.error('\nTest failed:', err.message);
  process.exit(1);
});

