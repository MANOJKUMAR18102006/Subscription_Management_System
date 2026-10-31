const mongoose = require('mongoose');

const paymentAuditSchema = new mongoose.Schema(
  {
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true
    },
    action: {
      type: String,
      enum: ['created', 'updated', 'refunded', 'voided'],
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: Number,
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

paymentAuditSchema.index({ invoiceId: 1, createdAt: -1 });
paymentAuditSchema.index({ paymentId: 1, createdAt: -1 });

module.exports = mongoose.model('PaymentAudit', paymentAuditSchema);
