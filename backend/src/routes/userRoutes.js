const express = require('express');
const {
  getUserProfile,
  updateProfile,
  updateAvatar,
  changePassword,
  deleteAccount,
  getAllUsers,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getAllUsers);
router.get('/:id', getUserProfile);

// Protected routes
router.put('/profile', protect, updateProfile);
router.put('/avatar', protect, updateAvatar);
router.put('/change-password', protect, changePassword);
router.delete('/account', protect, deleteAccount);

module.exports = router;