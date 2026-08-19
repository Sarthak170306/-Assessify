/**
 * Assessify AI - Security Hardening & Input Sanitization Middleware
 */

// 1. Secure HTTP Headers Middleware
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
};

// 2. In-Memory Rate Limiter Generator
const createRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
  const max = options.max || 100; // limit per window
  const message = options.message || 'Too many requests from this IP, please try again later.';

  const requestCounts = new Map();

  // Periodic cleanup
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of requestCounts.entries()) {
      if (now - data.startTime > windowMs) {
        requestCounts.delete(ip);
      }
    }
  }, windowMs);

  return (req, res, next) => {
    const clientKey = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();

    if (!requestCounts.has(clientKey)) {
      requestCounts.set(clientKey, { count: 1, startTime: now });
      return next();
    }

    const data = requestCounts.get(clientKey);

    if (now - data.startTime > windowMs) {
      // Window expired, reset
      requestCounts.set(clientKey, { count: 1, startTime: now });
      return next();
    }

    data.count += 1;

    if (data.count > max) {
      return res.status(429).json({
        success: false,
        error: 'TooManyRequests',
        message
      });
    }

    next();
  };
};

const apiRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 300 });
const aiRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 30, message: 'AI generation rate limit exceeded. Please wait a few minutes.' });
const authRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 50 });

// 3. Input Sanitization Helper & Middleware
const sanitizeValue = (val) => {
  if (typeof val === 'string') {
    // Remove script tags and basic malicious vectors
    return val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();
  }
  if (val !== null && typeof val === 'object') {
    for (const k of Object.keys(val)) {
      val[k] = sanitizeValue(val[k]);
    }
  }
  return val;
};

const sanitizeInputBody = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  next();
};

// 4. Quiz Submission Payload Schema Validator
const validateSubmissionPayload = (req, res, next) => {
  const { quizId, answers } = req.body;
  const targetQuizId = quizId || req.params.id || req.params.quizId;

  if (!targetQuizId || typeof targetQuizId !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'BadRequest',
      message: 'quizId is required and must be a valid string.'
    });
  }

  if (answers && typeof answers !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'BadRequest',
      message: 'answers must be a valid key-value map object.'
    });
  }

  next();
};

// 5. Structured Error Handler
const structuredErrorHandler = (err, req, res, next) => {
  console.error('Unhandled Error Middleware:', err.stack || err.message);
  
  const statusCode = err.status || err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected server error occurred.'
  });
};

module.exports = {
  securityHeaders,
  apiRateLimiter,
  aiRateLimiter,
  authRateLimiter,
  sanitizeInputBody,
  validateSubmissionPayload,
  structuredErrorHandler
};
