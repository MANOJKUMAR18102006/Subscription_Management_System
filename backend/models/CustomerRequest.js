const mongoose = require('mongoose');

const customerRequestSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', required: true },
    type: { type: String, enum: ['renewal', 'pause', 'cancellation'], required: true },
    reason: { type: String, trim: true, maxlength: 1000 },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date }
  },
  { timestamps: true }
);

customerRequestSchema.index({ customerId: 1, createdAt: -1 });
customerRequestSchema.index({ subscriptionId: 1, type: 1, status: 1 });

module.exports = mongoose.model('CustomerRequest', customerRequestSchema);
