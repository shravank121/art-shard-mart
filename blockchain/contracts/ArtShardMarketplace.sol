// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ArtShardMarketplace is Ownable, ReentrancyGuard {
    struct Listing {
        address seller;
        uint256 price;
        bool isActive;
    }

    // nft => tokenId => listing
    mapping(address => mapping(uint256 => Listing)) public listings;

    uint256 public platformFeeBasisPoints = 250; // 2.5%
    address public feeRecipient;

    event ItemListed(address indexed seller, address indexed nftContract, uint256 indexed tokenId, uint256 price);
    event ItemSold(address indexed seller, address indexed buyer, address indexed nftContract, uint256 tokenId, uint256 price);
    event ListingCancelled(address indexed seller, address indexed nftContract, uint256 indexed tokenId);
    event PlatformFeeUpdated(uint256 newFeeBps);
    event FeeRecipientUpdated(address newRecipient);

    constructor(address _feeRecipient) Ownable(msg.sender) {
        require(_feeRecipient != address(0), "invalid fee recipient");
        feeRecipient = _feeRecipient;
    }

    function listItem(address nftContract, uint256 tokenId, uint256 price) external nonReentrant {
        require(price > 0, "price = 0");
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "not owner");
        require(
            nft.getApproved(tokenId) == address(this) ||
                nft.isApprovedForAll(msg.sender, address(this)),
            "marketplace not approved"
        );

        listings[nftContract][tokenId] = Listing({seller: msg.sender, price: price, isActive: true});
        emit ItemListed(msg.sender, nftContract, tokenId, price);
    }

    function cancelListing(address nftContract, uint256 tokenId) external nonReentrant {
        Listing memory lst = listings[nftContract][tokenId];
        require(lst.isActive, "not listed");
        require(lst.seller == msg.sender, "not seller");
        delete listings[nftContract][tokenId];
        emit ListingCancelled(msg.sender, nftContract, tokenId);
    }

    function buyItem(address nftContract, uint256 tokenId) external payable nonReentrant {
        Listing memory lst = listings[nftContract][tokenId];
        require(lst.isActive, "not listed");
        require(msg.value >= lst.price, "insufficient payment");

        // effects
        delete listings[nftContract][tokenId];

        // interactions
        uint256 feeAmount = (lst.price * platformFeeBasisPoints) / 10000;
        uint256 sellerAmount = lst.price - feeAmount;

        (bool s1, ) = payable(feeRecipient).call{value: feeAmount}("");
        (bool s2, ) = payable(lst.seller).call{value: sellerAmount}("");
        require(s1 && s2, "payout failed");

        IERC721(nftContract).safeTransferFrom(lst.seller, msg.sender, tokenId);

        emit ItemSold(lst.seller, msg.sender, nftContract, tokenId, lst.price);

        // refund any excess
        if (msg.value > lst.price) {
            (bool r, ) = payable(msg.sender).call{value: msg.value - lst.price}("");
            require(r, "refund failed");
        }
    }

    function getListing(address nftContract, uint256 tokenId) external view returns (Listing memory) {
        return listings[nftContract][tokenId];
    }

    function updatePlatformFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 1000, "fee too high");
        platformFeeBasisPoints = newFeeBps;
        emit PlatformFeeUpdated(newFeeBps);
    }

    function updateFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "invalid addr");
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(newRecipient);
    }
}
