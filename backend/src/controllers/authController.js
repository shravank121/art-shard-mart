import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { errorLogger } from '../utils/logger.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const user = await User.create({ username, email, password });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id)
    });
  } catch (error) {
    errorLogger('Register user error', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id)
    });
  } catch (error) {
    errorLogger('Login user error', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Get platform stats (user count)
export const getStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.status(200).json({
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    errorLogger('Get stats error', error);
    res.status(500).json({ error: 'Failed to get stats', userCount: 0 });
  }
};

// Connect wallet to user account (requires authentication)
export const connectWallet = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    const userId = req.user._id;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Validate wallet address format (basic check)
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if wallet is already connected to this user
    const existingWallet = user.connectedWallets.find(
      w => w.address.toLowerCase() === walletAddress.toLowerCase()
    );

    if (existingWallet) {
      // Update lastUsed timestamp
      existingWallet.lastUsed = new Date();
      await user.save();
      return res.status(200).json({
        message: 'Wallet already connected',
        walletCount: user.connectedWallets.length,
        wallets: user.connectedWallets
      });
    }

    // Add new wallet
    user.connectedWallets.push({
      address: walletAddress.toLowerCase(),
      connectedAt: new Date(),
      lastUsed: new Date()
    });

    await user.save();

    res.status(200).json({
      message: 'Wallet connected successfully',
      walletCount: user.connectedWallets.length,
      wallets: user.connectedWallets
    });
  } catch (error) {
    errorLogger('Connect wallet error', error);
    res.status(500).json({ error: 'Failed to connect wallet' });
  }
};

// Get user's connected wallets
export const getConnectedWallets = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('connectedWallets');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      walletCount: user.connectedWallets.length,
      wallets: user.connectedWallets
    });
  } catch (error) {
    errorLogger('Get wallets error', error);
    res.status(500).json({ error: 'Failed to get wallets' });
  }
};

// Disconnect a wallet from user account
export const disconnectWallet = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    const userId = req.user._id;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const walletIndex = user.connectedWallets.findIndex(
      w => w.address.toLowerCase() === walletAddress.toLowerCase()
    );

    if (walletIndex === -1) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    user.connectedWallets.splice(walletIndex, 1);
    await user.save();

    res.status(200).json({
      message: 'Wallet disconnected successfully',
      walletCount: user.connectedWallets.length,
      wallets: user.connectedWallets
    });
  } catch (error) {
    errorLogger('Disconnect wallet error', error);
    res.status(500).json({ error: 'Failed to disconnect wallet' });
  }
};
