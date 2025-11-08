// backend/src/config/socket.js
let io = null;

const initSocketIO = (socketIO) => {
  io = socketIO;
  console.log('✅ Socket.IO initialized in config');
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized! Call initSocketIO first.');
  }
  return io;
};

const emitToProject = (projectId, event, data) => {
  if (io) {
    io.to(`project_${projectId}`).emit(event, data);
    console.log(`📡 Emitted ${event} to project_${projectId}`);
  } else {
    console.warn('⚠️ Socket.io not initialized, cannot emit to project');
  }
};

const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
    console.log(`📡 Emitted ${event} to user_${userId}`);
  } else {
    console.warn('⚠️ Socket.io not initialized, cannot emit to user');
  }
};

module.exports = {
  initSocketIO,
  getIO,
  emitToProject,
  emitToUser,
};