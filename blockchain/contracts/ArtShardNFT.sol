// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract ArtShardNFT is ERC721URIStorage {
    uint256 private _tokenIdCounter;

    constructor() ERC721("ArtShardNFT", "ASM") {}

    function mint(address to, string memory tokenURI_) external returns (uint256) {
        _tokenIdCounter += 1;
        uint256 tokenId = _tokenIdCounter;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);
        return tokenId;
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
}
