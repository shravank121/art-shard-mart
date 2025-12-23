# 🚀 Art Shard Mart - Deployment Guide

## Quick Start (Development)

```bash
# 1. Clone and install dependencies
npm install
cd backend && npm install
cd ../Frontend && npm install
cd ../blockchain && npm install

# 2. Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp Frontend/.env.example Frontend/.env

# 3. Fill in your environment variables in each .env file

# 4. Start development servers
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd Frontend && npm run dev
```

## Production Deployment (Docker)

### Prerequisites
- Docker & Docker Compose installed
- MongoDB Atlas account (or self-hosted MongoDB)
- Infura account for RPC access
- Pinata account for IPFS

### Steps

1. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

2. **Build and run containers**
   ```bash
   docker-compose up -d --build
   ```

3. **Verify deployment**
   ```bash
   # Check backend health
   curl http://localhost:4000/health
   
   # Check frontend
   curl http://localhost:3000
   ```

4. **View logs**
   ```bash
   docker-compose logs -f
   ```

---

## Deployed Smart Contracts (Sepolia Testnet)

| Contract | Address |
|----------|---------|
| NFT Contract | `0x09B462b7ECC3bfF4784Ee6172762992780bCc9d4` |
| Marketplace | `0xe44108704b86549aA9113Ea6102b6A6b4A228b85` |
| Fractionalize | `0x0c6210d62747D81b9d09756F9db9775070d11665` |
| Fraction Marketplace | `0xAacC463c98fA9635eC82467fCf04e32d2e88C0Ba` |

**Network**: Sepolia Testnet  
**Explorer**: https://sepolia.etherscan.io

---

## Environment Variables Reference

### Backend (.env)
| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port | Yes |
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Yes |
| `CORS_ORIGIN` | Allowed CORS origins | Production |
| `RPC_URL` | Ethereum RPC endpoint | Yes |
| `PRIVATE_KEY` | Wallet private key for minting | Yes |
| `CONTRACT_ADDRESS` | NFT contract address | Yes |
| `PINATA_JWT` | Pinata JWT for IPFS | Yes |
| `DEPLOY_BLOCK` | Block to start event scanning | No |

### Frontend (.env)
| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | Yes |
| `VITE_RPC_URL` | Fallback RPC URL | Yes |
| `VITE_SEPOLIA_MARKETPLACE_ADDRESS` | Marketplace contract | Yes |
| `VITE_SEPOLIA_FRACTIONALIZE_ADDRESS` | Fractionalize contract | Yes |
| `VITE_SEPOLIA_FRACTION_MARKETPLACE_ADDRESS` | Fraction marketplace | Yes |

---

## Security Checklist

- [ ] Change default JWT_SECRET to a strong random string
- [ ] Use environment-specific CORS_ORIGIN in production
- [ ] Never commit .env files to version control
- [ ] Use HTTPS in production
- [ ] Keep private keys secure (consider using secrets manager)
- [ ] Enable rate limiting (already configured)
- [ ] Regular security audits of smart contracts

---

## Troubleshooting

**Backend won't start**
- Check MONGO_URI is correct
- Verify JWT_SECRET is set
- Check port 4000 is available

**Frontend can't connect to backend**
- Verify VITE_API_URL matches backend URL
- Check CORS_ORIGIN includes frontend URL

**Blockchain transactions failing**
- Ensure wallet has Sepolia ETH
- Verify RPC_URL is working
- Check contract addresses are correct

---

## Notes
- Smart contracts are deployed on Sepolia testnet (no real value)
- Get Sepolia ETH from faucets: https://sepoliafaucet.com
- Transactions are visible on Sepolia Etherscan
