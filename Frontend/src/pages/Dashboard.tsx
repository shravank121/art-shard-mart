import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import NFTCard from "@/components/nft/NFTCard";
import { Wallet, TrendingUp, Coins, Palette, Eye, Share2, MoreHorizontal } from "lucide-react";
import { apiGetAllNFTs } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { fetchIpfsJson, ipfsToHttp } from "@/lib/ipfs";
import { useWallet } from "@/contexts/WalletContext";
import { ethers } from "ethers";
import {
  SEPOLIA_NFT_ADDRESS,
  SEPOLIA_FRACTIONALIZE_ADDRESS,
  NFT_ABI,
  FRACTIONALIZE_ABI,
  FRACTION_TOKEN_ABI,
} from "@/config/contracts";

interface FractionalHolding {
  vaultId: number;
  tokenId: number;
  title: string;
  image: string;
  sharesOwned: string;
  totalShares: string;
  reservePrice: string;
  curator: string;
  fractionToken: string;
  ownershipPercent: number;
}

const Dashboard = () => {
  // Simple user data placeholder
  const userStats = {
    totalValue: "45.67",
    ownedNFTs: 12,
    fractionalShares: 1847,
    totalEarnings: "8.23"
  };

  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [ownedNFTs, setOwnedNFTs] = useState<Array<{
    id: string | number;
    title: string;
    artist: string;
    image: string;
    price: string;
    currency: string;
  }>>([]);
  const [fractionalHoldings, setFractionalHoldings] = useState<FractionalHolding[]>([]);
  const { account, isConnected, signer } = useWallet();

  const resolveIpfs = (uri?: string) => {
    if (!uri) return "";
    if (uri.startsWith("ipfs://")) {
      return `https://ipfs.io/ipfs/${uri.replace("ipfs://", "")}`;
    }
    return uri;
  };

  // Load owned NFTs
  useEffect(() => {
    const load = async () => {
      try {
        const nfts = await apiGetAllNFTs();
        // Filter by connected wallet; if not connected, show none
        const myNfts = account
          ? nfts.filter((n) => n.owner && n.owner.toLowerCase() === account.toLowerCase())
          : [];
        const placeholder = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop";
        const mapped = await Promise.all(
          myNfts.map(async (n) => {
            let meta: any = null;
            try {
              if (n.uri) meta = await fetchIpfsJson(n.uri);
            } catch {}
            const img = meta?.image ? ipfsToHttp(meta.image) : (n.uri?.startsWith("http") ? n.uri : placeholder);
            const title = meta?.name || n.name || `Token #${n.id}`;
            return {
              id: n.id,
              title,
              artist: n.owner ? `${n.owner.slice(0,6)}...${n.owner.slice(-4)}` : "",
              image: img,
              price: "0",
              currency: "ETH",
            };
          })
        );
        setOwnedNFTs(mapped);
      } catch (e: any) {
        toast({ title: "Failed to load NFTs", description: e?.message || "", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [account]);

  // Load fractional holdings from blockchain
  useEffect(() => {
    const loadFractionalHoldings = async () => {
      if (!signer || !account || !SEPOLIA_FRACTIONALIZE_ADDRESS) return;
      
      try {
        const nft = new ethers.Contract(SEPOLIA_NFT_ADDRESS, NFT_ABI, signer);
        const frac = new ethers.Contract(SEPOLIA_FRACTIONALIZE_ADDRESS, FRACTIONALIZE_ABI, signer);
        
        const count = await frac.vaultCount();
        const holdings: FractionalHolding[] = [];

        for (let i = 1; i <= Number(count); i++) {
          try {
            const v = await frac.getVault(i);
            if (v.fractionToken === ethers.ZeroAddress || v.isRedeemed) continue;

            // Check if user has any shares
            const token = new ethers.Contract(v.fractionToken, FRACTION_TOKEN_ABI, signer);
            const balance = await token.balanceOf(account);
            const balanceNum = parseFloat(ethers.formatUnits(balance, 18));
            
            if (balanceNum > 0) {
              const totalShares = ethers.formatUnits(v.totalShares, 18);
              const ownershipPercent = (balanceNum / parseFloat(totalShares)) * 100;

              // Fetch NFT metadata
              let title = `NFT #${v.tokenId}`;
              let image = "";
              try {
                const uri: string = await nft.tokenURI(v.tokenId);
                const url = resolveIpfs(uri);
                const res = await fetch(url);
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
                curator: v.curator,
                fractionToken: v.fractionToken,
                ownershipPercent,
              });
            }
          } catch {}
        }
        setFractionalHoldings(holdings);
      } catch (e) {
        console.error("Failed to load fractional holdings:", e);
      }
    };

    loadFractionalHoldings();
  }, [signer, account]);

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
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 border-card-border" onClick={() => navigate(`/nft/${nft.id}`)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-card-border"
                      onClick={async () => {
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
                    >
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
            {fractionalHoldings.length === 0 ? (
              <Card className="bg-card border-card-border">
                <CardContent className="py-12 text-center">
                  <Coins className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Fractional Holdings</h3>
                  <p className="text-muted-foreground mb-4">
                    You don't own any fraction tokens yet.
                  </p>
                  <Button onClick={() => navigate("/fractionalize")}>
                    Explore Fractionalized NFTs
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {fractionalHoldings.map((holding) => (
                  <Card key={holding.vaultId} className="bg-card border-card-border">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="w-full lg:w-48 aspect-square flex-shrink-0">
                          {holding.image ? (
                            <img
                              src={holding.image}
                              alt={holding.title}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                              <span className="text-3xl text-muted-foreground">#{holding.tokenId}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 space-y-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-semibold text-foreground">{holding.title}</h3>
                              {holding.ownershipPercent >= 100 && (
                                <Badge className="bg-green-600">100% Owner</Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground">NFT #{holding.tokenId}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Shares Owned</p>
                              <p className="text-lg font-semibold text-foreground">
                                {parseFloat(holding.sharesOwned).toLocaleString()} / {parseFloat(holding.totalShares).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Ownership</p>
                              <p className="text-lg font-semibold text-primary">
                                {holding.ownershipPercent.toFixed(1)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Reserve Price</p>
                              <p className="text-lg font-semibold text-foreground">
                                {holding.reservePrice} ETH
                              </p>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${Math.min(holding.ownershipPercent, 100)}%` }}
                            />
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button variant="outline" className="border-card-border" onClick={() => navigate("/fractionalize")}>
                              <Eye className="w-4 h-4 mr-2" />
                              View in Vaults
                            </Button>
                            {holding.ownershipPercent >= 100 && (
                              <Button className="bg-green-600 hover:bg-green-700" onClick={() => navigate("/fractionalize")}>
                                🔓 Redeem NFT
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