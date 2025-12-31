# Art Shard Mart

A full-stack NFT dApp for minting, showcasing, and fractionalizing NFTs. Built with React + Vite (frontend), Node/Express (backend), Solidity smart contracts, and deployed on AWS EC2 with Docker.

🌐 **Live Demo:** [https://nftfract.duckdns.org](https://nftfract.duckdns.org)

## Features
- Wallet connect (MetaMask) with Sepolia testnet
- Mint NFTs with on-chain contract
- Fractionalize NFTs into tradeable shares
- Marketplace for buying/selling NFTs and fractions
- Upload images + metadata to IPFS via Pinata
- User dashboard with owned NFTs
- Secure JWT authentication

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, TypeScript, shadcn/ui, TailwindCSS |
| Backend | Node.js, Express, Ethers v6, MongoDB |
| Blockchain | Solidity, Hardhat, Sepolia Testnet |
| Storage | IPFS (Pinata) |
| Infrastructure | AWS EC2, Docker, Caddy (SSL) |
| CI/CD | GitHub Actions |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AWS EC2 Instance                         │
│  ┌─────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │  Caddy  │───►│  Frontend   │    │   Backend   │         │
│  │  (SSL)  │    │  (nginx)    │    │  (Express)  │         │
│  └─────────┘    └─────────────┘    └──────┬──────┘         │
│   :80/:443                                 │                │
└────────────────────────────────────────────┼────────────────┘
                                             │
              ┌──────────────────────────────┼──────────────────┐
              │                              │                  │
              ▼                              ▼                  ▼
      ┌─────────────┐              ┌─────────────┐    ┌─────────────┐
      │  MongoDB    │              │   Alchemy   │    │   Sepolia   │
      │   Atlas     │              │    (RPC)    │    │   Chain     │
      └─────────────┘              └─────────────┘    └─────────────┘
```

## Project Structure
```
art-shard-mart/
├── Frontend/           # React application
├── backend/            # Express API server
├── blockchain/         # Smart contracts & Hardhat config
├── .github/workflows/  # CI/CD pipeline
├── docker-compose.yml  # Container orchestration
├── Caddyfile          # SSL/reverse proxy config
└── README.md
```

## Smart Contracts (Sepolia)

| Contract | Address |
|----------|---------|
| Marketplace | `0xe44108704b86549aA9113Ea6102b6A6b4A228b85` |
| Fractionalize | `0x0c6210d62747D81b9d09756F9db9775070d11665` |
| Fraction Marketplace | `0xAacC463c98fA9635eC82467fCf04e32d2e88C0Ba` |

## Local Development

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- MetaMask wallet with Sepolia ETH
- MongoDB Atlas account
- Pinata account (IPFS)
- Alchemy account (RPC)

### Environment Setup

Create `.env` files:

**backend/.env**
```env
PORT=4000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=0x...
CONTRACT_ADDRESS=0x...
PINATA_JWT=...
CORS_ORIGIN=http://localhost:3000
```

**Frontend/.env**
```env
VITE_API_URL=http://localhost:4000
VITE_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
VITE_SEPOLIA_MARKETPLACE_ADDRESS=0x...
VITE_SEPOLIA_FRACTIONALIZE_ADDRESS=0x...
VITE_SEPOLIA_FRACTION_MARKETPLACE_ADDRESS=0x...
```

### Run Locally

**With Docker:**
```bash
docker-compose up -d --build
# Frontend: http://localhost:3000
# Backend: http://localhost:4000
```

**Without Docker:**
```bash
# Install dependencies
npm install
npm --prefix backend install
npm --prefix Frontend install

# Run both
npm run dev
```

## Deployment

### Infrastructure Setup (AWS EC2)

1. Launch EC2 t2.micro instance (Amazon Linux 2023)
2. Configure security group (ports 22, 80, 443)
3. Allocate Elastic IP
4. Install Docker:
```bash
sudo yum update -y && sudo yum install -y docker git
sudo service docker start
sudo usermod -a -G docker ec2-user
```

5. Install Docker Compose:
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

6. Clone and deploy:
```bash
git clone https://github.com/shravank121/art-shard-mart.git
cd art-shard-mart
# Create .env with production values
docker-compose up -d --build
```

### SSL with Caddy
Caddy automatically provisions SSL certificates from Let's Encrypt. Configuration in `Caddyfile`:
```
nftfract.duckdns.org {
    handle /api/* {
        reverse_proxy backend:4000
    }
    handle {
        reverse_proxy frontend:80
    }
}
```

### CI/CD Pipeline

Automated deployment via GitHub Actions on push to `main`:

1. **CI Stage** (GitHub runners):
   - Install dependencies
   - Build frontend
   - Validate backend syntax
   - Test backend startup

2. **CD Stage** (EC2 via SSH):
   - Pull latest code
   - Rebuild Docker images
   - Restart containers

**Required GitHub Secrets:**
| Secret | Description |
|--------|-------------|
| `EC2_HOST` | Elastic IP address |
| `EC2_SSH_KEY` | Contents of .pem file |
| `MONGO_URI` | MongoDB connection string |
| `VITE_RPC_URL` | Alchemy RPC URL |
| `VITE_SEPOLIA_MARKETPLACE_ADDRESS` | Contract address |
| `VITE_SEPOLIA_FRACTIONALIZE_ADDRESS` | Contract address |
| `VITE_SEPOLIA_FRACTION_MARKETPLACE_ADDRESS` | Contract address |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/stats` | Platform statistics |
| POST | `/api/nft/upload` | Upload to IPFS |
| POST | `/api/nft/mint` | Mint NFT (protected) |
| GET | `/api/nft/all` | List all NFTs |
| GET | `/health` | Health check |

## Useful Commands

```bash
# View logs
docker logs -f artshard-backend
docker logs -f artshard-frontend

# Container stats
docker stats

# Rebuild single service
docker-compose up -d --build backend

# Clean up
docker system prune -a -f

# SSH to EC2
ssh -i your-key.pem ec2-user@<elastic-ip>
```

## Mainnet Deployment

To deploy to Ethereum mainnet:

1. Get mainnet RPC URL from Alchemy
2. Fund deployer wallet with ETH
3. Deploy contracts: `npx hardhat run scripts/deploy.js --network mainnet`
4. Update all `.env` files with mainnet addresses
5. Rebuild and redeploy

⚠️ **Important:** Audit smart contracts before mainnet deployment.

## License
MIT
