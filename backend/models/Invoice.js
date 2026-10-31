const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Invoice must belong to a customer']
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription'
    },
    amount: {
      type: Number,
      required: [true, 'Invoice amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    amountPaid: {
      type: Number,
      min: 0,
      default: 0
    },
    balanceDue: {
      type: Number,
      min: 0,
      default: function () {
        return this.amount;
      }
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true
    },
    status: {
      type: String,
      required: true,
      enum: ['paid', 'partially_paid', 'pending', 'overdue', 'failed', 'canceled'],
      default: 'pending'
    },
    dueDate: {
      type: Date,
      required: true
    },
    paidAt: {
      type: Date
    },
    billingPeriodStart: {
      type: Date
    },
    billingPeriodEnd: {
      type: Date
    },
    items: [
      {
        description: String,
        amount: Number
      }
    ]
  },
  {
    timestamps: true
  }
);

// Indexes for aggregations
invoiceSchema.index({ customerId: 1, status: 1 });
invoiceSchema.index({ status: 1, dueDate: 1 });
invoiceSchema.index({ createdAt: 1 });
invoiceSchema.index({ status: 1, createdAt: -1, customerId: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
