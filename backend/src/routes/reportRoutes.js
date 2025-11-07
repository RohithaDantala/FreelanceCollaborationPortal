// backend/src/routes/reportRoutes.js
const express = require('express');
const {
  generateContributionReport,
  generateMilestoneReport,
  generateProjectSummary,
  getProjectReports,
  getReport,
  deleteReport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Generate reports
router.post('/contribution', generateContributionReport);
router.post('/milestone', generateMilestoneReport);
router.post('/summary', generateProjectSummary);

// Get reports
router.get('/project/:projectId', getProjectReports);
router.get('/:id', getReport);

// Delete report
router.delete('/:id', deleteReport);

module.exports = router;