const QuotationTemplate = require('../models/QuotationTemplate');
const Product = require('../models/Product');
const Plan = require('../models/Plan');

/**
 * @desc    Get all quotation templates
 * @route   GET /api/quotation-templates
 * @access  Private (Admin, Staff)
 */
const getTemplates = async (req, res) => {
  try {
    const { search, isActive } = req.query;
    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const templates = await QuotationTemplate.find(query)
      .populate('selectedProducts.product', 'name salesPrice costPrice productType status')
      .populate('selectedPlans.plan', 'name price billingFrequency status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching quotation templates'
    });
  }
};

/**
 * @desc    Get single quotation template by ID
 * @route   GET /api/quotation-templates/:id
 * @access  Private (Admin, Staff)
 */
const getTemplateById = async (req, res) => {
  try {
    const template = await QuotationTemplate.findById(req.params.id)
      .populate('selectedProducts.product', 'name salesPrice costPrice productType status variants')
      .populate('selectedPlans.plan', 'name price billingFrequency status minQuantity features');

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Quotation template not found'
      });
    }

    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching quotation template'
    });
  }
};

/**
 * @desc    Create a quotation template
 * @route   POST /api/quotation-templates
 * @access  Private (Admin, Staff)
 */
const createTemplate = async (req, res) => {
  try {
    const {
      name,
      description,
      selectedProducts,
      selectedPlans,
      defaultQuantities,
      defaultTaxes,
      validityDuration,
      paymentTerms,
      termsAndConditions,
      isActive
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Template name is required'
      });
    }

    const template = await QuotationTemplate.create({
      name: name.trim(),
      description: description || '',
      selectedProducts: selectedProducts || [],
      selectedPlans: selectedPlans || [],
      defaultQuantities: defaultQuantities || 1,
      defaultTaxes: defaultTaxes !== undefined ? defaultTaxes : 18,
      validityDuration: validityDuration || 30,
      paymentTerms: paymentTerms || 'Net 30',
      termsAndConditions: termsAndConditions || undefined,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id
    });

    const populated = await QuotationTemplate.findById(template._id)
      .populate('selectedProducts.product', 'name salesPrice costPrice')
      .populate('selectedPlans.plan', 'name price billingFrequency');

    res.status(201).json({
      success: true,
      message: 'Quotation template created successfully',
      data: populated
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating quotation template'
    });
  }
};

/**
 * @desc    Update a quotation template
 * @route   PUT /api/quotation-templates/:id
 * @access  Private (Admin, Staff)
 */
const updateTemplate = async (req, res) => {
  try {
    let template = await QuotationTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Quotation template not found'
      });
    }

    const updatableFields = [
      'name',
      'description',
      'selectedProducts',
      'selectedPlans',
      'defaultQuantities',
      'defaultTaxes',
      'validityDuration',
      'paymentTerms',
      'termsAndConditions',
      'isActive'
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        template[field] = req.body[field];
      }
    });

    await template.save();

    const populated = await QuotationTemplate.findById(template._id)
      .populate('selectedProducts.product', 'name salesPrice costPrice')
      .populate('selectedPlans.plan', 'name price billingFrequency');

    res.status(200).json({
      success: true,
      message: 'Quotation template updated successfully',
      data: populated
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating quotation template'
    });
  }
};

/**
 * @desc    Delete a quotation template
 * @route   DELETE /api/quotation-templates/:id
 * @access  Private (Admin)
 */
const deleteTemplate = async (req, res) => {
  try {
    const template = await QuotationTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Quotation template not found'
      });
    }

    await template.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Quotation template deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting quotation template'
    });
  }
};

module.exports = {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate
};

