const mongoose = require('mongoose');

const quotationProductLineSchema = new mongoose.Schema(
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
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount percentage cannot be negative'],
      max: [100, 'Discount percentage cannot exceed 100%']
    },
    lineTotal: {
      type: Number,
      default: 0
    }
  },
  { _id: true }
);

const quotationPlanLineSchema = new mongoose.Schema(
  {
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: [true, 'Plan reference is required']
    },
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true
    },
    billingFrequency: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly', 'Yearly'],
      default: 'Monthly'
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
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount percentage cannot be negative'],
      max: [100, 'Discount percentage cannot exceed 100%']
    },
    lineTotal: {
      type: Number,
      default: 0
    }
  },
  { _id: true }
);

const quotationHistorySchema = new mongoose.Schema(
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

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: {
      type: String,
      required: [true, 'Quotation number is required'],
      unique: true,
      trim: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer is required']
    },
    quotationTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuotationTemplate'
    },
    products: {
      type: [quotationProductLineSchema],
      default: []
    },
    plans: {
      type: [quotationPlanLineSchema],
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
    discountAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0
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
    validityDuration: {
      type: Number,
      default: 30,
      min: [1, 'Validity duration must be at least 1 day']
    },
    createdDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required']
    },
    paymentTerms: {
      type: String,
      enum: ['Immediate', 'Net 15', 'Net 30', 'Net 60', 'Due on Receipt'],
      default: 'Net 30'
    },
    status: {
      type: String,
      enum: {
        values: ['Draft', 'Quotation', 'Confirmed', 'Active', 'Closed'],
        message: '{VALUE} is not a valid quotation status'
      },
      default: 'Draft'
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription'
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    termsAndConditions: {
      type: String,
      default: '1. Quotation is valid until the specified expiry date.\n2. Payment terms as agreed above.\n3. Taxes applicable as per statutory rates.'
    },
    history: {
      type: [quotationHistorySchema],
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

// Virtual for backwards compatibility with any existing queries referencing customerId
quotationSchema.virtual('customerId').get(function () {
  return this.customer;
});

// Helper calculation method
quotationSchema.methods.recalculateTotals = function () {
  let subtotal = 0;
  let taxTotal = 0;
  let totalDiscount = 0;

  if (Array.isArray(this.products)) {
    this.products.forEach((line) => {
      const base = (line.quantity || 1) * (line.unitPrice || 0);
      const discPercent = line.discount || 0;
      const lineDisc = base * (discPercent / 100);
      const lineNet = base - lineDisc;
      line.lineTotal = Number(lineNet.toFixed(2));

      const tax = lineNet * ((line.taxRate || 0) / 100);
      subtotal += lineNet;
      taxTotal += tax;
      totalDiscount += lineDisc;
    });
  }

  if (Array.isArray(this.plans)) {
    this.plans.forEach((line) => {
      const base = (line.quantity || 1) * (line.unitPrice || 0);
      const discPercent = line.discount || 0;
      const lineDisc = base * (discPercent / 100);
      const lineNet = base - lineDisc;
      line.lineTotal = Number(lineNet.toFixed(2));

      const tax = lineNet * ((line.taxRate || 0) / 100);
      subtotal += lineNet;
      taxTotal += tax;
      totalDiscount += lineDisc;
    });
  }

  this.subtotal = Number(subtotal.toFixed(2));
  this.taxAmount = Number(taxTotal.toFixed(2));
  this.discountAmount = Number(totalDiscount.toFixed(2));
  this.totalAmount = Number((subtotal + taxTotal).toFixed(2));

  // Compute expiry date if createdDate and validityDuration are present
  if (this.createdDate && this.validityDuration) {
    const cDate = new Date(this.createdDate);
    this.expiryDate = new Date(cDate.getTime() + this.validityDuration * 24 * 60 * 60 * 1000);
  }
};

// Auto recalculate on pre-save
quotationSchema.pre('validate', function () {
  this.recalculateTotals();
});

// Indexes
quotationSchema.index({ quotationNumber: 1 }, { unique: true });
quotationSchema.index({ customer: 1, status: 1 });
quotationSchema.index({ status: 1, expiryDate: 1 });
quotationSchema.index({ createdDate: -1 });

module.exports = mongoose.model('Quotation', quotationSchema);
