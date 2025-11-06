const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: [true, 'Filename is required'],
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    fileType: {
      type: String,
      required: true,
      enum: [
        'image',
        'document',
        'video',
        'audio',
        'archive',
        'code',
        'other',
      ],
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
      min: 0,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    milestone: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      enum: ['general', 'deliverable', 'reference', 'asset', 'report'],
      default: 'general',
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    version: {
      type: Number,
      default: 1,
    },
    previousVersion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      default: null,
    },
    isDeliverable: {
      type: Boolean,
      default: false,
    },
    deliverableStatus: {
      type: String,
      enum: ['pending', 'submitted', 'approved', 'rejected', 'revision_requested'],
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewComments: {
      type: String,
      default: '',
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
fileSchema.index({ project: 1, isActive: 1 });
fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ task: 1 });
fileSchema.index({ isDeliverable: 1, deliverableStatus: 1 });
fileSchema.index({ createdAt: -1 });

// Virtual for file size in MB
fileSchema.virtual('fileSizeMB').get(function () {
  return (this.fileSize / (1024 * 1024)).toFixed(2);
});

// Static method to get file type from mime type
fileSchema.statics.getFileType = function (mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('text') ||
    mimeType.includes('word') ||
    mimeType.includes('excel') ||
    mimeType.includes('powerpoint') ||
    mimeType.includes('presentation')
  ) {
    return 'document';
  }
  if (
    mimeType.includes('zip') ||
    mimeType.includes('rar') ||
    mimeType.includes('tar') ||
    mimeType.includes('7z')
  ) {
    return 'archive';
  }
  if (
    mimeType.includes('javascript') ||
    mimeType.includes('json') ||
    mimeType.includes('xml') ||
    mimeType.includes('html')
  ) {
    return 'code';
  }
  return 'other';
};

// Method to increment download count
fileSchema.methods.incrementDownloadCount = async function () {
  this.downloadCount += 1;
  await this.save({ validateBeforeSave: false });
};

module.exports = mongoose.model('File', fileSchema);