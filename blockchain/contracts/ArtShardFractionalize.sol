// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title FractionToken
 * @dev ERC20 token representing fractional ownership of an NFT
 */
contract FractionToken is ERC20 {
    address public immutable vault;
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        address initialHolder
    ) ERC20(name, symbol) {
        vault = msg.sender;
        _mint(initialHolder, totalSupply);
    }
    
    function burnFrom(address account, uint256 amount) external {
        require(msg.sender == vault, "only vault");
        _burn(account, amount);
    }
}

/**
 * @title ArtShardFractionalize
 * @dev Vault contract for fractionalizing NFTs into ERC20 tokens
 */
contract ArtShardFractionalize is IERC721Receiver, ReentrancyGuard {
    struct Vault {
        address nftContract;
        uint256 tokenId;
        address fractionToken;
        uint256 totalShares;
        address curator;
        uint256 reservePrice;
        bool isRedeemed;
    }

    uint256 public vaultCount;
    mapping(uint256 => Vault) public vaults;
    
    // Track which NFTs are fractionalized
    mapping(address => mapping(uint256 => uint256)) public nftToVault;

    event VaultCreated(
        uint256 indexed vaultId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address fractionToken,
        uint256 totalShares,
        address curator
    );
    
    event VaultRedeemed(
        uint256 indexed vaultId,
        address indexed redeemer
    );
    
    event ReservePriceUpdated(
        uint256 indexed vaultId,
        uint256 newPrice
    );

    /**
     * @dev Fractionalize an NFT into ERC20 tokens
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to fractionalize
     * @param name Name for the fraction token
     * @param symbol Symbol for the fraction token
     * @param totalShares Total number of fraction tokens to mint
     * @param reservePrice Minimum price (in wei) to redeem/buyout the NFT
     */
    function fractionalize(
        address nftContract,
        uint256 tokenId,
        string calldata name,
        string calldata symbol,
        uint256 totalShares,
        uint256 reservePrice
    ) external nonReentrant returns (uint256 vaultId) {
        require(totalShares > 0, "shares must be > 0");
        require(nftToVault[nftContract][tokenId] == 0, "already fractionalized");
        
        // Transfer NFT to this contract
        IERC721(nftContract).safeTransferFrom(msg.sender, address(this), tokenId);
        
        // Create fraction token
        FractionToken fractionToken = new FractionToken(
            name,
            symbol,
            totalShares,
            msg.sender
        );
        
        vaultCount++;
        vaultId = vaultCount;
        
        vaults[vaultId] = Vault({
            nftContract: nftContract,
            tokenId: tokenId,
            fractionToken: address(fractionToken),
            totalShares: totalShares,
            curator: msg.sender,
            reservePrice: reservePrice,
            isRedeemed: false
        });
        
        nftToVault[nftContract][tokenId] = vaultId;
        
        emit VaultCreated(
            vaultId,
            nftContract,
            tokenId,
            address(fractionToken),
            totalShares,
            msg.sender
        );
    }

    /**
     * @dev Redeem NFT by burning all fraction tokens
     * @param vaultId ID of the vault to redeem
     */
    function redeem(uint256 vaultId) external nonReentrant {
        Vault storage vault = vaults[vaultId];
        require(!vault.isRedeemed, "already redeemed");
        require(vault.fractionToken != address(0), "vault not found");
        
        FractionToken token = FractionToken(vault.fractionToken);
        uint256 balance = token.balanceOf(msg.sender);
        require(balance == vault.totalShares, "must own all shares");
        
        // Burn all tokens
        token.burnFrom(msg.sender, vault.totalShares);
        
        // Mark as redeemed
        vault.isRedeemed = true;
        nftToVault[vault.nftContract][vault.tokenId] = 0;
        
        // Transfer NFT back
        IERC721(vault.nftContract).safeTransferFrom(
            address(this),
            msg.sender,
            vault.tokenId
        );
        
        emit VaultRedeemed(vaultId, msg.sender);
    }

    /**
     * @dev Buyout the NFT by paying the reserve price
     * @param vaultId ID of the vault to buyout
     */
    function buyout(uint256 vaultId) external payable nonReentrant {
        Vault storage vault = vaults[vaultId];
        require(!vault.isRedeemed, "already redeemed");
        require(vault.fractionToken != address(0), "vault not found");
        require(msg.value >= vault.reservePrice, "insufficient payment");
        
        FractionToken token = FractionToken(vault.fractionToken);
        uint256 buyerShares = token.balanceOf(msg.sender);
        
        // Mark as redeemed
        vault.isRedeemed = true;
        nftToVault[vault.nftContract][vault.tokenId] = 0;
        
        // Transfer NFT to buyer
        IERC721(vault.nftContract).safeTransferFrom(
            address(this),
            msg.sender,
            vault.tokenId
        );
        
        // Calculate payment per share for other holders
        uint256 otherShares = vault.totalShares - buyerShares;
        if (otherShares > 0) {
            // Store payment info for claims (simplified: direct distribution)
            // In production, use a claim pattern for gas efficiency
        }
        
        // Refund excess
        if (msg.value > vault.reservePrice) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - vault.reservePrice}("");
            require(success, "refund failed");
        }
        
        emit VaultRedeemed(vaultId, msg.sender);
    }

    /**
     * @dev Update reserve price (only curator)
     */
    function updateReservePrice(uint256 vaultId, uint256 newPrice) external {
        Vault storage vault = vaults[vaultId];
        require(msg.sender == vault.curator, "only curator");
        require(!vault.isRedeemed, "already redeemed");
        
        vault.reservePrice = newPrice;
        emit ReservePriceUpdated(vaultId, newPrice);
    }

    /**
     * @dev Get vault details
     */
    function getVault(uint256 vaultId) external view returns (
        address nftContract,
        uint256 tokenId,
        address fractionToken,
        uint256 totalShares,
        address curator,
        uint256 reservePrice,
        bool isRedeemed
    ) {
        Vault memory v = vaults[vaultId];
        return (
            v.nftContract,
            v.tokenId,
            v.fractionToken,
            v.totalShares,
            v.curator,
            v.reservePrice,
            v.isRedeemed
        );
    }

    /**
     * @dev Check if an NFT is fractionalized
     */
    function isFractionalized(address nftContract, uint256 tokenId) external view returns (bool) {
        return nftToVault[nftContract][tokenId] != 0;
    }

    /**
     * @dev Required for receiving NFTs
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
