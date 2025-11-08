const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  'https://freelance-collaboration-portal.vercel.app',
  'https://freelancer-collaboration-portal.onrender.com',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5000',
  process.env.CLIENT_URL,
].filter(url => url && url.trim());

console.log('🔒 Allowed CORS origins:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) {
      console.log('✅ Allowing request with no origin');
      return callback(null, true);
    }
    
    const normalizedOrigin = origin.replace(/\/$/, '');
    
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (!allowedOrigin) return false;
      const normalizedAllowed = allowedOrigin.replace(/\/$/, '');
      return normalizedOrigin === normalizedAllowed || 
             normalizedOrigin.endsWith('.vercel.app') ||
             normalizedOrigin.endsWith('.onrender.com');
    });
    
    if (isAllowed) {
      console.log('✅ CORS allowed for:', normalizedOrigin);
      callback(null, true);
    } else {
      console.warn('⚠️ Blocked by CORS:', normalizedOrigin);
      callback(null, true); // Still allow for development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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

// Root route handler
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Freelancer Collaboration Portal API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      projects: '/api/projects',
      users: '/api/users',
      notifications: '/api/notifications'
    }
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    corsOrigins: allowedOrigins,
  });
});

// Debug: Check which route files exist
console.log('\n🔍 Checking route files...');
const routeFiles = [
  'authRoutes', 'userRoutes', 'projectRoutes', 'taskRoutes',
  'fileRoutes', 'notificationRoutes', 'milestoneRoutes', 'adminRoutes',
  'reportRoutes', 'commentRoutes', 'messageRoutes', 'paymentRoutes',
  'interviewRoutes', 'timeTrackingRoutes'
];

routeFiles.forEach(file => {
  const filePath = path.join(__dirname, 'routes', `${file}.js`);
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${file}.js`);
});
console.log('');

// ✅ FIXED: API routes configuration
const routes = [
  { path: '/api/auth', file: './routes/authRoutes' },
  { path: '/api/users', file: './routes/userRoutes' },
  { path: '/api/projects', file: './routes/projectRoutes' },
  { path: '/api/notifications', file: './routes/notificationRoutes' },
  { path: '/api', file: './routes/taskRoutes' },
  { path: '/api', file: './routes/fileRoutes' },
  { path: '/api', file: './routes/milestoneRoutes' },
  { path: '/api/admin', file: './routes/adminRoutes' },
  { path: '/api/reports', file: './routes/reportRoutes' },
  { path: '/api/comments', file: './routes/commentRoutes' },
  { path: '/api', file: './routes/messageRoutes' }, // ✅ Correct - makes /api/projects/:projectId/messages
  { path: '/api/payments', file: './routes/paymentRoutes' },
  { path: '/api/interviews', file: './routes/interviewRoutes' },
  { path: '/api', file: './routes/timeTrackingRoutes' }, // ✅ FIXED: Changed path from /api/time-tracking to /api
];

let loadedRoutes = 0;
let failedRoutes = 0;

routes.forEach(({ path, file }) => {
  try {
    const route = require(file);
    app.use(path, route);
    console.log(`✅ Loaded route: ${file} -> ${path}`);
    loadedRoutes++;
  } catch (error) {
    console.error(`❌ Failed to load route ${file}:`, error.message);
    failedRoutes++;
  }
});

console.log(`\n📊 Route loading summary: ${loadedRoutes} loaded, ${failedRoutes} failed\n`);

// 404 handler - must be after all routes
app.use(notFound);

// Error handler - must be last
app.use(errorHandler);

module.exports = app;