# Docker Setup Guide

## Prerequisites
- Docker and Docker Compose installed
- Environment variables configured

## Quick Start

### 1. Create environment file
Copy the example and fill in your values:
```bash
cp .env.example .env
```

Edit `.env` with your actual values:
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT tokens
- `RPC_URL` - Sepolia RPC URL (Infura/Alchemy)
- `PRIVATE_KEY` - Wallet private key for backend minting
- `CONTRACT_ADDRESS` - Deployed NFT contract address
- `PINATA_JWT` - Pinata JWT for IPFS uploads
- `VITE_SEPOLIA_MARKETPLACE_ADDRESS` - Marketplace contract address

### 2. Build and run
```bash
docker-compose up --build
```

### 3. Access the application
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## Individual Services

### Build backend only
```bash
docker build -t artshard-backend ./backend
docker run -p 4000:4000 --env-file backend/.env artshard-backend
```

### Build frontend only
```bash
docker build -t artshard-frontend \
  --build-arg VITE_API_URL=http://localhost:4000 \
  --build-arg VITE_SEPOLIA_MARKETPLACE_ADDRESS=0x_your_address \
  ./Frontend
docker run -p 3000:80 artshard-frontend
```

## Production Deployment

For production, update `VITE_API_URL` to your backend's public URL:
```bash
docker-compose up --build -d
```

## Useful Commands
```bash
# Stop containers
docker-compose down

# View logs
docker-compose logs -f

# Rebuild specific service
docker-compose up --build backend

# Remove all containers and volumes
docker-compose down -v
```
