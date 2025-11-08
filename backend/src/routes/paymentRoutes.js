// backend/src/routes/paymentRoutes.js - FIXED
const express = require('express');
const {
  createPayment,           // FIXED: Changed from createPaymentIntent
  holdInEscrow,
  releasePayment,
  getProjectPayments,      // FIXED: Added this
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Payment operations
router.post('/create', createPayment);              // FIXED: Changed route and function
router.post('/:id/escrow', holdInEscrow);
router.post('/:id/release', releasePayment);

// Get payments - FIXED: Added this route
router.get('/project/:projectId', getProjectPayments);

module.exports = router;

// USAGE IN app.js should be