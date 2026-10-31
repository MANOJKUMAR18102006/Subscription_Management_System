const express = require('express');
const router = express.Router();
const {
  createSubscription,
  getSubscriptions,
  getSubscriptionById,
  pauseSubscription,
  resumeSubscription,
  earlyCloseSubscription,
  renewSubscription
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');

// All subscription routes require authentication
router.use(protect);

router.post('/', createSubscription);
router.get('/', getSubscriptions);
router.get('/:id', getSubscriptionById);
router.patch('/:id/pause', pauseSubscription);
router.patch('/:id/resume', resumeSubscription);
router.patch('/:id/early-close', earlyCloseSubscription);
router.post('/:id/renew', renewSubscription);

module.exports = router;
