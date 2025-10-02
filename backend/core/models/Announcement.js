const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
    maxlength: [2000, 'Content cannot exceed 2000 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  targetRoles: [{
    type: String,
    enum: ['user', 'manager', 'admin', 'all'],
    default: 'all'
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  expiresAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  storeId: {
    type: String,
    index: true
  },
  storeName: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
announcementSchema.index({ isActive: 1, targetRoles: 1, expiresAt: 1 });
announcementSchema.index({ storeId: 1, isActive: 1 });

module.exports = mongoose.model('Announcement', announcementSchema);
