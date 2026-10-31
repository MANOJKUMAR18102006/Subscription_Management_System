const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Payment must belong to a customer']
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription'
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice'
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true
    },
    status: {
      type: String,
      required: true,
      enum: ['succeeded', 'pending', 'failed', 'refunded'],
      default: 'succeeded'
    },
    paymentMethod: {
      type: String,
      required: true,
      default: 'Credit Card'
    },
    cardLast4: {
      type: String,
      default: '4242'
    },
    paidAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Indexes for revenue aggregations
paymentSchema.index({ status: 1, paidAt: 1, amount: 1 });
paymentSchema.index({ customerId: 1, status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;

