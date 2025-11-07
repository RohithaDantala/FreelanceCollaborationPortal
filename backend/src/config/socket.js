// backend/src/config/socket.js
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Join project room
    socket.on('join_project', (projectId) => {
      socket.join(`project_${projectId}`);
      console.log(`User ${socket.userId} joined project ${projectId}`);
    });

    // Leave project room
    socket.on('leave_project', (projectId) => {
      socket.leave(`project_${projectId}`);
      console.log(`User ${socket.userId} left project ${projectId}`);
    });

    // Send message
    socket.on('send_message', async (data) => {
      const { projectId, message, type } = data;
      
      // Broadcast to project room
      io.to(`project_${projectId}`).emit('receive_message', {
        userId: socket.userId,
        message,
        type,
        timestamp: new Date(),
      });
    });

    // Typing indicator
    socket.on('typing', (data) => {
      socket.to(`project_${data.projectId}`).emit('user_typing', {
        userId: socket.userId,
        projectId: data.projectId,
      });
    });

    // Stop typing
    socket.on('stop_typing', (data) => {
      socket.to(`project_${data.projectId}`).emit('user_stop_typing', {
        userId: socket.userId,
        projectId: data.projectId,
      });
    });

    // Real-time task updates
    socket.on('task_updated', (data) => {
      socket.to(`project_${data.projectId}`).emit('task_update', data);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Helper functions for emitting events
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
};

const emitToProject = (projectId, event, data) => {
  if (io) {
    io.to(`project_${projectId}`).emit(event, data);
  }
};

module.exports = { initializeSocket, getIO, emitToUser, emitToProject };