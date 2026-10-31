const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Subscription must belong to a customer']
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    selectedVariant: {
      variantName: String,
      optionValue: String,
      additionalPrice: { type: Number, default: 0 }
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
    // Requirement 2: Quantity support
    quantity: {
      type: Number,
      default: 1,
      min: [1, 'Quantity must be at least 1']
    },
    // Requirement 7: Agreed unit price locked at signup
    unitPrice: {
      type: Number,
      default: 0,
      min: [0, 'Unit price cannot be negative']
    },
    priceLockedAt: {
      type: Date,
      default: Date.now
    },
    // Billing frequency / cycle
    billingFrequency: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly', 'Yearly', 'daily', 'weekly', 'monthly', 'yearly'],
      default: 'Monthly'
    },
    billingCycle: {
      type: String,
      default: 'monthly'
    },
    amount: {
      type: Number,
      required: [true, 'Subscription amount is required'],
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
    status: {
      type: String,
      required: true,
      enum: ['active', 'past_due', 'canceled', 'trialing', 'expired', 'paused', 'closed'],
      default: 'active'
    },
    // Requirement 5 & 7: Frozen snapshot of the plan terms, pricing & rules at subscription time
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
    // Tracking pause and closure
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
    startDate: {
      type: Date,
      default: Date.now
    },
    nextBillingDate: {
      type: Date,
      required: true
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    },
    features: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster aggregation queries
subscriptionSchema.index({ customerId: 1, status: 1 });
subscriptionSchema.index({ planId: 1, status: 1 });
subscriptionSchema.index({ status: 1, createdAt: 1 });
subscriptionSchema.index({ nextBillingDate: 1 });
subscriptionSchema.index({ status: 1, createdAt: -1, customerId: 1, planId: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;

