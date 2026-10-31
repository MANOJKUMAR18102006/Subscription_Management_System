const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getPayments,
  createPayment,
  getPaymentReceipt,
  getPaymentAudit,
  getCustomers
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.get('/invoices', getInvoices);
router.get('/customers', authorize('admin', 'staff'), getCustomers);
router.get('/', getPayments);
router.get('/:id/receipt', getPaymentReceipt);
router.get('/invoice/:invoiceId/audit', authorize('admin', 'staff'), getPaymentAudit);
router.post('/', authorize('admin', 'staff'), createPayment);

module.exports = router;
