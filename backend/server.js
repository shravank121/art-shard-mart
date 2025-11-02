import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import bodyParser from 'body-parser';

import authRoutes from './src/routes/authRoutes.js';
import nftRoutes from './src/routes/nftRoutes.js';
import { initBlockchain } from './src/config/blockchain.js';
import { startEventLogging } from './src/services/nftService.js';
import { connectDB } from './src/config/db.js';
import { errorLogger } from './src/utils/logger.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Connect to MongoDB
connectDB();

// Initialize blockchain
initBlockchain();
// Start on-chain event subscriptions (logs to console)
startEventLogging();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/nft', nftRoutes);

// Root route
app.get('/', (req, res) => {
  try {
    res.send(' Art Shard Mart Backend API Running ');
  } catch (err) {
    errorLogger('Root route error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  errorLogger('Global error', err);
  res.status(500).json({ error: 'Server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
