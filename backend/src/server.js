
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

// ✅ FIX: Initialize Socket.io with proper CORS
const socketIO = require('socket.io');

const allowedOrigins = [
  'https://freelance-collaboration-portal.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.CLIENT_URL,
].filter(url => url && url.trim());

const io = socketIO(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Check if origin is allowed or is a Vercel deployment
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        return origin === allowedOrigin || origin.endsWith('.vercel.app');
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn('❌ Socket.io blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'], // Allow both transports
});

console.log('🔐 Socket.io CORS origins:', allowedOrigins);

// ✅ FIX: Use the chat socket handler with corrected imports
require('../sockets/chatSocket')(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🔌 Socket.io initialized with CORS for:`, allowedOrigins);
  
  // Start cron jobs
  try {
    startDeadlineReminderJob();
  } catch (e) {
    console.warn('⚠️  Failed to start deadline reminder jobs:', e.message);
  }
});

// Notification scheduler (optional)
try {
  const notificationScheduler = require('./services/notificationScheduler');
  notificationScheduler.initializeSchedulers();
} catch (e) {
  console.warn('⚠️  Notification scheduler not available:', e.message);
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
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