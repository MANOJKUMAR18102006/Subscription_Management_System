const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Product = require('./models/Product');
const Subscription = require('./models/Subscription');
const Invoice = require('./models/Invoice');
const Payment = require('./models/Payment');
const Activity = require('./models/Activity');
const Plan = require('./models/Plan');

dotenv.config();

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/subscription_management');
    console.log('[Seed] Connected to MongoDB for Module 3 Seed');

    // 1. Clean existing records
    await User.deleteMany({});
    await Product.deleteMany({});
    await Subscription.deleteMany({});
    await Invoice.deleteMany({});
    await Payment.deleteMany({});
    await Activity.deleteMany({});
    await Plan.deleteMany({});
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

    console.log('[Seed] Seeded Users (1 Admin, 2 Staff, 5 Customers)');

    // 3. Create Products with Variants & Pricing (Module 3 Specification)
    // Product 1: The prompt's exact example
    const prodBusinessSoftware = await Product.create({
      name: 'Business Software',
      productType: 'Software',
      salesPrice: 2000,
      costPrice: 1200,
      currency: 'INR',
      currencySymbol: '₹',
      description: 'Enterprise resource planning and business operational automation software suite with multi-brand connectors.',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
      status: 'Active',
      variants: [
        {
          name: 'Brand',
          options: [
            { value: 'Odoo', additionalPrice: 560, sku: 'BS-BR-ODOO' },
            { value: 'SAP', additionalPrice: 1200, sku: 'BS-BR-SAP' },
            { value: 'Salesforce', additionalPrice: 1500, sku: 'BS-BR-SF' }
          ]
        },
        {
          name: 'Edition',
          options: [
            { value: 'Standard', additionalPrice: 0, sku: 'BS-ED-STD' },
            { value: 'Professional', additionalPrice: 850, sku: 'BS-ED-PRO' },
            { value: 'Enterprise', additionalPrice: 1600, sku: 'BS-ED-ENT' }
          ]
        }
      ],
      createdBy: admin._id
    });

    // Product 2: Cloud CRM Suite
    const prodCloudCRM = await Product.create({
      name: 'Cloud CRM Suite',
      productType: 'Software',
      salesPrice: 3500,
      costPrice: 1800,
      currency: 'INR',
      currencySymbol: '₹',
      description: 'End-to-end cloud pipeline, lead scoring, and automated client lifecycle management platform.',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80',
      status: 'Active',
      variants: [
        {
          name: 'Tier',
          options: [
            { value: 'Essential', additionalPrice: 0, sku: 'CRM-TR-ESS' },
            { value: 'Growth', additionalPrice: 1100, sku: 'CRM-TR-GRO' },
            { value: 'Scale', additionalPrice: 2400, sku: 'CRM-TR-SCL' }
          ]
        },
        {
          name: 'Cloud Storage',
          options: [
            { value: '50 GB', additionalPrice: 0, sku: 'CRM-ST-50' },
            { value: '250 GB', additionalPrice: 450, sku: 'CRM-ST-250' },
            { value: '1 TB', additionalPrice: 1250, sku: 'CRM-ST-1TB' }
          ]
        }
      ],
      createdBy: admin._id
    });

    // Product 3: Developer API Gateway
    const prodAPIGateway = await Product.create({
      name: 'Developer API Gateway',
      productType: 'Add-on',
      salesPrice: 800,
      costPrice: 200,
      currency: 'INR',
      currencySymbol: '₹',
      description: 'Ultra-low latency managed API gateway with rate limiting and automated webhook dispatch.',
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80',
      status: 'Active',
      variants: [
        {
          name: 'Throughput',
          options: [
            { value: '10k Requests/day', additionalPrice: 0, sku: 'API-TP-10K' },
            { value: '100k Requests/day', additionalPrice: 600, sku: 'API-TP-100K' },
            { value: '1 Million Requests/day', additionalPrice: 2100, sku: 'API-TP-1M' }
          ]
        }
      ],
      createdBy: admin._id
    });

    // Product 4: Dedicated 24/7 SLA Service
    const prodSLAService = await Product.create({
      name: 'Dedicated 24/7 SLA Service',
      productType: 'Service',
      salesPrice: 1500,
      costPrice: 650,
      currency: 'INR',
      currencySymbol: '₹',
      description: 'Mission-critical 15-minute response SLA with dedicated technical account manager and triage hotline.',
      status: 'Active',
      variants: [
        {
          name: 'Response SLA',
          options: [
            { value: '4 Hour SLA', additionalPrice: 0, sku: 'SLA-4H' },
            { value: '1 Hour SLA', additionalPrice: 750, sku: 'SLA-1H' },
            { value: '15 Minute Dedicated', additionalPrice: 2200, sku: 'SLA-15M' }
          ]
        }
      ],
      createdBy: admin._id
    });

    // Product 5: Archived Product (Safe Archiving Example)
    const prodArchivedLegacy = await Product.create({
      name: 'Legacy On-Premise Connector v1',
      productType: 'Add-on',
      salesPrice: 950,
      costPrice: 400,
      currency: 'INR',
      currencySymbol: '₹',
      description: 'Deprecated on-premise sync agent. Safely archived for existing contracts.',
      status: 'Archived',
      variants: [],
      createdBy: admin._id
    });

    // Product 6: Standalone Draft Product (Available for clean deletion test)
    const prodStandaloneDraft = await Product.create({
      name: 'Biometric Edge Gateway Device',
      productType: 'Hardware',
      salesPrice: 4500,
      costPrice: 3100,
      currency: 'INR',
      currencySymbol: '₹',
      description: 'Draft IoT terminal hardware evaluation kit.',
      status: 'Draft',
      variants: [],
      createdBy: admin._id
    });

    console.log('[Seed] Seeded 6 Products with Variant Options & Pricing Matrix');

    // 4. Create Subscription Plans (Module 4 Specification)
    const now = new Date();

    // Plan 1: Enterprise Cloud Suite (Multi-product bundle, Monthly, Auto-close enabled)
    const planEnterpriseCloud = await Plan.create({
      name: 'Enterprise Cloud Suite',
      description: 'Comprehensive business suite bundling Cloud CRM and 24/7 Priority Support with multi-tenant isolation.',
      linkedProducts: [
        { product: prodCloudCRM._id, minQuantity: 1, isPrimary: true },
        { product: prodSLAService._id, minQuantity: 1, isPrimary: false }
      ],
      billingFrequency: 'Monthly',
      price: 4600,
      currency: 'INR',
      currencySymbol: '₹',
      minQuantity: 1,
      availableFrom: new Date(now.getFullYear(), now.getMonth() - 6, 1),
      availableUntil: new Date(now.getFullYear() + 1, 11, 31),
      autoClose: true,
      allowEarlyClosure: true,
      allowPause: true,
      allowRenewal: true,
      status: 'Active',
      features: [
        'Dedicated CRM Workspace',
        '24/7 Dedicated Support',
        'Multi-tenant Cloud Isolation',
        'Unlimited Audit Retention'
      ],
      createdBy: admin._id
    });

    // Plan 2: Business Automation Annual (Yearly frequency, Minimum Quantity 2, Early Closure prohibited)
    const planBusinessAnnual = await Plan.create({
      name: 'Business Automation Annual',
      description: 'Annual enterprise license for core business operations with multi-brand connectors. Requires min 2 licenses.',
      linkedProducts: [
        { product: prodBusinessSoftware._id, minQuantity: 2, isPrimary: true }
      ],
      billingFrequency: 'Yearly',
      price: 32000,
      currency: 'INR',
      currencySymbol: '₹',
      minQuantity: 2,
      availableFrom: new Date(now.getFullYear(), 0, 1),
      availableUntil: null, // Perpetual
      autoClose: false,
      allowEarlyClosure: false, // Early closure restricted by contract
      allowPause: true,
      allowRenewal: true,
      status: 'Active',
      features: [
        'Full ERP Core Engine',
        'Multi-Brand SAP/Odoo/Salesforce Connectors',
        'Dedicated Account Director',
        'Annual Rate Guarantee'
      ],
      createdBy: admin._id
    });

    // Plan 3: Developer API Gateway Pro (Daily billing frequency, Min quantity 5, Pause prohibited)
    const planAPIDaily = await Plan.create({
      name: 'Developer API Gateway Pro',
      description: 'High-throughput microservices gateway billed daily for dynamic scaling. Minimum 5 seats.',
      linkedProducts: [
        { product: prodAPIGateway._id, minQuantity: 5, isPrimary: true }
      ],
      billingFrequency: 'Daily',
      price: 200,
      currency: 'INR',
      currencySymbol: '₹',
      minQuantity: 5,
      availableFrom: new Date(now.getFullYear(), now.getMonth() - 2, 1),
      availableUntil: new Date(now.getFullYear(), now.getMonth() + 6, 1),
      autoClose: false,
      allowEarlyClosure: true,
      allowPause: false, // Pausing not allowed
      allowRenewal: true,
      status: 'Active',
      features: [
        '100k API Requests/day per unit',
        'Sub-10ms Global Latency',
        'Continuous Uptime Monitoring'
      ],
      createdBy: admin._id
    });

    // Plan 4: Operations Sprint Weekly (Weekly billing, Renewal prohibited)
    const planWeeklySprint = await Plan.create({
      name: 'Operations Sprint Weekly',
      description: 'Accelerated 7-day engineering support sprint. One-time sprint cycle (no auto-renewal).',
      linkedProducts: [
        { product: prodSLAService._id, minQuantity: 1, isPrimary: true }
      ],
      billingFrequency: 'Weekly',
      price: 750,
      currency: 'INR',
      currencySymbol: '₹',
      minQuantity: 1,
      availableFrom: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14),
      availableUntil: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 45),
      autoClose: true,
      allowEarlyClosure: true,
      allowPause: true,
      allowRenewal: false, // Renewal prohibited
      status: 'Active',
      features: [
        'Weekly Rapid Architecture Reviews',
        'Emergency 1-Hour SLA',
        'Direct Slack / Teams Sync'
      ],
      createdBy: admin._id
    });

    // Plan 5: Legacy Q3 Flash Bundle (Expired with Auto Close = true -> Auto Closed Demonstration)
    const planExpiredFlash = await Plan.create({
      name: 'Q3 Early-Bird Flash Bundle',
      description: 'Limited seasonal promotion for early adopters. Expired and automatically closed.',
      linkedProducts: [
        { product: prodCloudCRM._id, minQuantity: 1, isPrimary: true }
      ],
      billingFrequency: 'Monthly',
      price: 1800,
      currency: 'INR',
      currencySymbol: '₹',
      minQuantity: 1,
      availableFrom: new Date(now.getFullYear(), now.getMonth() - 3, 1),
      availableUntil: new Date(now.getFullYear(), now.getMonth() - 1, 1), // Past date!
      autoClose: true,
      allowEarlyClosure: true,
      allowPause: true,
      allowRenewal: true,
      status: 'Closed',
      features: [
        'Discounted Early Access Rate',
        'Standard Features'
      ],
      createdBy: admin._id
    });

    // Plan 6: Upcoming 2027 Vision Plan (Future Available From Date -> Scheduled Showcase)
    const planScheduledFuture = await Plan.create({
      name: 'Vision 2027 Enterprise Tier',
      description: 'Pre-announced next-generation cloud subscription scheduled for future rollout.',
      linkedProducts: [
        { product: prodBusinessSoftware._id, minQuantity: 1, isPrimary: true },
        { product: prodAPIGateway._id, minQuantity: 1, isPrimary: false }
      ],
      billingFrequency: 'Yearly',
      price: 65000,
      currency: 'INR',
      currencySymbol: '₹',
      minQuantity: 1,
      availableFrom: new Date(now.getFullYear() + 1, 0, 1), // Future date!
      availableUntil: new Date(now.getFullYear() + 2, 0, 1),
      autoClose: true,
      allowEarlyClosure: true,
      allowPause: true,
      allowRenewal: true,
      status: 'Active',
      features: [
        'Quantum-Ready Encryption',
        'AI Autonomous Agents Included'
      ],
      createdBy: admin._id
    });

    console.log('[Seed] Seeded 6 Subscription Plans with multi-products, billing frequencies, and auto-close');

    // 5. Create Subscriptions (Linked to Plans & Products with Price Locking)

    // Primary customer subscription -> Linked to Enterprise Cloud Suite
    const subPrimary = await Subscription.create({
      customerId: customerPrimary._id,
      productId: prodBusinessSoftware._id,
      planId: planEnterpriseCloud._id,
      planName: planEnterpriseCloud.name,
      quantity: 1,
      unitPrice: 2560,
      priceLockedAt: new Date(now.getFullYear(), now.getMonth() - 3, 1),
      billingFrequency: 'Monthly',
      billingCycle: 'monthly',
      amount: 2560,
      currency: 'INR',
      currencySymbol: '₹',
      status: 'active',
      planSnapshot: {
        planId: planEnterpriseCloud._id,
        name: planEnterpriseCloud.name,
        price: 2560,
        billingFrequency: 'Monthly',
        minQuantity: 1,
        allowEarlyClosure: true,
        allowPause: true,
        allowRenewal: true,
        currency: 'INR',
        currencySymbol: '₹',
        features: planEnterpriseCloud.features
      },
      selectedVariant: {
        variantName: 'Brand',
        optionValue: 'Odoo',
        additionalPrice: 560
      },
      startDate: new Date(now.getFullYear(), now.getMonth() - 3, 1),
      nextBillingDate: new Date(now.getFullYear(), now.getMonth() + 1, 15),
      features: ['Unlimited Team Seats', 'Brand: Odoo Integration', '24/7 Priority SLA', 'Custom SSO']
    });

    // Sub 2: Acme -> Linked to Enterprise Cloud Suite
    const subAcme = await Subscription.create({
      customerId: custAcme._id,
      productId: prodCloudCRM._id,
      planId: planEnterpriseCloud._id,
      planName: planEnterpriseCloud.name,
      quantity: 1,
      unitPrice: 4600,
      priceLockedAt: new Date(now.getFullYear(), now.getMonth() - 5, 10),
      billingFrequency: 'Monthly',
      billingCycle: 'monthly',
      amount: 4600,
      currency: 'INR',
      currencySymbol: '₹',
      status: 'active',
      planSnapshot: {
        planId: planEnterpriseCloud._id,
        name: planEnterpriseCloud.name,
        price: 4600,
        billingFrequency: 'Monthly',
        minQuantity: 1,
        allowEarlyClosure: true,
        allowPause: true,
        allowRenewal: true,
        currency: 'INR',
        currencySymbol: '₹',
        features: planEnterpriseCloud.features
      },
      selectedVariant: {
        variantName: 'Tier',
        optionValue: 'Growth',
        additionalPrice: 1100
      },
      startDate: new Date(now.getFullYear(), now.getMonth() - 5, 10),
      nextBillingDate: new Date(now.getFullYear(), now.getMonth() + 1, 10),
      features: ['20 Team Seats', 'Cloud Storage: 250 GB', 'Advanced Reporting']
    });

    // Sub 3: Nexus (Past Due Developer API Gateway Pro)
    const subNexus = await Subscription.create({
      customerId: custNexus._id,
      productId: prodAPIGateway._id,
      planId: planAPIDaily._id,
      planName: planAPIDaily.name,
      quantity: 5,
      unitPrice: 280,
      priceLockedAt: new Date(now.getFullYear(), now.getMonth() - 2, 5),
      billingFrequency: 'Daily',
      billingCycle: 'daily',
      amount: 1400,
      currency: 'INR',
      currencySymbol: '₹',
      status: 'past_due',
      planSnapshot: {
        planId: planAPIDaily._id,
        name: planAPIDaily.name,
        price: 280,
        billingFrequency: 'Daily',
        minQuantity: 5,
        allowEarlyClosure: true,
        allowPause: false, // Pausing disabled!
        allowRenewal: true,
        currency: 'INR',
        currencySymbol: '₹',
        features: planAPIDaily.features
      },
      selectedVariant: {
        variantName: 'Throughput',
        optionValue: '100k Requests/day',
        additionalPrice: 600
      },
      startDate: new Date(now.getFullYear(), now.getMonth() - 2, 5),
      nextBillingDate: new Date(now.getFullYear(), now.getMonth(), 5),
      features: ['10 Team Seats', '100k Requests/day']
    });

    // Sub 4: Apex (Active Yearly Business Automation Annual - Early closure restricted!)
    const subApex = await Subscription.create({
      customerId: custApex._id,
      productId: prodBusinessSoftware._id,
      planId: planBusinessAnnual._id,
      planName: planBusinessAnnual.name,
      quantity: 2,
      unitPrice: 16000,
      priceLockedAt: new Date(now.getFullYear(), 0, 15),
      billingFrequency: 'Yearly',
      billingCycle: 'yearly',
      amount: 32000,
      currency: 'INR',
      currencySymbol: '₹',
      status: 'active',
      planSnapshot: {
        planId: planBusinessAnnual._id,
        name: planBusinessAnnual.name,
        price: 16000,
        billingFrequency: 'Yearly',
        minQuantity: 2,
        allowEarlyClosure: false, // Early closure prohibited!
        allowPause: true,
        allowRenewal: true,
        currency: 'INR',
        currencySymbol: '₹',
        features: planBusinessAnnual.features
      },
      selectedVariant: {
        variantName: 'Brand',
        optionValue: 'SAP',
        additionalPrice: 1200
      },
      startDate: new Date(now.getFullYear(), 0, 15),
      nextBillingDate: new Date(now.getFullYear() + 1, 0, 15),
      features: ['Unlimited Seats', 'Brand: SAP Core Engine', 'Dedicated Manager']
    });

    // Sub 5: Vertex (Trialing)
    const subVertex = await Subscription.create({
      customerId: custVertex._id,
      productId: prodCloudCRM._id,
      planId: planEnterpriseCloud._id,
      planName: planEnterpriseCloud.name,
      quantity: 1,
      unitPrice: 3500,
      priceLockedAt: new Date(),
      billingFrequency: 'Monthly',
      billingCycle: 'monthly',
      amount: 3500,
      currency: 'INR',
      currencySymbol: '₹',
      status: 'trialing',
      planSnapshot: {
        planId: planEnterpriseCloud._id,
        name: planEnterpriseCloud.name,
        price: 3500,
        billingFrequency: 'Monthly',
        minQuantity: 1,
        allowEarlyClosure: true,
        allowPause: true,
        allowRenewal: true,
        currency: 'INR',
        currencySymbol: '₹',
        features: planEnterpriseCloud.features
      },
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3),
      nextBillingDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 11),
      features: ['3 Team Seats', 'Core Features']
    });

    // Sub 6: Canceled
    const subCanceled = await Subscription.create({
      customerId: custNexus._id,
      productId: prodAPIGateway._id,
      planId: planEnterpriseCloud._id,
      planName: planEnterpriseCloud.name,
      quantity: 1,
      unitPrice: 800,
      billingFrequency: 'Monthly',
      billingCycle: 'monthly',
      amount: 800,
      currency: 'INR',
      currencySymbol: '₹',
      status: 'canceled',
      planSnapshot: {
        planId: planEnterpriseCloud._id,
        name: planEnterpriseCloud.name,
        price: 800,
        billingFrequency: 'Monthly',
        minQuantity: 1,
        allowEarlyClosure: true,
        allowPause: true,
        allowRenewal: true
      },
      startDate: new Date(now.getFullYear(), now.getMonth() - 6, 1),
      nextBillingDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      cancelAtPeriodEnd: true,
      features: ['Standard Support']
    });

    console.log('[Seed] Seeded Subscriptions linked to Plans & Products with locked prices');

    // 5. Create Invoices
    const invPrimaryPaid1 = await Invoice.create({
      invoiceNumber: 'INV-2026-001',
      customerId: customerPrimary._id,
      subscriptionId: subPrimary._id,
      amount: 2560,
      currency: 'INR',
      status: 'paid',
      dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 15),
      paidAt: new Date(now.getFullYear(), now.getMonth() - 1, 14),
      items: [{ description: 'Business Software (Brand: Odoo) - Monthly Subscription', amount: 2560 }],
      createdAt: new Date(now.getFullYear(), now.getMonth() - 1, 10)
    });

    const invPrimaryPaid2 = await Invoice.create({
      invoiceNumber: 'INV-2026-002',
      customerId: customerPrimary._id,
      subscriptionId: subPrimary._id,
      amount: 2560,
      currency: 'INR',
      status: 'paid',
      dueDate: new Date(now.getFullYear(), now.getMonth(), 15),
      paidAt: new Date(now.getFullYear(), now.getMonth(), 15),
      items: [{ description: 'Business Software (Brand: Odoo) - Monthly Subscription', amount: 2560 }],
      createdAt: new Date(now.getFullYear(), now.getMonth(), 10)
    });

    const invAcmePaid = await Invoice.create({
      invoiceNumber: 'INV-2026-003',
      customerId: custAcme._id,
      subscriptionId: subAcme._id,
      amount: 4600,
      currency: 'INR',
      status: 'paid',
      dueDate: new Date(now.getFullYear(), now.getMonth(), 10),
      paidAt: new Date(now.getFullYear(), now.getMonth(), 9),
      items: [{ description: 'Cloud CRM Suite (Growth Tier) - Monthly Subscription', amount: 4600 }],
      createdAt: new Date(now.getFullYear(), now.getMonth(), 5)
    });

    const invNexusOverdue = await Invoice.create({
      invoiceNumber: 'INV-2026-005',
      customerId: custNexus._id,
      subscriptionId: subNexus._id,
      amount: 1400,
      currency: 'INR',
      status: 'overdue',
      dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 28),
      items: [{ description: 'Developer API Gateway (100k Throughput) - Monthly Subscription', amount: 1400 }],
      createdAt: new Date(now.getFullYear(), now.getMonth() - 1, 20)
    });

    const invPending2 = await Invoice.create({
      invoiceNumber: 'INV-2026-008',
      customerId: customerPrimary._id,
      subscriptionId: subPrimary._id,
      amount: 2560,
      currency: 'INR',
      status: 'pending',
      dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 15),
      items: [{ description: 'Business Software (Brand: Odoo) - Upcoming Renewal', amount: 2560 }],
      createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate())
    });

    console.log('[Seed] Seeded Invoices linked to subscriptions');

    // 6. Create Payments
    await Payment.create({
      transactionId: 'TXN-2026-9001',
      customerId: customerPrimary._id,
      invoiceId: invPrimaryPaid2._id,
      subscriptionId: subPrimary._id,
      amount: 2560,
      currency: 'INR',
      status: 'succeeded',
      paymentMethod: 'UPI / Visa •••• 4242',
      cardLast4: '4242',
      paidAt: new Date()
    });

    await Payment.create({
      transactionId: 'TXN-2026-8942',
      customerId: custAcme._id,
      invoiceId: invAcmePaid._id,
      subscriptionId: subAcme._id,
      amount: 4600,
      currency: 'INR',
      status: 'succeeded',
      paymentMethod: 'Mastercard •••• 5510',
      cardLast4: '5510',
      paidAt: new Date(now.getFullYear(), now.getMonth(), 8)
    });

    await Payment.create({
      transactionId: 'TXN-2026-9110',
      customerId: custNexus._id,
      invoiceId: invNexusOverdue._id,
      subscriptionId: subNexus._id,
      amount: 1400,
      currency: 'INR',
      status: 'pending',
      paymentMethod: 'Net Banking / NEFT',
      cardLast4: 'BANK',
      paidAt: new Date(now.getFullYear(), now.getMonth(), now.getDate())
    });

    console.log('[Seed] Seeded Payments');

    // 7. Customer Activities
    const activities = [
      {
        customerId: customerPrimary._id,
        action: 'payment_succeeded',
        description: 'Payment of ₹2560.00 succeeded for Business Software (Brand: Odoo)',
        type: 'billing',
        createdAt: new Date()
      },
      {
        customerId: customerPrimary._id,
        action: 'subscription_created',
        description: 'Subscribed to Business Software with Brand: Odoo (Base: ₹2000 + Add: ₹560 = ₹2560)',
        type: 'subscription',
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
      },
      {
        customerId: custAcme._id,
        action: 'plan_upgraded',
        description: 'Upgraded Cloud CRM Suite to Growth Tier (₹4600/month)',
        type: 'subscription',
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
      }
    ];

    for (const act of activities) {
      await Activity.create(act);
    }
    console.log('[Seed] Seeded Activities');

    console.log('====================================================');
    console.log('[Seed] Database successfully seeded for Module 3!');
    console.log('====================================================');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedDB();
