import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ShoppingBag, Tag, Coins, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { ethers } from "ethers";
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

const SEPOLIA_RPC = "https://sepolia.infura.io/v3/bef97c7d99a241579f118d6b1bb576bd";

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

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signer, account, isConnected } = useWallet();

  const [loading, setLoading] = useState(false);
  const [loadingNFTs, setLoadingNFTs] = useState(true);
  const [loadingShares, setLoadingShares] = useState(true);
  const [nftListings, setNftListings] = useState<NFTListing[]>([]);
  const [shareListings, setShareListings] = useState<ShareListing[]>([]);
  const [buyAmount, setBuyAmount] = useState<{ [key: number]: string }>({});

  const getReadOnlyProvider = () => new ethers.JsonRpcProvider(SEPOLIA_RPC);

  const resolveIpfs = (uri?: string) => {
    if (!uri) return "";
    if (uri.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${uri.replace("ipfs://", "")}`;
    return uri;
  };

  // Load NFT listings
  const loadNFTListings = async () => {
    if (!SEPOLIA_MARKETPLACE_ADDRESS) {
      setLoadingNFTs(false);
      return;
    }
    try {
      setLoadingNFTs(true);
      const provider = getReadOnlyProvider();
      const nft = new ethers.Contract(SEPOLIA_NFT_ADDRESS, NFT_ABI, provider);
      const market = new ethers.Contract(SEPOLIA_MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);

      let maxTokenId = 50;
      try {
        const supply = await nft.totalSupply();
        maxTokenId = Math.min(Number(supply), 100);
      } catch {}

      if (maxTokenId === 0) {
        setNftListings([]);
        return;
      }

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

      if (sortBy === "price-low") active.sort((a, b) => parseFloat(a.priceEth) - parseFloat(b.priceEth));
      else if (sortBy === "price-high") active.sort((a, b) => parseFloat(b.priceEth) - parseFloat(a.priceEth));

      setNftListings(active);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingNFTs(false);
    }
  };

  // Load share listings
  const loadShareListings = async () => {
    if (!SEPOLIA_FRACTION_MARKETPLACE_ADDRESS) {
      setLoadingShares(false);
      return;
    }
    try {
      setLoadingShares(true);
      const provider = getReadOnlyProvider();
      const fracMarket = new ethers.Contract(SEPOLIA_FRACTION_MARKETPLACE_ADDRESS, FRACTION_MARKETPLACE_ABI, provider);
      const frac = new ethers.Contract(SEPOLIA_FRACTIONALIZE_ADDRESS, FRACTIONALIZE_ABI, provider);
      const nft = new ethers.Contract(SEPOLIA_NFT_ADDRESS, NFT_ABI, provider);

      const count = await fracMarket.listingCount();
      const active: ShareListing[] = [];

      for (let i = 1; i <= Number(count); i++) {
        try {
          const [seller, fractionToken, amount, pricePerShare, isActive] = await fracMarket.getListing(i);
          if (!isActive || amount === 0n) continue;

          const amountStr = ethers.formatUnits(amount, 18);
          const priceStr = ethers.formatEther(pricePerShare);
          const totalPrice = (parseFloat(amountStr) * parseFloat(priceStr)).toFixed(4);

          let tokenName = "", tokenSymbol = "", nftImage = "", nftName = "", vaultId = 0;

          try {
            const token = new ethers.Contract(fractionToken, FRACTION_TOKEN_ABI, provider);
            tokenName = await token.name();
            tokenSymbol = await token.symbol();
          } catch {}

          // Find vault for this fraction token
          try {
            const vaultCount = await frac.vaultCount();
            for (let v = 1; v <= Number(vaultCount); v++) {
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
        } catch {}
      }

      setShareListings(active);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingShares(false);
    }
  };

  useEffect(() => {
    loadNFTListings();
    loadShareListings();
  }, [sortBy]);

  const handleBuyNFT = async (tokenId: number, priceEth: string) => {
    if (!isConnected || !signer) {
      toast({ title: "Connect wallet", variant: "destructive" });
      return;
    }
    try {
      setLoading(true);
      const market = new ethers.Contract(SEPOLIA_MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
      const tx = await market.buyItem(SEPOLIA_NFT_ADDRESS, tokenId, { value: ethers.parseEther(priceEth) });
      await tx.wait();
      toast({ title: "Purchase successful! 🎉", description: `You now own Token #${tokenId}` });
      loadNFTListings();
    } catch (e: any) {
      toast({ title: "Purchase failed", description: e?.shortMessage || e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleBuyShares = async (listingId: number, pricePerShare: string, maxAmount: string) => {
    if (!isConnected || !signer) {
      toast({ title: "Connect wallet", variant: "destructive" });
      return;
    }
    const amount = buyAmount[listingId] || maxAmount;
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Enter amount to buy", variant: "destructive" });
      return;
    }
    try {
      setLoading(true);
      const fracMarket = new ethers.Contract(SEPOLIA_FRACTION_MARKETPLACE_ADDRESS, FRACTION_MARKETPLACE_ABI, signer);
      const amountWei = ethers.parseUnits(amount, 18);
      const totalPrice = ethers.parseEther((parseFloat(amount) * parseFloat(pricePerShare)).toString());
      const tx = await fracMarket.buyShares(listingId, amountWei, { value: totalPrice });
      await tx.wait();
      toast({ title: "Shares purchased! 🎉", description: `Bought ${amount} shares` });
      loadShareListings();
    } catch (e: any) {
      toast({ title: "Purchase failed", description: e?.shortMessage || e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredNFTs = nftListings.filter(l =>
    l.name?.toLowerCase().includes(searchQuery.toLowerCase()) || `#${l.tokenId}`.includes(searchQuery)
  );

  const filteredShares = shareListings.filter(l =>
    l.tokenName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.nftName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">
              <span className="gradient-primary bg-clip-text text-transparent">Marketplace</span>
            </h1>
            <p className="text-muted-foreground">Buy NFTs or fraction shares from creators worldwide.</p>
          </div>
          <Button onClick={() => navigate("/sell")} className="btn-neon">
            <Tag className="w-4 h-4 mr-2" />
            Sell Assets
          </Button>
        </div>

        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-card-border"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-44 bg-card border-card-border">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="nfts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="nfts" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              NFTs ({filteredNFTs.length})
            </TabsTrigger>
            <TabsTrigger value="shares" className="flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Fraction Shares ({filteredShares.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="nfts">
            {loadingNFTs ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
                <p className="text-muted-foreground">Loading NFTs...</p>
              </div>
            ) : filteredNFTs.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No NFTs Listed</h3>
                <Button onClick={() => navigate("/sell")}>List Your NFT</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredNFTs.map((listing) => (
                  <Card key={listing.tokenId} className="bg-card border-card-border overflow-hidden hover:border-primary/50 transition-all">
                    <div className="relative">
                      {listing.image ? (
                        <img src={listing.image} alt={listing.name} className="w-full aspect-square object-cover" />
                      ) : (
                        <div className="w-full aspect-square bg-muted flex items-center justify-center">
                          <span className="text-3xl text-muted-foreground">#{listing.tokenId}</span>
                        </div>
                      )}
                      {account && listing.seller.toLowerCase() === account.toLowerCase() && (
                        <Badge className="absolute top-2 right-2">Your Listing</Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="font-semibold truncate mb-1">{listing.name || `NFT #${listing.tokenId}`}</div>
                      <div className="text-xs text-muted-foreground mb-2">
                        by {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-primary">{listing.priceEth} ETH</div>
                        <Button size="sm" onClick={() => handleBuyNFT(listing.tokenId, listing.priceEth)} disabled={loading || !isConnected}>
                          Buy
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="shares">
            {loadingShares ? (
              <div className="text-center py-12">
                <Coins className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
                <p className="text-muted-foreground">Loading shares...</p>
              </div>
            ) : filteredShares.length === 0 ? (
              <div className="text-center py-12">
                <Coins className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Shares Listed</h3>
                <Button onClick={() => navigate("/sell")}>List Your Shares</Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredShares.map((listing) => (
                  <Card key={listing.listingId} className="bg-card border-card-border">
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row gap-4">
                        {listing.nftImage ? (
                          <img src={listing.nftImage} className="w-24 h-24 rounded-lg object-cover" />
                        ) : (
                          <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                            <Coins className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{listing.tokenName || "Fraction Shares"}</span>
                            <Badge variant="secondary">{listing.tokenSymbol}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">{listing.nftName}</div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Available</div>
                              <div className="font-semibold">{parseFloat(listing.amount).toLocaleString()} shares</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Price/Share</div>
                              <div className="font-semibold">{listing.pricePerShare} ETH</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Total Value</div>
                              <div className="font-semibold text-primary">{listing.totalPrice} ETH</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 min-w-[200px]">
                          <Input
                            placeholder={`Max: ${listing.amount}`}
                            value={buyAmount[listing.listingId] || ""}
                            onChange={(e) => setBuyAmount({ ...buyAmount, [listing.listingId]: e.target.value })}
                            type="number"
                            max={listing.amount}
                          />
                          <div className="text-xs text-muted-foreground text-center">
                            Cost: {((parseFloat(buyAmount[listing.listingId] || listing.amount)) * parseFloat(listing.pricePerShare)).toFixed(4)} ETH
                          </div>
                          <Button
                            onClick={() => handleBuyShares(listing.listingId, listing.pricePerShare, listing.amount)}
                            disabled={loading || !isConnected}
                          >
                            Buy Shares
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Marketplace;
