const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: { type: String, required: true, unique: true, trim: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
    status: {
      type: String,
      enum: ['draft', 'sent', 'accepted', 'expired', 'rejected'],
      default: 'sent'
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR', uppercase: true },
    validUntil: { type: Date },
    items: [{ description: String, amount: { type: Number, min: 0 } }]
  },
  { timestamps: true }
);

quotationSchema.index({ customerId: 1, createdAt: -1 });

module.exports = mongoose.model('Quotation', quotationSchema);
