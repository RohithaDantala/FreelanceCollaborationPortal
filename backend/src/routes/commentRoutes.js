const express = require('express');
const {
  createComment,
  getComments,
  updateComment,
  deleteComment,
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', createComment);
router.get('/', getComments);
router.put('/:id', updateComment);
router.delete('/:id', deleteComment);

module.exports = router;