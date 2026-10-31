const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    action: {
      type: String,
      required: true,
      enum: [
        'subscription_created',
        'subscription_renewed',
        'subscription_canceled',
        'invoice_generated',
        'invoice_paid',
        'payment_succeeded',
        'payment_failed',
        'plan_upgraded',
        'payment_method_updated'
      ]
    },
    description: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['billing', 'subscription', 'account', 'security'],
      default: 'billing'
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

activitySchema.index({ customerId: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;

