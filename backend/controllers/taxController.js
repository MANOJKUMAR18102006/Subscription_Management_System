const Tax = require('../models/Tax');

/**
 * @desc    Get all tax rules with search and filters
 * @route   GET /api/taxes
 * @access  Private
 */
exports.getTaxes = async (req, res, next) => {
  try {
    const { status, type, search } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }
    if (type && type !== 'all') {
      filter.type = type;
    }
    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: regex }, { code: regex }, { description: regex }];
    }

    const taxes = await Tax.find(filter)
      .populate('applicableProducts', 'name salesPrice productType')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const totalCount = await Tax.countDocuments(filter);
    const activeCount = await Tax.countDocuments({ status: 'active' });
    const percentageCount = await Tax.countDocuments({ type: 'percentage', status: 'active' });
    const fixedCount = await Tax.countDocuments({ type: 'fixed', status: 'active' });

    res.status(200).json({
      success: true,
      count: taxes.length,
      totalCount,
      stats: {
        total: totalCount,
        active: activeCount,
        percentage: percentageCount,
        fixed: fixedCount
      },
      taxes
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single tax rule by ID
 * @route   GET /api/taxes/:id
 * @access  Private
 */
exports.getTaxById = async (req, res, next) => {
  try {
    const tax = await Tax.findById(req.params.id)
      .populate('applicableProducts', 'name salesPrice productType')
      .populate('createdBy', 'name email');

    if (!tax) {
      return res.status(404).json({ success: false, message: 'Tax rule not found' });
    }

    res.status(200).json({ success: true, tax });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new tax rule
 * @route   POST /api/taxes
 * @access  Private (Admin, Staff)
 */
exports.createTax = async (req, res, next) => {
  try {
    const {
      name,
      code,
      type = 'percentage',
      rate,
      description,
      effectiveFrom,
      effectiveUntil,
      status = 'active',
      applicableProducts
    } = req.body;

    if (!name || !code || rate === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, code, and tax rate/amount are required'
      });
    }

    const normalizedCode = code.trim().toUpperCase();
    const existing = await Tax.findOne({ code: normalizedCode });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Tax rule with code '${normalizedCode}' already exists.`
      });
    }

    if (effectiveFrom && effectiveUntil && new Date(effectiveUntil) < new Date(effectiveFrom)) {
      return res.status(400).json({
        success: false,
        message: 'Effective until date must be on or after effective from date.'
      });
    }

    const tax = await Tax.create({
      name: name.trim(),
      code: normalizedCode,
      type,
      rate: Number(rate),
      description: description || '',
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      effectiveUntil: effectiveUntil ? new Date(effectiveUntil) : null,
      status,
      applicableProducts: Array.isArray(applicableProducts) ? applicableProducts : [],
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: `Tax rule '${tax.name}' (${tax.code}) created successfully.`,
      tax
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a tax rule
 * @route   PUT /api/taxes/:id
 * @access  Private (Admin, Staff)
 */
exports.updateTax = async (req, res, next) => {
  try {
    const tax = await Tax.findById(req.params.id);
    if (!tax) {
      return res.status(404).json({ success: false, message: 'Tax rule not found' });
    }

    const {
      name,
      code,
      type,
      rate,
      description,
      effectiveFrom,
      effectiveUntil,
      status,
      applicableProducts
    } = req.body;

    if (code) {
      const normalizedCode = code.trim().toUpperCase();
      const existing = await Tax.findOne({ code: normalizedCode, _id: { $ne: tax._id } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Tax code '${normalizedCode}' is already in use by another tax rule.`
        });
      }
      tax.code = normalizedCode;
    }

    if (name) tax.name = name.trim();
    if (type) tax.type = type;
    if (rate !== undefined) tax.rate = Number(rate);
    if (description !== undefined) tax.description = description;
    if (effectiveFrom) tax.effectiveFrom = new Date(effectiveFrom);
    if (effectiveUntil !== undefined) tax.effectiveUntil = effectiveUntil ? new Date(effectiveUntil) : null;
    if (status) tax.status = status;
    if (Array.isArray(applicableProducts)) tax.applicableProducts = applicableProducts;

    await tax.save();

    res.status(200).json({
      success: true,
      message: `Tax rule '${tax.name}' updated successfully.`,
      tax
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a tax rule
 * @route   DELETE /api/taxes/:id
 * @access  Private (Admin, Staff)
 */
exports.deleteTax = async (req, res, next) => {
  try {
    const tax = await Tax.findById(req.params.id);
    if (!tax) {
      return res.status(404).json({ success: false, message: 'Tax rule not found' });
    }

    await Tax.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: `Tax rule '${tax.name}' deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Calculate tax breakdown for a given amount/items
 * @route   POST /api/taxes/calculate
 * @access  Private
 */
exports.calculateTaxBreakdown = async (req, res, next) => {
  try {
    const { amount = 0, quantity = 1, taxIds = [], date = new Date() } = req.body;

    let query = { status: 'active' };
    if (Array.isArray(taxIds) && taxIds.length > 0) {
      query._id = { $in: taxIds };
    }

    const activeTaxes = await Tax.find(query);
    const breakdown = [];
    let totalTax = 0;

    for (const tax of activeTaxes) {
      if (tax.isEffectiveOn(date)) {
        const taxAmount = tax.calculateTax(amount, quantity);
        breakdown.push({
          taxId: tax._id,
          name: tax.name,
          code: tax.code,
          type: tax.type,
          rate: tax.rate,
          amount: taxAmount
        });
        totalTax += taxAmount;
      }
    }

    res.status(200).json({
      success: true,
      baseAmount: Number(amount),
      totalTax: Number(totalTax.toFixed(2)),
      grandTotal: Number((Number(amount) + totalTax).toFixed(2)),
      breakdown
    });
  } catch (error) {
    next(error);
  }
};

