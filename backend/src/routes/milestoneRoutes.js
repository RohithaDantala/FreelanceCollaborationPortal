// backend/src/routes/milestoneRoutes.js
const express = require('express');
const {
  createMilestone,
  getProjectMilestones,
  getMilestone,
  updateMilestone,
  deleteMilestone,
  linkTaskToMilestone,
  getProjectProgress,
  reorderMilestones,
} = require('../controllers/milestoneController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Project-level milestone routes
router.post('/projects/:projectId/milestones', createMilestone);
router.get('/projects/:projectId/milestones', getProjectMilestones);
router.get('/projects/:projectId/progress', getProjectProgress);
router.put('/projects/:projectId/milestones/reorder', reorderMilestones);

// Individual milestone routes
router.get('/milestones/:id', getMilestone);
router.put('/milestones/:id', updateMilestone);
router.delete('/milestones/:id', deleteMilestone);

// Task-milestone linking
router.post('/milestones/:id/tasks/:taskId', linkTaskToMilestone);

module.exports = router;