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
    // Validate dependencies
    if (!wallet) {
      throw new Error('Wallet not initialized. Check blockchain configuration.');
    }
    if (!CONTRACT_ADDRESS) {
      throw new Error('CONTRACT_ADDRESS not set in environment variables');
    }
    if (!CONTRACT_ABI) {
      throw new Error('Contract ABI not loaded');
    }

    console.log(`[mint] Wallet: ${wallet ? wallet.address : 'UNDEFINED'}`);
    console.log(`[mint] Contract Address: ${CONTRACT_ADDRESS}`);
    console.log(`[mint] ABI loaded: ${CONTRACT_ABI ? 'YES' : 'NO'}`);
    
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
    console.log(`[mint] Contract instance created: ${contract ? 'YES' : 'NO'}`);
    console.log(`[mint] Contract has mint function: ${typeof contract.mint === 'function' ? 'YES' : 'NO'}`);
    console.log(`[mint] To: ${toAddress}`);
    console.log(`[mint] MetadataURI: ${metadataURI}`);

    // Check if wallet is owner
    try {
      const owner = await contract.owner();
      console.log(`[mint] Contract owner: ${owner}`);
      console.log(`[mint] Wallet is owner: ${owner.toLowerCase() === wallet.address.toLowerCase()}`);
    } catch (e) {
      console.log('[mint] Could not check owner:', e?.message);
    }

    // Estimate gas
    let gasEstimate;
    try {
      gasEstimate = await contract.estimateGas.mint(toAddress, metadataURI);
      console.log(`[mint] Estimated gas: ${gasEstimate?.toString?.() || gasEstimate}`);
    } catch (e) {
      console.log('[mint] Gas estimate failed:', e?.message || e);
      console.log('[mint] Error details:', e);
      throw new Error(`Gas estimation failed: ${e?.message || 'Unknown error'}`);
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
    console.error('[mint] Full error:', error);
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
    // Use a contract with the Transfer event ABI for event subscription
    const EVENT_ABI = [
      'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
    ];
    const readOnlyEvents = new ethers.Contract(CONTRACT_ADDRESS, EVENT_ABI, provider);
    console.log(`[events] Subscribing to Transfer events for ${CONTRACT_ADDRESS}`);
    readOnlyEvents.on('Transfer', async (from, to, tokenId, event) => {
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
    if (!CONTRACT_ADDRESS) throw new Error('CONTRACT_ADDRESS not set');
    const ERC721_ABI = [
      'function ownerOf(uint256 tokenId) view returns (address)',
      'function tokenURI(uint256 tokenId) view returns (string)',
      'function totalSupply() view returns (uint256)'
    ];
    const readOnly = new ethers.Contract(CONTRACT_ADDRESS, ERC721_ABI, provider);

    // Try to get total supply first for efficient querying
    let maxTokenId = 0;
    try {
      const supply = await readOnly.totalSupply();
      maxTokenId = Number(supply);
      console.log(`[nfts] Total supply: ${maxTokenId}`);
    } catch {
      console.log('[nfts] totalSupply not available, falling back to event scanning');
    }

    if (maxTokenId > 0) {
      // Use totalSupply for efficient parallel fetching
      const tokenIds = Array.from({ length: maxTokenId }, (_, i) => i + 1);
      const results = await Promise.all(
        tokenIds.map(async (id) => {
          let owner = '';
          let uri = '';
          try { owner = await readOnly.ownerOf(id); } catch {}
          try { uri = await readOnly.tokenURI(id); } catch {}
          return { id: String(id), name: '', owner: owner || '', uri: uri || '' };
        })
      );
      console.log(`[nfts] Fetched ${results.length} tokens via totalSupply`);
      return results.filter(r => r.owner); // Only return tokens with valid owners
    }

    // Fallback: Discover tokenIds by scanning Transfer logs
    const fromBlockEnv = process.env.DEPLOY_BLOCK ? Number(process.env.DEPLOY_BLOCK) : 0;
    const fromBlock = Number.isFinite(fromBlockEnv) && fromBlockEnv > 0 ? fromBlockEnv : 0;
    const latest = await provider.getBlockNumber();
    console.log(`[nfts] Querying Transfer events from block ${fromBlock} to ${latest}`);
    const evReadOnly = new ethers.Contract(CONTRACT_ADDRESS, [
      'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
    ], provider);
    const transferFilter = evReadOnly.filters.Transfer?.() ?? { address: CONTRACT_ADDRESS, topics: [ethers.id('Transfer(address,address,uint256)')] };
    const events = await evReadOnly.queryFilter(transferFilter, fromBlock, latest).catch(async () => {
      return (await provider.getLogs({ address: CONTRACT_ADDRESS, topics: [ethers.id('Transfer(address,address,uint256)')], fromBlock, toBlock: latest }))
        .map(l => ({ args: { tokenId: l.topics?.[3] ? BigInt(l.topics[3]).toString() : null } }));
    });
    console.log(`[nfts] Transfer events fetched: ${events.length}`);
    const tokenIdSet = new Set();
    for (const ev of events) {
      try {
        const tid = ev?.args?.tokenId?.toString?.() || ev?.args?.tokenId || null;
        if (tid) tokenIdSet.add(String(tid));
      } catch {}
    }

    // Resolve current owner and tokenURI for each tokenId in parallel
    const ids = Array.from(tokenIdSet.values());
    ids.sort((a, b) => BigInt(a) > BigInt(b) ? 1 : -1);
    console.log(`[nfts] Unique tokenIds discovered: ${ids.length}`);
    
    const results = await Promise.all(
      ids.map(async (id) => {
        let owner = '';
        let uri = '';
        try { owner = await readOnly.ownerOf(id); } catch {}
        try { uri = await readOnly.tokenURI(id); } catch {}
        return { id, name: '', owner: owner || '', uri: uri || '' };
      })
    );

    return results.filter(r => r.owner);
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
