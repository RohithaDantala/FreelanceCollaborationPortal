// backend/src/routes/timeTrackingRoutes.js - FIXED
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/timeTrackingController');

// ✅ FIXED: Routes now match what frontend expects
// When mounted at /api, these become:
// POST /api/time/start
// POST /api/time/stop
// GET /api/time/running  ✅ This is what your frontend calls!
// POST /api/time/entry
// GET /api/time/entries
// GET /api/time/summary

// Start a new running timer
router.post('/time/start', protect, ctrl.startTimer);

// Stop running timer (optionally by entryId)
router.post('/time/stop/:entryId?', protect, ctrl.stopTimer);

// Get currently running timer ✅ FIXED: This route was missing!
router.get('/time/running', protect, ctrl.getRunning);

// Create a manual entry (with start/end)
router.post('/time/entry', protect, ctrl.createEntry);

// Get my entries with optional filters
router.get('/time/entries', protect, ctrl.getMyEntries);

// Get my time summary (per-day and by project)
router.get('/time/summary', protect, ctrl.getSummary);

module.exports = router;