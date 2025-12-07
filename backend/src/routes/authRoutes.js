import express from 'express';
import { registerUser, loginUser, getStats, connectWallet, getConnectedWallets, disconnectWallet } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/stats', getStats);

// Wallet routes (protected - require login)
router.post('/wallet/connect', protect, connectWallet);
router.get('/wallet', protect, getConnectedWallets);
router.post('/wallet/disconnect', protect, disconnectWallet);

export default router;
