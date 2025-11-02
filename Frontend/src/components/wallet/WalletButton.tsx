import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";
import { Wallet } from "lucide-react";

const WalletButton = () => {
  const { account, isConnected, connectWallet, disconnectWallet, chainId } = useWallet();

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
      onClick={connectWallet}
      size="sm"
      className="btn-neon"
    >
      <Wallet className="w-4 h-4 mr-2" />
      Connect Wallet
    </Button>
  );
};

export default WalletButton;
