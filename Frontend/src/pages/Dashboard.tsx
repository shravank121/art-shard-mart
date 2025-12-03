import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import NFTCard from "@/components/nft/NFTCard";
import { Wallet, TrendingUp, Coins, Palette, Eye, Share2, MoreHorizontal, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@/contexts/WalletContext";
import { useData } from "@/contexts/DataContext";

const Dashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { account } = useWallet();
  const { myNFTs, myFractions, loading, refreshData, lastUpdated } = useData();

  // Map NFTs to display format
  const ownedNFTs = myNFTs.map((nft) => ({
    id: nft.id,
    title: nft.name || `NFT #${nft.id}`,
    artist: nft.owner ? `${nft.owner.slice(0, 6)}...${nft.owner.slice(-4)}` : "",
    image: nft.image || "",
    price: "0",
    currency: "ETH",
  }));

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">
              My <span className="gradient-primary bg-clip-text text-transparent">Dashboard</span>
            </h1>
            <p className="text-muted-foreground">
              Manage your NFT collection and fractional holdings.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refreshData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card border-card-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Owned NFTs</p>
                  <p className="text-2xl font-bold text-foreground">{ownedNFTs.length}</p>
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
                  <p className="text-sm text-muted-foreground">Fraction Holdings</p>
                  <p className="text-2xl font-bold text-foreground">{myFractions.length}</p>
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
                  <p className="text-sm text-muted-foreground">Total Shares</p>
                  <p className="text-2xl font-bold text-foreground">
                    {myFractions.reduce((sum, f) => sum + parseFloat(f.sharesOwned), 0).toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-card-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Wallet</p>
                  <p className="text-sm font-bold text-foreground truncate max-w-[120px]">
                    {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Not connected"}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Last updated */}
        {lastUpdated && (
          <p className="text-xs text-muted-foreground mb-4">
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </p>
        )}

        {/* Main Content */}
        <Tabs defaultValue="owned" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-2 mb-8">
            <TabsTrigger value="owned">My NFTs ({ownedNFTs.length})</TabsTrigger>
            <TabsTrigger value="fractional">Fractional Holdings ({myFractions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="owned" className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading your NFTs...</p>
              </div>
            ) : ownedNFTs.length === 0 ? (
              <div className="text-center py-12">
                <Palette className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No NFTs Yet</h3>
                <p className="text-muted-foreground mb-4">Start your collection by minting or purchasing NFTs.</p>
                <Button onClick={() => navigate("/mint")}>Mint Your First NFT</Button>
              </div>
            ) : (
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
                      onView={() => navigate(`/nft/${nft.id}`)}
                      onShare={async () => {
                        const url = `${window.location.origin}/nft/${nft.id}`;
                        await navigator.clipboard.writeText(url);
                        toast({ title: "Link copied" });
                      }}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/nft/${nft.id}`)}>
                        <Eye className="w-4 h-4 mr-1" /> View
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate("/sell")}>
                        Sell
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="fractional" className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading your holdings...</p>
              </div>
            ) : myFractions.length === 0 ? (
              <div className="text-center py-12">
                <Coins className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Fractional Holdings</h3>
                <p className="text-muted-foreground mb-4">You don't own any fraction tokens yet.</p>
                <Button onClick={() => navigate("/fractionalize")}>Explore Fractionalized NFTs</Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {myFractions.map((holding) => (
                  <Card key={holding.vaultId} className="bg-card border-card-border">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        {holding.image ? (
                          <img src={holding.image} alt={holding.title} className="w-24 h-24 rounded-lg object-cover" />
                        ) : (
                          <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                            <span className="text-xl">#{holding.tokenId}</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{holding.title}</h3>
                            {holding.ownershipPercent >= 100 && <Badge className="bg-green-600">100%</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            {parseFloat(holding.sharesOwned).toLocaleString()} / {parseFloat(holding.totalShares).toLocaleString()} shares
                            ({holding.ownershipPercent.toFixed(1)}%)
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 mb-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(holding.ownershipPercent, 100)}%` }} />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => navigate("/fractionalize")}>
                              View
                            </Button>
                            {holding.ownershipPercent >= 100 && (
                              <Button size="sm" className="bg-green-600" onClick={() => navigate("/fractionalize")}>
                                Redeem
                              </Button>
                            )}
                          </div>
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

export default Dashboard;
