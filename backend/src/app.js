const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// API routes
try {
  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/users', require('./routes/userRoutes'));
  app.use('/api/projects', require('./routes/projectRoutes'));
  app.use('/api', require('./routes/taskRoutes')); // Task routes
  app.use('/api', require('./routes/fileRoutes')); // File routes
  app.use('/api/notifications', require('./routes/notificationRoutes'));
  app.use('/api', require('./routes/milestoneRoutes'));
  app.use('/api/admin', require('./routes/adminRoutes'));
  app.use('/api/reports', require('./routes/reportRoutes'));
  app.use('/api/comments', require('./routes/commentRoutes'));
  app.use('/api', require('./routes/messageRoutes')); // Message routes
  app.use('/api/payments', require('./routes/paymentRoutes'));
  app.use('/api/interviews', require('./routes/interviewRoutes')); // Interview routes
  
  // FIXED: Use only ONE time tracking route file
  app.use('/api/time-tracking', require('./routes/timeTrackingRoutes'));
  
} catch (error) {
  console.warn('⚠️ Some routes not found — create them under src/routes/');
}

// 404 handler - must be after all routes
app.use(notFound);
// Error handler - must be last
app.use(errorHandler);

module.exports = app;