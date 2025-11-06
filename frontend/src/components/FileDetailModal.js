// frontend/src/components/FileDetailModal.js
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateFile,
  deleteFile,
  submitDeliverable,
  reviewDeliverable,
  uploadNewVersion,
  downloadFile,
} from '../redux/slices/fileSlice';

const FileDetailModal = ({ file, projectId, onClose, onUpdate, onDelete }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    description: file.description || '',
    tags: file.tags?.join(', ') || '',
    category: file.category || 'general',
  });

  const [reviewData, setReviewData] = useState({
    status: '',
    comments: '',
  });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newVersionFile, setNewVersionFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const isOwner = file.uploadedBy?._id === user.id;
  const isProjectOwner = file.project?.owner === user.id; // You may need to pass project data

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleUpdate = async () => {
    try {
      const fileData = {
        description: formData.description,
        tags: formData.tags.split(',').map((t) => t.trim()).filter((t) => t),
        category: formData.category,
      };

      await dispatch(updateFile({ id: file._id, fileData })).unwrap();
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      alert('Failed to update file');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await dispatch(deleteFile(file._id)).unwrap();
        onDelete(file._id);
        onClose();
      } catch (error) {
        alert('Failed to delete file');
      }
    }
  };

  const handleDownload = async () => {
    try {
      const result = await dispatch(downloadFile(file._id)).unwrap();
      window.open(result.fileUrl, '_blank');
    } catch (error) {
      alert('Failed to download file');
    }
  };

  const handleSubmitDeliverable = async () => {
    try {
      await dispatch(submitDeliverable(file._id)).unwrap();
      onUpdate();
    } catch (error) {
      alert('Failed to submit deliverable');
    }
  };

  const handleReview = async () => {
    if (!reviewData.status) {
      alert('Please select a review status');
      return;
    }

    try {
      await dispatch(
        reviewDeliverable({
          id: file._id,
          status: reviewData.status,
          comments: reviewData.comments,
        })
      ).unwrap();
      setShowReviewModal(false);
      setReviewData({ status: '', comments: '' });
      onUpdate();
    } catch (error) {
      alert('Failed to review deliverable');
    }
  };

  const handleVersionUpload = async (e) => {
    e.preventDefault();
    if (!newVersionFile) {
      alert('Please select a file');
      return;
    }

    setIsUploading(true);
    const data = new FormData();
    data.append('file', newVersionFile);

    try {
      await dispatch(
        uploadNewVersion({
          id: file._id,
          formData: data,
          onProgress: setUploadProgress,
        })
      ).unwrap();
      setNewVersionFile(null);
      onUpdate();
    } catch (error) {
      alert('Failed to upload new version');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getFileIcon = (fileType) => {
    const icons = {
      image: '🖼️',
      document: '📄',
      video: '🎥',
      audio: '🎵',
      archive: '📦',
      code: '💻',
      other: '📎',
    };
    return icons[fileType] || icons.other;
  };

  const getCategoryBadge = (category) => {
    const badges = {
      general: 'bg-gray-100 text-gray-800',
      deliverable: 'bg-blue-100 text-blue-800',
      reference: 'bg-purple-100 text-purple-800',
      asset: 'bg-green-100 text-green-800',
      report: 'bg-yellow-100 text-yellow-800',
    };
    return badges[category] || badges.general;
  };

  const getDeliverableStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      submitted: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      revision_requested: 'bg-orange-100 text-orange-800',
    };
    return badges[status] || '';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{getFileIcon(file.fileType)}</span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {file.originalName}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryBadge(
                        file.category
                      )}`}
                    >
                      {file.category}
                    </span>
                    {file.isDeliverable && file.deliverableStatus && (
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getDeliverableStatusBadge(
                          file.deliverableStatus
                        )}`}
                      >
                        {file.deliverableStatus.replace('_', ' ')}
                      </span>
                    )}
                    {file.version > 1 && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                        Version {file.version}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl ml-4"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              ⬇️ Download
            </button>

            {(isOwner || isProjectOwner) && (
              <>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50"
                  >
                    ✏️ Edit Details
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleUpdate}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      💾 Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          description: file.description || '',
                          tags: file.tags?.join(', ') || '',
                          category: file.category || 'general',
                        });
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </>
                )}

                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  🗑️ Delete
                </button>
              </>
            )}

            {/* Deliverable Actions */}
            {file.isDeliverable && isOwner && file.deliverableStatus === 'pending' && (
              <button
                onClick={handleSubmitDeliverable}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                📤 Submit for Review
              </button>
            )}

            {file.isDeliverable &&
              isProjectOwner &&
              file.deliverableStatus === 'submitted' && (
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  📝 Review Deliverable
                </button>
              )}
          </div>

          {/* File Preview */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Preview</h3>
            {file.fileType === 'image' ? (
              <img
                src={file.fileUrl}
                alt={file.originalName}
                className="max-w-full max-h-96 mx-auto rounded-lg shadow-md"
              />
            ) : file.fileType === 'document' && file.mimeType === 'application/pdf' ? (
              <div className="text-center">
                <p className="text-gray-600 mb-4">PDF Preview</p>
                <iframe
                  src={file.fileUrl}
                  className="w-full h-96 border rounded-lg"
                  title={file.originalName}
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">{getFileIcon(file.fileType)}</div>
                <p className="text-gray-600">Preview not available for this file type</p>
                <button
                  onClick={handleDownload}
                  className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Download to View
                </button>
              </div>
            )}
          </div>

          {/* File Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Description */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Description
              </h3>
              {isEditing ? (
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Add description..."
                />
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap">
                  {file.description || 'No description provided'}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Category</h3>
              {isEditing ? (
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="general">General</option>
                  <option value="deliverable">Deliverable</option>
                  <option value="reference">Reference</option>
                  <option value="asset">Asset</option>
                  <option value="report">Report</option>
                </select>
              ) : (
                <p className="text-gray-700 capitalize">{file.category}</p>
              )}
            </div>

            {/* File Type */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">File Type</h3>
              <p className="text-gray-700 capitalize">{file.fileType}</p>
            </div>

            {/* File Size */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">File Size</h3>
              <p className="text-gray-700">{formatFileSize(file.fileSize)}</p>
            </div>

            {/* MIME Type */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">MIME Type</h3>
              <p className="text-gray-700 text-sm font-mono">{file.mimeType}</p>
            </div>

            {/* Tags */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Tags</h3>
              {isEditing ? (
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="design, logo, final"
                />
              ) : file.tags && file.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {file.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No tags</p>
              )}
            </div>
          </div>

          {/* Deliverable Review Comments */}
          {file.isDeliverable && file.reviewComments && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Review Comments
              </h3>
              <p className="text-gray-700">{file.reviewComments}</p>
              {file.reviewedBy && (
                <p className="text-sm text-gray-500 mt-2">
                  Reviewed by {file.reviewedBy.firstName} {file.reviewedBy.lastName} on{' '}
                  {new Date(file.reviewedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Upload New Version */}
          {isOwner && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Upload New Version
              </h3>
              <form onSubmit={handleVersionUpload} className="space-y-4">
                <div>
                  <input
                    type="file"
                    onChange={(e) => setNewVersionFile(e.target.files[0])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  {newVersionFile && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected: {newVersionFile.name} (
                      {(newVersionFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                {isUploading && (
                  <div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-primary-600 h-2.5 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{uploadProgress}%</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!newVersionFile || isUploading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : '📤 Upload Version ' + (file.version + 1)}
                </button>
              </form>
            </div>
          )}

          {/* Version History */}
          {file.previousVersion && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Version History
              </h3>
              <div className="space-y-2">
                <div className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">
                        Version {file.previousVersion.version}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(file.previousVersion.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <button className="text-primary-600 hover:text-primary-700 text-sm">
                      View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-6 border-t text-sm text-gray-500 space-y-1">
            <p>
              <strong>Uploaded by:</strong> {file.uploadedBy?.firstName}{' '}
              {file.uploadedBy?.lastName}
            </p>
            <p>
              <strong>Uploaded:</strong> {new Date(file.createdAt).toLocaleString()}
            </p>
            {file.task && (
              <p>
                <strong>Related Task:</strong> {file.task.title}
              </p>
            )}
            <p>
              <strong>Downloads:</strong> {file.downloadCount || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowReviewModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Review Deliverable
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Decision *
                </label>
                <select
                  value={reviewData.status}
                  onChange={(e) =>
                    setReviewData({ ...reviewData, status: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select...</option>
                  <option value="approved">✅ Approve</option>
                  <option value="rejected">❌ Reject</option>
                  <option value="revision_requested">🔄 Request Revision</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments
                </label>
                <textarea
                  value={reviewData.comments}
                  onChange={(e) =>
                    setReviewData({ ...reviewData, comments: e.target.value })
                  }
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Add your feedback..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleReview}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Submit Review
                </button>
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    setReviewData({ status: '', comments: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileDetailModal;