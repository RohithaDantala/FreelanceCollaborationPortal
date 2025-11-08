// backend/src/routes/timeTrackingRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const timeTrackingController = require('../controllers/timeTrackingController');

// Start timer
router.post('/start', auth, timeTrackingController.startTimer);

// Stop timer
router.put('/stop/:entryId?', auth, timeTrackingController.stopTimer);

// Get active (running) session
router.get('/active', auth, timeTrackingController.getRunning);

// Create manual entry
router.post('/', auth, timeTrackingController.createEntry);

// Get my time entries
router.get('/', auth, timeTrackingController.getMyEntries);

// Get summary (daily/project stats)
router.get('/summary', auth, timeTrackingController.getSummary);

module.exports = router;
