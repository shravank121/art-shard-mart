import { mintNFTOnBlockchain, fetchAllNFTs } from '../services/nftService.js';
import { errorLogger } from '../utils/logger.js';

export const mintNFT = async (req, res) => {
  try {
    const { toAddress, metadataURI } = req.body;
    if (!toAddress || !metadataURI) {
      return res.status(400).json({ error: 'toAddress and metadataURI are required' });
    }

    const txHash = await mintNFTOnBlockchain(toAddress, metadataURI);
    res.status(200).json({ success: true, txHash });
  } catch (error) {
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
