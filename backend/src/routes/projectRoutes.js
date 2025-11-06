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
router.get('/:id', getProject);

// Protected routes
router.post('/', protect, createProject);
router.get('/user/my-projects', protect, getMyProjects);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);
router.post('/:id/apply', protect, applyToProject);
router.put('/:id/applicants/:applicantId', protect, handleApplication);
router.delete('/:id/members/:memberId', protect, removeMember);

module.exports = router;