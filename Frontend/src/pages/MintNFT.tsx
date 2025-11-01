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

const MintNFT = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: null as File | null,
    royalty: "10",
    enableFractionalization: false,
    totalShares: "1000",
    initialPrice: "1.0",
  });
  
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintingStep, setMintingStep] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  const mintingSteps = [
    "Uploading metadata to IPFS",
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
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
      toast({
        title: "Authentication Required",
        description: "Please log in to mint NFTs.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (!formData.image || !formData.title || !formData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and upload an image.",
        variant: "destructive",
      });
      return;
    }

    setIsMinting(true);
    setMintingStep(0);

    // Simulate minting process
    for (let i = 0; i < mintingSteps.length; i++) {
      setMintingStep(i);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    toast({
      title: "NFT Minted Successfully!",
      description: formData.enableFractionalization 
        ? `Your NFT has been minted and fractionalized into ${formData.totalShares} shares.`
        : "Your NFT has been minted and is now available for trading.",
    });

    setIsMinting(false);
    setMintingStep(0);

    // Reset form
    setFormData({
      title: "",
      description: "",
      image: null,
      royalty: "10",
      enableFractionalization: false,
      totalShares: "1000",
      initialPrice: "1.0",
    });
    setImagePreview("");
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            Mint Your <span className="gradient-primary bg-clip-text text-transparent">NFT</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Transform your digital art into tradeable NFTs with optional fractionalization.
          </p>
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
                disabled={!formData.image || !formData.title || !formData.description}
              >
                <Coins className="w-5 h-5 mr-2" />
                {formData.enableFractionalization ? "Mint & Fractionalize NFT" : "Mint NFT"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MintNFT;