const mongoose = require('mongoose');

const templateProductSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required']
    },
    defaultQuantity: {
      type: Number,
      default: 1,
      min: [1, 'Quantity must be at least 1']
    },
    unitPrice: {
      type: Number,
      default: 0,
      min: [0, 'Unit price cannot be negative']
    },
    defaultTaxRate: {
      type: Number,
      default: 18,
      min: [0, 'Tax rate cannot be negative']
    },
    defaultDiscount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative']
    }
  },
  { _id: true }
);

const templatePlanSchema = new mongoose.Schema(
  {
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: [true, 'Plan reference is required']
    },
    defaultQuantity: {
      type: Number,
      default: 1,
      min: [1, 'Quantity must be at least 1']
    },
    unitPrice: {
      type: Number,
      default: 0,
      min: [0, 'Unit price cannot be negative']
    },
    billingFrequency: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly', 'Yearly'],
      default: 'Monthly'
    },
    defaultTaxRate: {
      type: Number,
      default: 18,
      min: [0, 'Tax rate cannot be negative']
    },
    defaultDiscount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative']
    }
  },
  { _id: true }
);

const quotationTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Template Name is required'],
      trim: true,
      maxlength: [120, 'Template Name cannot exceed 120 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    selectedProducts: {
      type: [templateProductSchema],
      default: []
    },
    selectedPlans: {
      type: [templatePlanSchema],
      default: []
    },
    defaultQuantities: {
      type: Number,
      default: 1,
      min: [1, 'Default quantity must be at least 1']
    },
    defaultTaxes: {
      type: Number,
      default: 18,
      min: [0, 'Default tax percentage cannot be negative']
    },
    validityDuration: {
      type: Number,
      required: [true, 'Validity duration in days is required'],
      default: 30,
      min: [1, 'Validity duration must be at least 1 day']
    },
    paymentTerms: {
      type: String,
      enum: ['Immediate', 'Net 15', 'Net 30', 'Net 60', 'Due on Receipt'],
      default: 'Net 30'
    },
    termsAndConditions: {
      type: String,
      default: '1. Quotation is valid until the specified expiry date.\n2. Payment terms as agreed above.\n3. Taxes applicable as per statutory rates.'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

quotationTemplateSchema.index({ name: 1, isActive: 1 });

module.exports = mongoose.model('QuotationTemplate', quotationTemplateSchema);
