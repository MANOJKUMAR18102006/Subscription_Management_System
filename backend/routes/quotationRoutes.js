const express = require('express');
const router = express.Router();
const {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  updateQuotationStatus,
  convertToSubscription,
  deleteQuotation
} = require('../controllers/quotationController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All quotation endpoints require authentication
router.use(protect);

// Quotation listing & detail (Admin, Staff, Customer for own)
router.get('/', getQuotations);
router.get('/:id', getQuotationById);

// Staff and Admin can create, edit, change status, and convert to subscription
router.post('/', authorize('admin', 'staff'), createQuotation);
router.put('/:id', authorize('admin', 'staff'), updateQuotation);
router.patch('/:id/status', authorize('admin', 'staff'), updateQuotationStatus);
router.post('/:id/convert-to-subscription', authorize('admin', 'staff'), convertToSubscription);

// Admin only: delete quotation
router.delete('/:id', authorize('admin'), deleteQuotation);

module.exports = router;

