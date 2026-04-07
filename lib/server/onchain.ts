import { Contract, JsonRpcProvider, Wallet, formatUnits } from "ethers";
import { reactionsTreasuryAbi } from "@/lib/contracts/reactionsTreasuryAbi";
import { toClaimKey } from "@/lib/contracts/claimKey";

function getPrivateKey() {
  return process.env.DEPLOYER_PRIVATE_KEY || "";
}

export function hasOnchainConfig() {
  return Boolean(process.env.NEXT_PUBLIC_REACTIONS_TREASURY_ADDRESS);
}

function getAdminContract() {
  const privateKey = getPrivateKey();
  const rpcUrl = process.env.CELO_RPC_URL || "https://forno.celo.org";
  const contractAddress = process.env.NEXT_PUBLIC_REACTIONS_TREASURY_ADDRESS;

  if (!privateKey || !contractAddress) {
    throw new Error("Missing onchain contract configuration");
  }

  const provider = new JsonRpcProvider(rpcUrl);
  const signer = new Wallet(privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`, provider);

  return new Contract(contractAddress, reactionsTreasuryAbi, signer);
}

function getReadContract() {
  const rpcUrl = process.env.CELO_RPC_URL || "https://forno.celo.org";
  const contractAddress = process.env.NEXT_PUBLIC_REACTIONS_TREASURY_ADDRESS;

  if (!contractAddress) {
    throw new Error("Missing onchain contract configuration");
  }

  const provider = new JsonRpcProvider(rpcUrl);
  return new Contract(contractAddress, reactionsTreasuryAbi, provider);
}

export async function registerClaimOnchain(claimId: string, creatorWallet: string) {
  if (!getPrivateKey()) {
    return;
  }

  const contract = getAdminContract();
  const claimKey = toClaimKey(claimId);
  const existing = await contract.getClaim(claimKey);

  if (existing[3]) {
    return;
  }

  const tx = await contract.registerClaim(claimKey, creatorWallet);
  await tx.wait();
}

export async function getCreatorAccruedOnchain(walletAddress: string) {
  if (!hasOnchainConfig()) {
    return 0;
  }

  const contract = getReadContract();
  const accrued = await contract.creatorAccrued(walletAddress);
  return Number(formatUnits(accrued, 18));
}
