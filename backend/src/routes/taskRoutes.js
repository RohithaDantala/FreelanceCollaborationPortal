const express = require('express');
const {
  createTask,
  getProjectTasks,
  getTask,
  updateTask,
  deleteTask,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  reorderTasks,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Project-level task routes
router.post('/projects/:projectId/tasks', createTask);
router.get('/projects/:projectId/tasks', getProjectTasks);
router.put('/projects/:projectId/tasks/reorder', reorderTasks);

// Individual task routes
router.get('/tasks/:id', getTask);
router.put('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);

// Subtask routes
router.post('/tasks/:id/subtasks', addSubtask);
router.put('/tasks/:id/subtasks/:subtaskId', toggleSubtask);
router.delete('/tasks/:id/subtasks/:subtaskId', deleteSubtask);

module.exports = router;