const express = require('express');
const {
  createPaymentIntent,
  holdInEscrow,
  releasePayment,
  requestRefund,
  createDispute,
  getProjectPayments,
  getMyPayments,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Payment operations
router.post('/create-intent', createPaymentIntent);
router.post('/:id/escrow', holdInEscrow);
router.post('/:id/release', releasePayment);
router.post('/:id/refund', requestRefund);
router.post('/:id/dispute', createDispute);

// Get payments
router.get('/my-payments', getMyPayments);

module.exports = router;