const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Discount name is required'],
      trim: true,
      maxlength: [100, 'Discount name cannot exceed 100 characters']
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      index: true
    },
    type: {
      type: String,
      enum: {
        values: ['percentage', 'fixed'],
        message: '{VALUE} is not a valid discount type (percentage or fixed)'
      },
      required: [true, 'Discount type is required']
    },
    value: {
      type: Number,
      required: [true, 'Discount value/amount is required'],
      min: [0, 'Discount value cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true
    },
    // Minimum purchase rules
    minPurchaseAmount: {
      type: Number,
      default: 0,
      min: [0, 'Minimum purchase cannot be negative']
    },
    minQuantity: {
      type: Number,
      default: 1,
      min: [1, 'Minimum quantity must be at least 1']
    },
    // Usage limits
    maxUsageCount: {
      type: Number,
      default: null // null indicates unlimited usage
    },
    currentUsageCount: {
      type: Number,
      default: 0,
      min: 0
    },
    // Effective validity dates
    validFrom: {
      type: Date,
      default: Date.now
    },
    validUntil: {
      type: Date,
      default: null
    },
    // Target eligibility
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // null means available to all customers
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null
    },
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      }
    ],
    applicablePlans: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plan'
      }
    ],
    status: {
      type: String,
      enum: ['active', 'expired', 'redeemed', 'disabled'],
      default: 'active'
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

discountSchema.index({ code: 1, status: 1 });
discountSchema.index({ customerId: 1, status: 1 });
discountSchema.index({ validFrom: 1, validUntil: 1, status: 1 });

/**
 * Validate discount eligibility for an order
 */
discountSchema.methods.validateEligibility = function ({
  amount = 0,
  quantity = 1,
  customerId = null,
  date = new Date()
}) {
  if (this.status !== 'active') {
    return { valid: false, reason: `Discount is currently ${this.status}` };
  }

  const d = new Date(date);
  if (this.validFrom && d < new Date(this.validFrom)) {
    return { valid: false, reason: `Discount is not yet active (valid from ${new Date(this.validFrom).toLocaleDateString()})` };
  }
  if (this.validUntil && d > new Date(this.validUntil)) {
    return { valid: false, reason: `Discount expired on ${new Date(this.validUntil).toLocaleDateString()}` };
  }

  if (this.maxUsageCount !== null && this.currentUsageCount >= this.maxUsageCount) {
    return { valid: false, reason: 'Discount usage limit has been reached' };
  }

  if (this.customerId && customerId && this.customerId.toString() !== customerId.toString()) {
    return { valid: false, reason: 'This discount is restricted to another customer account' };
  }

  if (Number(amount) < Number(this.minPurchaseAmount || 0)) {
    return {
      valid: false,
      reason: `Order total ₹${amount} is below the minimum required purchase amount of ₹${this.minPurchaseAmount}`
    };
  }

  if (Number(quantity) < Number(this.minQuantity || 1)) {
    return {
      valid: false,
      reason: `Order quantity (${quantity}) is below the minimum required quantity of ${this.minQuantity}`
    };
  }

  return { valid: true };
};

/**
 * Calculate monetary discount amount
 */
discountSchema.methods.calculateDiscountAmount = function (baseAmount = 0) {
  const base = Number(baseAmount) || 0;
  if (this.type === 'percentage') {
    const calculated = base * (Number(this.value) / 100);
    return Number(calculated.toFixed(2));
  }
  // Fixed discount: cannot exceed base amount
  return Number(Math.min(base, Number(this.value)).toFixed(2));
};

const Discount = mongoose.model('Discount', discountSchema);

module.exports = Discount;
