const express = require('express');
const {
  createProject,
  getAllProjects,
  getProject,
  getMyProjects,
  updateProject,
  deleteProject,
  applyToProject,
  handleApplication,
  removeMember,
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getAllProjects);

// Protected routes - FIX: Move specific routes before dynamic /:id
router.post('/', protect, createProject);
router.get('/user/my-projects', protect, getMyProjects); // FIX: Moved before /:id

// Dynamic routes (must come after specific routes)
router.get('/:id', getProject);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);
router.post('/:id/apply', protect, applyToProject);
router.put('/:id/applicants/:applicantId', protect, handleApplication);
router.delete('/:id/members/:memberId', protect, removeMember);

module.exports = router;