// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./MosaicNFT.sol";

contract MosaicFactory is Ownable, ReentrancyGuard, Pausable {
    MosaicNFT public immutable mosaicNFT;

    struct Collection {
        string name;
        string description;
        address creator;
        uint256[] tokenIds;
        uint256 createdAt;
        bool isActive;
    }

    mapping(uint256 => Collection) public collections;
    mapping(address => uint256[]) public creatorCollections;
    mapping(uint256 => mapping(address => bool)) public collectionApprovals;

    uint256 public nextCollectionId;
    uint256 public platformFeePercentage = 250; // 2.5% in basis points
    uint256 public constant MAX_PLATFORM_FEE = 1000; // 10%

    event CollectionCreated(
        uint256 indexed collectionId,
        string name,
        address indexed creator
    );

    event TokenAddedToCollection(
        uint256 indexed collectionId,
        uint256 indexed tokenId
    );

    event PlatformFeeUpdated(uint256 newFeePercentage);

    modifier validPlatformFee(uint256 feePercentage) {
        require(feePercentage <= MAX_PLATFORM_FEE, "Platform fee too high");
        _;
    }

    constructor(address _mosaicNFTAddress) {
        mosaicNFT = MosaicNFT(_mosaicNFTAddress);
    }

    function createCollection(
        string memory name,
        string memory description
    ) external whenNotPaused returns (uint256) {
        require(bytes(name).length > 0, "Collection name cannot be empty");

        uint256 collectionId = nextCollectionId++;

        collections[collectionId] = Collection({
            name: name,
            description: description,
            creator: msg.sender,
            tokenIds: new uint256[](0),
            createdAt: block.timestamp,
            isActive: true
        });

        creatorCollections[msg.sender].push(collectionId);

        emit CollectionCreated(collectionId, name, msg.sender);
        return collectionId;
    }

    function addTokenToCollection(
        uint256 collectionId,
        uint256 tokenId
    ) external nonReentrant {
        require(collections[collectionId].isActive, "Collection not active");
        require(
            collections[collectionId].creator == msg.sender ||
            collectionApprovals[collectionId][msg.sender],
            "Not authorized"
        );
        require(
            mosaicNFT.ownerOf(tokenId) == msg.sender,
            "Not token owner"
        );

        collections[collectionId].tokenIds.push(tokenId);

        emit TokenAddedToCollection(collectionId, tokenId);
    }

    function batchMintToCollection(
        uint256 collectionId,
        string[] memory names,
        string[] memory descriptions,
        string[][] memory imageCIDsArray,
        string[] memory mosaicCIDs,
        MosaicNFT.MosaicPattern[] memory patterns,
        uint256[] memory royaltyPercentages
    ) external payable nonReentrant whenNotPaused {
        require(
            collections[collectionId].creator == msg.sender ||
            collectionApprovals[collectionId][msg.sender],
            "Not authorized"
        );
        require(collections[collectionId].isActive, "Collection not active");

        uint256 batchSize = names.length;
        require(
            batchSize == descriptions.length &&
            batchSize == imageCIDsArray.length &&
            batchSize == mosaicCIDs.length &&
            batchSize == patterns.length &&
            batchSize == royaltyPercentages.length,
            "Array lengths must match"
        );

        uint256 totalFee = 0;
        for (uint256 i = 0; i < batchSize; i++) {
            totalFee += mosaicNFT.creationFee();
        }

        require(msg.value >= totalFee, "Insufficient payment for batch");

        for (uint256 i = 0; i < batchSize; i++) {
            uint256 tokenId = mosaicNFT.createMosaic{value: mosaicNFT.creationFee()}(
                names[i],
                descriptions[i],
                imageCIDsArray[i],
                mosaicCIDs[i],
                patterns[i],
                royaltyPercentages[i]
            );

            collections[collectionId].tokenIds.push(tokenId);
            emit TokenAddedToCollection(collectionId, tokenId);
        }

        // Refund excess payment
        if (msg.value > totalFee) {
            payable(msg.sender).transfer(msg.value - totalFee);
        }
    }

    function approveCollection(
        uint256 collectionId,
        address operator
    ) external {
        require(
            collections[collectionId].creator == msg.sender,
            "Only collection creator"
        );
        collectionApprovals[collectionId][operator] = true;
    }

    function revokeCollectionApproval(
        uint256 collectionId,
        address operator
    ) external {
        require(
            collections[collectionId].creator == msg.sender,
            "Only collection creator"
        );
        collectionApprovals[collectionId][operator] = false;
    }

    function getCollection(uint256 collectionId)
        external
        view
        returns (Collection memory)
    {
        require(collections[collectionId].isActive, "Collection not active");
        return collections[collectionId];
    }

    function getCreatorCollections(address creator)
        external
        view
        returns (uint256[] memory)
    {
        return creatorCollections[creator];
    }

    function getCollectionTokens(uint256 collectionId)
        external
        view
        returns (uint256[] memory)
    {
        require(collections[collectionId].isActive, "Collection not active");
        return collections[collectionId].tokenIds;
    }

    function setPlatformFee(uint256 newFeePercentage)
        external
        onlyOwner
        validPlatformFee(newFeePercentage)
    {
        platformFeePercentage = newFeePercentage;
        emit PlatformFeeUpdated(newFeePercentage);
    }

    function toggleCollectionActive(uint256 collectionId) external onlyOwner {
        collections[collectionId].isActive = !collections[collectionId].isActive;
    }

    function emergencyPause() external onlyOwner {
        _pause();
    }

    function emergencyUnpause() external onlyOwner {
        _unpause();
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }

    function calculateBatchMintFee(uint256 count) external view returns (uint256) {
        return mosaicNFT.creationFee() * count;
    }
}