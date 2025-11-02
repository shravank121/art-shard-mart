# 🦊 MetaMask Wallet Integration

## ✅ What Was Added

### 1. Wallet Context (`Frontend/src/contexts/WalletContext.tsx`)
- Global state management for wallet connection
- Automatic detection of MetaMask
- Account and network change listeners
- Persistent connection across page reloads

### 2. Wallet Button Component (`Frontend/src/components/wallet/WalletButton.tsx`)
- "Connect Wallet" button when disconnected
- Shows connected address and network when connected
- "Disconnect" functionality
- Responsive design (mobile & desktop)

### 3. Integration in App
- `WalletProvider` wraps the entire app in `App.tsx`
- `WalletButton` added to Navbar (desktop & mobile)
- Replaces old wallet connection code

## 🚀 How to Use

### For Users:
1. **Install MetaMask**: https://metamask.io/download/
2. **Click "Connect Wallet"** in the top-right corner
3. **Approve the connection** in MetaMask popup
4. **Your wallet is now connected!**
   - See your address: `0x1234...5678`
   - See your network: Sepolia, Ethereum, etc.

### For Developers:
```typescript
import { useWallet } from "@/contexts/WalletContext";

function MyComponent() {
  const { account, chainId, isConnected, provider, signer } = useWallet();
  
  if (!isConnected) {
    return <div>Please connect your wallet</div>;
  }
  
  // Use the wallet
  const sendTransaction = async () => {
    const tx = await signer.sendTransaction({
      to: "0x...",
      value: ethers.parseEther("0.1")
    });
    await tx.wait();
  };
}
```

## 🌐 Supported Networks

The wallet button shows the network name:
- **Ethereum Mainnet** (Chain ID: 1)
- **Sepolia Testnet** (Chain ID: 11155111) ← Your deployed contract
- **Hardhat Local** (Chain ID: 31337)
- Other networks show as "Chain {id}"

## 🔄 Auto-Reconnect

The wallet automatically reconnects on page reload if:
- User previously connected
- MetaMask is still unlocked
- Same account is selected

## 📱 Mobile Support

- Responsive button design
- Shows shortened address on mobile
- Full address + network on desktop
- Works in MetaMask mobile browser

## 🎨 UI Features

- **Gradient "Connect Wallet" button** when disconnected
- **Address display** with format: `0x1234...5678`
- **Network badge** showing current chain
- **Disconnect button** to manually disconnect

## ⚠️ Important Notes

1. **MetaMask Required**: Users must have MetaMask installed
2. **Network Switching**: App reloads when user switches networks
3. **Account Changes**: Automatically updates when user switches accounts
4. **No Private Keys**: Never asks for or stores private keys

## 🔗 Next Steps

To use the wallet in your mint function:
```typescript
import { useWallet } from "@/contexts/WalletContext";

const { signer, account } = useWallet();

// Instead of backend minting, mint directly from frontend:
const contract = new ethers.Contract(contractAddress, abi, signer);
const tx = await contract.mint(account, metadataURI);
await tx.wait();
```

## 🐛 Troubleshooting

**"MetaMask is not installed"**
→ Install MetaMask browser extension

**Wallet not connecting**
→ Check if MetaMask is unlocked
→ Try refreshing the page

**Wrong network**
→ Switch to Sepolia in MetaMask
→ App will reload automatically

**Account not updating**
→ Refresh the page
→ Disconnect and reconnect

## 📝 Files Modified

- ✅ `Frontend/src/contexts/WalletContext.tsx` (new)
- ✅ `Frontend/src/components/wallet/WalletButton.tsx` (new)
- ✅ `Frontend/src/App.tsx` (added WalletProvider)
- ✅ `Frontend/src/components/layout/Navbar.tsx` (replaced old wallet code)

## 🎯 Current Status

- ✅ Wallet connection working
- ✅ Network detection working
- ✅ Account switching working
- ✅ UI responsive
- ⏳ Minting still uses backend (can be changed to use wallet directly)
