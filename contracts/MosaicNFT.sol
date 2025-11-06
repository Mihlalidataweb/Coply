// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MosaicNFT is ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct MosaicData {
        string name;
        string description;
        string[] imageCIDs; // 30 image CIDs
        string mosaicCID; // Generated mosaic image CID
        address creator;
        uint256 createdAt;
        MosaicPattern pattern;
        uint256 royaltyPercentage; // Basis points (100 = 1%)
    }

    enum MosaicPattern { GRID, CIRCULAR, RANDOM, ARTISTIC }

    mapping(uint256 => MosaicData) public mosaics;
    mapping(uint256 => string) private _tokenURIs;

    uint256 public constant MAX_IMAGES = 30;
    uint256 public constant MAX_ROYALTY = 1000; // 10%
    uint256 public creationFee = 0.001 ether; // Adjustable creation fee

    event MosaicCreated(
        uint256 indexed tokenId,
        string name,
        address indexed creator,
        MosaicPattern pattern,
        string[] imageCIDs,
        string mosaicCID
    );

    event CreationFeeUpdated(uint256 newFee);

    modifier validMosaicData(string[] memory imageCIDs) {
        require(imageCIDs.length == MAX_IMAGES, "Must have exactly 30 images");
        for (uint256 i = 0; i < imageCIDs.length; i++) {
            require(bytes(imageCIDs[i]).length > 0, "Image CID cannot be empty");
        }
        _;
    }

    modifier validRoyalty(uint256 royaltyPercentage) {
        require(royaltyPercentage <= MAX_ROYALTY, "Royalty cannot exceed 10%");
        _;
    }

    constructor() ERC721("MosaicNFT", "MOSAIC") {}

    function createMosaic(
        string memory name,
        string memory description,
        string[] memory imageCIDs,
        string memory mosaicCID,
        MosaicPattern pattern,
        uint256 royaltyPercentage
    )
        external
        payable
        nonReentrant
        validMosaicData(imageCIDs)
        validRoyalty(royaltyPercentage)
        returns (uint256)
    {
        require(msg.value >= creationFee, "Insufficient creation fee");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(mosaicCID).length > 0, "Mosaic CID cannot be empty");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        // Mint the NFT to the creator
        _safeMint(msg.sender, tokenId);

        // Store mosaic metadata
        mosaics[tokenId] = MosaicData({
            name: name,
            description: description,
            imageCIDs: imageCIDs,
            mosaicCID: mosaicCID,
            creator: msg.sender,
            createdAt: block.timestamp,
            pattern: pattern,
            royaltyPercentage: royaltyPercentage
        });

        // Set token URI to metadata
        string memory metadataURI = _buildMetadataURI(tokenId, name, description, mosaicCID, pattern);
        _setTokenURI(tokenId, metadataURI);

        emit MosaicCreated(tokenId, name, msg.sender, pattern, imageCIDs, mosaicCID);

        // Refund excess payment
        if (msg.value > creationFee) {
            payable(msg.sender).transfer(msg.value - creationFee);
        }

        return tokenId;
    }

    function getMosaicData(uint256 tokenId)
        external
        view
        returns (MosaicData memory)
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return mosaics[tokenId];
    }

    function getTokenRoyalty(uint256 tokenId) external view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return mosaics[tokenId].royaltyPercentage;
    }

    function setCreationFee(uint256 newFee) external onlyOwner {
        creationFee = newFee;
        emit CreationFeeUpdated(newFee);
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    function _buildMetadataURI(
        uint256 tokenId,
        string memory name,
        string memory description,
        string memory mosaicCID,
        MosaicPattern pattern
    ) internal pure returns (string memory) {
        string memory patternString = _patternToString(pattern);

        return string(abi.encodePacked(
            "data:application/json;base64,",
            _base64Encode(
                bytes(
                    abi.encodePacked(
                        "{",
                        '"name":"', name, '",',
                        '"description":"', description, '",',
                        '"image":"ipfs://', mosaicCID, '",',
                        '"external_url":"https://mosaicapp.com/mosaic/', _toString(tokenId), '",',
                        '"attributes":[',
                            '{"trait_type":"Pattern","value":"', patternString, '"},',
                            '{"trait_type":"Image Count","value":30},',
                            '{"trait_type":"Created Date","value":"', _toString(block.timestamp), '"}',
                        ']',
                        "}"
                    )
                )
            )
        )
    }

    function _patternToString(MosaicPattern pattern) internal pure returns (string memory) {
        if (pattern == MosaicPattern.GRID) return "Grid";
        if (pattern == MosaicPattern.CIRCULAR) return "Circular";
        if (pattern == MosaicPattern.RANDOM) return "Random";
        if (pattern == MosaicPattern.ARTISTIC) return "Artistic";
        return "Unknown";
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    function _base64Encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";

        string memory table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        uint256 encodedLen = 4 * ((data.length + 2) / 3);
        string memory result = new string(encodedLen);

        assembly {
            let tablePtr := add(table, 1)
            let dataPtr := add(data, 0x20)
            let endPtr := add(dataPtr, mload(data))
            let resultPtr := add(result, 0x20)

            for {} lt(dataPtr, endPtr) {} {
                dataPtr := add(dataPtr, 3)
                let input := mload(dataPtr)

                mstore8(resultPtr, mload(add(tablePtr, and(shr(18, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(12, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(6, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(input, 0x3F))))
                resultPtr := add(resultPtr, 1)
            }

            // Padding with "="
            switch mod(mload(data), 3)
            case 1 { mstore8(sub(resultPtr, 2), 0x3d) mstore8(sub(resultPtr, 1), 0x3d) }
            case 2 { mstore8(sub(resultPtr, 1), 0x3d) }
        }

        return result;
    }

    // The following functions are overrides required by Solidity.
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}