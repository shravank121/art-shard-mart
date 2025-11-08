import express from 'express';
import { mintNFT, getAllNFTs, getTx, uploadToIPFS } from '../controllers/nftController.js';
import { protect } from "../middlewares/authMiddleware.js"
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

router.post('/mint', protect, mintNFT); // Protected route
router.get('/all', getAllNFTs);
router.get('/tx/:hash', getTx);
router.post('/upload', upload.single('image'), uploadToIPFS);

export default router;
