// backend/src/routes/paymentRoutes.js - FIXED
const express = require('express');
const {
  createPayment,
  updatePaymentStatus,
  getProjectPayments,
  getMyPayments,
  getPayment,
  deletePayment,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Payment operations
router.post('/create', createPayment);
router.put('/:id/status', updatePaymentStatus);

// Get payments
router.get('/project/:projectId', getProjectPayments);
router.get('/my-payments', getMyPayments);
router.get('/:id', getPayment);

// Delete payment
router.delete('/:id', deletePayment);

module.exports = router;