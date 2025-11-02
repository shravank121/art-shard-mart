# 🎨 Frontend Minting with MetaMask - Complete Guide

## ✅ What Changed

### Before (Backend Signing):
```
User → Backend API → Backend Wallet signs → Blockchain
```
- Backend wallet needed to be initialized
- Backend paid gas fees
- User didn't control NFTs

### After (Frontend Signing):
```
User + MetaMask → User signs → Blockchain
```
- User signs with their own wallet
- User pays gas fees
- User owns and controls NFTs
- **No backend wallet needed!**

## 🚀 How It Works Now

### 1. User Connects Wallet
- Click "Connect Wallet" button
- MetaMask popup appears
- User approves connection
- Wallet address shown in navbar

### 2. User Fills Mint Form
- **Title**: Name of the NFT
- **Description**: Details about the NFT
- **Recipient** (optional): Leave empty to mint to your own wallet
- **Image**: Upload artwork (currently not uploaded to IPFS)

### 3. User Clicks "Mint NFT"
- Checks if wallet is connected
- Checks if on Sepolia network (Chain ID: 11155111)
- Creates contract instance with user's signer
- Calls `contract.mint(recipient, metadataURI)`
- **MetaMask popup appears** asking user to sign
- User approves transaction
- Transaction is sent to blockchain
- Waits for confirmation
- Shows success with Etherscan link

## 📝 Code Flow

### Contract Setup (MintNFT.tsx)
```typescript
const CONTRACT_ADDRESS = "0x941b12780a04968844668332c915aC2F246E0c7B";
const CONTRACT_ABI = [
  "function mint(address to, string memory tokenURI_) external returns (uint256)"
];
```

### Mint Function
```typescript
// Get wallet context
const { account, signer, isConnected, chainId } = useWallet();

// Create contract with user's signer
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

// User signs transaction in MetaMask
const tx = await contract.mint(recipient, metadataURI);

// Wait for confirmation
const receipt = await tx.wait();
```

## 🌐 Network Requirements

**Must be on Sepolia Testnet:**
- Chain ID: `11155111`
- RPC URL: `https://sepolia.infura.io/v3/...`
- Contract: `0x941b12780a04968844668332c915aC2F246E0c7B`

If user is on wrong network, they'll see:
> ⚠️ Wrong Network
> Please switch to Sepolia testnet in MetaMask.

## 💰 Gas Fees

- **User pays gas** from their MetaMask wallet
- Need Sepolia ETH to mint
- Get from faucet: https://sepoliafaucet.com/

## ⚠️ Important: Contract Owner Restriction

The contract has `onlyOwner` modifier on the `mint` function:
```solidity
function mint(address to, string memory tokenURI_) external onlyOwner returns (uint256)
```

**This means:**
- Only the contract owner can mint
- Contract owner: `0xB23700417951616AA99c6FF4CE4740F7542829B6`
- Other users will get error: "You are not the contract owner"

### To Allow Anyone to Mint:

**Option 1: Remove onlyOwner** (recommended for public minting)
```solidity
function mint(address to, string memory tokenURI_) external returns (uint256) {
    _tokenIdCounter += 1;
    uint256 tokenId = _tokenIdCounter;
    _safeMint(to, tokenId);
    _setTokenURI(tokenId, tokenURI_);
    return tokenId;
}
```

**Option 2: Add Minter Role** (more control)
```solidity
mapping(address => bool) public minters;

modifier onlyMinter() {
    require(minters[msg.sender] || owner() == msg.sender, "Not a minter");
    _;
}

function mint(address to, string memory tokenURI_) external onlyMinter returns (uint256) {
    // ... mint logic
}
```

## 🎯 Testing Steps

### 1. Install MetaMask
- Go to: https://metamask.io/download/
- Install browser extension
- Create or import wallet

### 2. Get Sepolia ETH
- Go to: https://sepoliafaucet.com/
- Enter your wallet address
- Request 0.5 Sepolia ETH

### 3. Switch to Sepolia
- Open MetaMask
- Click network dropdown
- Select "Sepolia test network"
- If not visible, enable "Show test networks" in settings

### 4. Connect Wallet
- Open app: http://localhost:8083
- Click "Connect Wallet"
- Approve in MetaMask

### 5. Mint NFT
- Go to "Mint NFT" page
- Fill in Title and Description
- Leave Recipient empty (mints to you)
- Click "Mint NFT"
- **Approve transaction in MetaMask**
- Wait for confirmation
- Click Etherscan link to see transaction

## 🐛 Common Errors

### "Wallet Not Connected"
→ Click "Connect Wallet" in top-right

### "Wrong Network"
→ Switch to Sepolia in MetaMask

### "You are not the contract owner"
→ Only contract owner can mint
→ Need to remove `onlyOwner` modifier or use owner's wallet

### "Insufficient ETH for gas fees"
→ Get Sepolia ETH from faucet

### "Transaction rejected by user"
→ User clicked "Reject" in MetaMask
→ Try again and click "Confirm"

## 📊 What Happens on Success

1. **Transaction submitted** to Sepolia
2. **Miners confirm** transaction (~15-30 seconds)
3. **NFT minted** to recipient address
4. **Transfer event** emitted
5. **Token ID** incremented
6. **Metadata URI** stored on-chain

## 🔗 View Your NFT

After minting:
- **Transaction**: https://sepolia.etherscan.io/tx/[TX_HASH]
- **Contract**: https://sepolia.etherscan.io/address/0x941b12780a04968844668332c915aC2F246E0c7B
- **Your Tokens**: Go to contract → "Read Contract" → `balanceOf(yourAddress)`

## 📝 Files Modified

- ✅ `Frontend/src/pages/MintNFT.tsx` - Uses MetaMask instead of backend API
- ✅ `Frontend/src/contexts/WalletContext.tsx` - Wallet state management
- ✅ `Frontend/src/components/wallet/WalletButton.tsx` - Connect button
- ✅ `Frontend/src/App.tsx` - Wrapped with WalletProvider

## 🎉 Benefits of This Approach

1. **True Ownership**: Users own their NFTs
2. **No Backend Wallet**: No private key in backend
3. **Decentralized**: Direct blockchain interaction
4. **Transparent**: Users see and approve all transactions
5. **Secure**: Private keys never leave MetaMask
6. **Standard Web3**: Industry-standard pattern

## 🔄 Next Steps (Optional)

1. **Upload to IPFS**: Store metadata on IPFS instead of mock URIs
2. **Remove onlyOwner**: Allow anyone to mint
3. **Add payment**: Require ETH payment to mint
4. **Lazy minting**: Mint on first transfer to save gas
5. **Batch minting**: Mint multiple NFTs at once
