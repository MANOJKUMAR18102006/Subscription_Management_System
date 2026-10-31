const Invoice = require('../models/Invoice');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Product = require('../models/Product');
const Tax = require('../models/Tax');
const Discount = require('../models/Discount');
const Payment = require('../models/Payment');
const Activity = require('../models/Activity');

/**
 * Generate sequential invoice number INV-YYYY-XXXX
 */
const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const latestInv = await Invoice.findOne({
    invoiceNumber: { $regex: new RegExp(`^INV-${year}-\\d+$`) }
  }).sort({ invoiceNumber: -1 });

  let nextSeq = 1;
  if (latestInv && latestInv.invoiceNumber) {
    const parts = latestInv.invoiceNumber.split('-');
    const lastNum = parseInt(parts[2], 10);
    if (!isNaN(lastNum)) {
      nextSeq = lastNum + 1;
    }
  }

  let candidate = `${prefix}${String(nextSeq).padStart(4, '0')}`;
  while (await Invoice.findOne({ invoiceNumber: candidate })) {
    nextSeq++;
    candidate = `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }
  return candidate;
};

/**
 * Calculate next billing date from a reference date and frequency
 */
const calculateNextBillingDate = (startDate = new Date(), frequency = 'Monthly') => {
  const next = new Date(startDate);
  const freq = (frequency || 'Monthly').toLowerCase();
  switch (freq) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
  }
  return next;
};

/**
 * Calculate due date based on payment terms
 */
const calculateDueDate = (terms = 'Net 30', fromDate = new Date()) => {
  const due = new Date(fromDate);
  switch (terms) {
    case 'Immediate':
    case 'Due on Receipt':
      return due;
    case 'Net 15':
      due.setDate(due.getDate() + 15);
      return due;
    case 'Net 30':
      due.setDate(due.getDate() + 30);
      return due;
    case 'Net 60':
      due.setDate(due.getDate() + 60);
      return due;
    default:
      due.setDate(due.getDate() + 30);
      return due;
  }
};

/**
 * @desc    Get all invoices with filtering, pagination & status breakdown
 * @route   GET /api/invoices
 * @access  Private
 */
exports.getInvoices = async (req, res, next) => {
  try {
    const {
      status,
      search,
      customerId,
      subscriptionId,
      from,
      to,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};

    // Customer role restriction
    if (req.user.role === 'customer') {
      filter.customerId = req.user._id;
    } else if (customerId && customerId !== 'all') {
      filter.customerId = customerId;
    }

    if (subscriptionId && subscriptionId !== 'all') {
      filter.subscriptionId = subscriptionId;
    }

    // Status filter
    if (status && status !== 'all') {
      // Map display name to possible stored variants
      const norm = status.toLowerCase();
      if (norm === 'paid') filter.status = { $in: ['Paid', 'paid'] };
      else if (norm === 'partially paid' || norm === 'partially_paid') filter.status = { $in: ['Partially Paid', 'partially_paid'] };
      else if (norm === 'draft') filter.status = { $in: ['Draft', 'draft'] };
      else if (norm === 'confirmed') filter.status = { $in: ['Confirmed', 'confirmed', 'pending'] };
      else if (norm === 'overdue') filter.status = { $in: ['Overdue', 'overdue'] };
      else if (norm === 'cancelled' || norm === 'canceled') filter.status = { $in: ['Cancelled', 'cancelled', 'canceled'] };
      else filter.status = { $regex: new RegExp(`^${status}$`, 'i') };
    }

    // Date range filter
    if (from || to) {
      filter.dueDate = {};
      if (from) filter.dueDate.$gte = new Date(`${from}T00:00:00.000Z`);
      if (to) filter.dueDate.$lte = new Date(`${to}T23:59:59.999Z`);
    }

    // Search query
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      const matchingUsers = await User.find({ name: searchRegex }).select('_id');
      const userIds = matchingUsers.map((u) => u._id);

      filter.$or = [
        { invoiceNumber: searchRegex },
        { customerId: { $in: userIds } }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Check overdue status on pending/confirmed invoices
    const now = new Date();
    await Invoice.updateMany(
      {
        status: { $in: ['Confirmed', 'confirmed', 'pending'] },
        dueDate: { $lt: now },
        balanceDue: { $gt: 0 }
      },
      { $set: { status: 'overdue' } }
    );

    const [invoices, totalCount] = await Promise.all([
      Invoice.find(filter)
        .populate('customerId', 'name email company phone')
        .populate('subscriptionId', 'subscriptionNumber planName billingFrequency')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Invoice.countDocuments(filter)
    ]);

    // Financial totals aggregation
    const userScope = req.user.role === 'customer' ? { customerId: req.user._id } : {};
    const aggStats = await Invoice.aggregate([
      { $match: userScope },
      {
        $group: {
          _id: null,
          totalInvoiced: { $sum: '$amount' },
          totalPaid: { $sum: '$amountPaid' },
          totalBalanceDue: { $sum: '$balanceDue' }
        }
      }
    ]);

    const statsTotals = aggStats[0] || { totalInvoiced: 0, totalPaid: 0, totalBalanceDue: 0 };
    const overdueCount = await Invoice.countDocuments({ ...userScope, status: { $in: ['overdue', 'Overdue'] } });
    const paidCount = await Invoice.countDocuments({ ...userScope, status: { $in: ['paid', 'Paid'] } });
    const draftCount = await Invoice.countDocuments({ ...userScope, status: { $in: ['draft', 'Draft'] } });

    res.status(200).json({
      success: true,
      count: invoices.length,
      totalInvoices: totalCount,
      totalPages: Math.ceil(totalCount / limitNum) || 1,
      currentPage: pageNum,
      limit: limitNum,
      stats: {
        totalInvoiced: Number(statsTotals.totalInvoiced.toFixed(2)),
        totalPaid: Number(statsTotals.totalPaid.toFixed(2)),
        totalBalanceDue: Number(statsTotals.totalBalanceDue.toFixed(2)),
        overdueCount,
        paidCount,
        draftCount
      },
      invoices
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single invoice by ID with line items, tax breakdown & payment records
 * @route   GET /api/invoices/:id
 * @access  Private
 */
exports.getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerId', 'name email company phone address')
      .populate('subscriptionId', 'subscriptionNumber planName billingFrequency startDate expiryDate')
      .populate('invoiceLines.product', 'name productType salesPrice image')
      .populate('history.performedBy', 'name email role');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Role security
    if (req.user.role === 'customer' && invoice.customerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only view your own invoices' });
    }

    // Fetch payments applied against this invoice
    const payments = await Payment.find({ invoiceId: invoice._id })
      .populate('recordedBy', 'name email')
      .sort({ paymentDate: -1 });

    res.status(200).json({
      success: true,
      invoice,
      payments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new invoice directly
 * @route   POST /api/invoices
 * @access  Private (Admin, Staff)
 */
exports.createInvoice = async (req, res, next) => {
  try {
    const {
      customerId,
      subscriptionId,
      invoiceLines = [],
      dueDate: inputDueDate,
      paymentTerms = 'Net 30',
      billingPeriodStart,
      billingPeriodEnd,
      billingFrequency = 'Monthly',
      status = 'Confirmed',
      couponCode,
      notes = '',
      termsAndConditions
    } = req.body;

    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Customer is required to generate an invoice' });
    }

    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer account not found' });
    }

    if (!Array.isArray(invoiceLines) || invoiceLines.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one invoice line item is required' });
    }

    // Process and normalize line items
    let subtotal = 0;
    let taxAmount = 0;
    let lineDiscountTotal = 0;
    const lines = [];

    for (const l of invoiceLines) {
      const qty = Number(l.quantity) || 1;
      const unit = Number(l.unitPrice) >= 0 ? Number(l.unitPrice) : 0;
      const disc = Math.max(0, Math.min(100, Number(l.discount) || 0));
      const taxR = Math.max(0, Number(l.taxRate) || 0);

      const base = qty * unit;
      const discAmt = base * (disc / 100);
      const net = base - discAmt;
      const taxAmt = net * (taxR / 100);
      const lineTotal = net + taxAmt;

      subtotal += net;
      taxAmount += taxAmt;
      lineDiscountTotal += discAmt;

      lines.push({
        product: l.product || undefined,
        name: l.name || 'Line Item',
        variant: l.variant || '',
        quantity: qty,
        unitPrice: unit,
        taxRate: taxR,
        taxAmount: Number(taxAmt.toFixed(2)),
        discount: disc,
        discountAmount: Number(discAmt.toFixed(2)),
        lineTotal: Number(lineTotal.toFixed(2))
      });
    }

    // Apply Coupon Discount if provided
    let couponDiscountAmount = 0;
    let discountDetails = undefined;
    if (couponCode && couponCode.trim() !== '') {
      const discountDoc = await Discount.findOne({ code: couponCode.trim().toUpperCase() });
      if (discountDoc) {
        const eligibility = discountDoc.validateEligibility({
          amount: subtotal,
          quantity: lines.length,
          customerId: customer._id
        });
        if (eligibility.valid) {
          couponDiscountAmount = discountDoc.calculateDiscountAmount(subtotal);
          discountDetails = {
            discountId: discountDoc._id,
            code: discountDoc.code,
            name: discountDoc.name,
            discountType: discountDoc.type,
            value: discountDoc.value,
            amount: couponDiscountAmount
          };
          discountDoc.currentUsageCount = (discountDoc.currentUsageCount || 0) + 1;
          await discountDoc.save();
        }
      }
    }

    const totalDiscount = lineDiscountTotal + couponDiscountAmount;
    const finalSubtotal = Math.max(0, subtotal - couponDiscountAmount);
    const totalAmount = Number((finalSubtotal + taxAmount).toFixed(2));

    const invoiceNumber = await generateInvoiceNumber();
    const dueDate = inputDueDate ? new Date(inputDueDate) : calculateDueDate(paymentTerms, new Date());

    const invoice = new Invoice({
      invoiceNumber,
      customerId: customer._id,
      subscriptionId: subscriptionId || undefined,
      invoiceLines: lines,
      subtotal: Number(subtotal.toFixed(2)),
      taxAmount: Number(taxAmount.toFixed(2)),
      discountAmount: Number(totalDiscount.toFixed(2)),
      discountDetails,
      totalAmount,
      amount: totalAmount,
      balanceDue: totalAmount,
      amountPaid: 0,
      currency: 'INR',
      currencySymbol: '₹',
      status: status || 'Confirmed',
      dueDate,
      billingPeriodStart: billingPeriodStart ? new Date(billingPeriodStart) : new Date(),
      billingPeriodEnd: billingPeriodEnd ? new Date(billingPeriodEnd) : dueDate,
      billingFrequency,
      paymentTerms,
      notes,
      termsAndConditions: termsAndConditions || undefined,
      confirmedAt: status === 'Confirmed' ? new Date() : undefined,
      createdBy: req.user._id,
      history: [
        {
          action: 'Created',
          performedBy: req.user._id,
          performedByName: req.user.name,
          timestamp: new Date(),
          details: `Invoice #${invoiceNumber} generated for amount ₹${totalAmount} (${status})`
        }
      ]
    });

    await invoice.save();

    await Activity.create({
      customerId: customer._id,
      action: 'invoice_generated',
      description: `Invoice ${invoiceNumber} created for ₹${totalAmount}`,
      type: 'billing',
      metadata: { invoiceId: invoice._id, invoiceNumber, amount: totalAmount }
    });

    res.status(201).json({
      success: true,
      message: `Invoice ${invoiceNumber} created successfully!`,
      invoice
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate Invoice from Subscription & Prevent Duplicate Invoices
 * @route   POST /api/invoices/from-subscription/:subscriptionId
 * @access  Private (Admin, Staff)
 */
exports.createInvoiceFromSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.subscriptionId)
      .populate('customerId')
      .populate('subscriptionLines.product');

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    const normStatus = (subscription.status || '').toLowerCase();
    if (['closed', 'draft'].includes(normStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot generate invoice for a subscription with status '${subscription.status}'`
      });
    }

    const periodStart = subscription.lastBilledDate || subscription.startDate || new Date();
    const periodEnd = subscription.nextBillingDate || calculateNextBillingDate(periodStart, subscription.billingFrequency);

    // Prevent duplicate billing for the current period
    const existingInvoice = await Invoice.findOne({
      subscriptionId: subscription._id,
      $or: [
        {
          billingPeriodStart: { $gte: new Date(new Date(periodStart).setHours(0, 0, 0, 0)) },
          billingPeriodEnd: { $lte: new Date(new Date(periodEnd).setHours(23, 59, 59, 999)) },
          status: { $in: ['pending', 'Confirmed', 'confirmed', 'Paid', 'paid', 'partially_paid'] }
        },
        {
          status: { $in: ['pending', 'Confirmed', 'confirmed'] },
          dueDate: { $gte: new Date() }
        }
      ]
    });

    if (existingInvoice) {
      return res.status(400).json({
        success: false,
        message: `Duplicate Invoice Prevented: Invoice #${existingInvoice.invoiceNumber} has already been issued for this subscription cycle.`,
        existingInvoice
      });
    }

    // Build invoice lines from subscription lines
    const lines = [];
    if (Array.isArray(subscription.subscriptionLines) && subscription.subscriptionLines.length > 0) {
      subscription.subscriptionLines.forEach((l) => {
        lines.push({
          product: l.product?._id || l.product,
          name: l.name,
          variant: l.variant || '',
          quantity: l.quantity || 1,
          unitPrice: l.unitPrice || 0,
          taxRate: l.taxRate || 0,
          taxAmount: l.taxAmount || 0,
          discount: l.discount || 0,
          discountAmount: l.discountAmount || 0,
          lineTotal: l.lineTotal || (l.quantity * l.unitPrice)
        });
      });
    } else {
      lines.push({
        name: `${subscription.planName} Recurring Agreement`,
        quantity: 1,
        unitPrice: subscription.totalAmount || subscription.amount,
        lineTotal: subscription.totalAmount || subscription.amount
      });
    }

    const invoiceNumber = await generateInvoiceNumber();
    const dueDate = calculateDueDate(subscription.paymentTerms, new Date());
    const invoiceAmount = subscription.totalAmount || subscription.amount;

    const invoice = new Invoice({
      invoiceNumber,
      customerId: subscription.customerId._id || subscription.customerId,
      subscriptionId: subscription._id,
      invoiceLines: lines,
      subtotal: subscription.subtotal || invoiceAmount,
      taxAmount: subscription.taxAmount || 0,
      discountAmount: subscription.discountAmount || 0,
      totalAmount: invoiceAmount,
      amount: invoiceAmount,
      balanceDue: invoiceAmount,
      amountPaid: 0,
      currency: subscription.currency || 'INR',
      status: 'Confirmed',
      dueDate,
      billingPeriodStart: periodStart,
      billingPeriodEnd: periodEnd,
      billingFrequency: subscription.billingFrequency || 'Monthly',
      paymentTerms: subscription.paymentTerms || 'Net 30',
      confirmedAt: new Date(),
      createdBy: req.user._id,
      history: [
        {
          action: 'Generated from Subscription',
          performedBy: req.user._id,
          performedByName: req.user.name,
          timestamp: new Date(),
          details: `Recurring cycle invoice #${invoiceNumber} generated for Subscription #${subscription.subscriptionNumber}`
        }
      ]
    });

    await invoice.save();

    // Advance subscription billing dates
    subscription.lastBilledDate = new Date();
    subscription.nextBillingDate = calculateNextBillingDate(periodEnd, subscription.billingFrequency);
    subscription.history.push({
      action: 'Invoice Generated',
      performedBy: req.user._id,
      performedByName: req.user.name,
      timestamp: new Date(),
      details: `Generated Invoice #${invoiceNumber} for ₹${invoiceAmount}. Next billing scheduled for: ${subscription.nextBillingDate.toLocaleDateString()}`
    });
    await subscription.save();

    await Activity.create({
      customerId: subscription.customerId._id || subscription.customerId,
      action: 'invoice_generated',
      description: `Invoice ${invoiceNumber} generated for Subscription ${subscription.subscriptionNumber}`,
      type: 'billing',
      metadata: { invoiceId: invoice._id, invoiceNumber, amount: invoiceAmount }
    });

    res.status(201).json({
      success: true,
      message: `Invoice ${invoiceNumber} generated successfully for ₹${invoiceAmount}!`,
      invoice,
      subscription
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Run recurring billing engine for all subscriptions due (Daily, Weekly, Monthly, Yearly)
 * @route   POST /api/invoices/recurring-billing/run
 * @access  Private (Admin, Staff)
 */
exports.runRecurringBilling = async (req, res, next) => {
  try {
    const now = new Date();
    // Find all active subscriptions where nextBillingDate <= now
    const dueSubscriptions = await Subscription.find({
      status: { $in: ['Active', 'active'] },
      nextBillingDate: { $lte: now }
    }).populate('customerId subscriptionLines.product');

    const generatedInvoices = [];
    const skippedSubscriptions = [];

    for (const sub of dueSubscriptions) {
      try {
        const periodStart = sub.lastBilledDate || sub.startDate || now;
        const periodEnd = sub.nextBillingDate;

        // Duplicate guard: check if an invoice already exists for this cycle
        const duplicate = await Invoice.findOne({
          subscriptionId: sub._id,
          billingPeriodEnd: { $gte: new Date(new Date(periodEnd).setHours(0, 0, 0, 0)) },
          status: { $in: ['pending', 'Confirmed', 'confirmed', 'Paid', 'paid'] }
        });

        if (duplicate) {
          skippedSubscriptions.push({
            subscriptionNumber: sub.subscriptionNumber,
            reason: `Invoice #${duplicate.invoiceNumber} already exists for this cycle`
          });
          continue;
        }

        const lines = (sub.subscriptionLines && sub.subscriptionLines.length > 0)
          ? sub.subscriptionLines.map((l) => ({
              product: l.product?._id || l.product,
              name: l.name,
              variant: l.variant || '',
              quantity: l.quantity || 1,
              unitPrice: l.unitPrice || 0,
              taxRate: l.taxRate || 0,
              taxAmount: l.taxAmount || 0,
              discount: l.discount || 0,
              discountAmount: l.discountAmount || 0,
              lineTotal: l.lineTotal || (l.quantity * l.unitPrice)
            }))
          : [
              {
                name: `${sub.planName} Recurring Agreement`,
                quantity: 1,
                unitPrice: sub.totalAmount || sub.amount,
                lineTotal: sub.totalAmount || sub.amount
              }
            ];

        const invoiceNumber = await generateInvoiceNumber();
        const dueDate = calculateDueDate(sub.paymentTerms, now);
        const invoiceAmount = sub.totalAmount || sub.amount;

        const invoice = await Invoice.create({
          invoiceNumber,
          customerId: sub.customerId._id || sub.customerId,
          subscriptionId: sub._id,
          invoiceLines: lines,
          subtotal: sub.subtotal || invoiceAmount,
          taxAmount: sub.taxAmount || 0,
          discountAmount: sub.discountAmount || 0,
          totalAmount: invoiceAmount,
          amount: invoiceAmount,
          balanceDue: invoiceAmount,
          amountPaid: 0,
          currency: sub.currency || 'INR',
          status: 'Confirmed',
          dueDate,
          billingPeriodStart: periodStart,
          billingPeriodEnd: periodEnd,
          billingFrequency: sub.billingFrequency || 'Monthly',
          paymentTerms: sub.paymentTerms || 'Net 30',
          confirmedAt: now,
          createdBy: req.user._id,
          history: [
            {
              action: 'Recurring Billing Engine Run',
              performedBy: req.user._id,
              performedByName: req.user.name || 'System Billing Engine',
              timestamp: now,
              details: `Automated recurring cycle invoice generated for ${sub.billingFrequency} cycle.`
            }
          ]
        });

        sub.lastBilledDate = now;
        sub.nextBillingDate = calculateNextBillingDate(periodEnd, sub.billingFrequency);
        sub.history.push({
          action: 'Recurring Invoice Generated',
          performedByName: 'Recurring Billing Engine',
          timestamp: now,
          details: `Invoice #${invoiceNumber} generated for ₹${invoiceAmount}. Next billing scheduled for ${sub.nextBillingDate.toLocaleDateString()}`
        });
        await sub.save();

        generatedInvoices.push(invoice);
      } catch (subErr) {
        skippedSubscriptions.push({
          subscriptionNumber: sub.subscriptionNumber,
          error: subErr.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Recurring billing executed. Scanned ${dueSubscriptions.length} subscriptions. Generated ${generatedInvoices.length} invoices.`,
      scannedCount: dueSubscriptions.length,
      generatedCount: generatedInvoices.length,
      skippedCount: skippedSubscriptions.length,
      generatedInvoices,
      skippedSubscriptions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update invoice status (Draft -> Confirmed -> Cancelled)
 * @route   PATCH /api/invoices/:id/status
 * @access  Private (Admin, Staff)
 */
exports.updateInvoiceStatus = async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const currentStatus = invoice.status.toLowerCase();
    const targetStatus = (status || '').toLowerCase();

    if (currentStatus === 'paid' && targetStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a paid invoice. Please process a payment refund first.'
      });
    }

    if (targetStatus === 'confirmed') {
      invoice.status = 'Confirmed';
      invoice.confirmedAt = new Date();
      invoice.history.push({
        action: 'Confirmed',
        performedBy: req.user._id,
        performedByName: req.user.name,
        timestamp: new Date(),
        details: 'Invoice confirmed and opened for payment.'
      });
    } else if (targetStatus === 'cancelled') {
      invoice.status = 'Cancelled';
      invoice.cancelledAt = new Date();
      invoice.cancellationReason = reason || 'Invoice voided/cancelled by administrator';
      invoice.balanceDue = 0;
      invoice.history.push({
        action: 'Cancelled',
        performedBy: req.user._id,
        performedByName: req.user.name,
        timestamp: new Date(),
        details: `Invoice cancelled. Reason: ${invoice.cancellationReason}`
      });
    } else {
      invoice.status = status;
      invoice.history.push({
        action: `Status changed to ${status}`,
        performedBy: req.user._id,
        performedByName: req.user.name,
        timestamp: new Date(),
        details: `Invoice status changed to ${status}`
      });
    }

    await invoice.save();

    res.status(200).json({
      success: true,
      message: `Invoice status updated to '${invoice.status}'`,
      invoice
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update editable invoice details in Draft status
 * @route   PUT /api/invoices/:id
 * @access  Private (Admin, Staff)
 */
exports.updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (['paid', 'partially_paid'].includes(invoice.status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit an invoice with recorded payments.'
      });
    }

    const {
      invoiceLines,
      dueDate,
      paymentTerms,
      notes,
      termsAndConditions
    } = req.body;

    if (dueDate) invoice.dueDate = new Date(dueDate);
    if (paymentTerms) invoice.paymentTerms = paymentTerms;
    if (notes !== undefined) invoice.notes = notes;
    if (termsAndConditions !== undefined) invoice.termsAndConditions = termsAndConditions;

    if (Array.isArray(invoiceLines) && invoiceLines.length > 0) {
      invoice.invoiceLines = invoiceLines.map((l) => {
        const qty = Number(l.quantity) || 1;
        const unit = Number(l.unitPrice) || 0;
        const disc = Number(l.discount) || 0;
        const taxR = Number(l.taxRate) || 0;

        const base = qty * unit;
        const discAmt = base * (disc / 100);
        const net = base - discAmt;
        const taxAmt = net * (taxR / 100);

        return {
          product: l.product,
          name: l.name,
          variant: l.variant || '',
          quantity: qty,
          unitPrice: unit,
          taxRate: taxR,
          taxAmount: Number(taxAmt.toFixed(2)),
          discount: disc,
          discountAmount: Number(discAmt.toFixed(2)),
          lineTotal: Number((net + taxAmt).toFixed(2))
        };
      });

      invoice.recalculateTotals();
    }

    invoice.history.push({
      action: 'Updated',
      performedBy: req.user._id,
      performedByName: req.user.name,
      timestamp: new Date(),
      details: 'Invoice line items or terms updated'
    });

    await invoice.save();

    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      invoice
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an invoice (Draft only)
 * @route   DELETE /api/invoices/:id
 * @access  Private (Admin, Staff)
 */
exports.deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (['paid', 'partially_paid'].includes(invoice.status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an invoice that has payments recorded against it.'
      });
    }

    await Invoice.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: `Invoice #${invoice.invoiceNumber} deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
};

