const Plan = require('../models/Plan');
const Product = require('../models/Product');
const Subscription = require('../models/Subscription');

/**
 * @desc    Create a new Subscription Plan
 * @route   POST /api/plans
 * @access  Private (Admin only)
 */
exports.createPlan = async (req, res, next) => {
  try {
    const {
      name,
      description,
      linkedProducts,
      billingFrequency,
      price,
      currency,
      currencySymbol,
      minQuantity,
      availableFrom,
      availableUntil,
      autoClose,
      allowEarlyClosure,
      allowPause,
      allowRenewal,
      status,
      features
    } = req.body;

    // 1. Basic validation
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Plan Name is required'
      });
    }

    if (price === undefined || price === null || price < 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid price (>= 0) is required'
      });
    }

    // 2. Billing frequency validation
    const validFrequencies = ['Daily', 'Weekly', 'Monthly', 'Yearly'];
    if (!billingFrequency || !validFrequencies.includes(billingFrequency)) {
      return res.status(400).json({
        success: false,
        message: `Billing frequency must be one of: ${validFrequencies.join(', ')}`
      });
    }

    // 3. Minimum quantity validation (Requirement 2)
    const parsedMinQty = parseInt(minQuantity, 10);
    if (isNaN(parsedMinQty) || parsedMinQty < 1) {
      return res.status(400).json({
        success: false,
        message: 'Minimum quantity must be an integer of at least 1'
      });
    }

    // 4. Validate availability dates (Requirement 3)
    const startDate = availableFrom ? new Date(availableFrom) : new Date();
    let endDate = null;
    if (availableUntil && availableUntil !== '') {
      endDate = new Date(availableUntil);
      if (isNaN(endDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Available Until date format'
        });
      }
      if (endDate < startDate) {
        return res.status(400).json({
          success: false,
          message: 'Available Until Date must be on or after Available From Date'
        });
      }
    }

    // 5. Validate linked products (Requirement 1: Allow linking one or more products)
    if (!Array.isArray(linkedProducts) || linkedProducts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Plan must be linked to at least one product'
      });
    }

    // Normalize and verify each product exists in DB
    const processedLinkedProducts = [];
    for (let i = 0; i < linkedProducts.length; i++) {
      const item = linkedProducts[i];
      const prodId = typeof item === 'string' ? item : item.product || item._id;
      if (!prodId) continue;

      const productExists = await Product.findById(prodId);
      if (!productExists) {
        return res.status(400).json({
          success: false,
          message: `Linked product with ID '${prodId}' was not found in the database`
        });
      }

      processedLinkedProducts.push({
        product: productExists._id,
        minQuantity: Math.max(1, parseInt(item.minQuantity, 10) || 1),
        isPrimary: Boolean(item.isPrimary || i === 0)
      });
    }

    if (processedLinkedProducts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one valid product must be linked to this plan'
      });
    }

    // Check duplicate plan name
    const existingPlan = await Plan.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: `A subscription plan with the name '${name.trim()}' already exists`
      });
    }

    // 6. Create the Plan
    const plan = await Plan.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      linkedProducts: processedLinkedProducts,
      billingFrequency,
      price: Number(price),
      currency: currency || 'INR',
      currencySymbol: currencySymbol || '₹',
      minQuantity: parsedMinQty,
      availableFrom: startDate,
      availableUntil: endDate,
      autoClose: Boolean(autoClose),
      allowEarlyClosure: allowEarlyClosure !== undefined ? Boolean(allowEarlyClosure) : true,
      allowPause: allowPause !== undefined ? Boolean(allowPause) : true,
      allowRenewal: allowRenewal !== undefined ? Boolean(allowRenewal) : true,
      status: status || 'Active',
      features: Array.isArray(features) ? features.filter(f => f && f.trim() !== '').map(f => f.trim()) : [],
      createdBy: req.user._id
    });

    const populatedPlan = await Plan.findById(plan._id).populate('linkedProducts.product', 'name productType salesPrice image status');

    res.status(201).json({
      success: true,
      message: `Subscription Plan '${plan.name}' created successfully`,
      plan: populatedPlan
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all subscription plans with search, filters & pagination
 * @route   GET /api/plans
 * @access  Private (Admin, Staff, Authenticated)
 */
exports.getPlans = async (req, res, next) => {
  try {
    // Requirement 4: Process auto close on expired plans prior to query
    await Plan.processAutoClose();

    const {
      search,
      billingFrequency,
      status,
      productId,
      minPrice,
      maxPrice,
      availability,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // 1. Status Filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // 2. Billing Frequency Filter
    if (billingFrequency && billingFrequency !== 'all') {
      query.billingFrequency = billingFrequency;
    }

    // 3. Linked Product Filter
    if (productId && productId !== 'all') {
      query['linkedProducts.product'] = productId;
    }

    // 4. Price Range Filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined && minPrice !== '') query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined && maxPrice !== '') query.price.$lte = Number(maxPrice);
    }

    // 5. Availability Filter
    const now = new Date();
    if (availability === 'available') {
      query.status = 'Active';
      query.availableFrom = { $lte: now };
      query.$or = [
        { availableUntil: null },
        { availableUntil: { $gte: now } }
      ];
    } else if (availability === 'upcoming') {
      query.availableFrom = { $gt: now };
    } else if (availability === 'expired') {
      query.availableUntil = { $ne: null, $lt: now };
    }

    // 6. Search Filter (by plan name, description, or linked product)
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      // Find products matching the search query to include plans that link them
      const matchingProducts = await Product.find({ name: searchRegex }).select('_id');
      const matchingProductIds = matchingProducts.map(p => p._id);

      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { 'linkedProducts.product': { $in: matchingProductIds } }
      ];
    }

    // Pagination calculations
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [plans, totalCount] = await Promise.all([
      Plan.find(query)
        .populate('linkedProducts.product', 'name productType salesPrice image status variants')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean({ virtuals: true }),
      Plan.countDocuments(query)
    ]);

    // Compute active subscription counts for each plan
    const planIds = plans.map(p => p._id);
    const activeSubCounts = await Subscription.aggregate([
      {
        $match: {
          planId: { $in: planIds },
          status: { $in: ['active', 'trialing', 'past_due', 'paused'] }
        }
      },
      {
        $group: {
          _id: '$planId',
          count: { $sum: 1 }
        }
      }
    ]);

    const activeSubsMap = {};
    activeSubCounts.forEach(item => {
      activeSubsMap[item._id.toString()] = item.count;
    });

    const enrichedPlans = plans.map(plan => {
      // Evaluate availability state
      let availabilityState = 'active';
      if (plan.status !== 'Active') {
        availabilityState = plan.status.toLowerCase();
      } else if (plan.availableFrom && now < new Date(plan.availableFrom)) {
        availabilityState = 'scheduled';
      } else if (plan.availableUntil && now > new Date(plan.availableUntil)) {
        availabilityState = 'expired';
      }

      return {
        ...plan,
        activeSubscriptionsCount: activeSubsMap[plan._id.toString()] || 0,
        availabilityState
      };
    });

    res.status(200).json({
      success: true,
      count: enrichedPlans.length,
      totalPlans: totalCount,
      totalPages: Math.ceil(totalCount / limitNum) || 1,
      currentPage: pageNum,
      limit: limitNum,
      plans: enrichedPlans
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Plan Summary Statistics
 * @route   GET /api/plans/stats/summary
 * @access  Private (Admin & Staff)
 */
exports.getPlanSummaryStats = async (req, res, next) => {
  try {
    // Process auto-close first
    await Plan.processAutoClose();
    const now = new Date();

    const [
      totalPlans,
      activePlans,
      draftPlans,
      closedPlans,
      frequencyBreakdown,
      avgPriceAgg,
      totalSubsUsingPlans,
      autoCloseEnabledCount
    ] = await Promise.all([
      Plan.countDocuments({ status: { $ne: 'Archived' } }),
      Plan.countDocuments({ status: 'Active' }),
      Plan.countDocuments({ status: 'Draft' }),
      Plan.countDocuments({ status: 'Closed' }),
      Plan.aggregate([
        { $match: { status: { $ne: 'Archived' } } },
        { $group: { _id: '$billingFrequency', count: { $sum: 1 } } }
      ]),
      Plan.aggregate([
        { $match: { status: { $ne: 'Archived' } } },
        { $group: { _id: null, avgPrice: { $avg: '$price' } } }
      ]),
      Subscription.countDocuments({
        planId: { $ne: null },
        status: { $in: ['active', 'trialing', 'past_due', 'paused'] }
      }),
      Plan.countDocuments({ autoClose: true })
    ]);

    const frequencyMap = { Daily: 0, Weekly: 0, Monthly: 0, Yearly: 0 };
    frequencyBreakdown.forEach(item => {
      if (frequencyMap[item._id] !== undefined) {
        frequencyMap[item._id] = item.count;
      }
    });

    const averagePrice = avgPriceAgg[0]?.avgPrice ? Math.round(avgPriceAgg[0].avgPrice * 100) / 100 : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalPlans,
        activePlans,
        draftPlans,
        closedPlans,
        frequencyMap,
        averagePrice,
        totalSubsUsingPlans,
        autoCloseEnabledCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single plan by ID
 * @route   GET /api/plans/:id
 * @access  Private
 */
exports.getPlanById = async (req, res, next) => {
  try {
    await Plan.processAutoClose();

    const plan = await Plan.findById(req.params.id)
      .populate('linkedProducts.product', 'name productType salesPrice costPrice image status variants')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    const activeSubscriptionsCount = await Subscription.countDocuments({
      planId: plan._id,
      status: { $in: ['active', 'trialing', 'past_due', 'paused'] }
    });

    // Check availability
    const availabilityCheck = plan.checkAvailability();

    res.status(200).json({
      success: true,
      plan,
      activeSubscriptionsCount,
      availabilityCheck
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing subscription plan
 * @route   PUT /api/plans/:id
 * @access  Private (Admin only)
 * 
 * Requirement 7: Existing subscriptions retain their agreed pricing even when the original plan changes.
 */
exports.updatePlan = async (req, res, next) => {
  try {
    const {
      name,
      description,
      linkedProducts,
      billingFrequency,
      price,
      currency,
      currencySymbol,
      minQuantity,
      availableFrom,
      availableUntil,
      autoClose,
      allowEarlyClosure,
      allowPause,
      allowRenewal,
      status,
      features
    } = req.body;

    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    // Name check if changed
    if (name && name.trim() !== plan.name) {
      const duplicate = await Plan.findOne({
        _id: { $ne: plan._id },
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Another plan with the name '${name.trim()}' already exists`
        });
      }
      plan.name = name.trim();
    }

    if (description !== undefined) plan.description = description.trim();

    // Billing frequency
    if (billingFrequency !== undefined) {
      const validFrequencies = ['Daily', 'Weekly', 'Monthly', 'Yearly'];
      if (!validFrequencies.includes(billingFrequency)) {
        return res.status(400).json({
          success: false,
          message: `Billing frequency must be one of: ${validFrequencies.join(', ')}`
        });
      }
      plan.billingFrequency = billingFrequency;
    }

    // Price
    if (price !== undefined) {
      if (Number(price) < 0) {
        return res.status(400).json({
          success: false,
          message: 'Price cannot be negative'
        });
      }
      plan.price = Number(price);
    }

    if (currency !== undefined) plan.currency = currency;
    if (currencySymbol !== undefined) plan.currencySymbol = currencySymbol;

    // Min Quantity (Requirement 2)
    if (minQuantity !== undefined) {
      const parsedMin = parseInt(minQuantity, 10);
      if (isNaN(parsedMin) || parsedMin < 1) {
        return res.status(400).json({
          success: false,
          message: 'Minimum quantity must be at least 1'
        });
      }
      plan.minQuantity = parsedMin;
    }

    // Dates validation (Requirement 3)
    let newStart = plan.availableFrom;
    if (availableFrom !== undefined) {
      newStart = new Date(availableFrom);
      plan.availableFrom = newStart;
    }

    if (availableUntil !== undefined) {
      if (availableUntil === null || availableUntil === '') {
        plan.availableUntil = null;
      } else {
        const newEnd = new Date(availableUntil);
        if (newEnd < newStart) {
          return res.status(400).json({
            success: false,
            message: 'Available Until Date must be on or after Available From Date'
          });
        }
        plan.availableUntil = newEnd;
      }
    }

    // Admin settings toggles (Requirements 4, 5)
    if (autoClose !== undefined) plan.autoClose = Boolean(autoClose);
    if (allowEarlyClosure !== undefined) plan.allowEarlyClosure = Boolean(allowEarlyClosure);
    if (allowPause !== undefined) plan.allowPause = Boolean(allowPause);
    if (allowRenewal !== undefined) plan.allowRenewal = Boolean(allowRenewal);
    if (status !== undefined) plan.status = status;
    if (Array.isArray(features)) {
      plan.features = features.filter(f => f && f.trim() !== '').map(f => f.trim());
    }

    // Linked products update (Requirement 1)
    if (Array.isArray(linkedProducts) && linkedProducts.length > 0) {
      const processed = [];
      for (let i = 0; i < linkedProducts.length; i++) {
        const item = linkedProducts[i];
        const prodId = typeof item === 'string' ? item : item.product || item._id;
        if (!prodId) continue;

        const prod = await Product.findById(prodId);
        if (prod) {
          processed.push({
            product: prod._id,
            minQuantity: Math.max(1, parseInt(item.minQuantity, 10) || 1),
            isPrimary: Boolean(item.isPrimary || i === 0)
          });
        }
      }
      if (processed.length > 0) {
        plan.linkedProducts = processed;
      }
    }

    plan.updatedBy = req.user._id;
    await plan.save();

    const populatedPlan = await Plan.findById(plan._id).populate('linkedProducts.product', 'name productType salesPrice image status');

    res.status(200).json({
      success: true,
      message: `Plan '${plan.name}' updated successfully. Note: Existing subscriptions retain their agreed locked pricing.`,
      plan: populatedPlan
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a plan (Safely guarded against active subscriptions)
 * @route   DELETE /api/plans/:id
 * @access  Private (Admin only)
 */
exports.deletePlan = async (req, res, next) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    // Guard: Prevent deletion if any active subscriptions exist for this plan
    const activeSubsCount = await Subscription.countDocuments({
      planId: plan._id,
      status: { $in: ['active', 'trialing', 'past_due', 'paused'] }
    });

    if (activeSubsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Deletion Blocked: '${plan.name}' is currently used in ${activeSubsCount} active subscription contract(s). To protect existing customer contracts, this plan cannot be deleted. You can safely close or archive it instead.`,
        activeSubscriptionsCount: activeSubsCount,
        canArchive: true,
        planId: plan._id
      });
    }

    await Plan.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: `Subscription plan '${plan.name}' has been permanently deleted`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Safely archive a plan
 * @route   PATCH /api/plans/:id/archive
 * @access  Private (Admin only)
 */
exports.archivePlan = async (req, res, next) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    plan.status = 'Archived';
    plan.updatedBy = req.user._id;
    await plan.save();

    res.status(200).json({
      success: true,
      message: `Plan '${plan.name}' archived successfully`,
      plan
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Quickly toggle plan status
 * @route   PATCH /api/plans/:id/status
 * @access  Private (Admin only)
 */
exports.togglePlanStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Active', 'Draft', 'Inactive', 'Closed', 'Archived'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    plan.status = status;
    plan.updatedBy = req.user._id;
    await plan.save();

    res.status(200).json({
      success: true,
      message: `Plan '${plan.name}' status set to '${status}'`,
      plan
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Trigger auto-close scan for expired plans
 * @route   POST /api/plans/check-auto-close
 * @access  Private (Admin & Staff)
 */
exports.triggerAutoCloseCheck = async (req, res, next) => {
  try {
    const result = await Plan.processAutoClose();
    res.status(200).json({
      success: true,
      message: `Auto-close check executed. Plans modified: ${result.modifiedCount}`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    next(error);
  }
};
