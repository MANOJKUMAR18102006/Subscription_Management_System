const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getInvoiceById,
  createInvoice,
  createInvoiceFromSubscription,
  runRecurringBilling,
  updateInvoiceStatus,
  updateInvoice,
  deleteInvoice
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/', getInvoices);
router.post('/recurring-billing/run', authorize('admin', 'staff'), runRecurringBilling);
router.post('/from-subscription/:subscriptionId', authorize('admin', 'staff'), createInvoiceFromSubscription);
router.get('/:id', getInvoiceById);
router.post('/', authorize('admin', 'staff'), createInvoice);
router.patch('/:id/status', authorize('admin', 'staff'), updateInvoiceStatus);
router.put('/:id', authorize('admin', 'staff'), updateInvoice);
router.delete('/:id', authorize('admin', 'staff'), deleteInvoice);

module.exports = router;

