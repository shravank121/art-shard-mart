import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import NFTCard from "@/components/nft/NFTCard";
import { Wallet, TrendingUp, Coins, Palette, Eye, Share2, MoreHorizontal } from "lucide-react";
import { apiGetAllNFTs } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  // Simple user data placeholder
  const userStats = {
    totalValue: "45.67",
    ownedNFTs: 12,
    fractionalShares: 1847,
    totalEarnings: "8.23"
  };

  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [ownedNFTs, setOwnedNFTs] = useState<Array<{
    id: string | number;
    title: string;
    artist: string;
    image: string;
    price: string;
    currency: string;
  }>>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const nfts = await apiGetAllNFTs();
        const placeholder = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop";
        const mapped = nfts.map((n) => ({
          id: n.id,
          title: n.name || `Token #${n.id}`,
          artist: n.owner ? `${n.owner.slice(0,6)}...${n.owner.slice(-4)}` : "",
          image: n.uri?.startsWith("http") ? n.uri : placeholder,
          price: "0",
          currency: "ETH",
        }));
        setOwnedNFTs(mapped);
      } catch (e: any) {
        toast({ title: "Failed to load NFTs", description: e?.message || "", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Mock fractional holdings
  const fractionalHoldings = [
    {
      id: "3",
      title: "Cyber Dreams",
      artist: "CryptoCreator",
      image: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=400&h=400&fit=crop",
      sharesOwned: 125,
      totalShares: 1000,
      shareValue: "0.017",
      totalValue: "2.125",
      purchaseDate: "2024-01-08"
    },
    {
      id: "4",
      title: "Neon Genesis",
      artist: "FutureArt",
      image: "https://images.unsplash.com/photo-1563089145-599997674d42?w=400&h=400&fit=crop",
      sharesOwned: 200,
      totalShares: 500,
      shareValue: "0.018",
      totalValue: "3.600",
      purchaseDate: "2024-01-05"
    },
    {
      id: "5",
      title: "Digital Harmony",
      artist: "TechCreative",
      image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=400&fit=crop",
      sharesOwned: 75,
      totalShares: 800,
      shareValue: "0.016",
      totalValue: "1.200",
      purchaseDate: "2024-01-03"
    }
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            My <span className="gradient-primary bg-clip-text text-transparent">Dashboard</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your NFT collection and fractional holdings.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card border-card-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold text-foreground">{userStats.totalValue} ETH</p>
                </div>
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-card-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Owned NFTs</p>
                  <p className="text-2xl font-bold text-foreground">{userStats.ownedNFTs}</p>
                </div>
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
                  <Palette className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-card-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Fractional Shares</p>
                  <p className="text-2xl font-bold text-foreground">{userStats.fractionalShares}</p>
                </div>
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
                  <Coins className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-card-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold text-foreground">{userStats.totalEarnings} ETH</p>
                </div>
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="owned" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2 mb-8">
            <TabsTrigger value="owned">My NFTs ({ownedNFTs.length})</TabsTrigger>
            <TabsTrigger value="fractional">Fractional Holdings ({fractionalHoldings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="owned" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {ownedNFTs.map((nft) => (
                <div key={String(nft.id)} className="space-y-2">
                  <NFTCard
                    id={String(nft.id)}
                    title={nft.title}
                    artist={nft.artist}
                    image={nft.image}
                    price={nft.price}
                    currency={nft.currency}
                    onPurchase={() => {}}
                    onView={() => console.log("View", nft.id)}
                    onShare={() => console.log("Share", nft.id)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 border-card-border">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 border-card-border">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    <Button size="sm" variant="outline" className="border-card-border">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="fractional" className="space-y-6">
            <div className="grid gap-6">
              {fractionalHoldings.map((holding) => (
                <Card key={holding.id} className="bg-card border-card-border">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="w-full lg:w-48 aspect-square">
                        <img
                          src={holding.image}
                          alt={holding.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 className="text-xl font-semibold text-foreground">{holding.title}</h3>
                          <p className="text-muted-foreground">by {holding.artist}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Shares Owned</p>
                            <p className="text-lg font-semibold text-foreground">
                              {holding.sharesOwned}/{holding.totalShares}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Share Value</p>
                            <p className="text-lg font-semibold text-foreground">
                              {holding.shareValue} ETH
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Value</p>
                            <p className="text-lg font-semibold text-primary">
                              {holding.totalValue} ETH
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Purchase Date</p>
                            <p className="text-lg font-semibold text-foreground">
                              {new Date(holding.purchaseDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button variant="outline" className="border-card-border">
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                          <Button variant="outline" className="border-card-border">
                            Sell Shares
                          </Button>
                          <Button variant="outline" className="border-card-border">
                            Buy More
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {ownedNFTs.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full gradient-primary mx-auto mb-4 flex items-center justify-center">
              <Palette className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No NFTs Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start your collection by minting or purchasing NFTs.
            </p>
            <Button className="btn-neon">
              Create Your First NFT
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;