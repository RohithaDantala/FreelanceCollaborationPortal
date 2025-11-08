// backend/src/routes/interviewRoutes.js - FIXED
const express = require('express');
const { protect } = require('../middleware/auth');
const {
  proposeInterviewDates,
  approveInterviewDate,
  getMyInterviews,
  getInterview,
  cancelInterview,
} = require('../controllers/interviewController');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Propose interview (freelancer)
router.post('/propose', proposeInterviewDates);

// Approve interview (client)
router.post('/:id/approve', approveInterviewDate);

// Get all interviews (for user)
router.get('/', getMyInterviews);

// Get single interview
router.get('/:id', getInterview);

// Cancel interview
router.delete('/:id', cancelInterview);

module.exports = router;