const express = require('express');
const router = express.Router();
const {
  createSubscription,
  createFromQuotation,
  getSubscriptions,
  getSubscriptionById,
  updateSubscription,
  confirmSubscription,
  activateSubscription,
  updateSubscriptionStatus,
  pauseSubscription,
  resumeSubscription,
  earlyCloseSubscription,
  renewSubscription,
  processAutoExpirations,
  generateInvoice
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');

// All subscription routes require authentication
router.use(protect);

// Collection operations
router.post('/', createSubscription);
router.get('/', getSubscriptions);
router.post('/process-expirations', processAutoExpirations);
router.post('/from-quotation/:quotationId', createFromQuotation);

// Single subscription operations
router.get('/:id', getSubscriptionById);
router.put('/:id', updateSubscription);
router.patch('/:id/confirm', confirmSubscription);
router.patch('/:id/activate', activateSubscription);
router.patch('/:id/status', updateSubscriptionStatus);
router.patch('/:id/pause', pauseSubscription);
router.patch('/:id/resume', resumeSubscription);
router.patch('/:id/early-close', earlyCloseSubscription);
router.post('/:id/renew', renewSubscription);
router.post('/:id/generate-invoice', generateInvoice);

module.exports = router;
