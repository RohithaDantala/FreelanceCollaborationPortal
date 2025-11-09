// backend/sockets/notificationSocket.js - FIXED VERSION
const User = require('../src/models/User');
const jwt = require('jsonwebtoken');

module.exports = (io) => {
  // Create a separate namespace for notifications
  const notificationNamespace = io.of('/notifications');

  // Authentication middleware
  notificationNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error('Notification socket auth error:', error);
      next(new Error('Authentication error'));
    }
  });

  notificationNamespace.on('connection', (socket) => {
    console.log(`🔔 Notification socket connected: ${socket.user.firstName} (${socket.id})`);

    // Join personal room for notifications
    const userRoom = `user_${socket.user.id}`;
    socket.join(userRoom);
    console.log(`✅ User ${socket.user.firstName} joined notification room: ${userRoom}`);

    socket.on('disconnect', () => {
      console.log(`🔌 Notification socket disconnected: ${socket.user.firstName} (${socket.id})`);
    });
  });

  // Return the namespace for use in other parts of the app
  return notificationNamespace;
};

// Helper function to emit notifications to specific user
module.exports.emitNotificationToUser = (io, userId, notification) => {
  try {
    const notificationNamespace = io.of('/notifications');
    const userRoom = `user_${userId}`;
    
    console.log(`📤 Emitting notification to user ${userId} in room ${userRoom}`);
    console.log('📧 Notification content:', {
      type: notification.type,
      title: notification.title,
      message: notification.message
    });

    notificationNamespace.to(userRoom).emit('new_notification', {
      _id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      sender: notification.sender,
      project: notification.project,
      task: notification.task,
      createdAt: notification.createdAt,
      isRead: notification.isRead
    });

    console.log('✅ Notification emitted successfully');
  } catch (error) {
    console.error('❌ Error emitting notification:', error);
  }
};