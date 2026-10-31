const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getStaffDashboard,
  getCustomerDashboard
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All dashboard endpoints require authentication
router.use(protect);

// Admin dashboard endpoint (Role-protected: admin only)
router.get('/admin', authorize('admin'), getAdminDashboard);

// Staff dashboard endpoint (Role-protected: staff & admin)
router.get('/staff', authorize('admin', 'staff'), getStaffDashboard);

// Customer dashboard endpoint (Role-protected: customer & admin)
router.get('/customer', getCustomerDashboard);

module.exports = router;

