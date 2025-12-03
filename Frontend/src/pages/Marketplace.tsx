import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ShoppingBag, Tag, Coins, Image, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { useData } from "@/contexts/DataContext";
import { ethers } from "ethers";
import {
  SEPOLIA_NFT_ADDRESS,
  SEPOLIA_MARKETPLACE_ADDRESS,
  SEPOLIA_FRACTION_MARKETPLACE_ADDRESS,
  MARKETPLACE_ABI,
  FRACTION_MARKETPLACE_ABI,
} from "@/config/contracts";

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signer, account, isConnected } = useWallet();
  const { nftListings, shareListings, loadingMarketplace, marketplaceLastUpdated, refreshMarketplace } = useData();

  const [loading, setLoading] = useState(false);
  const [buyAmount, setBuyAmount] = useState<{ [key: number]: string }>({});

  // Load marketplace data on mount if not cached
  useEffect(() => {
    if (!marketplaceLastUpdated) {
      refreshMarketplace();
    }
  }, []);

  // Sort NFT listings based on sortBy
  const sortedNftListings = useMemo(() => {
    const sorted = [...nftListings];
    if (sortBy === "price-low") sorted.sort((a, b) => parseFloat(a.priceEth) - parseFloat(b.priceEth));
    else if (sortBy === "price-high") sorted.sort((a, b) => parseFloat(b.priceEth) - parseFloat(a.priceEth));
    return sorted;
  }, [nftListings, sortBy]);

  // Sort share listings based on sortBy (by price per share)
  const sortedShareListings = useMemo(() => {
    const sorted = [...shareListings];
    if (sortBy === "price-low") sorted.sort((a, b) => parseFloat(a.pricePerShare) - parseFloat(b.pricePerShare));
    else if (sortBy === "price-high") sorted.sort((a, b) => parseFloat(b.pricePerShare) - parseFloat(a.pricePerShare));
    return sorted;
  }, [shareListings, sortBy]);

  const handleBuyNFT = async (tokenId: number, priceEth: string) => {
    if (!isConnected || !signer) {
      toast({ title: "Connect wallet to buy", variant: "destructive" });
      return;
    }
    try {
      setLoading(true);
      console.log("Buying NFT:", { tokenId, priceEth, marketplace: SEPOLIA_MARKETPLACE_ADDRESS });
      
      const market = new ethers.Contract(SEPOLIA_MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
      const priceWei = ethers.parseEther(priceEth);
      
      console.log("Sending transaction with value:", priceWei.toString());
      const tx = await market.buyItem(SEPOLIA_NFT_ADDRESS, tokenId, { value: priceWei });
      
      toast({ title: "Transaction submitted", description: "Waiting for confirmation..." });
      await tx.wait();
      
      toast({ title: "Purchase successful! 🎉", description: `You now own Token #${tokenId}` });
      refreshMarketplace(); // Refresh cached data
    } catch (e: any) {
      console.error("Buy NFT error:", e);
      const errorMsg = e?.reason || e?.shortMessage || e?.message || "Unknown error";
      toast({ title: "Purchase failed", description: errorMsg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleBuyShares = async (listingId: number, pricePerShare: string, maxAmount: string) => {
    if (!isConnected || !signer) {
      toast({ title: "Connect wallet", variant: "destructive" });
      return;
    }
    const amount = buyAmount[listingId];
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Enter amount to buy", variant: "destructive" });
      return;
    }
    if (parseFloat(amount) > parseFloat(maxAmount)) {
      toast({ title: "Amount exceeds available shares", variant: "destructive" });
      return;
    }
    try {
      setLoading(true);
      const fracMarket = new ethers.Contract(SEPOLIA_FRACTION_MARKETPLACE_ADDRESS, FRACTION_MARKETPLACE_ABI, signer);
      
      // First, get the actual listing from contract to ensure correct price
      const listing = await fracMarket.getListing(listingId);
      const contractPricePerShare = listing[3]; // pricePerShare is 4th element
      console.log("Contract listing data:", {
        seller: listing[0],
        fractionToken: listing[1],
        amount: listing[2].toString(),
        pricePerShare: contractPricePerShare.toString(),
        isActive: listing[4]
      });
      
      // Convert amount to wei (18 decimals for ERC20)
      const amountWei = ethers.parseUnits(amount, 18);
      
      // Calculate total price using contract's pricePerShare directly
      // Contract formula: totalPrice = (amount * pricePerShare) / 1e18
      // Do multiplication first to avoid precision loss
      const numerator = amountWei * contractPricePerShare;
      const denominator = ethers.parseUnits("1", 18);
      const totalPriceWei = numerator / denominator;
      
      // Add 2% buffer for rounding to be safe, minimum 1000 wei
      const buffer = totalPriceWei / 50n; // 2%
      const minBuffer = 1000n;
      const totalPriceWithBuffer = totalPriceWei + (buffer > minBuffer ? buffer : minBuffer);
      
      console.log("Buying shares:", { 
        listingId, 
        amount, 
        amountWei: amountWei.toString(),
        contractPricePerShare: contractPricePerShare.toString(),
        totalPriceWei: totalPriceWei.toString(),
        totalPriceWithBuffer: totalPriceWithBuffer.toString(),
        totalPriceEth: ethers.formatEther(totalPriceWithBuffer)
      });
      
      // Ensure we're sending ETH with the transaction
      console.log("Sending transaction with value:", totalPriceWithBuffer.toString(), "wei =", ethers.formatEther(totalPriceWithBuffer), "ETH");
      
      // Encode the function call data
      const iface = new ethers.Interface(FRACTION_MARKETPLACE_ABI);
      const data = iface.encodeFunctionData("buyShares", [listingId, amountWei]);
      
      // Send raw transaction with explicit value
      const tx = await signer.sendTransaction({
        to: SEPOLIA_FRACTION_MARKETPLACE_ADDRESS,
        data: data,
        value: totalPriceWithBuffer,
      });
      await tx.wait();
      toast({ title: "Shares purchased! 🎉", description: `Bought ${amount} shares` });
      refreshMarketplace(); // Refresh cached data
    } catch (e: any) {
      console.error("Buy shares error:", e);
      toast({ title: "Purchase failed", description: e?.shortMessage || e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredNFTs = sortedNftListings.filter(l =>
    l.name?.toLowerCase().includes(searchQuery.toLowerCase()) || `#${l.tokenId}`.includes(searchQuery)
  );

  const filteredShares = sortedShareListings.filter(l =>
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
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => refreshMarketplace()} 
              disabled={loadingMarketplace}
              className="border-card-border"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingMarketplace ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => navigate("/sell")} className="btn-neon">
              <Tag className="w-4 h-4 mr-2" />
              Sell Assets
            </Button>
          </div>
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
            {loadingMarketplace && nftListings.length === 0 ? (
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
                        <div className="text-lg font-bold text-primary">{parseFloat(listing.priceEth).toFixed(6)} ETH</div>
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
            {loadingMarketplace && shareListings.length === 0 ? (
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
                              <div className="font-semibold">{parseFloat(listing.pricePerShare).toFixed(6)} ETH</div>
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
