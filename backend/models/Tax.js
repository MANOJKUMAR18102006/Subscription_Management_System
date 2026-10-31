const mongoose = require('mongoose');

const taxSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tax name is required (e.g. GST 18%, VAT 5%)'],
      trim: true,
      maxlength: [100, 'Tax name cannot exceed 100 characters']
    },
    code: {
      type: String,
      required: [true, 'Tax code is required (e.g. GST18, VAT5)'],
      trim: true,
      uppercase: true
    },
    type: {
      type: String,
      enum: {
        values: ['percentage', 'fixed'],
        message: '{VALUE} is not a valid tax type (percentage or fixed)'
      },
      default: 'percentage',
      required: true
    },
    rate: {
      type: Number,
      required: [true, 'Tax rate/amount is required'],
      min: [0, 'Tax rate cannot be negative']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
      required: [true, 'Effective from date is required']
    },
    effectiveUntil: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

taxSchema.index({ code: 1, status: 1 });
taxSchema.index({ effectiveFrom: 1, effectiveUntil: 1, status: 1 });

/**
 * Check if tax rule is effective on a given date
 */
taxSchema.methods.isEffectiveOn = function (date = new Date()) {
  if (this.status !== 'active') return false;
  const d = new Date(date);
  if (this.effectiveFrom && d < new Date(this.effectiveFrom)) return false;
  if (this.effectiveUntil && d > new Date(this.effectiveUntil)) return false;
  return true;
};

/**
 * Calculate tax amount for a base amount and quantity
 */
taxSchema.methods.calculateTax = function (baseAmount = 0, quantity = 1) {
  if (this.type === 'percentage') {
    return Number((Number(baseAmount) * (Number(this.rate) / 100)).toFixed(2));
  }
  // fixed amount per unit
  return Number((Number(this.rate) * Number(quantity || 1)).toFixed(2));
};

const Tax = mongoose.model('Tax', taxSchema);

module.exports = Tax;

