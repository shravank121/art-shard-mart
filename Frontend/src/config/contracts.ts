export const SEPOLIA_NFT_ADDRESS = "0x09B462b7ECC3bfF4784Ee6172762992780bCc9d4";
export const SEPOLIA_MARKETPLACE_ADDRESS =
  (import.meta as any).env?.VITE_SEPOLIA_MARKETPLACE_ADDRESS ||
  // Fallback to deployed Sepolia marketplace address
  "0xe44108704b86549aA9113Ea6102b6A6b4A228b85";

export const NFT_ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function getApproved(uint256 tokenId) view returns (address)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function setApprovalForAll(address operator, bool approved)",
  "function approve(address to, uint256 tokenId)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function totalSupply() view returns (uint256)",
];

export const MARKETPLACE_ABI = [
  "function listItem(address nftContract, uint256 tokenId, uint256 price)",
  "function buyItem(address nftContract, uint256 tokenId) payable",
  "function cancelListing(address nftContract, uint256 tokenId)",
  "function getListing(address nftContract, uint256 tokenId) view returns (tuple(address seller, uint256 price, bool isActive))",
  "function platformFeeBasisPoints() view returns (uint256)",
  "function feeRecipient() view returns (address)",
  "event ItemListed(address indexed seller, address indexed nftContract, uint256 indexed tokenId, uint256 price)",
  "event ItemSold(address indexed seller, address indexed buyer, address indexed nftContract, uint256 tokenId, uint256 price)",
  "event ListingCancelled(address indexed seller, address indexed nftContract, uint256 indexed tokenId)",
];

export const SEPOLIA_FRACTIONALIZE_ADDRESS =
  (import.meta as any).env?.VITE_SEPOLIA_FRACTIONALIZE_ADDRESS ||
  "0x0c6210d62747D81b9d09756F9db9775070d11665";

export const FRACTIONALIZE_ABI = [
  "function fractionalize(address nftContract, uint256 tokenId, string name, string symbol, uint256 totalShares, uint256 reservePrice) returns (uint256)",
  "function redeem(uint256 vaultId)",
  "function buyout(uint256 vaultId) payable",
  "function updateReservePrice(uint256 vaultId, uint256 newPrice)",
  "function getVault(uint256 vaultId) view returns (address nftContract, uint256 tokenId, address fractionToken, uint256 totalShares, address curator, uint256 reservePrice, bool isRedeemed)",
  "function isFractionalized(address nftContract, uint256 tokenId) view returns (bool)",
  "function vaultCount() view returns (uint256)",
  "function nftToVault(address, uint256) view returns (uint256)",
  "event VaultCreated(uint256 indexed vaultId, address indexed nftContract, uint256 indexed tokenId, address fractionToken, uint256 totalShares, address curator)",
  "event VaultRedeemed(uint256 indexed vaultId, address indexed redeemer)",
];

export const FRACTION_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

export const SEPOLIA_FRACTION_MARKETPLACE_ADDRESS =
  (import.meta as any).env?.VITE_SEPOLIA_FRACTION_MARKETPLACE_ADDRESS ||
  "0x0c6210d62747D81b9d09756F9db9775070d11665";

export const FRACTION_MARKETPLACE_ABI = [
  "function listShares(address fractionToken, uint256 amount, uint256 pricePerShare) returns (uint256)",
  "function buyShares(uint256 listingId, uint256 amount) payable",
  "function cancelListing(uint256 listingId)",
  "function getListing(uint256 listingId) view returns (address seller, address fractionToken, uint256 amount, uint256 pricePerShare, bool isActive)",
  "function listingCount() view returns (uint256)",
  "event SharesListed(uint256 indexed listingId, address indexed seller, address indexed fractionToken, uint256 amount, uint256 pricePerShare)",
  "event SharesSold(uint256 indexed listingId, address indexed buyer, uint256 amount, uint256 totalPrice)",
  "event ListingCancelled(uint256 indexed listingId)",
];
