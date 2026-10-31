const Product = require('../models/Product');
const Subscription = require('../models/Subscription');

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Private (Admin only)
 */
exports.createProduct = async (req, res, next) => {
  try {
    const {
      name,
      productType,
      salesPrice,
      costPrice,
      description,
      image,
      status,
      variants,
      currency,
      currencySymbol
    } = req.body;

    // Basic validation
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Product Name is required'
      });
    }

    if (salesPrice === undefined || salesPrice === null || salesPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid Sales Price (>= 0) is required'
      });
    }

    // Process and validate variants if present
    let processedVariants = [];
    if (Array.isArray(variants)) {
      processedVariants = variants
        .filter((v) => v && v.name && v.name.trim() !== '')
        .map((v) => ({
          name: v.name.trim(),
          options: Array.isArray(v.options)
            ? v.options
                .filter((opt) => opt && opt.value && opt.value.trim() !== '')
                .map((opt) => ({
                  value: opt.value.trim(),
                  additionalPrice: Math.max(0, Number(opt.additionalPrice) || 0),
                  sku: opt.sku ? opt.sku.trim() : ''
                }))
            : []
        }));
    }

    const product = await Product.create({
      name: name.trim(),
      productType: productType || 'Software',
      salesPrice: Number(salesPrice),
      costPrice: Number(costPrice) || 0,
      description: description ? description.trim() : '',
      image: image ? image.trim() : '',
      status: status || 'Active',
      variants: processedVariants,
      currency: currency || 'INR',
      currencySymbol: currencySymbol || '₹',
      createdBy: req.user._id
    });

    const pricingMatrix = product.getComputedPricingMatrix();

    res.status(201).json({
      success: true,
      message: `Product '${product.name}' created successfully`,
      product,
      pricingMatrix
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all products with search, filters & pagination
 * @route   GET /api/products
 * @access  Private (Admin & Staff)
 */
exports.getProducts = async (req, res, next) => {
  try {
    const {
      search,
      status,
      productType,
      minPrice,
      maxPrice,
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

    // 2. Product Type Filter
    if (productType && productType !== 'all') {
      query.productType = productType;
    }

    // 3. Search Filter (by name or description or variant name/option)
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { 'variants.name': searchRegex },
        { 'variants.options.value': searchRegex }
      ];
    }

    // 4. Price Range Filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.salesPrice = {};
      if (minPrice !== undefined && minPrice !== '') query.salesPrice.$gte = Number(minPrice);
      if (maxPrice !== undefined && maxPrice !== '') query.salesPrice.$lte = Number(maxPrice);
    }

    // Pagination calculations
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [products, totalCount] = await Promise.all([
      Product.find(query)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean({ virtuals: true }),
      Product.countDocuments(query)
    ]);

    // Check active subscriptions count for each product
    const productIds = products.map((p) => p._id);
    const activeSubCounts = await Subscription.aggregate([
      {
        $match: {
          productId: { $in: productIds },
          status: { $in: ['active', 'trialing', 'past_due'] }
        }
      },
      {
        $group: {
          _id: '$productId',
          count: { $sum: 1 }
        }
      }
    ]);

    const activeSubsMap = {};
    activeSubCounts.forEach((item) => {
      activeSubsMap[item._id.toString()] = item.count;
    });

    const enrichedProducts = products.map((prod) => ({
      ...prod,
      activeSubscriptionsCount: activeSubsMap[prod._id.toString()] || 0,
      pricingMatrix: new Product(prod).getComputedPricingMatrix()
    }));

    res.status(200).json({
      success: true,
      count: enrichedProducts.length,
      totalProducts: totalCount,
      totalPages: Math.ceil(totalCount / limitNum) || 1,
      currentPage: pageNum,
      limit: limitNum,
      products: enrichedProducts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Private (Admin & Staff)
 */
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const activeSubscriptionsCount = await Subscription.countDocuments({
      productId: product._id,
      status: { $in: ['active', 'trialing', 'past_due'] }
    });

    res.status(200).json({
      success: true,
      product,
      pricingMatrix: product.getComputedPricingMatrix(),
      activeSubscriptionsCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing product
 * @route   PUT /api/products/:id
 * @access  Private (Admin only)
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const {
      name,
      productType,
      salesPrice,
      costPrice,
      description,
      image,
      status,
      variants,
      currency,
      currencySymbol
    } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (name !== undefined) product.name = name.trim();
    if (productType !== undefined) product.productType = productType;
    if (salesPrice !== undefined) product.salesPrice = Math.max(0, Number(salesPrice));
    if (costPrice !== undefined) product.costPrice = Math.max(0, Number(costPrice));
    if (description !== undefined) product.description = description.trim();
    if (image !== undefined) product.image = image.trim();
    if (status !== undefined) product.status = status;
    if (currency !== undefined) product.currency = currency;
    if (currencySymbol !== undefined) product.currencySymbol = currencySymbol;

    if (Array.isArray(variants)) {
      product.variants = variants
        .filter((v) => v && v.name && v.name.trim() !== '')
        .map((v) => ({
          name: v.name.trim(),
          options: Array.isArray(v.options)
            ? v.options
                .filter((opt) => opt && opt.value && opt.value.trim() !== '')
                .map((opt) => ({
                  value: opt.value.trim(),
                  additionalPrice: Math.max(0, Number(opt.additionalPrice) || 0),
                  sku: opt.sku ? opt.sku.trim() : ''
                }))
            : []
        }));
    }

    product.updatedBy = req.user._id;
    await product.save();

    res.status(200).json({
      success: true,
      message: `Product '${product.name}' updated successfully`,
      product,
      pricingMatrix: product.getComputedPricingMatrix()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a product (Safely guarded against active subscriptions)
 * @route   DELETE /api/products/:id
 * @access  Private (Admin only)
 * 
 * Requirement: Prevent deletion of products already used in active subscriptions unless safely archived.
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if product is tied to active subscriptions
    const activeSubsCount = await Subscription.countDocuments({
      productId: product._id,
      status: { $in: ['active', 'trialing', 'past_due'] }
    });

    if (activeSubsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Deletion Blocked: '${product.name}' is currently used in ${activeSubsCount} active subscription contract(s). To protect active customer agreements, this product cannot be deleted. You can safely archive it instead.`,
        activeSubscriptionsCount: activeSubsCount,
        canArchive: true,
        productId: product._id
      });
    }

    // If no active subscriptions, safely delete
    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: `Product '${product.name}' has been permanently deleted`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Safely archive a product
 * @route   PATCH /api/products/:id/archive
 * @access  Private (Admin only)
 */
exports.archiveProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.status = 'Archived';
    product.updatedBy = req.user._id;
    await product.save();

    res.status(200).json({
      success: true,
      message: `Product '${product.name}' safely archived. Existing active subscriptions will continue uninterrupted, but new signups are disabled.`,
      product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Calculate final product price dynamically given chosen variant options
 * @route   POST /api/products/:id/calculate-price
 * @access  Private (Admin & Staff)
 * 
 * Example:
 * Base Price: ₹2000
 * Variant: Brand, Option: Odoo, Additional: ₹560
 * Final Price: ₹2560
 */
exports.calculateFinalPrice = async (req, res, next) => {
  try {
    const { selectedOptions = [] } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const priceCalculation = product.calculateFinalPrice(selectedOptions);

    res.status(200).json({
      success: true,
      product: {
        id: product._id,
        name: product.name,
        productType: product.productType
      },
      calculation: priceCalculation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get summary statistics and product types
 * @route   GET /api/products/stats/summary
 * @access  Private (Admin & Staff)
 */
exports.getProductSummaryStats = async (req, res, next) => {
  try {
    const [totalProducts, activeProducts, archivedProducts, draftProducts] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ status: 'Active' }),
      Product.countDocuments({ status: 'Archived' }),
      Product.countDocuments({ status: 'Draft' })
    ]);

    const typeBreakdown = await Product.aggregate([
      { $group: { _id: '$productType', count: { $sum: 1 }, avgPrice: { $avg: '$salesPrice' } } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        activeProducts,
        archivedProducts,
        draftProducts,
        typeBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
};

