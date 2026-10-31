const express = require('express');
const { getReports, exportReports } = require('../controllers/reportsController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();
router.use(protect, authorize('admin', 'staff'));
router.get('/', getReports);
router.get('/export', exportReports);

module.exports = router;
