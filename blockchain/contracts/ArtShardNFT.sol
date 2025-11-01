// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ArtShardNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    constructor() ERC721("ArtShardNFT", "ASM") Ownable(msg.sender) {}

    function mint(address to, string memory tokenURI_) external onlyOwner returns (uint256) {
        _tokenIdCounter += 1;
        uint256 tokenId = _tokenIdCounter;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);
        return tokenId;
    }
}
