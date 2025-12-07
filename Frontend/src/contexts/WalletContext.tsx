import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { apiConnectWallet, apiDisconnectWallet, isLoggedIn } from '@/lib/api';

interface WalletContextType {
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  connectWallet: () => Promise<{ success: boolean; requiresLogin?: boolean }>;
  disconnectWallet: () => void;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  const connectWallet = async (): Promise<{ success: boolean; requiresLogin?: boolean }> => {
    try {
      // Check if user is logged in first
      if (!isLoggedIn()) {
        return { success: false, requiresLogin: true };
      }

      if (!window.ethereum) {
        alert('MetaMask is not installed. Please install MetaMask to continue.');
        return { success: false };
      }

      // Use wallet_requestPermissions to force MetaMask to show account selector
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      // Register wallet connection in backend
      try {
        await apiConnectWallet(accounts[0]);
        console.log('✅ Wallet registered in database');
      } catch (apiError) {
        console.error('Failed to register wallet in backend:', apiError);
        // Continue anyway - wallet is connected locally
      }

      setProvider(provider);
      setSigner(signer);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));

      console.log('✅ Wallet connected:', accounts[0]);
      console.log('🌐 Chain ID:', network.chainId);
      return { success: true };
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet: ' + error.message);
      return { success: false };
    }
  };

  const disconnectWallet = async () => {
    // Don't remove wallet from database on disconnect
    // We want to keep track of all wallets ever connected
    // Only clear local session state

    setAccount(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);

    // Revoke permissions so next connect will prompt for account selection
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch (error) {
        // wallet_revokePermissions may not be supported in all wallets
        console.log("Could not revoke permissions:", error);
      }
    }

    console.log("👋 Wallet disconnected (session only, kept in history)");
  };

  // Listen for account changes
  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // Just clear local state, don't call API
        setAccount(null);
        setChainId(null);
        setProvider(null);
        setSigner(null);
        console.log("👋 Wallet disconnected (external)");
      } else {
        setAccount(accounts[0]);
        console.log("🔄 Account changed:", accounts[0]);
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16);
      setChainId(newChainId);
      console.log("🔄 Chain changed:", newChainId);
    };

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  // Check if already connected on mount (only if logged in)
  useEffect(() => {
    let isMounted = true;

    const checkConnection = async () => {
      // Only auto-reconnect if user is logged in
      if (!isLoggedIn()) {
        return;
      }

      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.send("eth_accounts", []);
          if (accounts.length > 0 && isMounted) {
            const signer = await provider.getSigner();
            const network = await provider.getNetwork();
            setProvider(provider);
            setSigner(signer);
            setAccount(accounts[0]);
            setChainId(Number(network.chainId));
            // Don't call API on auto-reconnect to avoid spam
            // The wallet is already registered from initial connect
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
        }
      }
    };
    checkConnection();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        isConnected: !!account,
        connectWallet,
        disconnectWallet,
        provider,
        signer,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

// TypeScript will use the ethereum.d.ts file for window.ethereum type
