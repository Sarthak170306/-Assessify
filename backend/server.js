require('dotenv').config();
const express = require('express');
const cors = require('cors');
const prisma = require('./src/config/prisma');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred on the server.'
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 Assessify AI Backend Server Running`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=================================`);
});
