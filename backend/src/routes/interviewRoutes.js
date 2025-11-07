const express = require('express');
const {
  proposeInterview,
  approveInterview,
  getAllInterviews,
  getInterview,
  cancelInterview,
} = require('../controllers/interviewController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Propose interview (freelancer)
router.post('/propose', proposeInterview);

// Approve interview (client)
router.post('/:id/approve', approveInterview);

// Get all interviews (for user)
router.get('/', getAllInterviews);

// Get single interview
router.get('/:id', getInterview);

// Cancel interview
router.delete('/:id', cancelInterview);

module.exports = router;