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
