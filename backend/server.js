import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';

import authRoutes from './src/routes/authRoutes.js';
import nftRoutes from './src/routes/nftRoutes.js';
import { initBlockchain } from './src/config/blockchain.js';
import { startEventLogging } from './src/services/nftService.js';
import { connectDB } from './src/config/db.js';
import { errorLogger } from './src/utils/logger.js';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGO_URI'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || (isProduction ? false : '*'),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 100 : 1000, // Limit each IP
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth-specific rate limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 20 : 100, // Stricter limit for auth routes
  message: { error: 'Too many authentication attempts, please try again later.' },
});

// Middlewares
app.use(cors(corsOptions));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Logging - use 'combined' in production for more details
app.use(morgan(isProduction ? 'combined' : 'dev'));

// Connect to MongoDB
connectDB();

// Initialize blockchain
initBlockchain();
// Start on-chain event subscriptions (logs to console)
startEventLogging();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/nft', nftRoutes);

// Root route
app.get('/', (req, res) => {
  try {
    res.json({ 
      message: 'Art Shard Mart Backend API Running',
      version: '1.0.0',
      docs: '/health'
    });
  } catch (err) {
    errorLogger('Root route error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  errorLogger('Global error', err);
  res.status(err.status || 500).json({ 
    error: isProduction ? 'Server error' : err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (${isProduction ? 'production' : 'development'})`);
});
