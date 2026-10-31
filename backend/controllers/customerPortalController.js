const CustomerRequest = require('../models/CustomerRequest');
const Discount = require('../models/Discount');
const Activity = require('../models/Activity');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Plan = require('../models/Plan');
const Quotation = require('../models/Quotation');
const Subscription = require('../models/Subscription');

const customerIdFor = (req) => req.user._id;

const ownSubscription = async (req, res) => {
  const subscription = await Subscription.findOne({
    _id: req.params.subscriptionId,
    customerId: customerIdFor(req)
  }).populate('planId', 'name billingFrequency price currency currencySymbol features');
  if (!subscription) {
    res.status(404).json({ success: false, message: 'Subscription not found in your account.' });
    return null;
  }
  return subscription;
};

exports.getPortal = async (req, res, next) => {
  try {
    const customerId = customerIdFor(req);
    const [subscriptions, invoices, payments, quotations, discounts, requests, plans] = await Promise.all([
      Subscription.find({ customerId }).sort({ createdAt: -1 }).populate('planId', 'name features'),
      Invoice.find({ customerId }).sort({ dueDate: 1, createdAt: -1 }),
      Payment.find({ customerId }).sort({ paymentDate: -1 }).populate('invoiceId', 'invoiceNumber'),
      Quotation.find({ customerId }).sort({ createdAt: -1 }),
      Discount.find({ customerId }).sort({ validUntil: 1, createdAt: -1 }),
      CustomerRequest.find({ customerId }).sort({ createdAt: -1 }).populate('subscriptionId', 'planName status'),
      Plan.find({ status: 'Active' }).select('name description price currency currencySymbol billingFrequency features minQuantity allowPause allowRenewal')
    ]);

    const outstandingInvoices = invoices.filter((invoice) =>
      ['pending', 'partially_paid', 'overdue'].includes(invoice.status) && Number(invoice.balanceDue || 0) > 0
    );
    const nextBilling = subscriptions
      .filter((subscription) => (subscription.status || '').toLowerCase() === 'active' && subscription.nextBillingDate)
      .sort((a, b) => new Date(a.nextBillingDate) - new Date(b.nextBillingDate))[0];

    res.json({
      success: true,
      profile: req.user,
      subscriptions,
      invoices,
      payments,
      quotations,
      discounts,
      requests,
      availablePlans: plans,
      notifications: {
        nextBillingDate: nextBilling?.nextBillingDate || null,
        overdueInvoices: outstandingInvoices.filter((invoice) => invoice.status === 'overdue').length,
        outstandingAmount: outstandingInvoices.reduce((total, invoice) => total + Number(invoice.balanceDue || 0), 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getSubscriptionHistory = async (req, res, next) => {
  try {
    const subscription = await ownSubscription(req, res);
    if (!subscription) return;
    const requests = await CustomerRequest.find({
      customerId: customerIdFor(req),
      subscriptionId: subscription._id
    }).sort({ createdAt: -1 });
    const activities = await Activity.find({
      customerId: customerIdFor(req),
      'metadata.subscriptionId': subscription._id
    }).sort({ createdAt: -1 });
    res.json({ success: true, subscription, requests, activities });
  } catch (error) {
    next(error);
  }
};

exports.createRequest = async (req, res, next) => {
  try {
    const subscription = await ownSubscription(req, res);
    if (!subscription) return;
    const { type, reason } = req.body;
    if (!['renewal', 'pause', 'cancellation'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Request type must be renewal, pause, or cancellation.' });
    }
    const setting = type === 'renewal' ? 'allowRenewal' : type === 'pause' ? 'allowPause' : 'allowEarlyClosure';
    if (subscription.planSnapshot?.[setting] === false) {
      return res.status(400).json({ success: false, message: `This plan does not allow ${type} requests.` });
    }
    const existing = await CustomerRequest.findOne({
      customerId: customerIdFor(req),
      subscriptionId: subscription._id,
      type,
      status: 'pending'
    });
    if (existing) {
      return res.status(409).json({ success: false, message: `A pending ${type} request already exists.` });
    }
    const request = await CustomerRequest.create({
      customerId: customerIdFor(req),
      subscriptionId: subscription._id,
      type,
      reason
    });
    res.status(201).json({ success: true, message: `${type[0].toUpperCase()}${type.slice(1)} request submitted.`, request });
  } catch (error) {
    next(error);
  }
};

exports.downloadInvoicePdf = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.invoiceId, customerId: customerIdFor(req) }).populate('customerId', 'name email company');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found in your account.' });
    const escapePdf = (value) => String(value ?? '').replace(/([\\()])/g, '\\$1');
    const lines = [
      `BRIGHTLOOP INVOICE ${invoice.invoiceNumber}`,
      `Customer: ${invoice.customerId.name}`,
      `Email: ${invoice.customerId.email}`,
      `Amount: ${invoice.currency} ${invoice.amount}`,
      `Paid: ${invoice.currency} ${invoice.amountPaid || 0}`,
      `Balance due: ${invoice.currency} ${invoice.balanceDue || 0}`,
      `Status: ${invoice.status}`,
      `Due date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}`
    ];
    const content = `BT /F1 14 Tf 50 760 Td (${escapePdf(lines[0])}) Tj 0 -28 Td /F1 10 Tf ${lines.slice(1).map((line) => `(${escapePdf(line)}) Tj 0 -18 Td`).join(' ')} ET`;
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
      `<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets[index + 1] = Buffer.byteLength(pdf, 'utf8');
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xrefOffset = Buffer.byteLength(pdf, 'utf8');
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"` });
    res.send(Buffer.from(pdf, 'utf8'));
  } catch (error) {
    next(error);
  }
};
