const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Subscription = require('./models/Subscription');
const Invoice = require('./models/Invoice');
const Payment = require('./models/Payment');
const Activity = require('./models/Activity');

dotenv.config();

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/subscription_management');
    console.log('[Seed] Connected to MongoDB for Module 2 Seed');

    // 1. Clean existing records
    await User.deleteMany({});
    await Subscription.deleteMany({});
    await Invoice.deleteMany({});
    await Payment.deleteMany({});
    await Activity.deleteMany({});
    console.log('[Seed] Cleaned existing collections');

    // 2. Create Users (Admin, Staff, and multiple Customers)
    const admin = await User.create({
      name: 'Eleanor Vance (Admin)',
      email: 'admin@subscriptionms.com',
      password: 'Admin@123456',
      role: 'admin',
      company: 'Subscription Corp HQ',
      phone: '+1 (555) 019-2831'
    });

    const staff1 = await User.create({
      name: 'David Miller (Staff)',
      email: 'staff@subscriptionms.com',
      password: 'Staff@123456',
      role: 'staff',
      company: 'Operations Support Tier 2',
      phone: '+1 (555) 018-7742'
    });

    const staff2 = await User.create({
      name: 'Kelly Operations',
      email: 'kelly.ops@subscriptionms.com',
      password: 'Staff@123456',
      role: 'staff',
      company: 'Customer Success Desk',
      phone: '+1 (555) 018-9921'
    });

    // Primary demo customer
    const customerPrimary = await User.create({
      name: 'Alice Cooper (Customer)',
      email: 'customer@subscriptionms.com',
      password: 'Customer@123456',
      role: 'customer',
      company: 'Cooper Designs Inc',
      phone: '+1 (555) 012-3398'
    });

    // Additional customers for realistic multi-tenant SaaS analytics
    const custAcme = await User.create({
      name: 'Sarah Jenkins',
      email: 'sarah@acmecorp.com',
      password: 'Customer@123456',
      role: 'customer',
      company: 'Acme Corporation',
      phone: '+1 (555) 014-9912'
    });

    const custNexus = await User.create({
      name: 'Marcus Vance',
      email: 'marcus@nexustech.io',
      password: 'Customer@123456',
      role: 'customer',
      company: 'Nexus Technologies',
      phone: '+1 (555) 013-4481'
    });

    const custApex = await User.create({
      name: 'Elena Rostova',
      email: 'elena@apexlogistics.com',
      password: 'Customer@123456',
      role: 'customer',
      company: 'Apex Global Logistics',
      phone: '+1 (555) 017-8823'
    });

    const custVertex = await User.create({
      name: 'Liam Chen',
      email: 'liam@vertexai.co',
      password: 'Customer@123456',
      role: 'customer',
      company: 'Vertex AI Labs',
      phone: '+1 (555) 016-5529'
    });

    console.log('[Seed] Seeded 1 Admin, 2 Staff, and 5 Customer accounts');

    // 3. Create Subscriptions across various plans & statuses
    const now = new Date();

    // Primary customer subscription (Active Enterprise Pro)
    const subPrimary = await Subscription.create({
      customerId: customerPrimary._id,
      planName: 'Enterprise Pro',
      billingCycle: 'monthly',
      amount: 299,
      currency: 'USD',
      status: 'active',
      startDate: new Date(now.getFullYear(), now.getMonth() - 3, 1),
      nextBillingDate: new Date(now.getFullYear(), now.getMonth() + 1, 15),
      features: ['Unlimited Team Seats', 'Dedicated Account Manager', '24/7 Priority SLA', 'Custom SSO']
    });

    // Sub 2: Acme (Active Professional Suite)
    const subAcme = await Subscription.create({
      customerId: custAcme._id,
      planName: 'Professional Suite',
      billingCycle: 'monthly',
      amount: 149,
      currency: 'USD',
      status: 'active',
      startDate: new Date(now.getFullYear(), now.getMonth() - 5, 10),
      nextBillingDate: new Date(now.getFullYear(), now.getMonth() + 1, 10),
      features: ['20 Team Seats', 'Advanced Reporting', 'Standard SLA']
    });

    // Sub 3: Nexus (Past Due Growth Tier)
    const subNexus = await Subscription.create({
      customerId: custNexus._id,
      planName: 'Growth Tier',
      billingCycle: 'monthly',
      amount: 79,
      currency: 'USD',
      status: 'past_due',
      startDate: new Date(now.getFullYear(), now.getMonth() - 2, 5),
      nextBillingDate: new Date(now.getFullYear(), now.getMonth(), 5),
      features: ['10 Team Seats', 'Email Support']
    });

    // Sub 4: Apex (Active Yearly Enterprise)
    const subApex = await Subscription.create({
      customerId: custApex._id,
      planName: 'Enterprise Pro',
      billingCycle: 'yearly',
      amount: 2990,
      currency: 'USD',
      status: 'active',
      startDate: new Date(now.getFullYear(), 0, 15),
      nextBillingDate: new Date(now.getFullYear() + 1, 0, 15),
      features: ['Unlimited Seats', 'Dedicated Manager', 'Custom API Integrations']
    });

    // Sub 5: Vertex (Trialing Starter Plan)
    const subVertex = await Subscription.create({
      customerId: custVertex._id,
      planName: 'Starter Plan',
      billingCycle: 'monthly',
      amount: 29,
      currency: 'USD',
      status: 'trialing',
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3),
      nextBillingDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 11),
      features: ['3 Team Seats', 'Core Features']
    });

    // Sub 6: Canceled Starter
    const subCanceled = await Subscription.create({
      customerId: custNexus._id,
      planName: 'Starter Plan',
      billingCycle: 'monthly',
      amount: 29,
      currency: 'USD',
      status: 'canceled',
      startDate: new Date(now.getFullYear(), now.getMonth() - 6, 1),
      nextBillingDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      cancelAtPeriodEnd: true,
      features: ['Standard Support']
    });

    console.log('[Seed] Seeded 6 Subscriptions across multiple statuses');

    // 4. Create Invoices (Paid, Pending, Overdue)
    // Primary customer invoices
    const invPrimaryPaid1 = await Invoice.create({
      invoiceNumber: 'INV-2026-001',
      customerId: customerPrimary._id,
      subscriptionId: subPrimary._id,
      amount: 299,
      currency: 'USD',
      status: 'paid',
      dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 15),
      paidAt: new Date(now.getFullYear(), now.getMonth() - 1, 14),
      billingPeriodStart: new Date(now.getFullYear(), now.getMonth() - 2, 15),
      billingPeriodEnd: new Date(now.getFullYear(), now.getMonth() - 1, 15),
      items: [{ description: 'Enterprise Pro - Monthly Subscription', amount: 299 }],
      createdAt: new Date(now.getFullYear(), now.getMonth() - 1, 10)
    });

    const invPrimaryPaid2 = await Invoice.create({
      invoiceNumber: 'INV-2026-002',
      customerId: customerPrimary._id,
      subscriptionId: subPrimary._id,
      amount: 299,
      currency: 'USD',
      status: 'paid',
      dueDate: new Date(now.getFullYear(), now.getMonth(), 15),
      paidAt: new Date(now.getFullYear(), now.getMonth(), 15),
      billingPeriodStart: new Date(now.getFullYear(), now.getMonth() - 1, 15),
      billingPeriodEnd: new Date(now.getFullYear(), now.getMonth(), 15),
      items: [{ description: 'Enterprise Pro - Monthly Subscription', amount: 299 }],
      createdAt: new Date(now.getFullYear(), now.getMonth(), 10)
    });

    // Acme Invoices
    const invAcmePaid = await Invoice.create({
      invoiceNumber: 'INV-2026-003',
      customerId: custAcme._id,
      subscriptionId: subAcme._id,
      amount: 149,
      currency: 'USD',
      status: 'paid',
      dueDate: new Date(now.getFullYear(), now.getMonth(), 10),
      paidAt: new Date(now.getFullYear(), now.getMonth(), 9),
      billingPeriodStart: new Date(now.getFullYear(), now.getMonth() - 1, 10),
      billingPeriodEnd: new Date(now.getFullYear(), now.getMonth(), 10),
      items: [{ description: 'Professional Suite - Monthly Subscription', amount: 149 }],
      createdAt: new Date(now.getFullYear(), now.getMonth(), 5)
    });

    // Apex Yearly Invoice
    const invApexPaid = await Invoice.create({
      invoiceNumber: 'INV-2026-004',
      customerId: custApex._id,
      subscriptionId: subApex._id,
      amount: 2990,
      currency: 'USD',
      status: 'paid',
      dueDate: new Date(now.getFullYear(), 0, 15),
      paidAt: new Date(now.getFullYear(), 0, 15),
      billingPeriodStart: new Date(now.getFullYear(), 0, 15),
      billingPeriodEnd: new Date(now.getFullYear() + 1, 0, 15),
      items: [{ description: 'Enterprise Pro - Annual Subscription', amount: 2990 }],
      createdAt: new Date(now.getFullYear(), 0, 10)
    });

    // Nexus Overdue Invoice (Requirement: Overdue Invoices)
    const invNexusOverdue = await Invoice.create({
      invoiceNumber: 'INV-2026-005',
      customerId: custNexus._id,
      subscriptionId: subNexus._id,
      amount: 79,
      currency: 'USD',
      status: 'overdue',
      dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 28), // Due in the past
      billingPeriodStart: new Date(now.getFullYear(), now.getMonth() - 2, 28),
      billingPeriodEnd: new Date(now.getFullYear(), now.getMonth() - 1, 28),
      items: [{ description: 'Growth Tier - Monthly Subscription', amount: 79 }],
      createdAt: new Date(now.getFullYear(), now.getMonth() - 1, 20)
    });

    // Another Overdue Invoice for Apex additional licenses
    const invApexOverdue = await Invoice.create({
      invoiceNumber: 'INV-2026-006',
      customerId: custApex._id,
      subscriptionId: subApex._id,
      amount: 250,
      currency: 'USD',
      status: 'overdue',
      dueDate: new Date(now.getFullYear(), now.getMonth(), 1), // Past due
      billingPeriodStart: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      billingPeriodEnd: new Date(now.getFullYear(), now.getMonth(), 1),
      items: [{ description: 'Dedicated IP & Audit Add-on', amount: 250 }],
      createdAt: new Date(now.getFullYear(), now.getMonth() - 1, 25)
    });

    // Pending Invoices (Requirement: Pending Invoices)
    const invPending1 = await Invoice.create({
      invoiceNumber: 'INV-2026-007',
      customerId: custVertex._id,
      subscriptionId: subVertex._id,
      amount: 29,
      currency: 'USD',
      status: 'pending',
      dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 5),
      items: [{ description: 'Starter Plan - Upcoming Renewal', amount: 29 }],
      createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
    });

    const invPending2 = await Invoice.create({
      invoiceNumber: 'INV-2026-008',
      customerId: customerPrimary._id,
      subscriptionId: subPrimary._id,
      amount: 299,
      currency: 'USD',
      status: 'pending',
      dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 15),
      items: [{ description: 'Enterprise Pro - Upcoming Renewal', amount: 299 }],
      createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate())
    });

    console.log('[Seed] Seeded Invoices across paid, overdue, and pending statuses');

    // 5. Create Payments distributed across dates for charts & filters
    // Payments today
    const payToday = await Payment.create({
      transactionId: 'TXN-2026-9001',
      customerId: customerPrimary._id,
      invoiceId: invPrimaryPaid2._id,
      subscriptionId: subPrimary._id,
      amount: 299,
      currency: 'USD',
      status: 'succeeded',
      paymentMethod: 'Visa •••• 4242',
      cardLast4: '4242',
      paidAt: new Date()
    });

    // Payments this month
    const payThisMonth1 = await Payment.create({
      transactionId: 'TXN-2026-8942',
      customerId: custAcme._id,
      invoiceId: invAcmePaid._id,
      subscriptionId: subAcme._id,
      amount: 149,
      currency: 'USD',
      status: 'succeeded',
      paymentMethod: 'Mastercard •••• 5510',
      cardLast4: '5510',
      paidAt: new Date(now.getFullYear(), now.getMonth(), 8)
    });

    // Pending Payment (Requirement: Pending Payments)
    const payPending = await Payment.create({
      transactionId: 'TXN-2026-9110',
      customerId: custNexus._id,
      invoiceId: invNexusOverdue._id,
      subscriptionId: subNexus._id,
      amount: 79,
      currency: 'USD',
      status: 'pending',
      paymentMethod: 'ACH Bank Transfer',
      cardLast4: '9812',
      paidAt: new Date(now.getFullYear(), now.getMonth(), now.getDate())
    });

    // Payments last month
    const payLastMonth1 = await Payment.create({
      transactionId: 'TXN-2026-8711',
      customerId: customerPrimary._id,
      invoiceId: invPrimaryPaid1._id,
      subscriptionId: subPrimary._id,
      amount: 299,
      currency: 'USD',
      status: 'succeeded',
      paymentMethod: 'Visa •••• 4242',
      cardLast4: '4242',
      paidAt: new Date(now.getFullYear(), now.getMonth() - 1, 14)
    });

    const payLastMonth2 = await Payment.create({
      transactionId: 'TXN-2026-8690',
      customerId: custAcme._id,
      amount: 149,
      currency: 'USD',
      status: 'succeeded',
      paymentMethod: 'Mastercard •••• 5510',
      cardLast4: '5510',
      paidAt: new Date(now.getFullYear(), now.getMonth() - 1, 10)
    });

    // Monthly historical payments across this year (for Revenue Overview Chart)
    const monthsBack = [5, 4, 3, 2];
    for (const m of monthsBack) {
      await Payment.create({
        transactionId: `TXN-HIST-${m}M-1`,
        customerId: custAcme._id,
        amount: 149,
        status: 'succeeded',
        paymentMethod: 'Mastercard •••• 5510',
        cardLast4: '5510',
        paidAt: new Date(now.getFullYear(), now.getMonth() - m, 10)
      });
      await Payment.create({
        transactionId: `TXN-HIST-${m}M-2`,
        customerId: customerPrimary._id,
        amount: 299,
        status: 'succeeded',
        paymentMethod: 'Visa •••• 4242',
        cardLast4: '4242',
        paidAt: new Date(now.getFullYear(), now.getMonth() - m, 15)
      });
    }

    // Earlier this year: Annual Enterprise Payment
    await Payment.create({
      transactionId: 'TXN-2026-YEAR-01',
      customerId: custApex._id,
      invoiceId: invApexPaid._id,
      subscriptionId: subApex._id,
      amount: 2990,
      currency: 'USD',
      status: 'succeeded',
      paymentMethod: 'Wire Transfer',
      cardLast4: 'BANK',
      paidAt: new Date(now.getFullYear(), 0, 15)
    });

    console.log('[Seed] Seeded Payments across current, prior month, and historical periods');

    // 6. Create Customer Activities (for Staff Dashboard: Recent Customer Activities)
    const activities = [
      {
        customerId: customerPrimary._id,
        action: 'payment_succeeded',
        description: 'Payment of $299.00 succeeded for Enterprise Pro (Visa •••• 4242)',
        type: 'billing',
        createdAt: new Date()
      },
      {
        customerId: customerPrimary._id,
        action: 'subscription_renewed',
        description: 'Enterprise Pro subscription renewed for 1 month',
        type: 'subscription',
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
      },
      {
        customerId: custNexus._id,
        action: 'payment_failed',
        description: 'Scheduled payment of $79.00 failed (Card expired) - Account set to Past Due',
        type: 'billing',
        createdAt: new Date(now.getTime() - 18 * 60 * 60 * 1000)
      },
      {
        customerId: custVertex._id,
        action: 'subscription_created',
        description: 'Signed up for 14-day free trial on Starter Plan',
        type: 'subscription',
        createdAt: new Date(now.getTime() - 36 * 60 * 60 * 1000)
      },
      {
        customerId: custAcme._id,
        action: 'invoice_paid',
        description: 'Invoice INV-2026-003 ($149.00) marked as Paid via automated card charge',
        type: 'billing',
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        customerId: custApex._id,
        action: 'plan_upgraded',
        description: 'Added 5 additional enterprise seats & dedicated audit logging',
        type: 'subscription',
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        customerId: customerPrimary._id,
        action: 'payment_method_updated',
        description: 'Updated default payment card to Visa ending in 4242',
        type: 'account',
        createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000)
      }
    ];

    for (const act of activities) {
      await Activity.create(act);
    }
    console.log('[Seed] Seeded 7 Customer Activities');

    console.log('====================================================');
    console.log('[Seed] Database successfully seeded for Module 2!');
    console.log('====================================================');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedDB();
