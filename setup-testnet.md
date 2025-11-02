# Complete Testnet Setup Guide

## Your Wallet Information
- **Deployer Address**: 0x78c6Dd73d9E155a187d02Bd31C8fc87e39F2156E
- **Recipient Address**: 0xb23700417951616aa99c6ff4ce4740f7542829b6

## Step 1: Get Sepolia ETH

### Get ETH for deployer wallet (REQUIRED):
1. Go to: https://sepoliafaucet.com/
2. Login with Alchemy (free account)
3. Enter: `0x78c6Dd73d9E155a187d02Bd31C8fc87e39F2156E`
4. Request 0.5 Sepolia ETH
5. Wait 1-2 minutes

### Verify balance:
- https://sepolia.etherscan.io/address/0x78c6Dd73d9E155a187d02Bd31C8fc87e39F2156E

## Step 2: Deploy Contract (I'll do this after you get ETH)

Command: `npx hardhat run scripts/deploy.js --network sepolia`

## Step 3: Update Backend Config (I'll do this automatically)

## Step 4: Test Minting from UI

Once everything is set up, you can:
1. Login to your app
2. Go to Mint NFT page
3. Fill in details
4. Click Mint
5. View transaction on Sepolia Etherscan

---

## Current Status:
❌ Waiting for Sepolia ETH in deployer wallet
⏳ Contract deployment pending
⏳ Backend configuration pending
⏳ Ready to mint pending
