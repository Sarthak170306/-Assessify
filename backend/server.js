require('dotenv').config();
const express = require('express');
const cors = require('cors');
const prisma = require('./src/config/prisma');

// Import Security Middleware
const {
  securityHeaders,
  apiRateLimiter,
  sanitizeInputBody,
  structuredErrorHandler
} = require('./src/middleware/security');

// Import Routes
const userRoutes = require('./src/routes/userRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const quizRoutes = require('./src/routes/quizRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const attemptRoutes = require('./src/routes/attemptRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const leaderboardRoutes = require('./src/routes/leaderboardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Security HTTP Headers
app.use(securityHeaders);

// 2. CORS configuration supporting dynamic production origins & local dev
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in fallback for API deployment
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-clerk-user-id', 'x-requested-with']
}));

// OPTIONS Preflight Handler
app.options('*', cors());

// 3. Rate Limiter Middleware
app.use('/api', apiRateLimiter);

// 4. Body parsing & Input Sanitization
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(sanitizeInputBody);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Ping Database
    await prisma.$queryRaw`SELECT 1`;
    
    return res.status(200).json({
      status: 'OK',
      service: 'Assessify AI Backend API',
      version: '1.0.0',
      database: 'Connected (Supabase PostgreSQL)',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (dbError) {
    console.error('Health check DB error:', dbError.message);
    return res.status(500).json({
      status: 'ERROR',
      service: 'Assessify AI Backend API',
      database: 'Disconnected',
      error: dbError.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 5. API Routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Root route redirect/info
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Assessify AI Backend API',
    health: '/api/health',
    docs: 'Assessify AI API Services'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NotFound',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// 6. Global Structured Error Handler
app.use(structuredErrorHandler);

// Start Express Server
app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 Assessify AI Backend Server Running`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=================================`);
});
