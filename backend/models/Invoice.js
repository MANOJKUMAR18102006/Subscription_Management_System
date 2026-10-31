const mongoose = require('mongoose');

const invoiceLineSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    name: {
      type: String,
      required: [true, 'Line item name is required'],
      trim: true
    },
    variant: {
      type: String,
      default: '',
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: [1, 'Quantity must be at least 1']
    },
    unitPrice: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Unit price cannot be negative']
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    lineTotal: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    }
  },
  { _id: true }
);

const taxBreakdownSchema = new mongoose.Schema(
  {
    taxId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tax' },
    name: String,
    code: String,
    type: { type: String, default: 'percentage' },
    rate: Number,
    amount: Number
  },
  { _id: false }
);

const invoiceHistorySchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    performedByName: { type: String, default: 'System' },
    timestamp: { type: Date, default: Date.now },
    details: { type: String, default: '' }
  },
  { _id: true }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
      unique: true,
      trim: true,
      uppercase: true
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
    invoiceLines: {
      type: [invoiceLineSchema],
      default: []
    },
    subtotal: {
      type: Number,
      default: 0,
      min: 0
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    taxBreakdown: {
      type: [taxBreakdownSchema],
      default: []
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    discountDetails: {
      discountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Discount' },
      code: String,
      name: String,
      discountType: String,
      value: Number,
      amount: Number
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    // Main amount field kept equal to totalAmount for backward compatibility
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
        return this.amount || this.totalAmount || 0;
      }
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true
    },
    currencySymbol: {
      type: String,
      default: '₹'
    },
    // Full status lifecycle: Draft, Confirmed, Paid, Partially Paid, Overdue, Cancelled
    status: {
      type: String,
      required: true,
      enum: [
        'Draft', 'Confirmed', 'Paid', 'Partially Paid', 'Overdue', 'Cancelled',
        'draft', 'confirmed', 'paid', 'partially_paid', 'pending', 'overdue', 'failed', 'canceled', 'cancelled'
      ],
      default: 'pending'
    },
    dueDate: {
      type: Date,
      required: true
    },
    paidAt: {
      type: Date
    },
    confirmedAt: {
      type: Date
    },
    cancelledAt: {
      type: Date
    },
    cancellationReason: {
      type: String,
      trim: true
    },
    billingFrequency: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly', 'Yearly', 'daily', 'weekly', 'monthly', 'yearly'],
      default: 'Monthly'
    },
    paymentTerms: {
      type: String,
      default: 'Net 30'
    },
    billingPeriodStart: {
      type: Date
    },
    billingPeriodEnd: {
      type: Date
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    termsAndConditions: {
      type: String,
      trim: true,
      default: 'Payment is due as per agreed terms. Late payments may attract statutory interest.'
    },
    // Legacy simple items array for backward compatibility
    items: [
      {
        description: String,
        amount: Number
      }
    ],
    history: {
      type: [invoiceHistorySchema],
      default: []
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for customer
invoiceSchema.virtual('customer').get(function () {
  return this.customerId;
});

// Virtual for subscription
invoiceSchema.virtual('subscription').get(function () {
  return this.subscriptionId;
});

/**
 * Recalculate totals from invoice lines
 */
invoiceSchema.methods.recalculateTotals = function () {
  let subtotal = 0;
  let taxTotal = 0;
  let discTotal = 0;

  if (Array.isArray(this.invoiceLines) && this.invoiceLines.length > 0) {
    this.invoiceLines.forEach((line) => {
      const qty = Number(line.quantity) || 1;
      const unit = Number(line.unitPrice) || 0;
      const discPercent = Number(line.discount) || 0;
      const taxRate = Number(line.taxRate) || 0;

      const base = qty * unit;
      const lineDisc = base * (discPercent / 100);
      const net = base - lineDisc;
      const lineTax = net * (taxRate / 100);

      line.discountAmount = Number(lineDisc.toFixed(2));
      line.taxAmount = Number(lineTax.toFixed(2));
      line.lineTotal = Number((net + lineTax).toFixed(2));

      subtotal += net;
      taxTotal += lineTax;
      discTotal += lineDisc;
    });

    this.subtotal = Number(subtotal.toFixed(2));
    this.taxAmount = Number(taxTotal.toFixed(2));
    this.discountAmount = Number(discTotal.toFixed(2));
    this.totalAmount = Number((subtotal + taxTotal).toFixed(2));
    this.amount = this.totalAmount;
    this.balanceDue = Number(Math.max(0, this.totalAmount - (this.amountPaid || 0)).toFixed(2));
  } else if (this.amount && !this.totalAmount) {
    this.totalAmount = this.amount;
    this.subtotal = this.amount;
  }
};

// Pre-save hook: ensure totalAmount, amount, balanceDue are synchronized
invoiceSchema.pre('save', function () {
  if (this.invoiceLines && this.invoiceLines.length > 0) {
    this.recalculateTotals();
  } else {
    if (this.amount && !this.totalAmount) this.totalAmount = this.amount;
    if (this.totalAmount && !this.amount) this.amount = this.totalAmount;
    if (this.balanceDue === undefined) {
      this.balanceDue = Number(Math.max(0, (this.amount || 0) - (this.amountPaid || 0)).toFixed(2));
    }
  }

  // Populate legacy items if empty
  if ((!this.items || this.items.length === 0) && this.invoiceLines && this.invoiceLines.length > 0) {
    this.items = this.invoiceLines.map((l) => ({
      description: `${l.name}${l.variant ? ` (${l.variant})` : ''} x${l.quantity}`,
      amount: l.lineTotal
    }));
  }
});

// Indexes for aggregations and queries
invoiceSchema.index({ customerId: 1, status: 1 });
invoiceSchema.index({ subscriptionId: 1, status: 1 });
invoiceSchema.index({ status: 1, dueDate: 1 });
invoiceSchema.index({ createdAt: 1 });
invoiceSchema.index({ status: 1, createdAt: -1, customerId: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
