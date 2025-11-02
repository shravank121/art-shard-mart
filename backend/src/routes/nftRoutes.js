import express from 'express';
import { mintNFT, getAllNFTs, getTx } from '../controllers/nftController.js';
import { protect } from "../middlewares/authMiddleware.js"

const router = express.Router();

router.post('/mint', protect, mintNFT); // Protected route
router.get('/all', getAllNFTs);
router.get('/tx/:hash', getTx);

export default router;
