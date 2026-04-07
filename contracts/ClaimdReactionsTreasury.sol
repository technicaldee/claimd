// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ClaimdReactionsTreasury is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint16 public constant MAX_BPS = 10_000;

    error ZeroAddress();
    error InvalidFeeBps();
    error LengthMismatch();
    error ClaimAlreadyRegistered();
    error ClaimNotRegistered();
    error AlreadyReacted();
    error NothingToWithdraw();

    struct ClaimConfig {
        address creator;
        uint64 likes;
        uint64 dislikes;
        bool exists;
    }

    IERC20 public immutable paymentToken;
    address public platformRecipient;
    uint256 public reactionPrice;
    uint16 public platformFeeBps;
    uint256 public platformAccrued;

    mapping(bytes32 => ClaimConfig) private claims;
    mapping(bytes32 => mapping(address => bool)) public hasReacted;
    mapping(address => uint256) public creatorAccrued;

    event ClaimRegistered(bytes32 indexed claimId, address indexed creator);
    event ReactionRecorded(
        bytes32 indexed claimId,
        address indexed reactor,
        address indexed creator,
        bool isLike,
        uint256 amount,
        uint256 creatorShare,
        uint256 platformShare
    );
    event CreatorWithdrawn(address indexed creator, uint256 amount);
    event PlatformWithdrawn(address indexed recipient, uint256 amount);
    event ReactionPriceUpdated(uint256 newReactionPrice);
    event PlatformFeeUpdated(uint16 newPlatformFeeBps);
    event PlatformRecipientUpdated(address indexed newRecipient);

    constructor(
        address initialOwner,
        address paymentTokenAddress,
        address initialPlatformRecipient,
        uint256 initialReactionPrice,
        uint16 initialPlatformFeeBps
    ) Ownable(initialOwner) {
        if (initialOwner == address(0) || paymentTokenAddress == address(0) || initialPlatformRecipient == address(0)) {
            revert ZeroAddress();
        }
        if (initialPlatformFeeBps >= MAX_BPS) {
            revert InvalidFeeBps();
        }

        paymentToken = IERC20(paymentTokenAddress);
        platformRecipient = initialPlatformRecipient;
        reactionPrice = initialReactionPrice;
        platformFeeBps = initialPlatformFeeBps;
    }

    function registerClaim(bytes32 claimId, address creator) external onlyOwner {
        if (creator == address(0)) revert ZeroAddress();
        if (claims[claimId].exists) revert ClaimAlreadyRegistered();

        claims[claimId] = ClaimConfig({creator: creator, likes: 0, dislikes: 0, exists: true});

        emit ClaimRegistered(claimId, creator);
    }

    function batchRegisterClaims(bytes32[] calldata claimIds, address[] calldata creators) external onlyOwner {
        if (claimIds.length != creators.length) revert LengthMismatch();

        for (uint256 i = 0; i < claimIds.length; i++) {
            if (creators[i] == address(0)) revert ZeroAddress();
            if (claims[claimIds[i]].exists) revert ClaimAlreadyRegistered();

            claims[claimIds[i]] = ClaimConfig({creator: creators[i], likes: 0, dislikes: 0, exists: true});
            emit ClaimRegistered(claimIds[i], creators[i]);
        }
    }

    function react(bytes32 claimId, bool isLike) external nonReentrant {
        ClaimConfig storage claimConfig = claims[claimId];
        if (!claimConfig.exists) revert ClaimNotRegistered();
        if (hasReacted[claimId][msg.sender]) revert AlreadyReacted();

        hasReacted[claimId][msg.sender] = true;
        paymentToken.safeTransferFrom(msg.sender, address(this), reactionPrice);

        uint256 platformShare = (reactionPrice * platformFeeBps) / MAX_BPS;
        uint256 creatorShare = reactionPrice - platformShare;

        creatorAccrued[claimConfig.creator] += creatorShare;
        platformAccrued += platformShare;

        if (isLike) {
            claimConfig.likes += 1;
        } else {
            claimConfig.dislikes += 1;
        }

        emit ReactionRecorded(
            claimId,
            msg.sender,
            claimConfig.creator,
            isLike,
            reactionPrice,
            creatorShare,
            platformShare
        );
    }

    function withdrawCreatorRewards() external nonReentrant {
        uint256 amount = creatorAccrued[msg.sender];
        if (amount == 0) revert NothingToWithdraw();

        creatorAccrued[msg.sender] = 0;
        paymentToken.safeTransfer(msg.sender, amount);

        emit CreatorWithdrawn(msg.sender, amount);
    }

    function withdrawPlatformRewards() external onlyOwner nonReentrant {
        uint256 amount = platformAccrued;
        if (amount == 0) revert NothingToWithdraw();

        platformAccrued = 0;
        paymentToken.safeTransfer(platformRecipient, amount);

        emit PlatformWithdrawn(platformRecipient, amount);
    }

    function setReactionPrice(uint256 newReactionPrice) external onlyOwner {
        reactionPrice = newReactionPrice;
        emit ReactionPriceUpdated(newReactionPrice);
    }

    function setPlatformFeeBps(uint16 newPlatformFeeBps) external onlyOwner {
        if (newPlatformFeeBps >= MAX_BPS) revert InvalidFeeBps();
        platformFeeBps = newPlatformFeeBps;
        emit PlatformFeeUpdated(newPlatformFeeBps);
    }

    function setPlatformRecipient(address newPlatformRecipient) external onlyOwner {
        if (newPlatformRecipient == address(0)) revert ZeroAddress();
        platformRecipient = newPlatformRecipient;
        emit PlatformRecipientUpdated(newPlatformRecipient);
    }

    function getClaim(bytes32 claimId) external view returns (address creator, uint64 likes, uint64 dislikes, bool exists) {
        ClaimConfig memory claimConfig = claims[claimId];
        return (claimConfig.creator, claimConfig.likes, claimConfig.dislikes, claimConfig.exists);
    }
}
