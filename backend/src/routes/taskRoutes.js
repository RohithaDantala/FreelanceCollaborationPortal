// backend/src/routes/taskRoutes.js - FIXED
const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createTask,
  getProjectTasks,
  getTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Project-level task routes
router.post('/projects/:projectId/tasks', createTask);
router.get('/projects/:projectId/tasks', getProjectTasks);

// Individual task routes
router.get('/tasks/:id', getTask);
router.put('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);

module.exports = router;