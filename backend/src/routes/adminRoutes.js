// backend/src/routes/adminRoutes.js
const express = require('express');
const {
  getDashboardStats,
  getAllUsers,
  toggleUserStatus,
  deleteUser,
  changeUserRole,
  getAllProjects,
  deleteProject,
  getAdminLogs,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/adminAuth');

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(isAdmin);

// Dashboard
router.get('/stats', getDashboardStats);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id/status', toggleUserStatus);
router.put('/users/:id/role', changeUserRole);
router.delete('/users/:id', deleteUser);

// Project management
router.get('/projects', getAllProjects);
router.delete('/projects/:id', deleteProject);

// Admin logs
router.get('/logs', getAdminLogs);

module.exports = router;