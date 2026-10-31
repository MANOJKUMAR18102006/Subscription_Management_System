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
    planName: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
      enum: ['Starter Plan', 'Growth Tier', 'Professional Suite', 'Enterprise Pro']
    },
    billingCycle: {
      type: String,
      required: true,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    },
    amount: {
      type: Number,
      required: [true, 'Subscription amount is required'],
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
      enum: ['active', 'past_due', 'canceled', 'trialing', 'expired'],
      default: 'active'
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
subscriptionSchema.index({ status: 1, createdAt: 1 });
subscriptionSchema.index({ nextBillingDate: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;

