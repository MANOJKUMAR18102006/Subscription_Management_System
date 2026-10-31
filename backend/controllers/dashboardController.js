const mongoose = require('mongoose');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Activity = require('../models/Activity');
const { getDateRange } = require('../utils/dateFilter');

/**
 * @desc    Get Admin Dashboard Statistics & Aggregations
 * @route   GET /api/dashboard/admin
 * @access  Private (Admin only)
 */
exports.getAdminDashboard = async (req, res, next) => {
  try {
    const { period = 'this_month' } = req.query;
    const { startDate, endDate } = getDateRange(period);

    // 1. Total Customers (Overall and created in selected period)
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const periodCustomers = await User.countDocuments({
      role: 'customer',
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // 2. Total Active Subscriptions
    const totalActiveSubscriptions = await Subscription.countDocuments({ status: 'active' });

    // 3. Total Revenue in Date Filter Period (MongoDB Aggregation)
    const revenueAgg = await Payment.aggregate([
      {
        $match: {
          status: 'succeeded',
          paidAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      }
    ]);
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
    const successfulTransactions = revenueAgg[0]?.transactionCount || 0;

    // Lifetime Total Revenue for comparison
    const lifetimeRevenueAgg = await Payment.aggregate([
      { $match: { status: 'succeeded' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const lifetimeRevenue = lifetimeRevenueAgg[0]?.total || 0;

    // 4. Pending Payments (MongoDB Aggregation)
    const pendingPaymentsAgg = await Payment.aggregate([
      {
        $match: {
          status: 'pending',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    const pendingPaymentsTotal = pendingPaymentsAgg[0]?.totalAmount || 0;
    const pendingPaymentsCount = pendingPaymentsAgg[0]?.count || 0;

    // 5. Overdue Invoices (MongoDB Aggregation)
    const overdueInvoicesAgg = await Invoice.aggregate([
      {
        $match: {
          status: 'overdue'
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    const overdueInvoicesTotal = overdueInvoicesAgg[0]?.totalAmount || 0;
    const overdueInvoicesCount = overdueInvoicesAgg[0]?.count || 0;

    // 6 & 7. Monthly Recurring Revenue (MRR) & Annual Recurring Revenue (ARR)
    // Aggregation: sums monthly amount + (yearly amount / 12) for all active subscriptions
    const mrrAgg = await Subscription.aggregate([
      {
        $match: { status: 'active' }
      },
      {
        $group: {
          _id: null,
          mrr: {
            $sum: {
              $cond: [
                { $eq: ['$billingCycle', 'monthly'] },
                '$amount',
                { $divide: ['$amount', 12] }
              ]
            }
          }
        }
      }
    ]);
    const mrr = Math.round((mrrAgg[0]?.mrr || 0) * 100) / 100;
    const arr = Math.round(mrr * 12 * 100) / 100;

    // 8. Recent Subscriptions (Populated with Customer Name & Email)
    const recentSubscriptions = await Subscription.find()
      .populate('customerId', 'name email company')
      .sort({ createdAt: -1 })
      .limit(6);

    // 9. Recent Payments (Populated with Customer details)
    const recentPayments = await Payment.find()
      .populate('customerId', 'name email company')
      .sort({ paidAt: -1 })
      .limit(6);

    // 10. Revenue Overview Chart: Group succeeded payments by month/year (past 6-12 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const revenueChartAgg = await Payment.aggregate([
      {
        $match: {
          status: 'succeeded',
          paidAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paidAt' },
            month: { $month: '$paidAt' }
          },
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1
        }
      }
    ]);

    // Map month numbers to readable labels
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueOverviewChart = revenueChartAgg.map((item) => ({
      name: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      month: item._id.month,
      year: item._id.year,
      revenue: Math.round(item.revenue),
      transactions: item.transactions
    }));

    // 11. Subscription Status Distribution Chart (MongoDB Aggregation)
    const statusDistributionAgg = await Subscription.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$amount' }
        }
      }
    ]);

    const subscriptionStatusDistribution = statusDistributionAgg.map((item) => {
      const label = item._id.charAt(0).toUpperCase() + item._id.slice(1).replace('_', ' ');
      return {
        status: item._id,
        name: label,
        count: item.count,
        totalValue: Math.round(item.totalValue)
      };
    });

    res.status(200).json({
      success: true,
      period,
      dateRange: { startDate, endDate },
      metrics: {
        totalCustomers,
        periodCustomers,
        totalActiveSubscriptions,
        totalRevenue,
        lifetimeRevenue,
        successfulTransactions,
        pendingPayments: {
          count: pendingPaymentsCount,
          total: pendingPaymentsTotal
        },
        overdueInvoices: {
          count: overdueInvoicesCount,
          total: overdueInvoicesTotal
        },
        mrr,
        arr
      },
      recentSubscriptions,
      recentPayments,
      charts: {
        revenueOverview: revenueOverviewChart,
        subscriptionStatusDistribution
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Staff Dashboard Statistics & Operational Queue
 * @route   GET /api/dashboard/staff
 * @access  Private (Staff & Admin)
 */
exports.getStaffDashboard = async (req, res, next) => {
  try {
    const { period = 'this_month' } = req.query;
    const { startDate, endDate } = getDateRange(period);

    // 1. Total Customers
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const newCustomersPeriod = await User.countDocuments({
      role: 'customer',
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // 2. Active Subscriptions
    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });

    // 3. Pending Invoices (Count and Amount via Aggregation)
    const pendingInvoicesAgg = await Invoice.aggregate([
      {
        $match: {
          status: 'pending'
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    const pendingInvoicesTotal = pendingInvoicesAgg[0]?.totalAmount || 0;
    const pendingInvoicesCount = pendingInvoicesAgg[0]?.count || 0;

    // 4. Overdue Invoices (Count and Amount via Aggregation)
    const overdueInvoicesAgg = await Invoice.aggregate([
      {
        $match: {
          status: 'overdue'
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    const overdueInvoicesTotal = overdueInvoicesAgg[0]?.totalAmount || 0;
    const overdueInvoicesCount = overdueInvoicesAgg[0]?.count || 0;

    // 5. Recent Customer Activities
    const recentCustomerActivities = await Activity.find({
      createdAt: { $gte: startDate, $lte: endDate }
    })
      .populate('customerId', 'name email company')
      .sort({ createdAt: -1 })
      .limit(10);

    // Fallback if none in period: get latest 10 activities overall
    const activitiesList = recentCustomerActivities.length > 0
      ? recentCustomerActivities
      : await Activity.find()
          .populate('customerId', 'name email company')
          .sort({ createdAt: -1 })
          .limit(10);

    // Active subscriptions list for staff daily oversight
    const operationalSubscriptions = await Subscription.find({ status: { $in: ['active', 'past_due'] } })
      .populate('customerId', 'name email company')
      .sort({ nextBillingDate: 1 })
      .limit(6);

    res.status(200).json({
      success: true,
      period,
      dateRange: { startDate, endDate },
      metrics: {
        totalCustomers,
        newCustomersPeriod,
        activeSubscriptions,
        pendingInvoices: {
          count: pendingInvoicesCount,
          total: pendingInvoicesTotal
        },
        overdueInvoices: {
          count: overdueInvoicesCount,
          total: overdueInvoicesTotal
        }
      },
      recentCustomerActivities: activitiesList,
      operationalSubscriptions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Customer Personal Dashboard & Billing Portal Data
 * @route   GET /api/dashboard/customer
 * @access  Private (Customer only, or Admin inspecting)
 */
exports.getCustomerDashboard = async (req, res, next) => {
  try {
    const customerId = req.user._id;
    const { period = 'this_month' } = req.query;
    const { startDate, endDate } = getDateRange(period);

    // 1. Customer's Active Subscriptions
    const myActiveSubscriptions = await Subscription.find({
      customerId,
      status: 'active'
    }).sort({ createdAt: -1 });

    const allMySubscriptions = await Subscription.find({
      customerId
    }).sort({ createdAt: -1 });

    // 2. Next Billing Date (Earliest nextBillingDate from active subscriptions)
    const upcomingSubscription = await Subscription.findOne({
      customerId,
      status: 'active',
      nextBillingDate: { $gte: new Date() }
    }).sort({ nextBillingDate: 1 });

    const nextBillingDate = upcomingSubscription ? upcomingSubscription.nextBillingDate : null;

    // 3. Outstanding Invoices (Pending or Overdue)
    const outstandingInvoicesAgg = await Invoice.aggregate([
      {
        $match: {
          customerId,
          status: { $in: ['pending', 'overdue'] }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    const outstandingInvoicesTotal = outstandingInvoicesAgg[0]?.totalAmount || 0;
    const outstandingInvoicesCount = outstandingInvoicesAgg[0]?.count || 0;

    // 4. Total Payments Made by This Customer (Lifetime & Period)
    const totalPaymentsAgg = await Payment.aggregate([
      {
        $match: {
          customerId,
          status: 'succeeded'
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    const totalPaymentsAmount = totalPaymentsAgg[0]?.totalAmount || 0;
    const totalPaymentsCount = totalPaymentsAgg[0]?.count || 0;

    // 5. Recent Invoices and Payment History
    const recentInvoices = await Invoice.find({ customerId })
      .sort({ createdAt: -1 })
      .limit(5);

    const paymentHistory = await Payment.find({ customerId })
      .sort({ paidAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      period,
      metrics: {
        activeSubscriptionsCount: myActiveSubscriptions.length,
        nextBillingDate,
        upcomingPlan: upcomingSubscription?.planName || 'None',
        upcomingAmount: upcomingSubscription?.amount || 0,
        outstandingInvoices: {
          count: outstandingInvoicesCount,
          total: outstandingInvoicesTotal
        },
        totalPayments: {
          count: totalPaymentsCount,
          total: totalPaymentsAmount
        }
      },
      myActiveSubscriptions,
      allSubscriptions: allMySubscriptions,
      recentInvoices,
      paymentHistory
    });
  } catch (error) {
    next(error);
  }
};

