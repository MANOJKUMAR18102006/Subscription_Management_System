const express = require('express');
const {
  getPortal,
  getSubscriptionHistory,
  createRequest,
  downloadInvoicePdf
} = require('../controllers/customerPortalController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();
router.use(protect, authorize('customer'));
router.get('/', getPortal);
router.get('/subscriptions/:subscriptionId/history', getSubscriptionHistory);
router.post('/subscriptions/:subscriptionId/requests', createRequest);
router.get('/invoices/:invoiceId/pdf', downloadInvoicePdf);

module.exports = router;
