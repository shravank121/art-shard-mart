import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { useWallet } from "./WalletContext";
import {
  SEPOLIA_NFT_ADDRESS,
  SEPOLIA_MARKETPLACE_ADDRESS,
  SEPOLIA_FRACTIONALIZE_ADDRESS,
  SEPOLIA_FRACTION_MARKETPLACE_ADDRESS,
  NFT_ABI,
  MARKETPLACE_ABI,
  FRACTIONALIZE_ABI,
  FRACTION_TOKEN_ABI,
  FRACTION_MARKETPLACE_ABI,
} from "@/config/contracts";

// Fallback RPC endpoint (only used if MetaMask not available)
const FALLBACK_RPC = "https://sepolia.infura.io/v3/bef97c7d99a241579f118d6b1bb576bd";

const CACHE_DURATION = 180000; // 3 minute cache to reduce calls

// Helper to add delay between calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Get provider - prefer MetaMask's provider to avoid rate limits
const getProvider = (): ethers.Provider => {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    return new ethers.BrowserProvider((window as any).ethereum);
  }
  return new ethers.JsonRpcProvider(FALLBACK_RPC);
};

interface NFTData {
  id: number;
  name?: string;
  image?: string;
  owner: string;
}

interface FractionHolding {
  vaultId: number;
  tokenId: number;
  title: string;
  image: string;
  sharesOwned: string;
  totalShares: string;
  reservePrice: string;
  fractionToken: string;
  ownershipPercent: number;
}

interface NFTListing {
  tokenId: number;
  seller: string;
  priceEth: string;
  name?: string;
  image?: string;
}

interface ShareListing {
  listingId: number;
  seller: string;
  fractionToken: string;
  amount: string;
  pricePerShare: string;
  totalPrice: string;
  tokenName?: string;
  tokenSymbol?: string;
  nftImage?: string;
  nftName?: string;
  vaultId?: number;
}

interface DataContextType {
  myNFTs: NFTData[];
  myFractions: FractionHolding[];
  nftListings: NFTListing[];
  shareListings: ShareListing[];
  loading: boolean;
  loadingMarketplace: boolean;
  lastUpdated: number | null;
  marketplaceLastUpdated: number | null;
  refreshData: () => Promise<void>;
  refreshMarketplace: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { account } = useWallet();
  const [myNFTs, setMyNFTs] = useState<NFTData[]>([]);
  const [myFractions, setMyFractions] = useState<FractionHolding[]>([]);
  const [nftListings, setNftListings] = useState<NFTListing[]>([]);
  const [shareListings, setShareListings] = useState<ShareListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMarketplace, setLoadingMarketplace] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [marketplaceLastUpdated, setMarketplaceLastUpdated] = useState<number | null>(null);
  
  // Use refs to avoid stale closure issues in useCallback
  const lastUpdatedRef = useRef<number | null>(null);
  const marketplaceLastUpdatedRef = useRef<number | null>(null);

  const resolveIpfs = (uri?: string) => {
    if (!uri) return "";
    if (uri.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${uri.replace("ipfs://", "")}`;
    return uri;
  };



  const loadData = useCallback(async (force = false) => {
    if (!account) {
      setMyNFTs([]);
      setMyFractions([]);
      return;
    }

    // Skip if recently loaded and not forced
    if (!force && lastUpdatedRef.current && Date.now() - lastUpdatedRef.current < CACHE_DURATION) {
      return;
    }

    setLoading(true);
    const provider = getProvider();

    try {
      // Load NFTs
      const nft = new ethers.Contract(SEPOLIA_NFT_ADDRESS, NFT_ABI, provider);
      let maxTokenId = 50;
      try {
        const supply = await nft.totalSupply();
        maxTokenId = Math.min(Number(supply), 100);
      } catch {}

      if (maxTokenId > 0) {
        const nfts: NFTData[] = [];
        // Process in smaller batches with delays to avoid rate limiting
        const batchSize = 5;
        for (let start = 1; start <= maxTokenId; start += batchSize) {
          const end = Math.min(start + batchSize - 1, maxTokenId);
          const batch = Array.from({ length: end - start + 1 }, (_, i) => start + i);
          
          const results = await Promise.allSettled(
            batch.map(async (id) => {
              const owner = await nft.ownerOf(id);
              if (owner.toLowerCase() !== account.toLowerCase()) return null;
              let name: string | undefined, image: string | undefined;
              try {
                const uri = await nft.tokenURI(id);
                const res = await fetch(resolveIpfs(uri));
                const meta = await res.json();
                name = meta?.name;
                image = resolveIpfs(meta?.image || meta?.image_url);
              } catch {}
              return { id, name, image, owner };
            })
          );
          
          for (const result of results) {
            if (result.status === "fulfilled" && result.value !== null) {
              nfts.push(result.value);
            }
          }
          
          // Small delay between batches
          if (end < maxTokenId) await delay(200);
        }
        setMyNFTs(nfts);
      } else {
        setMyNFTs([]);
      }

      // Load fractions
      if (SEPOLIA_FRACTIONALIZE_ADDRESS) {
        const frac = new ethers.Contract(SEPOLIA_FRACTIONALIZE_ADDRESS, FRACTIONALIZE_ABI, provider);
        const nftContract = new ethers.Contract(SEPOLIA_NFT_ADDRESS, NFT_ABI, provider);
        const count = await frac.vaultCount();
        const holdings: FractionHolding[] = [];

        // Process vaults sequentially with delays to avoid rate limiting
        for (let i = 1; i <= Number(count); i++) {
          try {
            await delay(100); // Small delay between vault calls
            const v = await frac.getVault(i);
            if (v.fractionToken === ethers.ZeroAddress || v.isRedeemed) continue;

            await delay(100);
            const token = new ethers.Contract(v.fractionToken, FRACTION_TOKEN_ABI, provider);
            const balance = await token.balanceOf(account);
            const balanceNum = parseFloat(ethers.formatUnits(balance, 18));

            if (balanceNum > 0) {
              const totalShares = ethers.formatUnits(v.totalShares, 18);
              let title = `NFT #${v.tokenId}`, image = "";
              try {
                const uri = await nftContract.tokenURI(v.tokenId);
                const res = await fetch(resolveIpfs(uri));
                const meta = await res.json();
                title = meta?.name || title;
                image = resolveIpfs(meta?.image || meta?.image_url);
              } catch {}

              holdings.push({
                vaultId: i,
                tokenId: Number(v.tokenId),
                title,
                image,
                sharesOwned: balanceNum.toString(),
                totalShares,
                reservePrice: ethers.formatEther(v.reservePrice),
                fractionToken: v.fractionToken,
                ownershipPercent: (balanceNum / parseFloat(totalShares)) * 100,
              });
            }
          } catch {
            await delay(500); // Longer delay on error (likely rate limited)
          }
        }
        setMyFractions(holdings);
      }

      const now = Date.now();
      lastUpdatedRef.current = now;
      setLastUpdated(now);
    } catch (e) {
      console.error("Failed to load data:", e);
    } finally {
      setLoading(false);
    }
  }, [account]);

  // Load marketplace listings (NFTs and shares for sale)
  const loadMarketplace = useCallback(async (force = false) => {
    // Skip if recently loaded and not forced
    if (!force && marketplaceLastUpdatedRef.current && Date.now() - marketplaceLastUpdatedRef.current < CACHE_DURATION) {
      return;
    }

    setLoadingMarketplace(true);
    const provider = getProvider();
    const nft = new ethers.Contract(SEPOLIA_NFT_ADDRESS, NFT_ABI, provider);

    try {
      // Load NFT listings
      if (SEPOLIA_MARKETPLACE_ADDRESS) {
        const market = new ethers.Contract(SEPOLIA_MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);
        let maxTokenId = 50;
        try {
          const supply = await nft.totalSupply();
          maxTokenId = Math.min(Number(supply), 100);
        } catch {}

        if (maxTokenId > 0) {
          const tokenIds = Array.from({ length: maxTokenId }, (_, i) => i + 1);
          const results = await Promise.allSettled(
            tokenIds.map(async (tokenId) => {
              const listing = await market.getListing(SEPOLIA_NFT_ADDRESS, tokenId);
              return { tokenId, listing };
            })
          );

          const active: NFTListing[] = [];
          for (const result of results) {
            if (result.status === "fulfilled" && result.value.listing.isActive) {
              const { tokenId, listing } = result.value;
              let name: string | undefined, image: string | undefined;
              try {
                const uri = await nft.tokenURI(tokenId);
                const res = await fetch(resolveIpfs(uri));
                const meta = await res.json();
                name = meta?.name;
                image = resolveIpfs(meta?.image || meta?.image_url);
              } catch {}
              active.push({ tokenId, seller: listing.seller, priceEth: ethers.formatEther(listing.price), name, image });
            }
          }
          setNftListings(active);
        }
      }

      // Load share listings
      if (SEPOLIA_FRACTION_MARKETPLACE_ADDRESS && SEPOLIA_FRACTIONALIZE_ADDRESS) {
        const fracMarket = new ethers.Contract(SEPOLIA_FRACTION_MARKETPLACE_ADDRESS, FRACTION_MARKETPLACE_ABI, provider);
        const frac = new ethers.Contract(SEPOLIA_FRACTIONALIZE_ADDRESS, FRACTIONALIZE_ABI, provider);

        const count = await fracMarket.listingCount();
        const active: ShareListing[] = [];

        // Get vault count once to avoid repeated calls
        const vaultCount = await frac.vaultCount();
        
        // Process listings sequentially with delays
        for (let i = 1; i <= Number(count); i++) {
          try {
            await delay(150);
            const [seller, fractionToken, amount, pricePerShare, isActive] = await fracMarket.getListing(i);
            if (!isActive || amount === 0n) continue;

            const amountStr = ethers.formatUnits(amount, 18);
            const priceStr = ethers.formatEther(pricePerShare);
            const totalPrice = (parseFloat(amountStr) * parseFloat(priceStr)).toFixed(4);

            let tokenName = "", tokenSymbol = "", nftImage = "", nftName = "", vaultId = 0;

            try {
              await delay(100);
              const token = new ethers.Contract(fractionToken, FRACTION_TOKEN_ABI, provider);
              [tokenName, tokenSymbol] = await Promise.all([token.name(), token.symbol()]);
            } catch {}

            // Find vault for this fraction token
            try {
              for (let v = 1; v <= Number(vaultCount); v++) {
                await delay(100);
                const vault = await frac.getVault(v);
                if (vault.fractionToken.toLowerCase() === fractionToken.toLowerCase()) {
                  vaultId = v;
                  try {
                    const uri = await nft.tokenURI(vault.tokenId);
                    const res = await fetch(resolveIpfs(uri));
                    const meta = await res.json();
                    nftName = meta?.name || `NFT #${vault.tokenId}`;
                    nftImage = resolveIpfs(meta?.image || meta?.image_url);
                  } catch {}
                  break;
                }
              }
            } catch {}

            active.push({
              listingId: i,
              seller,
              fractionToken,
              amount: amountStr,
              pricePerShare: priceStr,
              totalPrice,
              tokenName,
              tokenSymbol,
              nftImage,
              nftName,
              vaultId,
            });
          } catch {
            await delay(500); // Longer delay on error
          }
        }
        setShareListings(active);
      }

      const now = Date.now();
      marketplaceLastUpdatedRef.current = now;
      setMarketplaceLastUpdated(now);
    } catch (e) {
      console.error("Failed to load marketplace:", e);
    } finally {
      setLoadingMarketplace(false);
    }
  }, []);

  // Load on account change
  useEffect(() => {
    if (account) {
      loadData(true);
    }
  }, [account, loadData]);

  // Load marketplace on mount and when account changes
  useEffect(() => {
    loadMarketplace(true);
  }, [loadMarketplace]);

  const refreshData = useCallback(() => loadData(true), [loadData]);
  const refreshMarketplace = useCallback(() => loadMarketplace(true), [loadMarketplace]);

  return (
    <DataContext.Provider value={{ 
      myNFTs, 
      myFractions, 
      nftListings, 
      shareListings, 
      loading, 
      loadingMarketplace, 
      lastUpdated, 
      marketplaceLastUpdated, 
      refreshData, 
      refreshMarketplace 
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};
