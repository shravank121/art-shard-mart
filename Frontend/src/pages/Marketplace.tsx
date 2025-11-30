import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NFTCard from "@/components/nft/NFTCard";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { ethers } from "ethers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SEPOLIA_NFT_ADDRESS, SEPOLIA_MARKETPLACE_ADDRESS, NFT_ABI, MARKETPLACE_ABI } from "@/config/contracts";

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signer, account, isConnected } = useWallet();

  const [listTokenId, setListTokenId] = useState("");
  const [listPriceEth, setListPriceEth] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeListings, setActiveListings] = useState<Array<{ tokenId: number; seller: string; priceEth: string }>>([]);
  const [myTokens, setMyTokens] = useState<Array<{ tokenId: number; name?: string; image?: string }>>([]);

  const contracts = () => {
    if (!signer) return { nft: null as any, market: null as any };
    const nft = new ethers.Contract(SEPOLIA_NFT_ADDRESS, NFT_ABI, signer);
    const market = new ethers.Contract(SEPOLIA_MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
    return { nft, market };
  };

  // Mock NFT data
  const mockNFTs = [
    {
      id: "1",
      title: "Digital Sunset #1",
      artist: "ArtistName",
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop",
      price: "2.5",
      currency: "ETH",
      isFractional: false,
    },
    {
      id: "2",
      title: "Cyber Dreams",
      artist: "CryptoCreator",
      image: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=400&h=400&fit=crop",
      price: "15.0",
      currency: "ETH",
      isFractional: true,
      totalShares: 1000,
      availableShares: 750,
      pricePerShare: "0.015",
    },
    {
      id: "3",
      title: "Abstract Flow",
      artist: "DigitalMaster",
      image: "https://images.unsplash.com/photo-1554188248-986adbb73be4?w=400&h=400&fit=crop",
      price: "1.8",
      currency: "ETH",
      isFractional: false,
    },
    {
      id: "4",
      title: "Neon Genesis",
      artist: "FutureArt",
      image: "https://images.unsplash.com/photo-1563089145-599997674d42?w=400&h=400&fit=crop",
      price: "8.5",
      currency: "ETH",
      isFractional: true,
      totalShares: 500,
      availableShares: 320,
      pricePerShare: "0.017",
    },
    {
      id: "5",
      title: "Quantum Realm",
      artist: "SciFiArtist",
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop",
      price: "3.2",
      currency: "ETH",
      isFractional: false,
    },
    {
      id: "6",
      title: "Digital Harmony",
      artist: "TechCreative",
      image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=400&fit=crop",
      price: "12.0",
      currency: "ETH",
      isFractional: true,
      totalShares: 800,
      availableShares: 600,
      pricePerShare: "0.015",
    },
  ];

  const filteredNFTs = mockNFTs.filter(nft =>
    nft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    nft.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fullNFTs = filteredNFTs.filter(nft => !nft.isFractional);
  const fractionalNFTs = filteredNFTs.filter(nft => nft.isFractional);

  const handlePurchase = (nftId: string) => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase NFTs.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    // Proceed with purchase
    toast({
      title: "Purchase Initiated",
      description: "Processing your NFT purchase...",
    });
    console.log("Purchasing NFT:", nftId);
    // Here you would integrate with smart contract
  };

  const loadListings = async () => {
    if (!signer || !SEPOLIA_MARKETPLACE_ADDRESS) return;
    try {
      const { nft, market } = contracts();
      
      // Get total supply to know how many tokens exist
      let maxTokenId = 50;
      try {
        const supply = await nft.totalSupply();
        maxTokenId = Math.min(Number(supply), 100); // Cap at 100 for performance
      } catch {}
      
      if (maxTokenId === 0) {
        setActiveListings([]);
        return;
      }

      // Fetch all listings in parallel
      const tokenIds = Array.from({ length: maxTokenId }, (_, i) => i + 1);
      const results = await Promise.allSettled(
        tokenIds.map(async (tokenId) => {
          const l = await market.getListing(SEPOLIA_NFT_ADDRESS, tokenId);
          return { tokenId, listing: l };
        })
      );

      const items: Array<{ tokenId: number; seller: string; priceEth: string }> = [];
      for (const result of results) {
        if (result.status === "fulfilled" && result.value.listing.isActive) {
          const { tokenId, listing } = result.value;
          items.push({ tokenId, seller: listing.seller, priceEth: ethers.formatEther(listing.price) });
        }
      }
      setActiveListings(items);
    } catch (e) {
      console.error(e);
    }
  };

  const resolveIpfs = (uri?: string) => {
    if (!uri) return "";
    if (uri.startsWith("ipfs://")) {
      return `https://ipfs.io/ipfs/${uri.replace("ipfs://", "")}`;
    }
    return uri;
  };

  const loadMyTokens = async () => {
    if (!signer || !account) return;
    try {
      const { nft } = contracts();
      
      // Get total supply to know how many tokens exist
      let maxTokenId = 50;
      try {
        const supply = await nft.totalSupply();
        maxTokenId = Math.min(Number(supply), 100); // Cap at 100 for performance
      } catch {}
      
      if (maxTokenId === 0) {
        setMyTokens([]);
        return;
      }

      // Fetch all owners in parallel
      const tokenIds = Array.from({ length: maxTokenId }, (_, i) => i + 1);
      const ownerResults = await Promise.allSettled(
        tokenIds.map(async (tokenId) => {
          const owner = await nft.ownerOf(tokenId);
          return { tokenId, owner };
        })
      );

      // Filter tokens owned by current account
      const myTokenIds: number[] = [];
      for (const result of ownerResults) {
        if (result.status === "fulfilled" && result.value.owner?.toLowerCase() === account.toLowerCase()) {
          myTokenIds.push(result.value.tokenId);
        }
      }

      // Fetch metadata for owned tokens in parallel
      const metadataResults = await Promise.allSettled(
        myTokenIds.map(async (tokenId) => {
          let name: string | undefined;
          let image: string | undefined;
          try {
            const uri: string = await nft.tokenURI(tokenId);
            const url = resolveIpfs(uri);
            const res = await fetch(url);
            const meta = await res.json();
            name = meta?.name;
            image = resolveIpfs(meta?.image || meta?.image_url);
          } catch {}
          return { tokenId, name, image };
        })
      );

      const mine: Array<{ tokenId: number; name?: string; image?: string }> = [];
      for (const result of metadataResults) {
        if (result.status === "fulfilled") {
          mine.push(result.value);
        }
      }
      setMyTokens(mine);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadListings();
    loadMyTokens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signer, account, SEPOLIA_MARKETPLACE_ADDRESS]);

  const listForSale = async () => {
    if (!isConnected || !signer) {
      toast({ title: "Connect wallet", variant: "destructive" });
      return;
    }
    if (!listTokenId || !listPriceEth) {
      toast({ title: "Enter tokenId and price", variant: "destructive" });
      return;
    }
    if (!SEPOLIA_MARKETPLACE_ADDRESS) {
      toast({ title: "Marketplace not configured", description: "Set VITE_SEPOLIA_MARKETPLACE_ADDRESS", variant: "destructive" });
      return;
    }
    try {
      setLoading(true);
      const { nft, market } = contracts();
      const tokenIdNum = Number(listTokenId);
      const approved = await nft.getApproved(tokenIdNum);
      if (approved.toLowerCase() !== SEPOLIA_MARKETPLACE_ADDRESS.toLowerCase()) {
        const txApprove = await nft.approve(SEPOLIA_MARKETPLACE_ADDRESS, tokenIdNum);
        await txApprove.wait();
      }
      const tx = await market.listItem(SEPOLIA_NFT_ADDRESS, tokenIdNum, ethers.parseEther(listPriceEth));
      await tx.wait();
      toast({ title: "Listed", description: `Token #${tokenIdNum} for ${listPriceEth} ETH` });
      setListPriceEth("");
      setListTokenId("");
      // Refresh listings in background, don't block on errors
      loadListings().catch(console.error);
      loadMyTokens().catch(console.error);
    } catch (e: any) {
      console.error("List error:", e);
      toast({ title: "List failed", description: e?.shortMessage || e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const buyListing = async (tokenId: number, priceEth: string) => {
    if (!isConnected || !signer) {
      toast({ title: "Connect wallet", variant: "destructive" });
      return;
    }
    try {
      setLoading(true);
      const { market } = contracts();
      const tx = await market.buyItem(SEPOLIA_NFT_ADDRESS, tokenId, { value: ethers.parseEther(priceEth) });
      await tx.wait();
      toast({ title: "Purchased", description: `Token #${tokenId}` });
      loadListings();
      loadMyTokens();
    } catch (e: any) {
      toast({ title: "Purchase failed", description: e?.shortMessage || e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const cancelMyListing = async (tokenId: number) => {
    if (!isConnected || !signer) {
      toast({ title: "Connect wallet", variant: "destructive" });
      return;
    }
    try {
      setLoading(true);
      const { market } = contracts();
      const tx = await market.cancelListing(SEPOLIA_NFT_ADDRESS, tokenId);
      await tx.wait();
      toast({ title: "Listing cancelled", description: `Token #${tokenId}` });
      loadListings();
    } catch (e: any) {
      toast({ title: "Cancel failed", description: e?.shortMessage || e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            NFT <span className="gradient-primary bg-clip-text text-transparent">Marketplace</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Discover and collect unique digital assets, or own fractions of premium NFTs.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search NFTs or artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-card-border"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 bg-card border-card-border">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm" className="border-card-border">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </div>

        {/* NFT Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3 mb-8">
            <TabsTrigger value="all">All NFTs ({filteredNFTs.length})</TabsTrigger>
            <TabsTrigger value="fractional">Fractional ({fractionalNFTs.length})</TabsTrigger>
            <TabsTrigger value="full">Full Ownership ({fullNFTs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredNFTs.map((nft) => (
                <NFTCard
                  key={nft.id}
                  {...nft}
                  onPurchase={() => handlePurchase(nft.id)}
                  onView={() => navigate(`/nft/${nft.id}`)}
                  onShare={async () => {
                    const url = `${window.location.origin}/nft/${nft.id}`;
                    try {
                      if (navigator.share) {
                        await navigator.share({ title: nft.title, url });
                      } else {
                        await navigator.clipboard.writeText(url);
                        toast({ title: "Link copied", description: url });
                      }
                    } catch {}
                  }}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="fractional" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {fractionalNFTs.map((nft) => (
                <NFTCard
                  key={nft.id}
                  {...nft}
                  onPurchase={() => handlePurchase(nft.id)}
                  onView={() => navigate(`/nft/${nft.id}`)}
                  onShare={async () => {
                    const url = `${window.location.origin}/nft/${nft.id}`;
                    try {
                      if (navigator.share) {
                        await navigator.share({ title: nft.title, url });
                      } else {
                        await navigator.clipboard.writeText(url);
                        toast({ title: "Link copied", description: url });
                      }
                    } catch {}
                  }}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="full" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {fullNFTs.map((nft) => (
                <NFTCard
                  key={nft.id}
                  {...nft}
                  onPurchase={() => handlePurchase(nft.id)}
                  onView={() => navigate(`/nft/${nft.id}`)}
                  onShare={async () => {
                    const url = `${window.location.origin}/nft/${nft.id}`;
                    try {
                      if (navigator.share) {
                        await navigator.share({ title: nft.title, url });
                      } else {
                        await navigator.clipboard.writeText(url);
                        toast({ title: "Link copied", description: url });
                      }
                    } catch {}
                  }}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* On-chain List & Active Listings */}
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <Card className="bg-card border-card-border lg:col-span-1">
            <CardHeader>
              <CardTitle>List NFT for Sale</CardTitle>
              <CardDescription>Approve and list your token</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Token ID"
                value={listTokenId}
                onChange={(e) => setListTokenId(e.target.value)}
                className="bg-background border-card-border"
                type="number"
                min={0}
              />
              <Input
                placeholder="Price (ETH)"
                value={listPriceEth}
                onChange={(e) => setListPriceEth(e.target.value)}
                className="bg-background border-card-border"
                type="number"
                min={0}
                step="0.0001"
              />
              <Button onClick={listForSale} disabled={loading || !SEPOLIA_MARKETPLACE_ADDRESS} className="w-full">
                {loading ? "Processing..." : "List for Sale"}
              </Button>
              {!SEPOLIA_MARKETPLACE_ADDRESS && (
                <p className="text-xs text-yellow-500">Set VITE_SEPOLIA_MARKETPLACE_ADDRESS in .env</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-card-border lg:col-span-2">
            <CardHeader>
              <CardTitle>Active Listings</CardTitle>
              <CardDescription>First 50 token IDs scanned</CardDescription>
            </CardHeader>
            <CardContent>
              {activeListings.length === 0 ? (
                <p className="text-muted-foreground">No active listings found.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {activeListings.map((it) => (
                    <div key={it.tokenId} className="p-4 rounded-lg border border-card-border bg-background">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">Token #{it.tokenId}</div>
                        <div className="text-sm text-muted-foreground">{it.priceEth} ETH</div>
                      </div>
                      <div className="text-xs text-muted-foreground mb-3">
                        Seller: {it.seller.slice(0, 6)}...{it.seller.slice(-4)}
                      </div>
                      {account && it.seller.toLowerCase() === account.toLowerCase() ? (
                        <div className="grid grid-cols-2 gap-2">
                          <Button size="sm" variant="secondary" disabled>
                            Your Listing
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => cancelMyListing(it.tokenId)} disabled={loading}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" className="w-full" onClick={() => buyListing(it.tokenId, it.priceEth)} disabled={loading}>
                          Buy
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* My Tokens (owned by connected wallet) */}
        <div className="mt-10">
          <Card className="bg-card border-card-border">
            <CardHeader>
              <CardTitle>My Tokens</CardTitle>
              <CardDescription>Tokens owned by your wallet (first 50 scanned)</CardDescription>
            </CardHeader>
            <CardContent>
              {(!account || myTokens.length === 0) ? (
                <p className="text-muted-foreground">No tokens detected for your wallet in the scanned range.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {myTokens.map((t) => {
                    const listed = activeListings.find(l => l.tokenId === t.tokenId);
                    return (
                      <div key={t.tokenId} className="p-3 rounded-lg border border-card-border bg-background">
                        {t.image ? (
                          <img src={t.image} alt={t.name || `#${t.tokenId}`} className="w-full h-24 object-cover rounded mb-2" />
                        ) : (
                          <div className="w-full h-24 rounded bg-muted mb-2" />
                        )}
                        <div className="font-medium mb-1 truncate">{t.name || `#${t.tokenId}`}</div>
                        <div className="text-xs text-muted-foreground mb-2">#{t.tokenId}</div>
                        {listed ? (
                          <div className="text-xs text-muted-foreground">Already listed at {listed.priceEth} ETH</div>
                        ) : (
                          <Button size="sm" className="w-full" onClick={() => { setListTokenId(String(t.tokenId)); }}>
                            List this Token
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {filteredNFTs.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full gradient-primary mx-auto mb-4 flex items-center justify-center">
              <Search className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No NFTs Found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or browse all NFTs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;