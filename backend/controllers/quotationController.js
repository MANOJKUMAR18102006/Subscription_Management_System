const Quotation = require('../models/Quotation');
const QuotationTemplate = require('../models/QuotationTemplate');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const Product = require('../models/Product');
const User = require('../models/User');

/**
 * Generate sequential quotation number QTN-YYYY-XXXX
 */
const generateQuotationNumber = async () => {
  const year = new Date().getFullYear();
  const count = await Quotation.countDocuments();
  let candidate = `QTN-${year}-${String(count + 1).padStart(4, '0')}`;
  const exists = await Quotation.findOne({ quotationNumber: candidate });
  if (exists) {
    candidate = `QTN-${year}-${Date.now().toString().slice(-4)}`;
  }
  return candidate;
};

/**
 * Recalculate totals helper
 */
const computeTotals = (products = [], plans = []) => {
  let subtotal = 0;
  let taxTotal = 0;
  let discountTotal = 0;

  const normalizedProducts = (products || []).map((p) => {
    const qty = Number(p.quantity) > 0 ? Number(p.quantity) : 1;
    const price = Number(p.unitPrice) >= 0 ? Number(p.unitPrice) : 0;
    const discPercent = Number(p.discount) >= 0 ? Number(p.discount) : 0;
    const taxRate = Number(p.taxRate) >= 0 ? Number(p.taxRate) : 18;

    const base = qty * price;
    const disc = base * (discPercent / 100);
    const net = base - disc;
    const lineTotal = Number(net.toFixed(2));
    const tax = lineTotal * (taxRate / 100);

    subtotal += lineTotal;
    taxTotal += tax;
    discountTotal += disc;

    return {
      product: p.product?._id || p.product,
      name: p.name || 'Product Item',
      variant: p.variant || '',
      quantity: qty,
      unitPrice: price,
      taxRate,
      discount: discPercent,
      lineTotal
    };
  });

  const normalizedPlans = (plans || []).map((pl) => {
    const qty = Number(pl.quantity) > 0 ? Number(pl.quantity) : 1;
    const price = Number(pl.unitPrice) >= 0 ? Number(pl.unitPrice) : 0;
    const discPercent = Number(pl.discount) >= 0 ? Number(pl.discount) : 0;
    const taxRate = Number(pl.taxRate) >= 0 ? Number(pl.taxRate) : 18;

    const base = qty * price;
    const disc = base * (discPercent / 100);
    const net = base - disc;
    const lineTotal = Number(net.toFixed(2));
    const tax = lineTotal * (taxRate / 100);

    subtotal += lineTotal;
    taxTotal += tax;
    discountTotal += disc;

    return {
      plan: pl.plan?._id || pl.plan,
      name: pl.name || 'Plan Item',
      billingFrequency: pl.billingFrequency || 'Monthly',
      quantity: qty,
      unitPrice: price,
      taxRate,
      discount: discPercent,
      lineTotal
    };
  });

  return {
    products: normalizedProducts,
    plans: normalizedPlans,
    subtotal: Number(subtotal.toFixed(2)),
    taxAmount: Number(taxTotal.toFixed(2)),
    discountAmount: Number(discountTotal.toFixed(2)),
    totalAmount: Number((subtotal + taxTotal).toFixed(2))
  };
};

/**
 * @desc    Get all quotations
 * @route   GET /api/quotations
 * @access  Private (Admin, Staff, Customer)
 */
const getQuotations = async (req, res) => {
  try {
    const { status, search, customerId, page = 1, limit = 50 } = req.query;
    const query = {};

    // Customer role can only view their own quotations
    if (req.user.role === 'customer') {
      query.customer = req.user._id;
    } else if (customerId) {
      query.customer = customerId;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { quotationNumber: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [quotations, total] = await Promise.all([
      Quotation.find(query)
        .populate('customer', 'name email company phone')
        .populate('quotationTemplate', 'name')
        .populate('products.product', 'name salesPrice')
        .populate('plans.plan', 'name price billingFrequency')
        .populate('subscriptionId', 'status nextBillingDate')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Quotation.countDocuments(query)
    ]);

    // Summary counts for dashboard / tabs
    const summaryFilter = req.user.role === 'customer' ? { customer: req.user._id } : {};
    const now = new Date();
    const [allCount, draftCount, quotationCount, confirmedCount, activeCount, closedCount, expiredCount] =
      await Promise.all([
        Quotation.countDocuments(summaryFilter),
        Quotation.countDocuments({ ...summaryFilter, status: 'Draft' }),
        Quotation.countDocuments({ ...summaryFilter, status: 'Quotation' }),
        Quotation.countDocuments({ ...summaryFilter, status: 'Confirmed' }),
        Quotation.countDocuments({ ...summaryFilter, status: 'Active' }),
        Quotation.countDocuments({ ...summaryFilter, status: 'Closed' }),
        Quotation.countDocuments({
          ...summaryFilter,
          status: { $in: ['Draft', 'Quotation'] },
          expiryDate: { $lt: now }
        })
      ]);

    res.status(200).json({
      success: true,
      data: quotations,
      meta: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        summary: {
          all: allCount,
          Draft: draftCount,
          Quotation: quotationCount,
          Confirmed: confirmedCount,
          Active: activeCount,
          Closed: closedCount,
          Expired: expiredCount
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching quotations'
    });
  }
};

/**
 * @desc    Get single quotation by ID
 * @route   GET /api/quotations/:id
 * @access  Private (Admin, Staff, Customer for own)
 */
const getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('customer', 'name email company phone role')
      .populate('quotationTemplate', 'name description')
      .populate('products.product', 'name salesPrice costPrice productType')
      .populate('plans.plan', 'name price billingFrequency features')
      .populate('subscriptionId')
      .populate('history.performedBy', 'name email role');

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    // Role check: customer can only read their own quotation
    if (
      req.user.role === 'customer' &&
      quotation.customer._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only access your own quotations'
      });
    }

    const isExpired = new Date(quotation.expiryDate) < new Date();

    res.status(200).json({
      success: true,
      data: quotation,
      isExpired
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching quotation'
    });
  }
};

/**
 * @desc    Create a quotation (optionally from template)
 * @route   POST /api/quotations
 * @access  Private (Admin, Staff)
 */
const createQuotation = async (req, res) => {
  try {
    const {
      customerId,
      customer,
      quotationTemplateId,
      validityDuration = 30,
      paymentTerms = 'Net 30',
      status = 'Draft',
      notes = '',
      termsAndConditions,
      products = [],
      plans = []
    } = req.body;

    const targetCustomerId = customerId || customer;
    if (!targetCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer is required to generate a quotation'
      });
    }

    // Verify customer exists
    const customerUser = await User.findById(targetCustomerId);
    if (!customerUser) {
      return res.status(404).json({
        success: false,
        message: 'Selected customer not found in system'
      });
    }

    let finalProducts = products;
    let finalPlans = plans;
    let finalDuration = Number(validityDuration) || 30;
    let finalPaymentTerms = paymentTerms;
    let finalTerms = termsAndConditions;

    // If template is selected and products/plans not provided or need merge
    if (quotationTemplateId) {
      const template = await QuotationTemplate.findById(quotationTemplateId)
        .populate('selectedProducts.product')
        .populate('selectedPlans.plan');

      if (template) {
        if (!finalDuration && template.validityDuration) {
          finalDuration = template.validityDuration;
        }
        if (!finalPaymentTerms && template.paymentTerms) {
          finalPaymentTerms = template.paymentTerms;
        }
        if (!finalTerms && template.termsAndConditions) {
          finalTerms = template.termsAndConditions;
        }

        // If client did not explicitly supply products, populate from template
        if (!products.length && template.selectedProducts && template.selectedProducts.length > 0) {
          finalProducts = template.selectedProducts
            .filter((p) => p.product)
            .map((p) => ({
              product: p.product._id,
              name: p.product.name,
              variant: '',
              quantity: p.defaultQuantity || template.defaultQuantities || 1,
              unitPrice: p.unitPrice !== undefined && p.unitPrice > 0 ? p.unitPrice : p.product.salesPrice || 0,
              taxRate: p.defaultTaxRate !== undefined ? p.defaultTaxRate : template.defaultTaxes || 18,
              discount: p.defaultDiscount || 0
            }));
        }

        // If client did not explicitly supply plans, populate from template
        if (!plans.length && template.selectedPlans && template.selectedPlans.length > 0) {
          finalPlans = template.selectedPlans
            .filter((pl) => pl.plan)
            .map((pl) => ({
              plan: pl.plan._id,
              name: pl.plan.name,
              billingFrequency: pl.billingFrequency || pl.plan.billingFrequency || 'Monthly',
              quantity: pl.defaultQuantity || template.defaultQuantities || 1,
              unitPrice: pl.unitPrice !== undefined && pl.unitPrice > 0 ? pl.unitPrice : pl.plan.price || 0,
              taxRate: pl.defaultTaxRate !== undefined ? pl.defaultTaxRate : template.defaultTaxes || 18,
              discount: pl.defaultDiscount || 0
            }));
        }
      }
    }

    // Require at least one line item (either product or plan)
    if (!finalProducts.length && !finalPlans.length) {
      return res.status(400).json({
        success: false,
        message: 'At least one product or plan line item is required'
      });
    }

    const {
      products: calcProducts,
      plans: calcPlans,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount
    } = computeTotals(finalProducts, finalPlans);

    const quotationNumber = await generateQuotationNumber();
    const createdDate = new Date();
    const expiryDate = new Date(createdDate.getTime() + finalDuration * 24 * 60 * 60 * 1000);

    const quotation = new Quotation({
      quotationNumber,
      customer: targetCustomerId,
      quotationTemplate: quotationTemplateId || undefined,
      products: calcProducts,
      plans: calcPlans,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      validityDuration: finalDuration,
      createdDate,
      expiryDate,
      paymentTerms: finalPaymentTerms || 'Net 30',
      status: ['Draft', 'Quotation'].includes(status) ? status : 'Draft',
      notes,
      termsAndConditions: finalTerms,
      createdBy: req.user._id,
      history: [
        {
          action: 'Created',
          performedBy: req.user._id,
          performedByName: req.user.name,
          timestamp: new Date(),
          details: `Quotation created with initial status '${status || 'Draft'}' and expiry on ${expiryDate.toLocaleDateString()}`
        }
      ]
    });

    await quotation.save();

    const populated = await Quotation.findById(quotation._id)
      .populate('customer', 'name email company phone')
      .populate('quotationTemplate', 'name')
      .populate('products.product', 'name salesPrice')
      .populate('plans.plan', 'name price billingFrequency');

    res.status(201).json({
      success: true,
      message: `Quotation ${quotationNumber} created successfully`,
      data: populated
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating quotation'
    });
  }
};

/**
 * @desc    Update a quotation (lines, validity, customer, payment terms)
 * @route   PUT /api/quotations/:id
 * @access  Private (Admin, Staff)
 */
const updateQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    // Do not allow updating if Active (already converted into subscription) or Closed
    if (['Active', 'Closed'].includes(quotation.status)) {
      return res.status(400).json({
        success: false,
        message: `Quotation cannot be edited because it is currently in '${quotation.status}' status`
      });
    }

    const {
      customerId,
      customer,
      validityDuration,
      paymentTerms,
      notes,
      termsAndConditions,
      products,
      plans,
      status
    } = req.body;

    if (customerId || customer) {
      quotation.customer = customerId || customer;
    }
    if (paymentTerms !== undefined) {
      quotation.paymentTerms = paymentTerms;
    }
    if (notes !== undefined) {
      quotation.notes = notes;
    }
    if (termsAndConditions !== undefined) {
      quotation.termsAndConditions = termsAndConditions;
    }

    if (validityDuration !== undefined && Number(validityDuration) > 0) {
      quotation.validityDuration = Number(validityDuration);
      quotation.expiryDate = new Date(
        new Date(quotation.createdDate).getTime() + Number(validityDuration) * 24 * 60 * 60 * 1000
      );
    }

    if (products !== undefined || plans !== undefined) {
      const updatedProducts = products !== undefined ? products : quotation.products;
      const updatedPlans = plans !== undefined ? plans : quotation.plans;

      const {
        products: calcProducts,
        plans: calcPlans,
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount
      } = computeTotals(updatedProducts, updatedPlans);

      quotation.products = calcProducts;
      quotation.plans = calcPlans;
      quotation.subtotal = subtotal;
      quotation.taxAmount = taxAmount;
      quotation.discountAmount = discountAmount;
      quotation.totalAmount = totalAmount;
    }

    if (status && ['Draft', 'Quotation'].includes(status)) {
      quotation.status = status;
    }

    quotation.updatedBy = req.user._id;
    quotation.history.push({
      action: 'Updated Lines',
      performedBy: req.user._id,
      performedByName: req.user.name,
      timestamp: new Date(),
      details: 'Quotation line items or validity duration updated'
    });

    await quotation.save();

    const populated = await Quotation.findById(quotation._id)
      .populate('customer', 'name email company phone')
      .populate('quotationTemplate', 'name')
      .populate('products.product', 'name salesPrice')
      .populate('plans.plan', 'name price billingFrequency')
      .populate('history.performedBy', 'name email');

    res.status(200).json({
      success: true,
      message: `Quotation ${quotation.quotationNumber} updated successfully`,
      data: populated
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating quotation'
    });
  }
};

/**
 * @desc    Update quotation status with strict expiry guard
 * @route   PATCH /api/quotations/:id/status
 * @access  Private (Admin, Staff)
 */
const updateQuotationStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    const validStatuses = ['Draft', 'Quotation', 'Confirmed', 'Active', 'Closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status '${status}'. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // REQUIREMENT 6: Prevent expired quotations from being confirmed
    if (status === 'Confirmed') {
      const now = new Date();
      if (quotation.expiryDate && new Date(quotation.expiryDate) < now) {
        return res.status(400).json({
          success: false,
          isExpired: true,
          message: `Cannot confirm quotation: This quotation expired on ${new Date(quotation.expiryDate).toLocaleDateString()}. Please extend the validity duration before confirming.`
        });
      }
    }

    const previousStatus = quotation.status;
    quotation.status = status;
    quotation.updatedBy = req.user._id;

    quotation.history.push({
      action: `Status changed to ${status}`,
      performedBy: req.user._id,
      performedByName: req.user.name,
      timestamp: new Date(),
      details: note || `Quotation status transitioned from '${previousStatus}' to '${status}'`
    });

    await quotation.save();

    res.status(200).json({
      success: true,
      message: `Quotation status updated to ${status}`,
      data: quotation
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating quotation status'
    });
  }
};

/**
 * @desc    Convert Confirmed Quotation into an Active Subscription
 * @route   POST /api/quotations/:id/convert-to-subscription
 * @access  Private (Admin, Staff)
 */
const convertToSubscription = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('customer')
      .populate('plans.plan')
      .populate('products.product');

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    // Check status: only Confirmed quotations can be converted
    if (quotation.status !== 'Confirmed') {
      return res.status(400).json({
        success: false,
        message: `Quotation must be in 'Confirmed' status before converting to a subscription (current status: '${quotation.status}')`
      });
    }

    // REQUIREMENT 6: Prevent expired quotation conversion
    const now = new Date();
    if (quotation.expiryDate && new Date(quotation.expiryDate) < now) {
      return res.status(400).json({
        success: false,
        isExpired: true,
        message: `Cannot convert quotation: This quotation expired on ${new Date(quotation.expiryDate).toLocaleDateString()}. Extend validity first.`
      });
    }

    if (quotation.subscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'This quotation has already been converted into a subscription'
      });
    }

    // Find primary plan line or fallback
    let primaryPlanLine = quotation.plans && quotation.plans[0];
    let primaryProductLine = quotation.products && quotation.products[0];

    // If no plan was linked on quotation, check if we have any active plan in system
    let planDoc = primaryPlanLine?.plan;
    if (!planDoc) {
      planDoc = await Plan.findOne({ status: 'Active' });
    }

    const billingFrequency = primaryPlanLine?.billingFrequency || planDoc?.billingFrequency || 'Monthly';

    // Calculate next billing date
    const startDate = new Date();
    const nextBillingDate = new Date(startDate);
    switch (billingFrequency.toLowerCase()) {
      case 'daily':
        nextBillingDate.setDate(nextBillingDate.getDate() + 1);
        break;
      case 'weekly':
        nextBillingDate.setDate(nextBillingDate.getDate() + 7);
        break;
      case 'yearly':
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
        break;
      case 'monthly':
      default:
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        break;
    }

    // Create Subscription
    const subscription = new Subscription({
      customerId: quotation.customer._id || quotation.customer,
      productId: primaryProductLine?.product?._id || primaryProductLine?.product || undefined,
      planId: planDoc?._id || undefined,
      planName: primaryPlanLine?.name || planDoc?.name || `Quotation ${quotation.quotationNumber} Package`,
      quantity: primaryPlanLine?.quantity || 1,
      unitPrice: primaryPlanLine?.unitPrice || quotation.totalAmount,
      billingFrequency,
      billingCycle: billingFrequency.toLowerCase(),
      amount: quotation.totalAmount,
      currency: quotation.currency || 'INR',
      currencySymbol: quotation.currencySymbol || '₹',
      status: 'active',
      startDate,
      nextBillingDate,
      priceLockedAt: new Date(),
      planSnapshot: planDoc
        ? {
            planId: planDoc._id,
            name: planDoc.name,
            price: planDoc.price,
            billingFrequency: planDoc.billingFrequency,
            minQuantity: planDoc.minQuantity,
            allowEarlyClosure: planDoc.allowEarlyClosure,
            allowPause: planDoc.allowPause,
            allowRenewal: planDoc.allowRenewal,
            currency: planDoc.currency,
            currencySymbol: planDoc.currencySymbol,
            features: planDoc.features || []
          }
        : undefined,
      features: planDoc?.features || []
    });

    await subscription.save();

    // Update Quotation to Active
    quotation.status = 'Active';
    quotation.subscriptionId = subscription._id;
    quotation.updatedBy = req.user._id;
    quotation.history.push({
      action: 'Converted to Subscription',
      performedBy: req.user._id,
      performedByName: req.user.name,
      timestamp: new Date(),
      details: `Successfully converted to active subscription #${subscription._id} on ${new Date().toLocaleString()}`
    });

    await quotation.save();

    res.status(200).json({
      success: true,
      message: `Quotation ${quotation.quotationNumber} successfully converted to Active Subscription!`,
      data: {
        quotation,
        subscription
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error converting quotation to subscription'
    });
  }
};

/**
 * @desc    Delete a quotation
 * @route   DELETE /api/quotations/:id
 * @access  Private (Admin)
 */
const deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    if (quotation.status === 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an active quotation that is linked to a live subscription'
      });
    }

    await quotation.deleteOne();

    res.status(200).json({
      success: true,
      message: `Quotation ${quotation.quotationNumber} deleted successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting quotation'
    });
  }
};

module.exports = {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  updateQuotationStatus,
  convertToSubscription,
  deleteQuotation
};

