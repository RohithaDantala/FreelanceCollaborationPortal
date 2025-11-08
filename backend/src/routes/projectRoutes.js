const express = require('express');
const Project = require('../models/Project'); // ADD THIS LINE
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
router.get('/user/my-projects', protect, getMyProjects);

// DEBUG ENDPOINT - Check what's in database
router.get('/debug/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'firstName lastName email')
      .populate('members.user', 'firstName lastName email')
      .populate('applicants.user', 'firstName lastName email');
    
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.json({
      success: true,
      debug: {
        projectId: project._id,
        title: project.title,
        ownerId: project.owner._id,
        ownerName: `${project.owner.firstName} ${project.owner.lastName}`,
        membersCount: project.members.length,
        members: project.members.map(m => ({
          userId: m.user._id,
          userName: `${m.user.firstName} ${m.user.lastName}`,
          role: m.role,
          joinedAt: m.joinedAt
        })),
        applicantsCount: project.applicants.length,
        applicants: project.applicants.map(a => ({
          userId: a.user._id,
          userName: `${a.user.firstName} ${a.user.lastName}`,
          status: a.status,
          appliedAt: a.appliedAt
        }))
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Dynamic routes (must come after specific routes)
router.get('/:id', getProject);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);
router.post('/:id/apply', protect, applyToProject);
router.put('/:id/applicants/:applicantId', protect, handleApplication);
router.delete('/:id/members/:memberId', protect, removeMember);

module.exports = router;