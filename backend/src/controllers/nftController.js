import { mintNFTOnBlockchain, fetchAllNFTs, getTxReceipt } from '../services/nftService.js';
import { ethers } from 'ethers';
import { errorLogger } from '../utils/logger.js';

export const mintNFT = async (req, res) => {
  try {
    console.log('\n🎨 ========== MINT REQUEST RECEIVED ==========');
    console.log('📍 From User:', req.user?.email || req.user?.username || 'Unknown');
    
    const { toAddress, metadataURI } = req.body;
    console.log('📬 To Address:', toAddress);
    console.log('📝 Metadata URI:', metadataURI);
    
    if (!toAddress || !metadataURI) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ error: 'toAddress and metadataURI are required' });
    }
    if (!ethers.isAddress(toAddress)) {
      console.log('❌ Invalid address format');
      return res.status(400).json({ error: 'Invalid recipient address. Please provide a 0x… address (ENS not supported on this network).' });
    }

    console.log('🚀 Starting blockchain mint...\n');
    const txHash = await mintNFTOnBlockchain(toAddress, metadataURI);
    
    console.log('\n✅ ========== MINT SUCCESS ==========');
    console.log('🔗 Transaction Hash:', txHash);
    console.log('🌐 View on Etherscan: https://sepolia.etherscan.io/tx/' + txHash);
    console.log('==========================================\n');
    
    res.status(200).json({ success: true, txHash });
  } catch (error) {
    console.log('\n❌ ========== MINT FAILED ==========');
    console.log('Error:', error.message || error);
    console.log('=====================================\n');
    errorLogger('Mint NFT error', error);
    res.status(500).json({ error: 'Minting failed' });
  }
};

export const getAllNFTs = async (req, res) => {
  try {
    const nfts = await fetchAllNFTs();
    res.status(200).json(nfts);
  } catch (error) {
    errorLogger('Fetch NFTs error', error);
    res.status(500).json({ error: 'Failed to fetch NFTs' });
  }
};

export const getTx = async (req, res) => {
  try {
    const { hash } = req.params;
    if (!hash) return res.status(400).json({ error: 'hash param required' });
    const receipt = await getTxReceipt(hash);
    if (!receipt) return res.status(202).json({ pending: true });

    // Convert BigInt fields to strings for safe JSON serialization
    const safe = {
      to: receipt.to,
      from: receipt.from,
      contractAddress: receipt.contractAddress || null,
      transactionHash: receipt.transactionHash,
      blockHash: receipt.blockHash,
      blockNumber: typeof receipt.blockNumber === 'bigint' ? receipt.blockNumber.toString() : receipt.blockNumber,
      index: typeof receipt.index === 'bigint' ? receipt.index.toString() : receipt.index,
      status: receipt.status,
      type: receipt.type,
      cumulativeGasUsed: receipt.cumulativeGasUsed?.toString?.() || receipt.cumulativeGasUsed,
      gasUsed: receipt.gasUsed?.toString?.() || receipt.gasUsed,
      logsBloom: receipt.logsBloom,
      logs: Array.isArray(receipt.logs) ? receipt.logs.map((l) => ({
        address: l.address,
        data: l.data,
        topics: l.topics,
        index: typeof l.index === 'bigint' ? l.index.toString() : l.index,
        transactionHash: l.transactionHash,
        blockHash: l.blockHash,
        blockNumber: typeof l.blockNumber === 'bigint' ? l.blockNumber.toString() : l.blockNumber,
      })) : [],
    };

    res.status(200).json(safe);
  } catch (error) {
    errorLogger('Get tx error', error);
    res.status(500).json({ error: 'Failed to get tx receipt' });
  }
};
