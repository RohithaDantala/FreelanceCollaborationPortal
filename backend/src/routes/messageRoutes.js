// backend/src/routes/messageRoutes.js - FIXED
const express = require('express');
const {
  getProjectMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  getUnreadCount,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// ✅ FIX: Correct route paths - these get mounted at /api in app.js
// So these become /api/projects/:projectId/messages
router.get('/projects/:projectId/messages/unread', getUnreadCount);
router.get('/projects/:projectId/messages', getProjectMessages);
router.post('/projects/:projectId/messages', sendMessage);
router.put('/messages/:id', editMessage);
router.delete('/messages/:id', deleteMessage);

module.exports = router;