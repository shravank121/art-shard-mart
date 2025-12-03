import express from 'express';
import { registerUser, loginUser, getStats } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/stats', getStats);

export default router;
