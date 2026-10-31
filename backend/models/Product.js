const mongoose = require('mongoose');

const variantOptionSchema = new mongoose.Schema(
  {
    value: {
      type: String,
      required: [true, 'Option value is required (e.g. Odoo, Standard, Cloud)'],
      trim: true
    },
    additionalPrice: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Additional price cannot be negative']
    },
    sku: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { _id: true }
);

const variantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Variant name is required (e.g. Brand, Edition, Tier)'],
      trim: true
    },
    options: {
      type: [variantOptionSchema],
      default: []
    }
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product Name is required'],
      trim: true,
      maxlength: [150, 'Product name cannot exceed 150 characters']
    },
    productType: {
      type: String,
      required: [true, 'Product Type is required'],
      enum: {
        values: ['Software', 'Service', 'Add-on', 'Subscription Plan', 'Hardware'],
        message: '{VALUE} is not a valid product type'
      },
      default: 'Software'
    },
    salesPrice: {
      type: Number,
      required: [true, 'Sales Price is required'],
      min: [0, 'Sales Price cannot be negative']
    },
    costPrice: {
      type: Number,
      required: [true, 'Cost Price is required'],
      min: [0, 'Cost Price cannot be negative'],
      default: 0
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
    description: {
      type: String,
      trim: true,
      default: ''
    },
    image: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      required: true,
      enum: ['Active', 'Archived', 'Draft', 'Inactive'],
      default: 'Active'
    },
    variants: {
      type: [variantSchema],
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

// Indexes for fast searching and filtering
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ status: 1, productType: 1 });
productSchema.index({ salesPrice: 1 });
productSchema.index({ createdAt: -1 });

// Virtual to calculate profit margin
productSchema.virtual('profitMargin').get(function () {
  if (!this.salesPrice || this.salesPrice === 0) return 0;
  return Math.round(((this.salesPrice - (this.costPrice || 0)) / this.salesPrice) * 100);
});

// Helper method to compute final price given specific variant choices
productSchema.methods.calculateFinalPrice = function (selectedOptions = []) {
  let additionalTotal = 0;
  const appliedOptions = [];

  if (Array.isArray(selectedOptions) && this.variants && this.variants.length > 0) {
    selectedOptions.forEach((selected) => {
      const variant = this.variants.find(
        (v) => v.name.toLowerCase() === (selected.variantName || '').toLowerCase()
      );
      if (variant) {
        const option = variant.options.find(
          (o) => o.value.toLowerCase() === (selected.optionValue || '').toLowerCase()
        );
        if (option) {
          additionalTotal += option.additionalPrice || 0;
          appliedOptions.push({
            variantName: variant.name,
            optionValue: option.value,
            additionalPrice: option.additionalPrice
          });
        }
      }
    });
  }

  const finalPrice = this.salesPrice + additionalTotal;
  return {
    basePrice: this.salesPrice,
    additionalTotal,
    finalPrice,
    appliedOptions,
    currency: this.currency,
    currencySymbol: this.currencySymbol || '₹'
  };
};

// Helper method to list all variant options with computed final prices
productSchema.methods.getComputedPricingMatrix = function () {
  const matrix = [];
  if (!this.variants || this.variants.length === 0) {
    return [
      {
        combinationKey: 'Standard',
        options: [],
        basePrice: this.salesPrice,
        additionalTotal: 0,
        finalPrice: this.salesPrice
      }
    ];
  }

  this.variants.forEach((v) => {
    v.options.forEach((opt) => {
      matrix.push({
        variantName: v.name,
        optionValue: opt.value,
        additionalPrice: opt.additionalPrice,
        basePrice: this.salesPrice,
        finalPrice: this.salesPrice + (opt.additionalPrice || 0),
        currencySymbol: this.currencySymbol || '₹'
      });
    });
  });

  return matrix;
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

