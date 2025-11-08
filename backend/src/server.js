// backend/src/server.js - FIXED
require('dotenv').config();
const app = require('./app');
const http = require('http');
const connectDB = require('./config/database');
const { startDeadlineReminderJob } = require('./jobs/deadlineReminder');

// Handle uncaught exceptions
process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Connect to database
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io with the chat socket handler
const socketIO = require('socket.io');
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Use the chatSocket handler (the better implementation)
require('../sockets/chatSocket')(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🔌 Socket.io initialized`);
  
  // Start cron jobs
  try {
    startDeadlineReminderJob();
  } catch (e) {
    console.warn('⚠️  Failed to start deadline reminder jobs:', e.message);
  }
});

// Notification scheduler
const notificationScheduler = require('./services/notificationScheduler');
notificationScheduler.initializeSchedulers();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  notificationScheduler.stopAll();
  server.close(() => {
    console.log('HTTP server closed');
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', err => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});