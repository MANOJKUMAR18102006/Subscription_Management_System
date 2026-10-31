const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  archiveProduct,
  calculateFinalPrice,
  getProductSummaryStats
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(protect);

// Staff and Admin can view products & calculate prices
router.get('/', authorize('admin', 'staff'), getProducts);
router.get('/stats/summary', authorize('admin', 'staff'), getProductSummaryStats);
router.get('/:id', authorize('admin', 'staff'), getProductById);
router.post('/:id/calculate-price', authorize('admin', 'staff'), calculateFinalPrice);

// Only Admin can manage products (create, update, delete, archive)
router.post('/', authorize('admin'), createProduct);
router.put('/:id', authorize('admin'), updateProduct);
router.delete('/:id', authorize('admin'), deleteProduct);
router.patch('/:id/archive', authorize('admin'), archiveProduct);

module.exports = router;

