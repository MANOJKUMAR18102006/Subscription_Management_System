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

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const invoice = await Invoice.findById(invoiceId).session(session);
      if (!invoice) {
        const error = new Error('Invoice not found');
        error.statusCode = 404;
        throw error;
      }

      const currentBalance = Math.max(0, Number(invoice.amount) - Number(invoice.amountPaid || 0));
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
      invoice.amountPaid = newAmountPaid;
      invoice.balanceDue = Number((Number(invoice.amount) - newAmountPaid).toFixed(2));
      invoice.status = invoice.balanceDue === 0 ? 'paid' : 'partially_paid';
      invoice.paidAt = invoice.status === 'paid' ? payment.paymentDate : undefined;

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

      result = { payment, invoice };
    });
    return result;
  } finally {
    await session.endSession();
  }
};

module.exports = { recordPayment };
