# Art Shard Mart

A full‑stack NFT dApp for minting, showcasing, and exploring NFTs with fractionalization concepts. Built with React + Vite + shadcn/ui (frontend), Node/Express (backend), Ethers v6, MongoDB, and IPFS (Pinata).

## Features
- Wallet connect (MetaMask), network check (Sepolia)
- Mint NFTs using on‑chain contract `mint(address to, string tokenURI)`
- Upload image + JSON metadata to IPFS via Pinata (backend upload endpoint)
- Marketplace and Dashboard views
- NFT Details page (resolves `tokenURI` → JSON → `image`)
- Dashboard filters NFTs by connected wallet owner
- Secure server config via `.env` (not committed)

## Tech Stack
- Frontend: React + Vite, TypeScript, shadcn/ui, lucide-react
- Backend: Node.js, Express, Ethers v6, MongoDB (Mongoose)
- Chain: Sepolia testnet
- Storage: IPFS (Pinata)

## Monorepo Layout
```
art-shard-mart/
├─ Frontend/                 # React app
├─ backend/                  # Node/Express API
├─ blockchain/               # Scripts and contract artifacts (ABI)
├─ package.json              # root scripts
└─ README.md
```

## Prerequisites
- Node.js 18+ (tested with Node 22)
- npm 9+
- MetaMask (Sepolia funds for gas)
- Pinata account (JWT key)
- MongoDB connection string

## Environment Variables
Environment files are ignored by Git. Create local env files using the examples below.

### Backend: `backend/.env`
```
PORT=4000
RPC_URL=https://sepolia.infura.io/v3/<your_infura_project_id>
PRIVATE_KEY=0x<deployer_private_key>
CONTRACT_ADDRESS=0xYourDeployedNFTContract
MONGODB_URI=mongodb+srv://user:pass@cluster/db
JWT_SECRET=<strong_random_secret>
PINATA_JWT=eyJ...<pinata_jwt>...
# Optional: start event scan at contract creation block for faster queries
DEPLOY_BLOCK=9588000
```

### Frontend: `Frontend/.env.local`
```
VITE_API_URL=http://localhost:4000
```

## Install & Run (Dev)
From repo root:
```bash
# install root deps for concurrently
npm install

# install backend deps
npm --prefix backend install

# install frontend deps
npm --prefix Frontend install

# run both apps
npm run dev
```
Then open the frontend at http://localhost:8080 (backend runs on http://localhost:4000).

## Core Flows
### 1) Upload + Mint
- Frontend (Mint page): choose image, set title/description.
- Frontend calls `POST /api/nft/upload` (multipart/form-data) → backend pins to Pinata:
  - Pins image → `imageURI = ipfs://<cid>`
  - Builds ERC‑721 metadata JSON `{ name, description, image }` and pins → `metadataURI = ipfs://<cid>`
- Frontend then calls the contract `mint(recipient, metadataURI)` with MetaMask signer.

### 2) Discover NFTs for Dashboard/Marketplace
- Backend `GET /api/nft/all`:
  - Scans Transfer events from `DEPLOY_BLOCK` to latest to discover tokenIds
  - Resolves `ownerOf(id)` and `tokenURI(id)` (best effort; missing data handled)
- Frontend Dashboard:
  - Filters NFTs to only those where `owner.toLowerCase() === account.toLowerCase()`
  - Fetches metadata JSON from `tokenURI`
  - Displays `metadata.image` through a public gateway

## API Summary (Backend)
Base URL: `${PORT}` default http://localhost:4000

- `POST /api/auth/register` / `POST /api/auth/login`
- `POST /api/nft/mint` (protected)
  - body: `{ toAddress: string, metadataURI: string }`
- `POST /api/nft/upload`
  - form-data: `image` (file), `name`, `description`, optional `attributes`
  - returns: `{ imageCID, imageURI, metadataCID, metadataURI }`
- `GET /api/nft/all`
  - returns array: `{ id, owner, uri }[]`
- `GET /api/nft/tx/:hash` (tx receipt)

## Contracts
- ABI: `backend/src/abi/ArtShardNFT.json`
- Required method: `mint(address to, string tokenURI)`
- Required views: `ownerOf(uint256)`, `tokenURI(uint256)`

## Frontend Notes
- IPFS helper converts `ipfs://` → gateway URL when rendering:
  - `Frontend/src/lib/ipfs.ts`
- Wallet context and connect button:
  - `Frontend/src/contexts/WalletContext.tsx`
  - `Frontend/src/components/wallet/WalletButton.tsx`

## Troubleshooting
- Dashboard shows “No NFTs yet”
  - Ensure `CONTRACT_ADDRESS` matches deployed contract
  - Set `DEPLOY_BLOCK` to the contract creation block
  - Check `/api/nft/all` in browser or via `curl.exe http://localhost:4000/api/nft/all`
- Upload to IPFS fails
  - Verify `PINATA_JWT` in `backend/.env`
  - Try a small PNG/JPG; ensure `image` field name
- Images not showing
  - Ensure `metadata.image` is `ipfs://...`; gateway access may take a few seconds
- Only want current user’s NFTs in Dashboard
  - Dashboard filters by connected wallet address; connect the wallet that owns the tokens

## Security
- Do not commit secrets. Use `.env` files locally.
- Provide `*.env.example` files for teammates (placeholders only).
- To purge accidental secrets from history, use `git filter-repo` or BFG and force push.

## Scripts
Root `package.json`:
```json
{
  "scripts": {
    "dev": "concurrently -k -n backend,frontend -c \"bgBlue.bold\",\"bgMagenta.bold\" \"npm --prefix backend run dev\" \"npm --prefix Frontend run dev\""
  }
}
```
Backend `package.json`:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

## Deployment (High Level)
- Provision a MongoDB instance (Atlas) and an RPC provider (Infura/Alchemy)
- Host backend (Render/Heroku/Vercel Functions/any Node host)
- Host frontend (Netlify/Vercel)
- Set all env vars in respective platforms
- Optional: pin content with paid Pinata plan for reliability

## License
MIT (or your chosen license)
