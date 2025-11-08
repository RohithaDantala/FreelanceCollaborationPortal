require('dotenv').config();
const app = require('./app');
const http = require('http');
const connectDB = require('./config/database');
const { initializeSocket } = require('./config/socket');
const { startDeadlineReminderJob } = require('./jobs/deadlineReminder');

// Handle uncaught exceptions
process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Connect to database
connectDB();
const server = http.createServer(app);
initializeSocket(server);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log(`Socket.io initialized`);
  // Start cron jobs
  try {
    startDeadlineReminderJob();
  } catch (e) {
    console.warn('Failed to start deadline reminder jobs:', e.message);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', err => {
  console.error('UN HANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});