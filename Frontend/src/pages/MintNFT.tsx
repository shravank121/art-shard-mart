import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Upload, Image, Wallet, Coins, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import { ethers } from "ethers";
import { apiUploadToIPFS } from "@/lib/api";

// Contract details
const CONTRACT_ADDRESS = "0x941b12780a04968844668332c915aC2F246E0c7B";
const CONTRACT_ABI = [
  "function mint(address to, string memory tokenURI_) external returns (uint256)"
];

const MintNFT = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: null as File | null,
    royalty: "10",
    enableFractionalization: false,
    totalShares: "1000",
    initialPrice: "1.0",
    toAddress: "",
  });
  
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintingStep, setMintingStep] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { account, signer, isConnected, chainId } = useWallet();

  const mintingSteps = [
    "Uploading image & metadata to IPFS",
    "Minting NFT on blockchain",
    "Setting up fractionalization",
    "Deployment complete"
  ];

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleMint = async () => {
    // Check if wallet is connected
    if (!isConnected || !account || !signer) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your MetaMask wallet to mint NFTs.",
        variant: "destructive",
      });
      return;
    }

    // Check if on correct network (Sepolia)
    // Sepolia can be reported as 11155111 or "0xaa36a7" (hex)
    const sepoliaChainIds = [11155111, 0xaa36a7];
    if (chainId && !sepoliaChainIds.includes(chainId)) {
      console.log("Current Chain ID:", chainId, "Expected: 11155111 (Sepolia)");
      
      // Try to switch network automatically
      try {
        await window.ethereum?.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }], // Sepolia in hex
        });
        // Wait a bit for network to switch
        await new Promise(r => setTimeout(r, 1000));
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            await window.ethereum?.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xaa36a7',
                chainName: 'Sepolia Testnet',
                nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://sepolia.infura.io/v3/bef97c7d99a241579f118d6b1bb576bd'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              }],
            });
          } catch (addError) {
            toast({
              title: "Failed to Add Network",
              description: "Please add Sepolia network manually in MetaMask.",
              variant: "destructive",
            });
            return;
          }
        } else {
          toast({
            title: "Wrong Network",
            description: `Please switch to Sepolia testnet in MetaMask. Current: Chain ${chainId}`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    // Use connected wallet address as recipient if not specified
    const recipient = formData.toAddress || account;

    if (!formData.title || !formData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in title and description.",
        variant: "destructive",
      });
      return;
    }

    setIsMinting(true);
    setMintingStep(0);

    try {
      if (!formData.image) {
        toast({ title: "Image required", description: "Please upload an image to mint.", variant: "destructive" });
        setIsMinting(false);
        return;
      }

      // 0) Upload to backend -> Pinata
      setMintingStep(0);
      const upload = await apiUploadToIPFS({
        image: formData.image,
        name: formData.title,
        description: formData.description,
      });
      const metadataURI = upload.metadataURI;

      // 1) Mint on-chain
      setMintingStep(1);
      console.log("🎨 Minting NFT...");
      console.log("📝 Contract:", CONTRACT_ADDRESS);
      console.log("👛 Recipient:", recipient);
      console.log("📄 Metadata:", metadataURI);

      // Create contract instance with user's signer
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Call mint function (user signs with MetaMask)
      const tx = await contract.mint(recipient, metadataURI);
      console.log("📤 Transaction sent:", tx.hash);

      toast({
        title: "Transaction Submitted",
        description: "Waiting for confirmation...",
      });

      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed:", receipt);

      setMintingStep(2);

      toast({
        title: "NFT Minted Successfully! 🎉",
        description: (
          <div className="space-y-1">
            <p>Token minted to: {recipient.slice(0, 10)}...</p>
            <a 
              href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline text-sm"
            >
              View on Etherscan →
            </a>
          </div>
        ),
      });

      setIsMinting(false);
      setMintingStep(0);

      // Reset form
      setFormData(prev => ({
        ...prev,
        title: "",
        description: "",
        image: null,
        toAddress: "",
      }));
      setImagePreview("");
    } catch (err: any) {
      console.error("❌ Mint error:", err);
      setIsMinting(false);
      setMintingStep(0);
      
      let errorMessage = err?.message || "Unknown error";
      
      // Handle common errors
      if (err?.code === "ACTION_REJECTED") {
        errorMessage = "Transaction rejected by user";
      } else if (err?.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient ETH for gas fees";
      } else if (err?.message?.includes("OwnableUnauthorizedAccount")) {
        errorMessage = "You are not the contract owner";
      }
      
      toast({ 
        title: "Mint Failed", 
        description: errorMessage, 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            Mint Your <span className="gradient-primary bg-clip-text text-transparent">NFT</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Transform your digital art into unique, tradeable NFTs on the blockchain
          </p>
          {/* Debug info */}
          {isConnected && (
            <div className="mt-4 text-xs text-muted-foreground">
              Connected: {account?.slice(0, 10)}... | Chain ID: {chainId} {chainId === 11155111 ? "✅ Sepolia" : "⚠️"}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card className="bg-card border-card-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Artwork Upload
              </CardTitle>
              <CardDescription>
                Upload your digital artwork (PNG, JPG, GIF, SVG)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!imagePreview ? (
                  <div className="border-2 border-dashed border-card-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">Click to upload or drag and drop</p>
                      <p className="text-sm text-muted-foreground">Max file size: 100MB</p>
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImagePreview("");
                        setFormData({ ...formData, image: null });
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Metadata Section */}
          <Card className="bg-card border-card-border">
            <CardHeader>
              <CardTitle>NFT Details</CardTitle>
              <CardDescription>
                Provide information about your NFT
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="toAddress">Recipient Address (Optional)</Label>
                <Input
                  id="toAddress"
                  placeholder={account ? `Leave empty to mint to your wallet (${account.slice(0, 10)}...)` : "Connect wallet first"}
                  value={formData.toAddress}
                  onChange={(e) => handleInputChange("toAddress", e.target.value)}
                  className="bg-background border-card-border"
                  disabled={!isConnected}
                />
                <p className="text-xs text-muted-foreground">
                  {isConnected 
                    ? "Leave empty to mint to your connected wallet" 
                    : "Connect your wallet to mint NFTs"}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter NFT title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="bg-background border-card-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your NFT..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="bg-background border-card-border min-h-24"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="royalty">Royalty Percentage</Label>
                <Input
                  id="royalty"
                  type="number"
                  min="0"
                  max="20"
                  placeholder="10"
                  value={formData.royalty}
                  onChange={(e) => handleInputChange("royalty", e.target.value)}
                  className="bg-background border-card-border"
                />
                <p className="text-sm text-muted-foreground">
                  Royalty you'll receive from future sales (0-20%)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Fractionalization Section */}
          <Card className="lg:col-span-2 bg-card border-card-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5" />
                Fractionalization Settings
              </CardTitle>
              <CardDescription>
                Make your NFT accessible through fractional ownership
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="fractionalization"
                  checked={formData.enableFractionalization}
                  onCheckedChange={(checked) => handleInputChange("enableFractionalization", checked)}
                />
                <Label htmlFor="fractionalization" className="text-sm font-medium">
                  Enable fractionalization
                </Label>
                {formData.enableFractionalization && (
                  <Badge className="gradient-primary text-white">
                    Fractional NFT
                  </Badge>
                )}
              </div>

              {formData.enableFractionalization && (
                <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border border-card-border">
                  <div className="space-y-2">
                    <Label htmlFor="totalShares">Total Shares</Label>
                    <Input
                      id="totalShares"
                      type="number"
                      min="100"
                      max="10000"
                      placeholder="1000"
                      value={formData.totalShares}
                      onChange={(e) => handleInputChange("totalShares", e.target.value)}
                      className="bg-background border-card-border"
                    />
                    <p className="text-sm text-muted-foreground">
                      Number of shares to create (100-10,000)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="initialPrice">Initial Price per Share (ETH)</Label>
                    <Input
                      id="initialPrice"
                      type="number"
                      step="0.001"
                      min="0.001"
                      placeholder="0.01"
                      value={formData.initialPrice}
                      onChange={(e) => handleInputChange("initialPrice", e.target.value)}
                      className="bg-background border-card-border"
                    />
                    <p className="text-sm text-muted-foreground">
                      Price per fractional share
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mint Button & Status */}
          <div className="lg:col-span-2">
            {isMinting ? (
              <Card className="bg-card border-card-border">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full gradient-primary mx-auto flex items-center justify-center animate-pulse">
                      <Wallet className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold">Minting Your NFT</h3>
                    <p className="text-muted-foreground">
                      {mintingSteps[mintingStep]}
                    </p>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="gradient-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${((mintingStep + 1) / mintingSteps.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button
                onClick={handleMint}
                size="lg"
                className="w-full btn-neon text-lg py-6"
                disabled={!isConnected || !formData.title || !formData.description}
              >
                <Coins className="w-5 h-5 mr-2" />
                {!isConnected 
                  ? "Connect Wallet to Mint" 
                  : formData.enableFractionalization 
                    ? "Mint & Fractionalize NFT" 
                    : "Mint NFT"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MintNFT;