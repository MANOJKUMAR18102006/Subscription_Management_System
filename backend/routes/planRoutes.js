const express = require('express');
const router = express.Router();
const {
  createPlan,
  getPlans,
  getPlanSummaryStats,
  getPlanById,
  updatePlan,
  deletePlan,
  archivePlan,
  togglePlanStatus,
  triggerAutoCloseCheck
} = require('../controllers/planController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All plan routes require authentication
router.use(protect);

// View plans & stats (Admin, Staff, and Customer can read plans to subscribe)
router.get('/', getPlans);
router.get('/stats/summary', authorize('admin', 'staff'), getPlanSummaryStats);
router.get('/:id', getPlanById);
router.post('/check-auto-close', authorize('admin', 'staff'), triggerAutoCloseCheck);

// Admin-only management endpoints (Create, Update, Delete, Archive, Toggle Status)
router.post('/', authorize('admin'), createPlan);
router.put('/:id', authorize('admin'), updatePlan);
router.delete('/:id', authorize('admin'), deletePlan);
router.patch('/:id/archive', authorize('admin'), archivePlan);
router.patch('/:id/status', authorize('admin'), togglePlanStatus);

module.exports = router;
