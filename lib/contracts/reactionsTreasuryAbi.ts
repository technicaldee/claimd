export const reactionsTreasuryAbi = [
  "function react(bytes32 claimId, bool isLike)",
  "function registerClaim(bytes32 claimId, address creator)",
  "function getClaim(bytes32 claimId) view returns (address creator, uint64 likes, uint64 dislikes, bool exists)",
  "function creatorAccrued(address creator) view returns (uint256)",
  "function reactionPrice() view returns (uint256)",
  "function withdrawCreatorRewards()"
] as const;
