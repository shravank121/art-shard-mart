# 🚀 Sepolia Testnet Deployment

## Contract Details
- **Contract Address**: `0x941b12780a04968844668332c915aC2F246E0c7B`
- **Network**: Sepolia Testnet
- **Deployer**: `0xB23700417951616AA99c6FF4CE4740F7542829B6`
- **Deployment Time**: 2025-11-02T13:37:14.200Z

## View on Etherscan
🔍 **Contract**: https://sepolia.etherscan.io/address/0x941b12780a04968844668332c915aC2F246E0c7B

## Backend Configuration Required

Update `backend/.env` with:
```env
PORT=4000
MONGO_URI=<your_mongo_uri>
JWT_SECRET=<your_jwt_secret>
RPC_URL=https://sepolia.infura.io/v3/bef97c7d99a241579f118d6b1bb576bd
PRIVATE_KEY=0xf36744293d99c41306c3d1adb731d8b06577559fe34e59ab15d433fd33e26b44
CONTRACT_ADDRESS=0x941b12780a04968844668332c915aC2F246E0c7B
```

## How to Test Minting

1. **Start the servers**:
   ```bash
   npm run dev
   ```

2. **Login to your app**

3. **Go to Mint NFT page**:
   - Recipient Address: `0x78c6Dd73d9E155a187d02Bd31C8fc87e39F2156E` (or any valid address)
   - Fill in Title and Description
   - Click "Mint NFT"

4. **View transaction**:
   - Backend will log the transaction hash
   - Check on Sepolia Etherscan: https://sepolia.etherscan.io/tx/<txHash>

## Wallet Addresses
- **Deployer/Owner**: `0xB23700417951616AA99c6FF4CE4740F7542829B6`
- **Default Recipient**: `0x78c6Dd73d9E155a187d02Bd31C8fc87e39F2156E`

## Notes
- Contract owner can mint NFTs
- Each mint costs gas (paid in Sepolia ETH)
- Transactions are visible on Sepolia Etherscan
- This is a testnet - no real value
