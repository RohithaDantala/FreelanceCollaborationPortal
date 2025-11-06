const express = require('express');
const {
  uploadFile,
  getProjectFiles,
  getFile,
  updateFile,
  deleteFile,
  submitDeliverable,
  reviewDeliverable,
  uploadNewVersion,
  downloadFile,
} = require('../controllers/fileController');
const { protect } = require('../middleware/auth');
const { uploadSingle, handleMulterError } = require('../middleware/upload');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Project file routes
router.post(
  '/projects/:projectId/files',
  uploadSingle,
  handleMulterError,
  uploadFile
);
router.get('/projects/:projectId/files', getProjectFiles);

// Individual file routes
router.get('/files/:id', getFile);
router.put('/files/:id', updateFile);
router.delete('/files/:id', deleteFile);
router.get('/files/:id/download', downloadFile);

// Deliverable routes
router.post('/files/:id/submit', submitDeliverable);
router.put('/files/:id/review', reviewDeliverable);

// Version control
router.post(
  '/files/:id/version',
  uploadSingle,
  handleMulterError,
  uploadNewVersion
);

module.exports = router;