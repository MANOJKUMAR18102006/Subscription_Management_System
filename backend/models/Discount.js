const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
    code: { type: String, trim: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['percentage', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR', uppercase: true },
    validFrom: { type: Date },
    validUntil: { type: Date },
    status: { type: String, enum: ['active', 'expired', 'redeemed'], default: 'active' }
  },
  { timestamps: true }
);

discountSchema.index({ customerId: 1, status: 1, validUntil: 1 });

module.exports = mongoose.model('Discount', discountSchema);
