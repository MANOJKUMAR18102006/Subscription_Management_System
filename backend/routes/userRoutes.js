const express = require('express');
const router = express.Router();
const {
  createStaff,
  getUsers,
  getUserById,
  toggleUserStatus,
  deleteUser,
  getSystemStats,
  getRoleData
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All user routes require authentication
router.use(protect);

// Requirement 9: Only Admin can create staff accounts
router.post('/staff', authorize('admin'), createStaff);

// Overview stats (Admin and Staff)
router.get('/stats/overview', authorize('admin', 'staff'), getSystemStats);

// Role-based subscription/invoice/payment data (Role-filtered: Customer gets own, Staff daily ops, Admin all)
router.get('/data/subscriptions', getRoleData);

// List users (Admin sees all; Staff sees staff + customers)
router.get('/', authorize('admin', 'staff'), getUsers);

// User status toggle & deletion (Admin only)
router.patch('/:id/toggle-status', authorize('admin'), toggleUserStatus);
router.delete('/:id', authorize('admin'), deleteUser);

// Single user details
router.get('/:id', getUserById);

module.exports = router;

