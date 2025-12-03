import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tag, Wallet, Package, Coins, Image, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { useData } from "@/contexts/DataContext";
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

interface TokenInfo {
  tokenId: number;
  name?: string;
  image?: string;
  isListed: boolean;
  listPrice?: string;
}

interface FractionHolding {
  vaultId: number;
  tokenId: number;
  fractionToken: string;
  tokenName: string;
  tokenSymbol: string;
  balance: string;
  totalShares: string;
  nftName?: string;
  nftImage?: string;
}

const SellNFT = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signer, account, isConnected } = useWallet();
  const { myNFTs, myFractions: cachedFractions, loading: dataLoading, refreshData } = useData();

  const [loading, setLoading] = useState(false);
  const [sellType, setSellType] = useState<"nft" | "shares">("nft");
  
  // NFT selling state
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [listPriceEth, setListPriceEth] = useState("");
  const [myTokens, setMyTokens] = useState<TokenInfo[]>([]);
  const [myNFTListings, setMyNFTListings] = useState<TokenInfo[]>([]);

  // Fraction selling state
  const [selectedFraction, setSelectedFraction] = useState<FractionHolding | null>(null);
  const [sharesToSell, setSharesToSell] = useState("");
  const [pricePerShare, setPricePerShare] = useState("");
  const [myFractionsLocal, setMyFractionsLocal] = useState<FractionHolding[]>([]);

  const resolveIpfs = (uri?: string) => {
    if (!uri) return "";
    if (uri.startsWith("ipfs://")) {
      return `https://ipfs.io/ipfs/${uri.replace("ipfs://", "")}`;
    }
    return uri;
  };

  // Load NFT listing status (uses cached NFT data)
  const loadMyTokens = async () => {
    if (!signer || !account || myNFTs.length === 0) {
      // Use cached data directly if no signer
      const tokens = myNFTs.map(n => ({
        tokenId: n.id,
        name: n.name,
        image: n.image,
        isListed: false,
        listPrice: undefined,
      }));
      setMyTokens(tokens);
      setMyNFTListings([]);
      return;
    }
    
    try {
      const market = new ethers.Contract(SEPOLIA_MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
      
      // Check listing status for cached NFTs
      const results = await Promise.allSettled(
        myNFTs.map(async (nft) => {
          const listing = await market.getListing(SEPOLIA_NFT_ADDRESS, nft.id);
          return { ...nft, listing };
        })
      );

      const owned: TokenInfo[] = [];
      const listed: TokenInfo[] = [];

      for (const result of results) {
        if (result.status !== "fulfilled") continue;
        const { id, name, image, listing } = result.value;
        const isListed = listing.isActive;
        const isSeller = listing.seller?.toLowerCase() === account.toLowerCase();

        const tokenInfo: TokenInfo = {
          tokenId: id,
          name,
          image,
          isListed,
          listPrice: isListed ? ethers.formatEther(listing.price) : undefined,
        };

        if (isListed && isSeller) {
          listed.push(tokenInfo);
        } else if (!isListed) {
          owned.push(tokenInfo);
        }
      }

      setMyTokens(owned);
      setMyNFTListings(listed);
    } catch (e) {
      console.error(e);
    }
  };

  // Load fraction holdings
  const loadMyFractions = async () => {
    if (!signer || !account || !SEPOLIA_FRACTIONALIZE_ADDRESS) return;
    try {
      const nft = new ethers.Contract(SEPOLIA_NFT_ADDRESS, NFT_ABI, signer);
      const frac = new ethers.Contract(SEPOLIA_FRACTIONALIZE_ADDRESS, FRACTIONALIZE_ABI, signer);
      
      const count = await frac.vaultCount();
      const holdings: FractionHolding[] = [];

      for (let i = 1; i <= Number(count); i++) {
        try {
          const v = await frac.getVault(i);
          if (v.fractionToken === ethers.ZeroAddress || v.isRedeemed) continue;

          const token = new ethers.Contract(v.fractionToken, FRACTION_TOKEN_ABI, signer);
          const balance = await token.balanceOf(account);
          const balanceNum = parseFloat(ethers.formatUnits(balance, 18));
          
          if (balanceNum > 0) {
            const tokenName = await token.name();
            const tokenSymbol = await token.symbol();
            
            let nftName: string | undefined;
            let nftImage: string | undefined;
            try {
              const uri: string = await nft.tokenURI(v.tokenId);
              const url = resolveIpfs(uri);
              const res = await fetch(url);
              const meta = await res.json();
              nftName = meta?.name;
              nftImage = resolveIpfs(meta?.image || meta?.image_url);
            } catch {}

            holdings.push({
              vaultId: i,
              tokenId: Number(v.tokenId),
              fractionToken: v.fractionToken,
              tokenName,
              tokenSymbol,
              balance: balanceNum.toString(),
              totalShares: ethers.formatUnits(v.totalShares, 18),
              nftName,
              nftImage,
            });
          }
        } catch {}
      }
      setMyFractionsLocal(holdings);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadMyTokens();
    loadMyFractions();
  }, [signer, account]);

  // List NFT for sale
  const handleListNFT = async () => {
    if (!isConnected || !signer) {
      toast({ title: "Connect wallet", variant: "destructive" });
      return;
    }
    if (!selectedToken || !listPriceEth) {
      toast({ title: "Select NFT and enter price", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const nft = new ethers.Contract(SEPOLIA_NFT_ADDRESS, NFT_ABI, signer);
      const market = new ethers.Contract(SEPOLIA_MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);

      // Check if approval is needed
      const approved = await nft.getApproved(selectedToken.tokenId);
      if (approved.toLowerCase() !== SEPOLIA_MARKETPLACE_ADDRESS.toLowerCase()) {
        toast({ title: "Step 1/2: Approving NFT", description: "Please confirm the approval transaction" });
        const txApprove = await nft.approve(SEPOLIA_MARKETPLACE_ADDRESS, selectedToken.tokenId);
        await txApprove.wait();
        toast({ title: "Approval confirmed!" });
      }

      toast({ title: "Step 2/2: Listing NFT", description: "Please confirm the listing transaction" });
      const tx = await market.listItem(SEPOLIA_NFT_ADDRESS, selectedToken.tokenId, ethers.parseEther(listPriceEth));
      await tx.wait();

      toast({ title: "Listed Successfully! 🎉", description: `Listed for ${listPriceEth} ETH` });
      setSelectedToken(null);
      setListPriceEth("");
      loadMyTokens();
    } catch (e: any) {
      toast({ title: "Listing failed", description: e?.shortMessage || e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // List shares for sale
  const handleListShares = async () => {
    if (!isConnected || !signer) {
      toast({ title: "Connect wallet", variant: "destructive" });
      return;
    }
    if (!selectedFraction || !sharesToSell || !pricePerShare) {
      toast({ title: "Fill all fields", variant: "destructive" });
      return;
    }
    if (!SEPOLIA_FRACTION_MARKETPLACE_ADDRESS) {
      toast({ title: "Fraction marketplace not configured", variant: "destructive" });
      return;
    }
    if (parseFloat(sharesToSell) > parseFloat(selectedFraction.balance)) {
      toast({ title: "Insufficient shares", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const token = new ethers.Contract(selectedFraction.fractionToken, FRACTION_TOKEN_ABI, signer);
      const fracMarket = new ethers.Contract(SEPOLIA_FRACTION_MARKETPLACE_ADDRESS, FRACTION_MARKETPLACE_ABI, signer);

      const amount = ethers.parseUnits(sharesToSell, 18);
      const price = ethers.parseEther(pricePerShare);

      toast({ title: "Approving shares transfer..." });
      const allowance = await token.allowance(account, SEPOLIA_FRACTION_MARKETPLACE_ADDRESS);
      if (allowance < amount) {
        const txApprove = await token.approve(SEPOLIA_FRACTION_MARKETPLACE_ADDRESS, amount);
        await txApprove.wait();
      }

      toast({ title: "Listing shares..." });
      const tx = await fracMarket.listShares(selectedFraction.fractionToken, amount, price);
      await tx.wait();

      toast({ 
        title: "Shares Listed! 🎉", 
        description: `${sharesToSell} shares at ${pricePerShare} ETH each` 
      });
      setSelectedFraction(null);
      setSharesToSell("");
      setPricePerShare("");
      loadMyFractions();
    } catch (e: any) {
      toast({ title: "Listing failed", description: e?.shortMessage || e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Cancel NFT listing
  const handleCancelNFTListing = async (tokenId: number) => {
    try {
      setLoading(true);
      const market = new ethers.Contract(SEPOLIA_MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
      const tx = await market.cancelListing(SEPOLIA_NFT_ADDRESS, tokenId);
      await tx.wait();
      toast({ title: "Listing cancelled" });
      loadMyTokens();
    } catch (e: any) {
      toast({ title: "Cancel failed", description: e?.shortMessage || e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            <span className="gradient-primary bg-clip-text text-transparent">Sell</span> Your Assets
          </h1>
          <p className="text-muted-foreground text-lg">
            List your NFTs or fraction shares on the marketplace.
          </p>
        </div>

        {/* Sell Type Selection */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card 
            className={`cursor-pointer transition-all ${sellType === "nft" ? "border-primary bg-primary/5" : "border-card-border hover:border-primary/50"}`}
            onClick={() => setSellType("nft")}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${sellType === "nft" ? "gradient-primary" : "bg-muted"}`}>
                <Image className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-semibold">Sell NFT</div>
                <div className="text-sm text-muted-foreground">List your full NFT for sale</div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all ${sellType === "shares" ? "border-primary bg-primary/5" : "border-card-border hover:border-primary/50"}`}
            onClick={() => setSellType("shares")}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${sellType === "shares" ? "gradient-primary" : "bg-muted"}`}>
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-semibold">Sell Shares</div>
                <div className="text-sm text-muted-foreground">Sell fraction tokens you own</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {sellType === "nft" ? (
          /* NFT Selling UI */
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="list">List NFT</TabsTrigger>
              <TabsTrigger value="active">My Listings ({myNFTListings.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="bg-card border-card-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Select NFT
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {myTokens.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">No NFTs available</p>
                        <Button variant="outline" onClick={() => navigate("/mint")}>Mint NFT</Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                        {myTokens.map((token) => (
                          <div
                            key={token.tokenId}
                            onClick={() => setSelectedToken(token)}
                            className={`cursor-pointer rounded-lg border-2 p-2 transition-all ${
                              selectedToken?.tokenId === token.tokenId ? "border-primary bg-primary/10" : "border-card-border hover:border-primary/50"
                            }`}
                          >
                            {token.image ? (
                              <img src={token.image} alt={token.name} className="w-full aspect-square object-cover rounded-md mb-2" />
                            ) : (
                              <div className="w-full aspect-square bg-muted rounded-md mb-2 flex items-center justify-center">
                                <span className="text-lg">#{token.tokenId}</span>
                              </div>
                            )}
                            <div className="text-sm font-medium truncate">{token.name || `#${token.tokenId}`}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card border-card-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="w-5 h-5" />
                      Set Price
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedToken && (
                      <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                        {selectedToken.image && <img src={selectedToken.image} className="w-16 h-16 rounded-lg object-cover" />}
                        <div>
                          <div className="font-semibold">{selectedToken.name || `#${selectedToken.tokenId}`}</div>
                          <div className="text-sm text-muted-foreground">Token #{selectedToken.tokenId}</div>
                        </div>
                      </div>
                    )}
                    <div>
                      <Label>Price (ETH)</Label>
                      <Input
                        placeholder="0.00"
                        value={listPriceEth}
                        onChange={(e) => setListPriceEth(e.target.value)}
                        type="number"
                        step="0.001"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        You receive: {listPriceEth ? (parseFloat(listPriceEth) * 0.975).toFixed(4) : "0"} ETH (2.5% fee)
                      </p>
                    </div>
                    <Button onClick={handleListNFT} disabled={loading || !selectedToken || !listPriceEth} className="w-full">
                      {loading ? "Processing..." : "List for Sale"}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      First-time listing requires 2 transactions: approval + listing
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="active">
              {myNFTListings.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">No active listings</CardContent></Card>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {myNFTListings.map((token) => (
                    <Card key={token.tokenId} className="overflow-hidden">
                      {token.image && <img src={token.image} className="w-full aspect-square object-cover" />}
                      <CardContent className="p-4">
                        <div className="font-semibold truncate">{token.name || `#${token.tokenId}`}</div>
                        <div className="text-lg font-bold text-primary">{token.listPrice} ETH</div>
                        <Button variant="destructive" size="sm" className="w-full mt-2" onClick={() => handleCancelNFTListing(token.tokenId)} disabled={loading}>
                          Cancel
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          /* Shares Selling UI */
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-card border-card-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="w-5 h-5" />
                  Select Fraction Shares
                </CardTitle>
                <CardDescription>Choose which shares to sell</CardDescription>
              </CardHeader>
              <CardContent>
                {myFractionsLocal.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No fraction shares owned</p>
                    <Button variant="outline" onClick={() => navigate("/fractionalize")}>Explore Fractions</Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {myFractionsLocal.map((frac) => (
                      <div
                        key={frac.vaultId}
                        onClick={() => setSelectedFraction(frac)}
                        className={`cursor-pointer rounded-lg border-2 p-3 transition-all flex gap-3 ${
                          selectedFraction?.vaultId === frac.vaultId ? "border-primary bg-primary/10" : "border-card-border hover:border-primary/50"
                        }`}
                      >
                        {frac.nftImage ? (
                          <img src={frac.nftImage} className="w-16 h-16 rounded-lg object-cover" />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                            <span>#{frac.tokenId}</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-semibold">{frac.tokenName}</div>
                          <div className="text-sm text-muted-foreground">{frac.nftName || `NFT #${frac.tokenId}`}</div>
                          <div className="text-sm">
                            <span className="font-medium">{parseFloat(frac.balance).toLocaleString()}</span>
                            <span className="text-muted-foreground"> / {parseFloat(frac.totalShares).toLocaleString()} shares</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-card-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Listing Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedFraction && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="font-semibold">{selectedFraction.tokenName} ({selectedFraction.tokenSymbol})</div>
                    <div className="text-sm text-muted-foreground">Available: {parseFloat(selectedFraction.balance).toLocaleString()} shares</div>
                  </div>
                )}
                <div>
                  <Label>Shares to Sell</Label>
                  <Input
                    placeholder="0"
                    value={sharesToSell}
                    onChange={(e) => setSharesToSell(e.target.value)}
                    type="number"
                    max={selectedFraction?.balance}
                  />
                  {selectedFraction && (
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" onClick={() => setSharesToSell((parseFloat(selectedFraction.balance) * 0.25).toString())}>25%</Button>
                      <Button variant="outline" size="sm" onClick={() => setSharesToSell((parseFloat(selectedFraction.balance) * 0.5).toString())}>50%</Button>
                      <Button variant="outline" size="sm" onClick={() => setSharesToSell((parseFloat(selectedFraction.balance) * 0.75).toString())}>75%</Button>
                      <Button variant="outline" size="sm" onClick={() => setSharesToSell(selectedFraction.balance)}>Max</Button>
                    </div>
                  )}
                </div>
                <div>
                  <Label>Price per Share (ETH)</Label>
                  <Input
                    placeholder="0.001"
                    value={pricePerShare}
                    onChange={(e) => setPricePerShare(e.target.value)}
                    type="number"
                    step="0.0001"
                  />
                </div>
                {sharesToSell && pricePerShare && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Value</div>
                    <div className="text-xl font-bold text-primary">
                      {(parseFloat(sharesToSell) * parseFloat(pricePerShare)).toFixed(4)} ETH
                    </div>
                    <div className="text-xs text-muted-foreground">
                      You receive: {(parseFloat(sharesToSell) * parseFloat(pricePerShare) * 0.975).toFixed(4)} ETH
                    </div>
                  </div>
                )}
                <Button 
                  onClick={handleListShares} 
                  disabled={loading || !selectedFraction || !sharesToSell || !pricePerShare || !SEPOLIA_FRACTION_MARKETPLACE_ADDRESS} 
                  className="w-full"
                >
                  {loading ? "Processing..." : "List Shares for Sale"}
                </Button>
                {!SEPOLIA_FRACTION_MARKETPLACE_ADDRESS && (
                  <p className="text-xs text-yellow-500 text-center">Fraction marketplace not deployed yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellNFT;
