import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NFTCard from "@/components/nft/NFTCard";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const navigate = useNavigate();
  const { toast } = useToast();

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