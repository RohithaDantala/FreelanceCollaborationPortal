// backend/src/utils/notificationHelper.js - FIXED VERSION
const Notification = require('../models/Notification');

/**
 * Create and emit notification to user
 * @param {Object} notificationData - Notification data
 * @param {String} notificationData.recipient - User ID to receive notification
 * @param {String} notificationData.sender - User ID sending notification  
 * @param {String} notificationData.type - Type of notification
 * @param {String} notificationData.title - Notification title
 * @param {String} notificationData.message - Notification message
 * @param {String} notificationData.link - Optional link
 * @param {String} notificationData.project - Optional project ID
 * @param {String} notificationData.task - Optional task ID
 */
const createAndEmitNotification = async (notificationData) => {
  try {
    // Create notification in database
    const notification = await Notification.createNotification(notificationData);
    
    if (!notification) {
      console.error('Failed to create notification in database');
      return null;
    }

    // Populate sender info for real-time notification
    await notification.populate('sender', 'firstName lastName avatar');

    console.log('🔔 Created notification:', {
      id: notification._id,
      recipient: notification.recipient,
      type: notification.type,
      title: notification.title
    });

    // Emit to user via socket if available
    if (global.notificationNamespace) {
      const userRoom = `user_${notification.recipient}`;
      
      global.notificationNamespace.to(userRoom).emit('new_notification', {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        sender: notification.sender ? {
          _id: notification.sender._id,
          firstName: notification.sender.firstName,
          lastName: notification.sender.lastName,
          avatar: notification.sender.avatar
        } : null,
        project: notification.project,
        task: notification.task,
        createdAt: notification.createdAt,
        isRead: notification.isRead
      });

      console.log(`✅ Notification emitted to room: ${userRoom}`);
    } else {
      console.warn('⚠️ Notification namespace not available');
    }

    return notification;
  } catch (error) {
    console.error('❌ Error creating/emitting notification:', error);
    return null;
  }
};

module.exports = {
  createAndEmitNotification
};