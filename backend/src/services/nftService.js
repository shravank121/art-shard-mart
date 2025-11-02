import { wallet } from '../config/blockchain.js';
import { ethers } from 'ethers';
import { errorLogger } from '../utils/logger.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ArtShardNFT = require('../abi/ArtShardNFT.json');
import { provider } from '../config/blockchain.js';

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_ABI = ArtShardNFT.abi; // Add your ABI JSON

export const mintNFTOnBlockchain = async (toAddress, metadataURI) => {
  try {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
    console.log(`[mint] Using contract ${CONTRACT_ADDRESS}`);
    console.log(`[mint] To: ${toAddress}`);
    console.log(`[mint] MetadataURI: ${metadataURI}`);

    // Estimate gas
    let gasEstimate;
    try {
      gasEstimate = await contract.estimateGas.mint(toAddress, metadataURI);
      console.log(`[mint] Estimated gas: ${gasEstimate?.toString?.() || gasEstimate}`);
    } catch (e) {
      console.log('[mint] Gas estimate failed (continuing):', e?.message || e);
    }

    const tx = await contract.mint(toAddress, metadataURI);
    console.log(`[mint] Submitted tx: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`[mint] Mined in block ${receipt.blockNumber}, status=${receipt.status}`);
    console.log(`[mint] Gas used: ${receipt.gasUsed?.toString?.() || receipt.gasUsed}`);
    if (receipt.logs?.length) {
      console.log(`[mint] Log count: ${receipt.logs.length}`);
    }

    console.log('✅ NFT Minted:', tx.hash);
    return tx.hash;
  } catch (error) {
    errorLogger('Blockchain minting error', error);
    throw error;
  }
};

let START_BLOCK = 0;

export const startEventLogging = async () => {
  try {
    if (!CONTRACT_ADDRESS) {
      console.log('[events] CONTRACT_ADDRESS missing, skipping event subscription');
      return;
    }
    // Capture current block to avoid replaying old events on startup
    START_BLOCK = await provider.getBlockNumber();
    const readOnly = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    console.log(`[events] Subscribing to Transfer events for ${CONTRACT_ADDRESS}`);
    readOnly.on('Transfer', async (from, to, tokenId, event) => {
      try {
        const id = tokenId?.toString?.() || tokenId;
        const blockNumber = event?.log?.blockNumber ?? event?.blockNumber;
        // Ignore historical events on startup
        if (typeof blockNumber === 'number' && blockNumber <= START_BLOCK) return;

        const txHash = event?.log?.transactionHash
          || event?.transactionHash
          || (await event.getTransaction())?.hash;
        console.log(`[event:Transfer] from=${from} to=${to} tokenId=${id} block=${blockNumber} tx=${txHash}`);
      } catch (e) {
        console.log('[event:Transfer] received but failed to resolve tx hash:', e?.message || e);
      }
    });
  } catch (error) {
    errorLogger('Start event logging error', error);
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

export const getTxReceipt = async (txHash) => {
  try {
    console.log(`[tx] Fetching receipt for ${txHash}`);
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
      console.log('[tx] Receipt not found (tx might be pending)');
      return null;
    }
    console.log(`[tx] block=${receipt.blockNumber} status=${receipt.status} gasUsed=${receipt.gasUsed?.toString?.() || receipt.gasUsed}`);
    return receipt;
  } catch (error) {
    errorLogger('Get tx receipt error', error);
    throw error;
  }
};
