const Discount = require('../models/Discount');

/**
 * @desc    Get all discounts with search and filter support
 * @route   GET /api/discounts
 * @access  Private
 */
exports.getDiscounts = async (req, res, next) => {
  try {
    const { status, type, search, customerId } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }
    if (type && type !== 'all') {
      filter.type = type;
    }
    if (customerId) {
      filter.$or = [{ customerId: null }, { customerId }];
    } else if (req.user.role === 'customer') {
      filter.$or = [{ customerId: null }, { customerId: req.user._id }];
    }

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: regex }, { code: regex }, { description: regex }];
    }

    const discounts = await Discount.find(filter)
      .populate('customerId', 'name email company')
      .populate('applicableProducts', 'name salesPrice')
      .populate('applicablePlans', 'name price')
      .sort({ createdAt: -1 });

    const totalCount = await Discount.countDocuments(filter);
    const activeCount = await Discount.countDocuments({ status: 'active' });
    const percentageCount = await Discount.countDocuments({ type: 'percentage', status: 'active' });
    const fixedCount = await Discount.countDocuments({ type: 'fixed', status: 'active' });

    res.status(200).json({
      success: true,
      count: discounts.length,
      totalCount,
      stats: {
        total: totalCount,
        active: activeCount,
        percentage: percentageCount,
        fixed: fixedCount
      },
      discounts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single discount by ID
 * @route   GET /api/discounts/:id
 * @access  Private
 */
exports.getDiscountById = async (req, res, next) => {
  try {
    const discount = await Discount.findById(req.params.id)
      .populate('customerId', 'name email company')
      .populate('applicableProducts', 'name salesPrice')
      .populate('applicablePlans', 'name price');

    if (!discount) {
      return res.status(404).json({ success: false, message: 'Discount not found' });
    }

    res.status(200).json({ success: true, discount });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new discount rule or promotional code
 * @route   POST /api/discounts
 * @access  Private (Admin, Staff)
 */
exports.createDiscount = async (req, res, next) => {
  try {
    const {
      name,
      code,
      type,
      value,
      currency = 'INR',
      minPurchaseAmount = 0,
      minQuantity = 1,
      maxUsageCount = null,
      validFrom,
      validUntil,
      customerId = null,
      applicableProducts = [],
      applicablePlans = [],
      description = '',
      status = 'active'
    } = req.body;

    if (!name || !type || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, discount type (percentage/fixed), and discount value are required'
      });
    }

    if (type === 'percentage' && (Number(value) <= 0 || Number(value) > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Percentage discount must be between 1% and 100%'
      });
    }

    if (type === 'fixed' && Number(value) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Fixed discount amount must be greater than zero'
      });
    }

    let normalizedCode = code ? code.trim().toUpperCase() : undefined;
    if (normalizedCode) {
      const existing = await Discount.findOne({ code: normalizedCode });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Discount code '${normalizedCode}' already exists.`
        });
      }
    }

    if (validFrom && validUntil && new Date(validUntil) < new Date(validFrom)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be on or after start date'
      });
    }

    const discount = await Discount.create({
      name: name.trim(),
      code: normalizedCode,
      type,
      value: Number(value),
      currency,
      minPurchaseAmount: Number(minPurchaseAmount) || 0,
      minQuantity: Number(minQuantity) || 1,
      maxUsageCount: maxUsageCount ? Number(maxUsageCount) : null,
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validUntil: validUntil ? new Date(validUntil) : null,
      customerId: customerId || null,
      applicableProducts,
      applicablePlans,
      description,
      status,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: `Discount '${discount.name}' created successfully.`,
      discount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing discount
 * @route   PUT /api/discounts/:id
 * @access  Private (Admin, Staff)
 */
exports.updateDiscount = async (req, res, next) => {
  try {
    const discount = await Discount.findById(req.params.id);
    if (!discount) {
      return res.status(404).json({ success: false, message: 'Discount not found' });
    }

    const {
      name,
      code,
      type,
      value,
      minPurchaseAmount,
      minQuantity,
      maxUsageCount,
      validFrom,
      validUntil,
      status,
      description,
      customerId,
      applicableProducts,
      applicablePlans
    } = req.body;

    if (code) {
      const normalizedCode = code.trim().toUpperCase();
      const existing = await Discount.findOne({ code: normalizedCode, _id: { $ne: discount._id } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Discount code '${normalizedCode}' already exists.`
        });
      }
      discount.code = normalizedCode;
    }

    if (name) discount.name = name.trim();
    if (type) discount.type = type;
    if (value !== undefined) discount.value = Number(value);
    if (minPurchaseAmount !== undefined) discount.minPurchaseAmount = Number(minPurchaseAmount);
    if (minQuantity !== undefined) discount.minQuantity = Number(minQuantity);
    if (maxUsageCount !== undefined) discount.maxUsageCount = maxUsageCount ? Number(maxUsageCount) : null;
    if (validFrom) discount.validFrom = new Date(validFrom);
    if (validUntil !== undefined) discount.validUntil = validUntil ? new Date(validUntil) : null;
    if (status) discount.status = status;
    if (description !== undefined) discount.description = description;
    if (customerId !== undefined) discount.customerId = customerId || null;
    if (Array.isArray(applicableProducts)) discount.applicableProducts = applicableProducts;
    if (Array.isArray(applicablePlans)) discount.applicablePlans = applicablePlans;

    await discount.save();

    res.status(200).json({
      success: true,
      message: `Discount '${discount.name}' updated successfully.`,
      discount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a discount
 * @route   DELETE /api/discounts/:id
 * @access  Private (Admin, Staff)
 */
exports.deleteDiscount = async (req, res, next) => {
  try {
    const discount = await Discount.findById(req.params.id);
    if (!discount) {
      return res.status(404).json({ success: false, message: 'Discount not found' });
    }

    await Discount.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: `Discount '${discount.name}' deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Validate a discount code against an order amount and return calculated savings
 * @route   POST /api/discounts/validate
 * @access  Private
 */
exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, amount = 0, quantity = 1, customerId } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Discount code is required' });
    }

    const discount = await Discount.findOne({ code: code.trim().toUpperCase() });
    if (!discount) {
      return res.status(404).json({ success: false, message: `Coupon code '${code}' not found.` });
    }

    const targetCustomer = customerId || req.user._id;
    const eligibility = discount.validateEligibility({
      amount: Number(amount),
      quantity: Number(quantity),
      customerId: targetCustomer
    });

    if (!eligibility.valid) {
      return res.status(400).json({
        success: false,
        message: eligibility.reason,
        discount
      });
    }

    const discountAmount = discount.calculateDiscountAmount(amount);
    const finalAmount = Number(Math.max(0, Number(amount) - discountAmount).toFixed(2));

    res.status(200).json({
      success: true,
      valid: true,
      message: `Coupon '${discount.code}' applied successfully! Savings: ₹${discountAmount}`,
      discount: {
        _id: discount._id,
        name: discount.name,
        code: discount.code,
        type: discount.type,
        value: discount.value,
        discountAmount,
        finalAmount
      }
    });
  } catch (error) {
    next(error);
  }
};

