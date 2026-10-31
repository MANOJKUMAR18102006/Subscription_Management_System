const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const PaymentAudit = require('../models/PaymentAudit');
const User = require('../models/User');
const { recordPayment } = require('../services/paymentService');

const canAccessCustomer = (req, customerId) =>
  ['admin', 'staff'].includes(req.user.role) || req.user._id.toString() === customerId.toString();

exports.getInvoices = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'customer') filter.customerId = req.user._id;
    if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
    if (req.query.customerId && ['admin', 'staff'].includes(req.user.role)) filter.customerId = req.query.customerId;

    const invoices = await Invoice.find(filter)
      .populate('customerId', 'name email company')
      .sort({ dueDate: 1, createdAt: -1 });
    res.json({ success: true, invoices });
  } catch (error) {
    next(error);
  }
};

exports.getPayments = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'customer') filter.customerId = req.user._id;
    if (req.query.customerId && ['admin', 'staff'].includes(req.user.role)) filter.customerId = req.query.customerId;
    if (req.query.method && req.query.method !== 'all') filter.paymentMethod = req.query.method;
    if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
    if (req.query.invoiceId) filter.invoiceId = req.query.invoiceId;
    if (req.query.from || req.query.to) {
      filter.paymentDate = {};
      if (req.query.from) filter.paymentDate.$gte = new Date(`${req.query.from}T00:00:00.000Z`);
      if (req.query.to) filter.paymentDate.$lte = new Date(`${req.query.to}T23:59:59.999Z`);
    }

    const payments = await Payment.find(filter)
      .populate('customerId', 'name email company')
      .populate('invoiceId', 'invoiceNumber amount amountPaid balanceDue status currency')
      .populate('recordedBy', 'name email role')
      .sort({ paymentDate: -1 });
    res.json({ success: true, payments });
  } catch (error) {
    next(error);
  }
};

exports.createPayment = async (req, res, next) => {
  try {
    const { invoiceId, amount, paymentMethod, paymentDate, transactionReference, notes } = req.body;
    if (!invoiceId || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'Invoice and payment method are required' });
    }
    const validMethods = ['cash', 'bank_transfer', 'upi', 'card', 'other'];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Unsupported payment method' });
    }

    const result = await recordPayment({
      invoiceId,
      amount,
      paymentMethod,
      paymentDate,
      transactionReference,
      notes,
      recordedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: `Payment recorded. Invoice is ${result.invoice.status.replace('_', ' ')}.`,
      payment: result.payment,
      invoice: result.invoice
    });
  } catch (error) {
    next(error);
  }
};

exports.getPaymentReceipt = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('customerId', 'name email company')
      .populate('invoiceId', 'invoiceNumber amount amountPaid balanceDue status currency')
      .populate('recordedBy', 'name email');
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (!canAccessCustomer(req, payment.customerId._id)) {
      return res.status(403).json({ success: false, message: 'You can only view your own payment receipts' });
    }
    res.json({
      success: true,
      receipt: {
        receiptNumber: payment.paymentReference,
        paymentReference: payment.paymentReference,
        transactionReference: payment.transactionReference,
        invoice: payment.invoiceId,
        customer: payment.customerId,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.paymentDate,
        status: payment.status,
        notes: payment.notes,
        recordedBy: payment.recordedBy
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getPaymentAudit = async (req, res, next) => {
  try {
    const audits = await PaymentAudit.find({ invoiceId: req.params.invoiceId })
      .populate('paymentId', 'paymentReference amount paymentMethod paymentDate status')
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 });
    res.json({ success: true, audits });
  } catch (error) {
    next(error);
  }
};

exports.getCustomers = async (req, res, next) => {
  try {
    const customers = await User.find({ role: 'customer', isActive: true }).select('name email company').sort({ name: 1 });
    res.json({ success: true, customers });
  } catch (error) {
    next(error);
  }
};
