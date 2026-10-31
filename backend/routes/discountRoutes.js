const express = require('express');
const router = express.Router();
const {
  getDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  validateCoupon
} = require('../controllers/discountController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', getDiscounts);
router.post('/validate', validateCoupon);
router.get('/:id', getDiscountById);
router.post('/', authorize('admin', 'staff'), createDiscount);
router.put('/:id', authorize('admin', 'staff'), updateDiscount);
router.delete('/:id', authorize('admin', 'staff'), deleteDiscount);

module.exports = router;

