import { parseUnits } from "ethers";
import { network } from "hardhat";

function env(name: string, fallback?: string) {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

const { ethers } = await network.connect();

const owner = env("REACTIONS_OWNER_ADDRESS");
const platformRecipient = env("REACTIONS_PLATFORM_RECIPIENT", owner);
const paymentToken = env("REACTIONS_PAYMENT_TOKEN_ADDRESS", process.env.NEXT_PUBLIC_CUSD_TOKEN_ADDRESS);
const reactionPrice = env(
  "REACTIONS_PRICE_WEI",
  parseUnits(process.env.NEXT_PUBLIC_DEFAULT_REACTION_PRICE_CUSD || "0.01", 18).toString()
);
const platformFeeBps = Number(env("REACTIONS_PLATFORM_FEE_BPS", "3000"));

const factory = await ethers.getContractFactory("ClaimdReactionsTreasury");
const contract = await factory.deploy(owner, paymentToken, platformRecipient, reactionPrice, platformFeeBps);
await contract.waitForDeployment();

const address = await contract.getAddress();

console.log(`ClaimdReactionsTreasury deployed to ${address}`);
console.log(`NEXT_PUBLIC_REACTIONS_TREASURY_ADDRESS=${address}`);
