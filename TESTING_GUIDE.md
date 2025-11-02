# 🧪 Testing Guide - Mint NFT on Sepolia

## ✅ Setup Complete
- Contract deployed: `0x941b12780a04968844668332c915aC2F246E0c7B`
- Network: Sepolia Testnet
- Backend configured and running
- Frontend configured and running

## 🚀 How to Test Minting

### Step 1: Login
1. Go to http://localhost:8080
2. Click "Login" or "Sign Up"
3. Use your credentials

### Step 2: Navigate to Mint Page
1. Click "Mint NFT" in the navigation
2. You should see the mint form

### Step 3: Fill the Form
- **Recipient Address**: Pre-filled with `0x78c6Dd73d9E155a187d02Bd31C8fc87e39F2156E`
  - You can change this to any valid Ethereum address
- **Title**: e.g., "My First Sepolia NFT"
- **Description**: e.g., "Testing NFT minting on Sepolia testnet"
- **Image**: Optional (not used in current implementation)
- **Royalty**: Default 10%
- **Fractionalization**: Optional toggle

### Step 4: Click "Mint NFT"
- The UI will show minting progress
- Backend will process the transaction
- You'll see a toast with the transaction hash

### Step 5: Verify on Etherscan
1. Copy the transaction hash from the toast
2. Go to: `https://sepolia.etherscan.io/tx/<YOUR_TX_HASH>`
3. Wait for confirmation (usually 15-30 seconds)

## 📊 What to Check in Backend Logs

After clicking Mint, you should see:
```
[mint] Using contract 0x941b12780a04968844668332c915aC2F246E0c7B
[mint] Wallet address: 0xB23700417951616AA99c6FF4CE4740F7542829B6
[mint] To: 0x78c6Dd73d9E155a187d02Bd31C8fc87e39F2156E
[mint] MetadataURI: ipfs://mock/...
[mint] Contract owner: 0xB23700417951616AA99c6FF4CE4740F7542829B6
[mint] Wallet is owner: true
[mint] Estimated gas: ...
[mint] Submitted tx: 0x...
[mint] Mined in block ..., status=1
✅ NFT Minted: 0x...
[event:Transfer] from=0x000... to=0x78c... tokenId=1 block=... tx=0x...
```

## ❌ Common Issues

### Issue: "Minting failed"
- Check backend logs for detailed error
- Ensure wallet has Sepolia ETH
- Verify contract address is correct

### Issue: "Invalid recipient address"
- Recipient must be a valid 0x... address
- No ENS names on testnet

### Issue: "execution reverted"
- Backend wallet must be the contract owner
- Check owner with: Contract owner log in backend

### Issue: "insufficient funds"
- Deployer wallet needs Sepolia ETH
- Get more from: https://sepoliafaucet.com/

## 🔍 View Your NFT

After successful mint:
1. Go to Sepolia Etherscan
2. Search for contract: `0x941b12780a04968844668332c915aC2F246E0c7B`
3. Click "Token Transfers" tab
4. See your minted NFT

## 💡 Tips
- Each mint costs gas (Sepolia ETH)
- Transactions take 15-30 seconds to confirm
- You can mint multiple NFTs
- Check Dashboard to see all NFTs (currently shows mock data)

## 🆘 Need Help?
If minting fails:
1. Check backend terminal for error logs
2. Verify wallet has Sepolia ETH
3. Confirm contract address in backend/.env
4. Try again with a different recipient address
