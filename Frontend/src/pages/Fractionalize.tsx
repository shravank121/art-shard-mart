import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { ethers } from "ethers";
import {
  SEPOLIA_NFT_ADDRESS,
  SEPOLIA_FRACTIONALIZE_ADDRESS,
  NFT_ABI,
  FRACTIONALIZE_ABI,
  FRACTION_TOKEN_ABI,
} from "@/config/contracts";

interface VaultInfo {
  vaultId: number;
  nftContract: string;
  tokenId: number;
  fractionToken: string;
  totalShares: string;
  curator: string;
  reservePrice: string;
  isRedeemed: boolean;
  tokenName?: string;
  tokenSymbol?: string;
  myBalance?: string;
  nftImage?: string;
  nftName?: string;
}

interface TokenInfo {
  id: number;
  name?: string;
  image?: string;
}

const Fractionalize = () => {
  const { toast } = useToast();
  const { signer, account, isConnected } = useWallet();
  const [loading, setLoading] = useState(false);

  // Form state for fractionalizing
  const [tokenId, setTokenId] = useState("");
  const [fractionName, setFractionName] = useState("");
  const [fractionSymbol, setFractionSymbol] = useState("");
  const [totalShares, setTotalShares] = useState("1000");
  const [reservePrice, setReservePrice] = useState("1");

  // Vaults state
  const [vaults, setVaults] = useState<VaultInfo[]>([]);
  const [myTokens, setMyTokens] = useState<TokenInfo[]>([]);

  const resolveIpfs = (uri?: string) => {
    if (!uri) return "";
    if (uri.startsWith("ipfs://")) {
      return `https://ipfs.io/ipfs/${uri.replace("ipfs://", "")}`;
    }
    return uri;
  };

  const contracts = () => {
    if (!signer) return { nft: null as any, frac: null as any };
    const nft = new ethers.Contract(SEPOLIA_NFT_ADDRESS, NFT_ABI, signer);
    const frac = new ethers.Contract(SEPOLIA_FRACTIONALIZE_ADDRESS, FRACTIONALIZE_ABI, signer);
    return { nft, frac };
  };

  const loadMyTokens = async () => {
    if (!signer || !account) return;
    try {
      const { nft } = contracts();
      let maxTokenId = 50;
      try {
        const supply = await nft.totalSupply();
        maxTokenId = Math.min(Number(supply), 100);
      } catch {}

      const tokenIds = Array.from({ length: maxTokenId }, (_, i) => i + 1);
      const ownerResults = await Promise.allSettled(
        tokenIds.map(async (id) => {
          const owner = await nft.ownerOf(id);
          return { id, owner };
        })
      );

      const myTokenIds: number[] = [];
      for (const result of ownerResults) {
        if (result.status === "fulfilled" && result.value.owner?.toLowerCase() === account.toLowerCase()) {
          myTokenIds.push(result.value.id);
        }
      }

      // Fetch metadata for owned tokens
      const metadataResults = await Promise.allSettled(
        myTokenIds.map(async (id) => {
          let name: string | undefined;
          let image: string | undefined;
          try {
            const uri: string = await nft.tokenURI(id);
            const url = resolveIpfs(uri);
            const res = await fetch(url);
            const meta = await res.json();
            name = meta?.name;
            image = resolveIpfs(meta?.image || meta?.image_url);
          } catch {}
          return { id, name, image };
        })
      );

      const mine: TokenInfo[] = [];
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

  const loadVaults = async () => {
    if (!signer || !SEPOLIA_FRACTIONALIZE_ADDRESS) return;
    try {
      const { nft, frac } = contracts();
      const count = await frac.vaultCount();
      const vaultList: VaultInfo[] = [];

      for (let i = 1; i <= Number(count); i++) {
        try {
          const v = await frac.getVault(i);
          if (v.fractionToken === ethers.ZeroAddress) continue;

          let tokenName = "";
          let tokenSymbol = "";
          let myBalance = "0";
          let nftImage = "";
          let nftName = "";

          try {
            const token = new ethers.Contract(v.fractionToken, FRACTION_TOKEN_ABI, signer);
            tokenName = await token.name();
            tokenSymbol = await token.symbol();
            if (account) {
              const bal = await token.balanceOf(account);
              myBalance = ethers.formatUnits(bal, 18);
            }
          } catch {}

          // Fetch NFT metadata for image
          try {
            const uri: string = await nft.tokenURI(v.tokenId);
            const url = resolveIpfs(uri);
            const res = await fetch(url);
            const meta = await res.json();
            nftName = meta?.name || `NFT #${v.tokenId}`;
            nftImage = resolveIpfs(meta?.image || meta?.image_url);
          } catch {}

          vaultList.push({
            vaultId: i,
            nftContract: v.nftContract,
            tokenId: Number(v.tokenId),
            fractionToken: v.fractionToken,
            totalShares: ethers.formatUnits(v.totalShares, 18),
            curator: v.curator,
            reservePrice: ethers.formatEther(v.reservePrice),
            isRedeemed: v.isRedeemed,
            tokenName,
            tokenSymbol,
            myBalance,
            nftImage,
            nftName,
          });
        } catch {}
      }
      setVaults(vaultList);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadMyTokens();
    loadVaults();
  }, [signer, account]);

  const handleFractionalize = async () => {
    if (!isConnected || !signer) {
      toast({ title: "Connect wallet", variant: "destructive" });
      return;
    }
    if (!SEPOLIA_FRACTIONALIZE_ADDRESS) {
      toast({ title: "Fractionalize contract not configured", variant: "destructive" });
      return;
    }
    if (!tokenId || !fractionName || !fractionSymbol || !totalShares || !reservePrice) {
      toast({ title: "Fill all fields", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const { nft, frac } = contracts();
      const tokenIdNum = Number(tokenId);

      // Check ownership
      const owner = await nft.ownerOf(tokenIdNum);
      if (owner.toLowerCase() !== account?.toLowerCase()) {
        toast({ title: "You don't own this token", variant: "destructive" });
        return;
      }

      // Approve fractionalize contract
      const approved = await nft.getApproved(tokenIdNum);
      if (approved.toLowerCase() !== SEPOLIA_FRACTIONALIZE_ADDRESS.toLowerCase()) {
        toast({ title: "Approving NFT transfer..." });
        const txApprove = await nft.approve(SEPOLIA_FRACTIONALIZE_ADDRESS, tokenIdNum);
        await txApprove.wait();
      }

      // Fractionalize
      toast({ title: "Fractionalizing NFT..." });
      const shares = ethers.parseUnits(totalShares, 18);
      const price = ethers.parseEther(reservePrice);
      const tx = await frac.fractionalize(
        SEPOLIA_NFT_ADDRESS,
        tokenIdNum,
        fractionName,
        fractionSymbol,
        shares,
        price
      );
      await tx.wait();

      toast({ title: "Success!", description: `NFT #${tokenIdNum} fractionalized into ${totalShares} shares` });
      setTokenId("");
      setFractionName("");
      setFractionSymbol("");
      loadMyTokens();
      loadVaults();
    } catch (e: any) {
      console.error(e);
      toast({ title: "Failed", description: e?.shortMessage || e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (vaultId: number) => {
    if (!isConnected || !signer) {
      toast({ title: "Connect wallet", variant: "destructive" });
      return;
    }
    try {
      setLoading(true);
      const { frac } = contracts();
      const tx = await frac.redeem(vaultId);
      await tx.wait();
      toast({ title: "Redeemed!", description: "NFT returned to your wallet" });
      loadVaults();
      loadMyTokens();
    } catch (e: any) {
      toast({ title: "Redeem failed", description: e?.shortMessage || e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleBuyout = async (vaultId: number, reservePrice: string) => {
    if (!isConnected || !signer) {
      toast({ title: "Connect wallet", variant: "destructive" });
      return;
    }
    try {
      setLoading(true);
      const { frac } = contracts();
      const tx = await frac.buyout(vaultId, { value: ethers.parseEther(reservePrice) });
      await tx.wait();
      toast({ title: "Buyout successful!", description: "NFT transferred to your wallet" });
      loadVaults();
      loadMyTokens();
    } catch (e: any) {
      toast({ title: "Buyout failed", description: e?.shortMessage || e?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            NFT <span className="gradient-primary bg-clip-text text-transparent">Fractionalization</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Split your NFTs into tradeable fraction tokens or buy fractions of premium NFTs.
          </p>
        </div>

        <Tabs defaultValue="fractionalize" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="fractionalize">Fractionalize NFT</TabsTrigger>
            <TabsTrigger value="vaults">Active Vaults ({vaults.filter(v => !v.isRedeemed).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="fractionalize">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-card border-card-border">
                <CardHeader>
                  <CardTitle>Fractionalize Your NFT</CardTitle>
                  <CardDescription>Lock your NFT and receive fraction tokens</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Token ID</Label>
                    <Input
                      placeholder="Enter token ID"
                      value={tokenId}
                      onChange={(e) => setTokenId(e.target.value)}
                      type="number"
                    />
                  </div>
                  <div>
                    <Label>Fraction Token Name</Label>
                    <Input
                      placeholder="e.g., Fractional Art #1"
                      value={fractionName}
                      onChange={(e) => setFractionName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Fraction Token Symbol</Label>
                    <Input
                      placeholder="e.g., FART1"
                      value={fractionSymbol}
                      onChange={(e) => setFractionSymbol(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Total Shares</Label>
                    <Input
                      placeholder="1000"
                      value={totalShares}
                      onChange={(e) => setTotalShares(e.target.value)}
                      type="number"
                    />
                  </div>
                  <div>
                    <Label>Reserve Price (ETH)</Label>
                    <Input
                      placeholder="Minimum buyout price"
                      value={reservePrice}
                      onChange={(e) => setReservePrice(e.target.value)}
                      type="number"
                      step="0.01"
                    />
                  </div>
                  <Button
                    onClick={handleFractionalize}
                    disabled={loading || !SEPOLIA_FRACTIONALIZE_ADDRESS}
                    className="w-full"
                  >
                    {loading ? "Processing..." : "Fractionalize NFT"}
                  </Button>
                  {!SEPOLIA_FRACTIONALIZE_ADDRESS && (
                    <p className="text-xs text-yellow-500">Set VITE_SEPOLIA_FRACTIONALIZE_ADDRESS in .env</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border-card-border">
                <CardHeader>
                  <CardTitle>Your NFTs</CardTitle>
                  <CardDescription>Select an NFT to fractionalize</CardDescription>
                </CardHeader>
                <CardContent>
                  {myTokens.length === 0 ? (
                    <p className="text-muted-foreground">No NFTs found in your wallet</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {myTokens.map((token) => (
                        <div
                          key={token.id}
                          onClick={() => setTokenId(String(token.id))}
                          className={`cursor-pointer rounded-lg border-2 p-2 transition-all ${
                            tokenId === String(token.id)
                              ? "border-primary bg-primary/10"
                              : "border-card-border hover:border-primary/50"
                          }`}
                        >
                          {token.image ? (
                            <img
                              src={token.image}
                              alt={token.name || `#${token.id}`}
                              className="w-full aspect-square object-cover rounded-md mb-2"
                            />
                          ) : (
                            <div className="w-full aspect-square bg-muted rounded-md mb-2 flex items-center justify-center">
                              <span className="text-2xl text-muted-foreground">#{token.id}</span>
                            </div>
                          )}
                          <div className="text-sm font-medium truncate">{token.name || `NFT #${token.id}`}</div>
                          <div className="text-xs text-muted-foreground">Token #{token.id}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="vaults">
            <div className="grid gap-4">
              {vaults.filter(v => !v.isRedeemed).length === 0 ? (
                <Card className="bg-card border-card-border">
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No active vaults found</p>
                  </CardContent>
                </Card>
              ) : (
                vaults.filter(v => !v.isRedeemed).map((vault) => (
                  <Card key={vault.vaultId} className="bg-card border-card-border">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* NFT Image */}
                        <div className="w-full lg:w-48 flex-shrink-0">
                          {vault.nftImage ? (
                            <img
                              src={vault.nftImage}
                              alt={vault.nftName || `NFT #${vault.tokenId}`}
                              className="w-full aspect-square object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
                              <span className="text-3xl text-muted-foreground">#{vault.tokenId}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Vault Info */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold">{vault.nftName || vault.tokenName || `Vault #${vault.vaultId}`}</span>
                            <span className="text-muted-foreground">({vault.tokenSymbol})</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            NFT #{vault.tokenId} • {vault.totalShares} shares
                          </div>
                          <div className="text-sm">
                            Reserve Price: <span className="font-semibold">{vault.reservePrice} ETH</span>
                          </div>
                          <div className="text-sm">
                            Your Balance: <span className="font-semibold">{vault.myBalance} / {vault.totalShares} shares</span>
                            <span className="ml-2 text-muted-foreground">
                              ({((parseFloat(vault.myBalance || "0") / parseFloat(vault.totalShares)) * 100).toFixed(1)}%)
                            </span>
                          </div>
                          {parseFloat(vault.myBalance || "0") > 0 && (
                            <div className="w-full bg-muted rounded-full h-2 mt-1">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${(parseFloat(vault.myBalance || "0") / parseFloat(vault.totalShares)) * 100}%` }}
                              />
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            Curator: {vault.curator.slice(0, 6)}...{vault.curator.slice(-4)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Token: {vault.fractionToken.slice(0, 10)}...{vault.fractionToken.slice(-8)}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 justify-center">
                          {parseFloat(vault.myBalance || "0") >= parseFloat(vault.totalShares) - 0.000001 && (
                            <Button onClick={() => handleRedeem(vault.vaultId)} disabled={loading} className="bg-green-600 hover:bg-green-700">
                              🔓 Redeem NFT (You own 100%)
                            </Button>
                          )}
                          {parseFloat(vault.myBalance || "0") < parseFloat(vault.totalShares) - 0.000001 && (
                            <Button
                              variant="outline"
                              onClick={() => handleBuyout(vault.vaultId, vault.reservePrice)}
                              disabled={loading}
                            >
                              Buyout ({vault.reservePrice} ETH)
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Fractionalize;
