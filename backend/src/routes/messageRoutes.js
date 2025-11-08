// backend/src/routes/messageRoutes.js
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

// IMPORTANT: More specific routes MUST come before general routes
router.get('/projects/:projectId/messages/unread', getUnreadCount); // ✅ Specific route first
router.get('/projects/:projectId/messages', getProjectMessages);
router.post('/projects/:projectId/messages', sendMessage);
router.put('/messages/:id', editMessage);
router.delete('/messages/:id', deleteMessage);

module.exports = router;