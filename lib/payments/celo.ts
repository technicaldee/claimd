export const CELO_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CELO_CHAIN_ID || "42220");
export const CELO_CHAIN_HEX = `0x${CELO_CHAIN_ID.toString(16)}`;
export const CELO_RPC_URL =
  process.env.NEXT_PUBLIC_CELO_RPC_URL ||
  (CELO_CHAIN_ID === 44787 ? "https://forno.celo-sepolia.celo-testnet.org" : "https://forno.celo.org");
export const CUSD_TOKEN_ADDRESS =
  process.env.NEXT_PUBLIC_CUSD_TOKEN_ADDRESS || "0x765DE816845861e75A25fCA122bb6898B8B1282a";
export const REACTIONS_TREASURY_ADDRESS =
  process.env.NEXT_PUBLIC_REACTIONS_TREASURY_ADDRESS || "";
export const REACTION_PRICE_CUSD = Number(process.env.NEXT_PUBLIC_DEFAULT_REACTION_PRICE_CUSD || "0.01");
export const COMMENT_PRICE_CUSD = Number(process.env.NEXT_PUBLIC_DEFAULT_COMMENT_PRICE_CUSD || "0.005");
export const PLATFORM_WALLET_ADDRESS =
  process.env.NEXT_PUBLIC_PLATFORM_WALLET_ADDRESS || "";

export const CUSD_ABI = [
  "function transfer(address to, uint256 value) returns (bool)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];
