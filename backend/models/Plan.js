const mongoose = require('mongoose');

const linkedProductSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required']
    },
    minQuantity: {
      type: Number,
      default: 1,
      min: [1, 'Linked product minimum quantity must be at least 1']
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  },
  { _id: true }
);

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan Name is required'],
      trim: true,
      maxlength: [120, 'Plan Name cannot exceed 120 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    // Requirement 1: Allow linking one or more products to plans
    linkedProducts: {
      type: [linkedProductSchema],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length > 0;
        },
        message: 'A plan must be linked to at least one product'
      }
    },
    // Billing frequencies: Daily, Weekly, Monthly, Yearly
    billingFrequency: {
      type: String,
      required: [true, 'Billing Frequency is required'],
      enum: {
        values: ['Daily', 'Weekly', 'Monthly', 'Yearly'],
        message: '{VALUE} is not a valid billing frequency (Daily, Weekly, Monthly, Yearly)'
      },
      default: 'Monthly'
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
      uppercase: true
    },
    currencySymbol: {
      type: String,
      default: '₹'
    },
    // Requirement 2: Support minimum quantities
    minQuantity: {
      type: Number,
      required: [true, 'Minimum Quantity is required'],
      default: 1,
      min: [1, 'Minimum Quantity must be at least 1']
    },
    // Requirement 3: Plan availability dates
    availableFrom: {
      type: Date,
      required: [true, 'Available From Date is required'],
      default: Date.now
    },
    availableUntil: {
      type: Date,
      default: null // null indicates perpetual availability unless manually closed
    },
    // Requirement 4: Auto Close setting
    autoClose: {
      type: Boolean,
      default: false
    },
    // Requirement 5: Settings for early closure, pause and renewal
    allowEarlyClosure: {
      type: Boolean,
      default: true
    },
    allowPause: {
      type: Boolean,
      default: true
    },
    allowRenewal: {
      type: Boolean,
      default: true
    },
    // Plan Status
    status: {
      type: String,
      required: true,
      enum: {
        values: ['Active', 'Draft', 'Inactive', 'Closed', 'Archived'],
        message: '{VALUE} is not a valid plan status'
      },
      default: 'Active'
    },
    features: {
      type: [String],
      default: []
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
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

// Requirement 3: Validate plan availability dates
planSchema.pre('validate', function () {
  if (this.availableFrom && this.availableUntil) {
    if (new Date(this.availableUntil) < new Date(this.availableFrom)) {
      this.invalidate('availableUntil', 'Available Until Date must be on or after Available From Date');
    }
  }
});

// Indexes for fast searching, filtering, and availability queries
planSchema.index({ name: 'text', description: 'text' });
planSchema.index({ status: 1, billingFrequency: 1 });
planSchema.index({ price: 1 });
planSchema.index({ availableFrom: 1, availableUntil: 1 });
planSchema.index({ 'linkedProducts.product': 1 });

/**
 * Check if the plan is currently available for subscription
 * @param {Date} [atDate=new Date()]
 * @returns {{ available: boolean, reason?: string, shouldAutoClose?: boolean }}
 */
planSchema.methods.checkAvailability = function (atDate = new Date()) {
  const target = new Date(atDate);

  if (this.status !== 'Active') {
    return {
      available: false,
      reason: `Plan is currently '${this.status}' and not open for new subscriptions`
    };
  }

  if (this.availableFrom && target < new Date(this.availableFrom)) {
    return {
      available: false,
      reason: `Plan is not yet available. Open from ${new Date(this.availableFrom).toLocaleDateString()}`
    };
  }

  if (this.availableUntil && target > new Date(this.availableUntil)) {
    return {
      available: false,
      shouldAutoClose: Boolean(this.autoClose),
      reason: `Plan availability ended on ${new Date(this.availableUntil).toLocaleDateString()}`
    };
  }

  return { available: true };
};

/**
 * Requirement 4: Automatically close plans when their availability ends if Auto Close is enabled.
 * Scans and updates all expired active plans with autoClose=true
 */
planSchema.statics.processAutoClose = async function () {
  const now = new Date();
  const result = await this.updateMany(
    {
      status: 'Active',
      autoClose: true,
      availableUntil: { $ne: null, $lt: now }
    },
    {
      $set: { status: 'Closed' }
    }
  );
  return result;
};

const Plan = mongoose.model('Plan', planSchema);

module.exports = Plan;
