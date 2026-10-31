const mongoose = require('mongoose');

const subscriptionLineSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required']
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    variant: {
      type: String,
      default: '',
      trim: true
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      default: 1,
      min: [1, 'Quantity must be at least 1']
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      default: 0,
      min: [0, 'Unit price cannot be negative']
    },
    taxRate: {
      type: Number,
      default: 18,
      min: [0, 'Tax rate cannot be negative']
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: [0, 'Tax amount cannot be negative']
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount percentage cannot be negative'],
      max: [100, 'Discount percentage cannot exceed 100%']
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, 'Discount amount cannot be negative']
    },
    lineTotal: {
      type: Number,
      required: [true, 'Line total is required'],
      default: 0,
      min: [0, 'Line total cannot be negative']
    }
  },
  { _id: true }
);

const subscriptionHistorySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    performedByName: {
      type: String,
      default: 'System'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: {
      type: String,
      default: ''
    }
  },
  { _id: true }
);

const subscriptionSchema = new mongoose.Schema(
  {
    // Requirement 2: Unique Subscription Number (e.g. SUB-2026-0001)
    subscriptionNumber: {
      type: String,
      required: [true, 'Subscription number is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Subscription must belong to a customer']
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan'
    },
    planName: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now
    },
    expiryDate: {
      type: Date
    },
    paymentTerms: {
      type: String,
      enum: ['Immediate', 'Net 15', 'Net 30', 'Net 60', 'Due on Receipt'],
      default: 'Net 30'
    },
    // Requirement 4: Support multiple product lines
    subscriptionLines: {
      type: [subscriptionLineSchema],
      default: []
    },
    // Legacy single product/variant support for backward compatibility
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    selectedVariant: {
      variantName: String,
      optionValue: String,
      additionalPrice: { type: Number, default: 0 }
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, 'Quantity must be at least 1']
    },
    unitPrice: {
      type: Number,
      default: 0,
      min: [0, 'Unit price cannot be negative']
    },
    priceLockedAt: {
      type: Date,
      default: Date.now
    },
    // Requirement 3: Calculated subscription totals
    subtotal: {
      type: Number,
      default: 0,
      min: [0, 'Subtotal cannot be negative']
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: [0, 'Tax amount cannot be negative']
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, 'Discount amount cannot be negative']
    },
    totalAmount: {
      type: Number,
      required: [true, 'Subscription total amount is required'],
      default: 0,
      min: [0, 'Total amount cannot be negative']
    },
    // Legacy amount field kept in sync with totalAmount
    amount: {
      type: Number,
      required: [true, 'Subscription amount is required'],
      default: 0,
      min: [0, 'Amount cannot be negative']
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
    // Requirement 6: Billing Frequency & Next Billing Date
    billingFrequency: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly', 'Yearly', 'daily', 'weekly', 'monthly', 'yearly'],
      default: 'Monthly'
    },
    billingCycle: {
      type: String,
      default: 'monthly'
    },
    nextBillingDate: {
      type: Date,
      required: [true, 'Next billing date is required']
    },
    // Requirement 12: Track last billed date to prevent duplicate subscription billing
    lastBilledDate: {
      type: Date
    },
    // Subscription statuses: Draft, Quotation, Confirmed, Active, Paused, Closed
    status: {
      type: String,
      required: true,
      enum: {
        values: [
          'Draft', 'Quotation', 'Confirmed', 'Active', 'Paused', 'Closed',
          'draft', 'quotation', 'confirmed', 'active', 'paused', 'closed',
          'past_due', 'trialing', 'canceled', 'expired'
        ],
        message: '{VALUE} is not a valid subscription status'
      },
      default: 'Draft'
    },
    // Frozen snapshot of plan terms & settings at signup
    planSnapshot: {
      planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
      name: String,
      price: Number,
      billingFrequency: String,
      minQuantity: Number,
      allowEarlyClosure: Boolean,
      allowPause: Boolean,
      allowRenewal: Boolean,
      currency: String,
      currencySymbol: String,
      features: [String],
      linkedProducts: Array
    },
    // Originating Quotation link (Requirement 1)
    quotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation'
    },
    quotationNumber: {
      type: String,
      trim: true
    },
    // Tracking pause and closure (Requirements 7 & 8)
    pausedAt: {
      type: Date
    },
    resumedAt: {
      type: Date
    },
    closedAt: {
      type: Date
    },
    closureReason: {
      type: String,
      trim: true
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    },
    features: {
      type: [String],
      default: []
    },
    // Requirement 11: Maintain subscription history and activity logs
    history: {
      type: [subscriptionHistorySchema],
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for customer
subscriptionSchema.virtual('customer').get(function () {
  return this.customerId;
});

// Virtual for plan
subscriptionSchema.virtual('plan').get(function () {
  return this.planId;
});

/**
 * Calculate next billing date helper
 */
subscriptionSchema.statics.calculateNextBillingDate = function (fromDate = new Date(), frequency = 'Monthly') {
  const next = new Date(fromDate);
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
 * Recalculate financial totals from lines
 */
subscriptionSchema.methods.recalculateTotals = function () {
  let subtotal = 0;
  let taxTotal = 0;
  let discountTotal = 0;

  if (Array.isArray(this.subscriptionLines) && this.subscriptionLines.length > 0) {
    this.subscriptionLines.forEach((line) => {
      const qty = Number(line.quantity) || 1;
      const unit = Number(line.unitPrice) || 0;
      const discPercent = Number(line.discount) || 0;
      const taxRate = Number(line.taxRate) || 0;

      const baseAmount = qty * unit;
      const lineDisc = baseAmount * (discPercent / 100);
      const lineNet = baseAmount - lineDisc;
      const lineTax = lineNet * (taxRate / 100);
      const lineFinal = lineNet + lineTax;

      line.discountAmount = Number(lineDisc.toFixed(2));
      line.taxAmount = Number(lineTax.toFixed(2));
      line.lineTotal = Number(lineFinal.toFixed(2));

      subtotal += lineNet;
      taxTotal += lineTax;
      discountTotal += lineDisc;
    });

    this.subtotal = Number(subtotal.toFixed(2));
    this.discountAmount = Number(discountTotal.toFixed(2));
    this.taxAmount = Number(taxTotal.toFixed(2));
    this.totalAmount = Number((subtotal + taxTotal).toFixed(2));
    this.amount = this.totalAmount;
  } else {
    // Fallback if no subscription lines (e.g. single plan unit price)
    if (!this.totalAmount && this.amount) {
      this.totalAmount = this.amount;
    }
    if (!this.amount && this.totalAmount) {
      this.amount = this.totalAmount;
    }
  }

  return {
    subtotal: this.subtotal,
    discountAmount: this.discountAmount,
    taxAmount: this.taxAmount,
    totalAmount: this.totalAmount
  };
};

/**
 * Requirement 10: Static method to process automatic expirations
 */
subscriptionSchema.statics.processAutoExpire = async function () {
  const now = new Date();
  const expiredSubscriptions = await this.find({
    expiryDate: { $lte: now },
    status: { $in: ['Active', 'active', 'Paused', 'paused', 'Confirmed', 'confirmed'] }
  });

  const modified = [];
  for (const sub of expiredSubscriptions) {
    sub.status = 'Closed';
    sub.closedAt = now;
    sub.closureReason = 'Auto-expired: Term ended on ' + sub.expiryDate.toLocaleDateString();
    sub.history.push({
      action: 'Expired',
      performedByName: 'System Auto-Expire Job',
      timestamp: now,
      details: `Subscription reached expiry date (${sub.expiryDate.toISOString()}) and automatically transitioned to Closed.`
    });
    await sub.save();
    modified.push(sub);
  }

  return {
    scanned: expiredSubscriptions.length,
    modifiedCount: modified.length,
    modified
  };
};

// Pre-save hook: auto calculate totals and ensure defaults
subscriptionSchema.pre('save', function () {
  // Sync amount & totalAmount
  if (this.subscriptionLines && this.subscriptionLines.length > 0) {
    this.recalculateTotals();
  } else {
    if (this.amount && !this.totalAmount) this.totalAmount = this.amount;
    if (this.totalAmount && !this.amount) this.amount = this.totalAmount;
  }

  // Ensure default expiryDate if not provided (default: 1 year from startDate)
  if (!this.expiryDate && this.startDate) {
    const exp = new Date(this.startDate);
    exp.setFullYear(exp.getFullYear() + 1);
    this.expiryDate = exp;
  }

  // Ensure nextBillingDate if missing
  if (!this.nextBillingDate && this.startDate) {
    this.nextBillingDate = subscriptionSchema.statics.calculateNextBillingDate(
      this.startDate,
      this.billingFrequency
    );
  }
});

// Indexes for faster aggregation and lookup
subscriptionSchema.index({ customerId: 1, status: 1 });
subscriptionSchema.index({ planId: 1, status: 1 });
subscriptionSchema.index({ status: 1, createdAt: 1 });
subscriptionSchema.index({ nextBillingDate: 1 });
subscriptionSchema.index({ expiryDate: 1 });
subscriptionSchema.index({ status: 1, createdAt: -1, customerId: 1, planId: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
