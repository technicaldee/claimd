import { keccak256, toUtf8Bytes } from "ethers";

export function toClaimKey(claimId: string) {
  return keccak256(toUtf8Bytes(claimId));
}
