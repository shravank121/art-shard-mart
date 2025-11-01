import { ethers } from 'ethers';
import { errorLogger } from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

let provider;
let wallet;

export const initBlockchain = () => {
  try {
    provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    console.log(' Connected to blockchain network');
  } catch (error) {
    errorLogger('Blockchain connection error', error);
  }
};

export { provider, wallet };
