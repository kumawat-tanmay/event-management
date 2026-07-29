const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

const app = express();

// 1. Trust Proxy (Important for Rate Limiting behind Load Balancers)
app.set('trust proxy', 1);

// 2. CORS config
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    // Normalize origins (remove trailing slash and convert to lowercase)
    const normalize = (url) => url.replace(/\/$/, '').toLowerCase();
    const normalizedOrigin = normalize(origin);
    
    const isAllowed = allowedOrigins.some(allowed => normalize(allowed) === normalizedOrigin) ||
                      normalizedOrigin.endsWith('.vercel.app') ||
                      normalizedOrigin.startsWith('https://event-management-');

    if (isAllowed) {
      return callback(null, true);
    }
    
    console.warn(`⚠️ CORS blocked origin: ${origin}. Allowed origins:`, allowedOrigins);
    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
};
app.use(cors(corsOptions));

// 3. Performance Middleware
app.use(compression());

// 4. Rate Limiting (Traffic Control)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 10000,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// 5. Security Middleware
app.use(helmet());

// Parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request ID Middleware for Tracing
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});

// Logging Middleware
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined) {
  morgan.token('id', (req) => req.id);
  app.use(morgan(':id :method :url :status :response-time ms - :res[content-length]'));
}

const { csrfTokenHandler } = require('./middlewares/csrfMiddleware');
const connectDB = require('./config/db');

// Ensure database is connected before processing any requests (especially on Vercel Serverless)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

// API Routes
const routes = require('./routes');
app.use('/api', routes);

// CSRF Token endpoint (for frontend compatibility)
app.get('/api/csrf-token', csrfTokenHandler, (req, res) => {
  const token = req.cookies?.['csrf-secret'] || req.cookies?.['XSRF-TOKEN'] || 'csrf_valid';
  res.json({ success: true, csrfToken: token });
});

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Krishna Event ERP API is running' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy' });
});

// Global Error Handler
app.use(notFound);
app.use(errorHandler);

module.exports = app;
