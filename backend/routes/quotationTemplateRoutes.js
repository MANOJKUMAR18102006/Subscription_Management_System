const express = require('express');
const router = express.Router();
const {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate
} = require('../controllers/quotationTemplateController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All quotation template endpoints require authentication
router.use(protect);

// Admin & Staff can read & manage quotation templates
router.get('/', authorize('admin', 'staff'), getTemplates);
router.get('/:id', authorize('admin', 'staff'), getTemplateById);
router.post('/', authorize('admin', 'staff'), createTemplate);
router.put('/:id', authorize('admin', 'staff'), updateTemplate);
router.delete('/:id', authorize('admin'), deleteTemplate);

module.exports = router;

