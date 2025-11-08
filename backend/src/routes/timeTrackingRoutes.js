// backend/src/routes/timeTrackingRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const timeTrackingController = require('../controllers/timeTrackingController');

// Use auth.protect instead of just auth
// Start timer
router.post('/start', auth.protect, timeTrackingController.startTimer);

// Stop timer
router.put('/stop/:entryId?', auth.protect, timeTrackingController.stopTimer);

// Get active (running) session
router.get('/active', auth.protect, timeTrackingController.getRunning);

// Create manual entry
router.post('/', auth.protect, timeTrackingController.createEntry);

// Get my time entries
router.get('/', auth.protect, timeTrackingController.getMyEntries);

// Get summary (daily/project stats)
router.get('/summary', auth.protect, timeTrackingController.getSummary);

module.exports = router;