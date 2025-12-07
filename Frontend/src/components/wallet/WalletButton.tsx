import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Wallet } from "lucide-react";

const WalletButton = () => {
  const { account, isConnected, connectWallet, disconnectWallet, chainId } = useWallet();
  const navigate = useNavigate();
  const { toast } = useToast();

  const getChainName = (id: number | null) => {
    if (!id) return "";
    switch (id) {
      case 1:
        return "Ethereum";
      case 11155111:
        return "Sepolia";
      case 31337:
        return "Hardhat";
      default:
        return `Chain ${id}`;
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleConnect = async () => {
    const result = await connectWallet();
    
    if (result.requiresLogin) {
      toast({
        title: "Login Required",
        description: "Please login to connect your wallet.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (result.success) {
      toast({
        title: "Wallet Connected",
        description: "Your wallet has been connected and saved to your account.",
      });
    }
  };

  if (isConnected && account) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden md:flex flex-col items-end text-sm">
          <span className="text-muted-foreground text-xs">{getChainName(chainId)}</span>
          <span className="font-mono">{formatAddress(account)}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={disconnectWallet}
          className="border-card-border"
        >
          <Wallet className="w-4 h-4 mr-2" />
          <span className="hidden md:inline">Disconnect</span>
          <span className="md:hidden">{formatAddress(account)}</span>
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      size="sm"
      className="btn-neon"
    >
      <Wallet className="w-4 h-4 mr-2" />
      Connect Wallet
    </Button>
  );
};

export default WalletButton;
