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

router.get('/projects/:projectId/messages', getProjectMessages);
router.post('/projects/:projectId/messages', sendMessage);
router.put('/messages/:id', editMessage);
router.delete('/messages/:id', deleteMessage);
router.get('/projects/:projectId/messages/unread', getUnreadCount);

module.exports = router;