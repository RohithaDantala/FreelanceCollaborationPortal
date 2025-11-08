// backend/src/routes/timeRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/timeTrackingController');

// Start a new running timer
router.post('/time/start', protect, ctrl.startTimer);

// Stop running timer (optionally by entryId)
router.post('/time/stop/:entryId?', protect, ctrl.stopTimer);

// Create a manual entry (with start/end)
router.post('/time/entry', protect, ctrl.createEntry);

// Get my entries with optional filters
router.get('/time/entries', protect, ctrl.getMyEntries);

// Get my running timer
router.get('/time/running', protect, ctrl.getRunning);

// Get my time summary (per-day and by project)
router.get('/time/summary', protect, ctrl.getSummary);

module.exports = router;
