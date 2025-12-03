// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FractionMarketplace
 * @dev Marketplace for trading ERC20 fraction tokens
 */
contract FractionMarketplace is ReentrancyGuard, Ownable {
    struct ShareListing {
        address seller;
        address fractionToken;
        uint256 amount;
        uint256 pricePerShare;
        bool isActive;
    }

    uint256 public listingCount;
    mapping(uint256 => ShareListing) public listings;
    
    uint256 public platformFeeBasisPoints = 250; // 2.5%
    address public feeRecipient;

    event SharesListed(
        uint256 indexed listingId,
        address indexed seller,
        address indexed fractionToken,
        uint256 amount,
        uint256 pricePerShare
    );
    
    event SharesSold(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 amount,
        uint256 totalPrice
    );
    
    event ListingCancelled(uint256 indexed listingId);

    constructor(address _feeRecipient) Ownable(msg.sender) {
        require(_feeRecipient != address(0), "invalid fee recipient");
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev List fraction shares for sale
     */
    function listShares(
        address fractionToken,
        uint256 amount,
        uint256 pricePerShare
    ) external nonReentrant returns (uint256 listingId) {
        require(amount > 0, "amount must be > 0");
        require(pricePerShare > 0, "price must be > 0");
        
        IERC20 token = IERC20(fractionToken);
        require(token.balanceOf(msg.sender) >= amount, "insufficient balance");
        require(
            token.allowance(msg.sender, address(this)) >= amount,
            "insufficient allowance"
        );

        // Transfer tokens to marketplace
        token.transferFrom(msg.sender, address(this), amount);

        listingCount++;
        listingId = listingCount;

        listings[listingId] = ShareListing({
            seller: msg.sender,
            fractionToken: fractionToken,
            amount: amount,
            pricePerShare: pricePerShare,
            isActive: true
        });

        emit SharesListed(listingId, msg.sender, fractionToken, amount, pricePerShare);
    }

    /**
     * @dev Buy shares from a listing
     */
    function buyShares(uint256 listingId, uint256 amount) external payable nonReentrant {
        ShareListing storage listing = listings[listingId];
        require(listing.isActive, "listing not active");
        require(amount > 0 && amount <= listing.amount, "invalid amount");

        // amount is in token wei (18 decimals), pricePerShare is in ETH wei
        // totalPrice = (amount * pricePerShare) / 10^18
        uint256 totalPrice = (amount * listing.pricePerShare) / 1e18;
        require(msg.value >= totalPrice, "insufficient payment");

        // Update listing
        listing.amount -= amount;
        if (listing.amount == 0) {
            listing.isActive = false;
        }

        // Calculate fees
        uint256 feeAmount = (totalPrice * platformFeeBasisPoints) / 10000;
        uint256 sellerAmount = totalPrice - feeAmount;

        // Transfer ETH
        (bool s1, ) = payable(feeRecipient).call{value: feeAmount}("");
        (bool s2, ) = payable(listing.seller).call{value: sellerAmount}("");
        require(s1 && s2, "payment failed");

        // Transfer tokens to buyer
        IERC20(listing.fractionToken).transfer(msg.sender, amount);

        emit SharesSold(listingId, msg.sender, amount, totalPrice);

        // Refund excess
        if (msg.value > totalPrice) {
            (bool r, ) = payable(msg.sender).call{value: msg.value - totalPrice}("");
            require(r, "refund failed");
        }
    }

    /**
     * @dev Cancel a listing and return tokens
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        ShareListing storage listing = listings[listingId];
        require(listing.isActive, "listing not active");
        require(listing.seller == msg.sender, "not seller");

        listing.isActive = false;

        // Return tokens to seller
        IERC20(listing.fractionToken).transfer(msg.sender, listing.amount);

        emit ListingCancelled(listingId);
    }

    /**
     * @dev Get listing details
     */
    function getListing(uint256 listingId) external view returns (
        address seller,
        address fractionToken,
        uint256 amount,
        uint256 pricePerShare,
        bool isActive
    ) {
        ShareListing memory l = listings[listingId];
        return (l.seller, l.fractionToken, l.amount, l.pricePerShare, l.isActive);
    }

    /**
     * @dev Update platform fee
     */
    function updatePlatformFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 1000, "fee too high");
        platformFeeBasisPoints = newFeeBps;
    }

    /**
     * @dev Update fee recipient
     */
    function updateFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "invalid address");
        feeRecipient = newRecipient;
    }
}
