const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    paymentReference: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    transactionReference: {
      type: String,
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
      ref: 'Invoice',
      required: [true, 'Payment must be recorded against an invoice']
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
    paymentMethod: {
      type: String,
      required: true,
      enum: ['cash', 'bank_transfer', 'upi', 'card', 'other']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      required: true,
      enum: ['completed', 'pending', 'failed', 'refunded'],
      default: 'completed'
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for revenue aggregations
paymentSchema.index({ status: 1, paymentDate: 1, amount: 1 });
paymentSchema.index({ customerId: 1, status: 1 });
paymentSchema.index({ invoiceId: 1, paymentDate: -1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
