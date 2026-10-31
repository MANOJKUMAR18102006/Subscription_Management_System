const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Plan = require('../models/Plan');

const DATE_FORMATS = {
  daily: '%Y-%m-%d',
  weekly: '%G-W%V',
  monthly: '%Y-%m',
  yearly: '%Y'
};

const parseDate = (value, fallback) => {
  const date = value ? new Date(`${value}T00:00:00.000Z`) : fallback;
  return Number.isNaN(date.getTime()) ? fallback : date;
};

const buildFilters = (query) => {
  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - 30);
  const from = parseDate(query.from, defaultFrom);
  const to = query.to ? parseDate(query.to, now) : now;
  to.setHours(23, 59, 59, 999);

  const subscription = {
    createdAt: { $gte: from, $lte: to }
  };
  const invoice = { createdAt: { $gte: from, $lte: to } };
  const payment = {
    paymentDate: { $gte: from, $lte: to },
    status: 'completed'
  };
  const customerId = query.customerId;
  const planId = query.planId;
  const status = query.status;

  if (customerId && mongoose.isValidObjectId(customerId)) {
    subscription.customerId = new mongoose.Types.ObjectId(customerId);
    invoice.customerId = new mongoose.Types.ObjectId(customerId);
    payment.customerId = new mongoose.Types.ObjectId(customerId);
  }
  if (planId && mongoose.isValidObjectId(planId)) {
    subscription.planId = new mongoose.Types.ObjectId(planId);
    invoice.subscriptionId = { $in: [] };
    payment.subscriptionId = { $in: [] };
  }
  if (status && status !== 'all') subscription.status = status;

  return {
    from,
    to,
    granularity: DATE_FORMATS[query.granularity] ? query.granularity : 'daily',
    subscription,
    invoice,
    payment,
    customerId,
    planId
  };
};

const recurringMonthlyAmount = (amount, frequency) => {
  switch (String(frequency || '').toLowerCase()) {
    case 'daily': return amount * 30;
    case 'weekly': return amount * 52 / 12;
    case 'yearly': return amount / 12;
    default: return amount;
  }
};

const applySubscriptionScope = async (filters) => {
  if (!filters.planId && (!filters.subscription.status || filters.subscription.status === 'all')) return;
  const relatedFilter = {};
  if (filters.subscription.customerId) relatedFilter.customerId = filters.subscription.customerId;
  if (filters.subscription.planId) relatedFilter.planId = filters.subscription.planId;
  if (filters.subscription.status && filters.subscription.status !== 'all') relatedFilter.status = filters.subscription.status;
  const subscriptionIds = await Subscription.distinct('_id', relatedFilter);
  filters.invoice.subscriptionId = { $in: subscriptionIds };
  filters.payment.subscriptionId = { $in: subscriptionIds };
};

const getReports = async (query = {}) => {
  const filters = buildFilters(query);
  const { from, to, granularity, subscription, invoice, payment } = filters;
  const activeSubscriptionFilter = { ...subscription };
  delete activeSubscriptionFilter.createdAt;
  await applySubscriptionScope(filters);
  const [summary, revenue, subscriptionTrends, subscriptionStatuses, invoiceStatuses, paymentMethods, customers, plans] = await Promise.all([
    Promise.all([
      Subscription.countDocuments({ ...activeSubscriptionFilter, status: { $in: ['active', 'trialing', 'past_due', 'paused'] } }),
      User.countDocuments({ role: 'customer', isActive: true }),
      Payment.aggregate([
        { $match: payment },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Invoice.aggregate([
        { $match: { ...invoice, status: { $in: ['pending', 'partially_paid', 'overdue'] } } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$balanceDue', 0] } }, overdue: { $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] } } } }
      ]),
      Subscription.countDocuments({ ...subscription, status: 'active' }),
      Subscription.countDocuments({ ...subscription, status: { $in: ['canceled', 'closed'] } }),
      Subscription.countDocuments({ ...subscription, status: 'active', nextBillingDate: { $gte: from, $lte: to } }),
      Subscription.aggregate([
        { $match: { ...activeSubscriptionFilter, status: { $in: ['active', 'trialing', 'past_due'] } } },
        { $group: { _id: null, amount: { $sum: { $switch: { branches: [
          { case: { $eq: [{ $toLower: '$billingFrequency' }, 'daily'] }, then: { $multiply: ['$amount', 30] } },
          { case: { $eq: [{ $toLower: '$billingFrequency' }, 'weekly'] }, then: { $multiply: ['$amount', 4.3333333333] } },
          { case: { $eq: [{ $toLower: '$billingFrequency' }, 'yearly'] }, then: { $divide: ['$amount', 12] } }
        ], default: '$amount' } } } } }
      ])
    ]),
    Payment.aggregate([
      { $match: payment },
      { $group: { _id: { $dateToString: { format: DATE_FORMATS[granularity], date: '$paymentDate' } }, revenue: { $sum: '$amount' }, transactions: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, name: '$_id', revenue: 1, transactions: 1 } }
    ]),
    Subscription.aggregate([
      { $match: subscription },
      { $group: { _id: { $dateToString: { format: DATE_FORMATS[granularity], date: '$createdAt' } }, newSubscriptions: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, name: '$_id', newSubscriptions: 1 } }
    ]),
    Subscription.aggregate([
      { $match: subscription },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
      { $sort: { count: -1 } }
    ]),
    Invoice.aggregate([
      { $match: invoice },
      { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' }, balanceDue: { $sum: { $ifNull: ['$balanceDue', 0] } } } },
      { $project: { _id: 0, status: '$_id', count: 1, amount: 1, balanceDue: 1 } }
    ]),
    Payment.aggregate([
      { $match: payment },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
      { $sort: { amount: -1 } },
      { $project: { _id: 0, method: '$_id', count: 1, amount: 1 } }
    ]),
    User.find({ role: 'customer', isActive: true }).select('name email').sort({ name: 1 }).lean(),
    Plan.find({ status: 'Active' }).select('_id name').sort({ name: 1 }).lean()
  ]);

  const [active, customerCount, payments, outstanding, renewalCount, canceledCount, mrrData] = summary;
  const mrr = mrrData[0]?.amount || 0;
  const paidInvoices = await Invoice.aggregate([
    { $match: { ...invoice, status: 'paid' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  return {
    filters: { from, to, granularity },
    metrics: {
      activeSubscriptions: active,
      customers: customerCount,
      totalRevenue: payments[0]?.total || 0,
      mrr,
      arr: mrr * 12,
      paymentsReceived: payments[0]?.total || 0,
      invoicedRevenue: paidInvoices[0]?.total || 0,
      outstandingAmount: outstanding[0]?.total || 0,
      overdueInvoices: outstanding[0]?.overdue || 0,
      renewalCount,
      canceledSubscriptions: canceledCount
    },
    charts: { revenue, subscriptionTrends, subscriptionStatuses, invoiceStatuses, paymentMethods },
    options: { customers, plans }
  };
};

const getDetails = async (query = {}) => {
  const filters = buildFilters(query);
  await applySubscriptionScope(filters);
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 25));
  const skip = (page - 1) * limit;
  const [subscriptions, invoices, payments] = await Promise.all([
    Subscription.find(filters.subscription).select('planName customerId status amount billingFrequency startDate nextBillingDate createdAt').populate('customerId', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Invoice.find(filters.invoice).select('invoiceNumber customerId status amount amountPaid balanceDue currency dueDate createdAt').populate('customerId', 'name email').sort({ dueDate: 1 }).skip(skip).limit(limit).lean(),
    Payment.find(filters.payment).select('paymentReference customerId amount currency paymentMethod paymentDate status invoiceId').populate('customerId', 'name email').sort({ paymentDate: -1 }).skip(skip).limit(limit).lean()
  ]);
  return { page, limit, subscriptions, invoices, payments };
};

module.exports = { getReports, getDetails, buildFilters, recurringMonthlyAmount, applySubscriptionScope };
