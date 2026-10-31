const crypto = require('crypto');
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const PaymentAudit = require('../models/PaymentAudit');

const createPaymentReference = () =>
  `PAY-${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}-${crypto
    .randomBytes(3)
    .toString('hex')
    .toUpperCase()}`;

const recordPayment = async ({ invoiceId, amount, paymentMethod, paymentDate, transactionReference, notes, recordedBy }) => {
  if (!mongoose.isValidObjectId(invoiceId)) {
    const error = new Error('A valid invoice is required');
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    const error = new Error('Payment amount must be greater than zero');
    error.statusCode = 400;
    throw error;
  }

  const executePaymentOperations = async (opts = {}) => {
    const { session } = opts;
    const findQuery = Invoice.findById(invoiceId);
    if (session) findQuery.session(session);
    const invoice = await findQuery;
    if (!invoice) {
      const error = new Error('Invoice not found');
      error.statusCode = 404;
      throw error;
    }

    const currentBalance = Math.max(0, Number(invoice.totalAmount || invoice.amount || 0) - Number(invoice.amountPaid || 0));
    if (Number(amount) > currentBalance + 0.000001) {
      const error = new Error(`Payment exceeds the outstanding balance of ${currentBalance.toFixed(2)}`);
      error.statusCode = 400;
      throw error;
    }

    const payment = new Payment({
      paymentReference: createPaymentReference(),
      transactionReference: transactionReference?.trim() || undefined,
      customerId: invoice.customerId,
      subscriptionId: invoice.subscriptionId,
      invoiceId: invoice._id,
      amount: Number(amount),
      currency: invoice.currency,
      paymentMethod,
      paymentDate: paymentDate || new Date(),
      notes: notes?.trim() || undefined,
      status: 'completed',
      recordedBy
    });

    const newAmountPaid = Number((Number(invoice.amountPaid || 0) + Number(amount)).toFixed(2));
    const totalAmount = Number(invoice.totalAmount || invoice.amount || 0);
    invoice.amountPaid = newAmountPaid;
    invoice.balanceDue = Math.max(0, Number((totalAmount - newAmountPaid).toFixed(2)));
    invoice.status = invoice.balanceDue <= 0.001 ? 'paid' : 'partially_paid';
    invoice.paidAt = invoice.status === 'paid' ? payment.paymentDate : undefined;

    if (!Array.isArray(invoice.history)) {
      invoice.history = [];
    }
    invoice.history.push({
      action: 'Payment Recorded',
      performedBy: recordedBy,
      timestamp: payment.paymentDate || new Date(),
      details: `Payment recorded: ${payment.currency || '₹'}${amount} via ${paymentMethod}. Balance due: ₹${invoice.balanceDue}`
    });

    if (session) {
      await payment.save({ session });
      await invoice.save({ session });
      await PaymentAudit.create(
        [
          {
            paymentId: payment._id,
            invoiceId: invoice._id,
            action: 'created',
            performedBy: recordedBy,
            amount: payment.amount,
            details: {
              paymentReference: payment.paymentReference,
              previousBalance: currentBalance,
              newBalance: invoice.balanceDue
            }
          }
        ],
        { session }
      );
    } else {
      await payment.save();
      await invoice.save();
      await PaymentAudit.create({
        paymentId: payment._id,
        invoiceId: invoice._id,
        action: 'created',
        performedBy: recordedBy,
        amount: payment.amount,
        details: {
          paymentReference: payment.paymentReference,
          previousBalance: currentBalance,
          newBalance: invoice.balanceDue
        }
      });
    }

    return { payment, invoice };
  };

  // Support both Replica Set and standalone MongoDB
  let session;
  try {
    session = await mongoose.startSession();
    let result;
    await session.withTransaction(async () => {
      result = await executePaymentOperations({ session });
    });
    return result;
  } catch (err) {
    if (err.message && err.message.includes('replica set')) {
      return await executePaymentOperations();
    }
    throw err;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

module.exports = { recordPayment };
