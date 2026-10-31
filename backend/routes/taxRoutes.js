const express = require('express');
const router = express.Router();
const {
  getTaxes,
  getTaxById,
  createTax,
  updateTax,
  deleteTax,
  calculateTaxBreakdown
} = require('../controllers/taxController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', getTaxes);
router.post('/calculate', calculateTaxBreakdown);
router.get('/:id', getTaxById);
router.post('/', authorize('admin', 'staff'), createTax);
router.put('/:id', authorize('admin', 'staff'), updateTax);
router.delete('/:id', authorize('admin', 'staff'), deleteTax);

module.exports = router;

