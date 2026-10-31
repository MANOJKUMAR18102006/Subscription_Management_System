const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const Product = require('../models/Product');
const User = require('../models/User');
const Activity = require('../models/Activity');

/**
 * Helper to calculate next billing date from a reference date and frequency
 */
const calculateNextBillingDate = (startDate, frequency = 'Monthly') => {
  const next = new Date(startDate);
  switch (frequency.toLowerCase()) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
  }
  return next;
};

/**
 * @desc    Create a new Subscription using a Plan
 * @route   POST /api/subscriptions
 * @access  Private (Admin, Staff, Customer)
 * 
 * Enforces Requirements:
 * - Req 2: Support minimum quantities
 * - Req 6: Prevent new subscriptions from using expired or unavailable plans
 * - Req 7: Existing subscriptions retain their agreed pricing even when original plan changes
 */
exports.createSubscription = async (req, res, next) => {
  try {
    const {
      planId,
      customerId,
      quantity,
      selectedVariant,
      customStartDate
    } = req.body;

    // 1. Determine customer target (Customers can only subscribe for themselves; Admin/Staff can subscribe for others)
    let targetCustomerId = req.user._id;
    if ((req.user.role === 'admin' || req.user.role === 'staff') && customerId) {
      targetCustomerId = customerId;
    }

    const customer = await User.findById(targetCustomerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // 2. Locate and check the Plan
    if (!planId) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID is required to create a subscription'
      });
    }

    // Check auto close first
    await Plan.processAutoClose();

    const plan = await Plan.findById(planId).populate('linkedProducts.product');
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    // 3. Requirement 6: Prevent new subscriptions from using expired or unavailable plans
    const now = new Date();
    if (plan.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: `Subscription Blocked: Plan '${plan.name}' is currently '${plan.status}' and not open for new subscriptions.`,
        planStatus: plan.status
      });
    }

    if (plan.availableFrom && now < new Date(plan.availableFrom)) {
      return res.status(400).json({
        success: false,
        message: `Subscription Blocked: Plan '${plan.name}' will only be available from ${new Date(plan.availableFrom).toLocaleDateString()}.`,
        availableFrom: plan.availableFrom
      });
    }

    if (plan.availableUntil && now > new Date(plan.availableUntil)) {
      // If auto close was enabled, update plan status
      if (plan.autoClose) {
        plan.status = 'Closed';
        await plan.save();
      }
      return res.status(400).json({
        success: false,
        message: `Subscription Blocked: Plan '${plan.name}' expired on ${new Date(plan.availableUntil).toLocaleDateString()} and is closed for new signups.`,
        availableUntil: plan.availableUntil
      });
    }

    // 4. Requirement 2: Support minimum quantities
    const orderQuantity = quantity !== undefined ? parseInt(quantity, 10) : plan.minQuantity;
    if (isNaN(orderQuantity) || orderQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Subscription quantity must be a positive number'
      });
    }

    if (orderQuantity < plan.minQuantity) {
      return res.status(400).json({
        success: false,
        message: `Minimum Quantity Requirement Not Met: Plan '${plan.name}' requires a minimum quantity of ${plan.minQuantity} (you requested ${orderQuantity}).`,
        minQuantityRequired: plan.minQuantity,
        quantityProvided: orderQuantity
      });
    }

    // 5. Requirement 7: Lock agreed pricing & terms snapshot
    // Calculate agreed total price: unitPrice * quantity
    const unitPrice = plan.price;
    const totalAmount = unitPrice * orderQuantity;

    // Build frozen snapshot of plan
    const planSnapshot = {
      planId: plan._id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      billingFrequency: plan.billingFrequency,
      minQuantity: plan.minQuantity,
      allowEarlyClosure: plan.allowEarlyClosure,
      allowPause: plan.allowPause,
      allowRenewal: plan.allowRenewal,
      currency: plan.currency,
      currencySymbol: plan.currencySymbol,
      features: [...(plan.features || [])],
      linkedProducts: plan.linkedProducts.map(lp => ({
        product: lp.product?._id || lp.product,
        productName: lp.product?.name || 'Linked Product',
        minQuantity: lp.minQuantity,
        isPrimary: lp.isPrimary
      }))
    };

    const startDate = customStartDate ? new Date(customStartDate) : new Date();
    const nextBillingDate = calculateNextBillingDate(startDate, plan.billingFrequency);

    // Primary product link for backward compatibility
    const primaryLinkedProduct = plan.linkedProducts.find(p => p.isPrimary) || plan.linkedProducts[0];
    const primaryProductId = primaryLinkedProduct?.product?._id || primaryLinkedProduct?.product;

    const subscription = await Subscription.create({
      customerId: customer._id,
      productId: primaryProductId,
      selectedVariant: selectedVariant || null,
      planId: plan._id,
      planName: plan.name,
      quantity: orderQuantity,
      unitPrice,
      priceLockedAt: new Date(),
      billingFrequency: plan.billingFrequency,
      billingCycle: plan.billingFrequency.toLowerCase(),
      amount: totalAmount,
      currency: plan.currency || 'INR',
      currencySymbol: plan.currencySymbol || '₹',
      status: 'active',
      planSnapshot,
      startDate,
      nextBillingDate,
      features: plan.features || []
    });

    // Record Activity audit trail
    await Activity.create({
      customerId: customer._id,
      action: 'subscription_created',
      description: `Subscribed to ${plan.name} (${orderQuantity} unit(s) at ${plan.currencySymbol || '₹'}${unitPrice}/${plan.billingFrequency} = ${plan.currencySymbol || '₹'}${totalAmount})`,
      type: 'subscription',
      metadata: {
        subscriptionId: subscription._id,
        planId: plan._id,
        unitPrice,
        quantity: orderQuantity,
        amount: totalAmount
      }
    });

    const populatedSub = await Subscription.findById(subscription._id)
      .populate('customerId', 'name email company')
      .populate('planId', 'name billingFrequency price linkedProducts')
      .populate('productId', 'name productType');

    res.status(201).json({
      success: true,
      message: `Successfully subscribed to plan '${plan.name}' with agreed price locked at ${plan.currencySymbol || '₹'}${totalAmount}/${plan.billingFrequency}`,
      subscription: populatedSub
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all subscriptions with search, filters & pagination
 * @route   GET /api/subscriptions
 * @access  Private (Admin, Staff, Customer sees only own)
 */
exports.getSubscriptions = async (req, res, next) => {
  try {
    const {
      search,
      status,
      billingFrequency,
      planId,
      customerId,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Customer can only see their own subscriptions
    if (req.user.role === 'customer') {
      query.customerId = req.user._id;
    } else if (customerId) {
      query.customerId = customerId;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (billingFrequency && billingFrequency !== 'all') {
      query.billingFrequency = { $regex: new RegExp(`^${billingFrequency}$`, 'i') };
    }

    if (planId && planId !== 'all') {
      query.planId = planId;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { planName: searchRegex },
        { currency: searchRegex }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [subscriptions, totalCount] = await Promise.all([
      Subscription.find(query)
        .populate('customerId', 'name email company phone')
        .populate('planId', 'name billingFrequency price status allowEarlyClosure allowPause allowRenewal')
        .populate('productId', 'name productType salesPrice image')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Subscription.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      totalSubscriptions: totalCount,
      totalPages: Math.ceil(totalCount / limitNum) || 1,
      currentPage: pageNum,
      limit: limitNum,
      subscriptions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single subscription by ID
 * @route   GET /api/subscriptions/:id
 * @access  Private
 */
exports.getSubscriptionById = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('customerId', 'name email company phone')
      .populate('planId')
      .populate('productId');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Role safety check
    if (req.user.role === 'customer' && subscription.customerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this subscription'
      });
    }

    res.status(200).json({
      success: true,
      subscription
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Pause a subscription
 * @route   PATCH /api/subscriptions/:id/pause
 * @access  Private (Admin, Staff, Customer owner)
 * 
 * Requirement 5: Allow pause based on admin settings
 */
exports.pauseSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Authorization
    if (req.user.role === 'customer' && subscription.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (subscription.status === 'paused') {
      return res.status(400).json({
        success: false,
        message: 'Subscription is already paused'
      });
    }

    if (['canceled', 'closed', 'expired'].includes(subscription.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot pause a subscription that is '${subscription.status}'`
      });
    }

    // Requirement 5: Check admin setting on the plan (from snapshot or plan model)
    const allowPause = subscription.planSnapshot?.allowPause !== undefined
      ? subscription.planSnapshot.allowPause
      : true;

    if (!allowPause) {
      return res.status(400).json({
        success: false,
        message: `Action Blocked: Pausing is disabled for plan '${subscription.planName}' per administrator settings.`,
        allowPause: false
      });
    }

    subscription.status = 'paused';
    subscription.pausedAt = new Date();
    await subscription.save();

    await Activity.create({
      customerId: subscription.customerId,
      action: 'payment_failed', // or custom activity
      description: `Subscription to ${subscription.planName} was paused`,
      type: 'subscription',
      metadata: { subscriptionId: subscription._id }
    });

    res.status(200).json({
      success: true,
      message: `Subscription to '${subscription.planName}' has been successfully paused.`,
      subscription
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resume a paused subscription
 * @route   PATCH /api/subscriptions/:id/resume
 * @access  Private (Admin, Staff, Customer owner)
 */
exports.resumeSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    if (req.user.role === 'customer' && subscription.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (subscription.status !== 'paused') {
      return res.status(400).json({
        success: false,
        message: `Subscription is not paused (current status: '${subscription.status}')`
      });
    }

    subscription.status = 'active';
    subscription.resumedAt = new Date();
    await subscription.save();

    await Activity.create({
      customerId: subscription.customerId,
      action: 'subscription_renewed',
      description: `Subscription to ${subscription.planName} was resumed to active status`,
      type: 'subscription',
      metadata: { subscriptionId: subscription._id }
    });

    res.status(200).json({
      success: true,
      message: `Subscription to '${subscription.planName}' has been resumed to active status.`,
      subscription
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Early closure of a subscription
 * @route   PATCH /api/subscriptions/:id/early-close
 * @access  Private (Admin, Staff, Customer owner)
 * 
 * Requirement 5: Allow early closure based on admin settings
 */
exports.earlyCloseSubscription = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    if (req.user.role === 'customer' && subscription.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (['closed', 'canceled', 'expired'].includes(subscription.status)) {
      return res.status(400).json({
        success: false,
        message: `Subscription is already terminated (status: '${subscription.status}')`
      });
    }

    // Requirement 5: Check admin setting on the plan (from snapshot)
    const allowEarlyClosure = subscription.planSnapshot?.allowEarlyClosure !== undefined
      ? subscription.planSnapshot.allowEarlyClosure
      : true;

    if (!allowEarlyClosure) {
      return res.status(400).json({
        success: false,
        message: `Action Blocked: Early closure is prohibited for plan '${subscription.planName}' per contractual terms defined by administrator.`,
        allowEarlyClosure: false
      });
    }

    subscription.status = 'closed';
    subscription.closedAt = new Date();
    subscription.closureReason = reason ? reason.trim() : 'Early closure requested';
    await subscription.save();

    await Activity.create({
      customerId: subscription.customerId,
      action: 'subscription_canceled',
      description: `Subscription to ${subscription.planName} was closed early. Reason: ${subscription.closureReason}`,
      type: 'subscription',
      metadata: { subscriptionId: subscription._id, reason: subscription.closureReason }
    });

    res.status(200).json({
      success: true,
      message: `Subscription to '${subscription.planName}' has been closed early.`,
      subscription
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Renew a subscription
 * @route   POST /api/subscriptions/:id/renew
 * @access  Private (Admin, Staff, Customer owner)
 * 
 * Requirement 5: Allow renewal based on admin settings
 */
exports.renewSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    if (req.user.role === 'customer' && subscription.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Requirement 5: Check admin setting on the plan (from snapshot)
    const allowRenewal = subscription.planSnapshot?.allowRenewal !== undefined
      ? subscription.planSnapshot.allowRenewal
      : true;

    if (!allowRenewal) {
      return res.status(400).json({
        success: false,
        message: `Action Blocked: Renewal is disabled for plan '${subscription.planName}' per administrator settings.`,
        allowRenewal: false
      });
    }

    // Advance nextBillingDate based on locked agreed frequency
    const currentBillingDate = subscription.nextBillingDate && subscription.nextBillingDate > new Date()
      ? subscription.nextBillingDate
      : new Date();

    const newNextBillingDate = calculateNextBillingDate(currentBillingDate, subscription.billingFrequency);

    subscription.nextBillingDate = newNextBillingDate;
    subscription.status = 'active';
    await subscription.save();

    await Activity.create({
      customerId: subscription.customerId,
      action: 'subscription_renewed',
      description: `Subscription to ${subscription.planName} renewed until ${newNextBillingDate.toLocaleDateString()} at agreed locked rate (${subscription.currencySymbol || '₹'}${subscription.amount})`,
      type: 'subscription',
      metadata: {
        subscriptionId: subscription._id,
        newNextBillingDate,
        amount: subscription.amount
      }
    });

    res.status(200).json({
      success: true,
      message: `Subscription to '${subscription.planName}' successfully renewed until ${newNextBillingDate.toLocaleDateString()}.`,
      nextBillingDate: newNextBillingDate,
      subscription
    });
  } catch (error) {
    next(error);
  }
};
