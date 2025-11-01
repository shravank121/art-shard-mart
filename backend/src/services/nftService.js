import { wallet } from '../config/blockchain.js';
import { ethers } from 'ethers';
import { errorLogger } from '../utils/logger.js';

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_ABI = []; // Add your ABI JSON

export const mintNFTOnBlockchain = async (toAddress, metadataURI) => {
  try {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
    console.log(`Minting NFT for: ${toAddress} with metadata: ${metadataURI}`);

    const tx = await contract.mint(toAddress, metadataURI);
    await tx.wait();

    console.log('✅ NFT Minted:', tx.hash);
    return tx.hash;
  } catch (error) {
    errorLogger('Blockchain minting error', error);
    throw error;
  }
};

export const fetchAllNFTs = async () => {
  try {
    // TODO: Fetch actual NFTs from blockchain
    return [
      { id: 1, name: 'Art #1', owner: '0x123...', uri: 'ipfs://xyz' },
      { id: 2, name: 'Art #2', owner: '0x456...', uri: 'ipfs://abc' },
    ];
  } catch (error) {
    errorLogger('Fetch all NFTs error', error);
    throw error;
  }
};
