import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import { defineConfig } from "hardhat/config";

const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY || "";

const accounts = deployerPrivateKey
  ? [deployerPrivateKey.startsWith("0x") ? deployerPrivateKey : `0x${deployerPrivateKey}`]
  : [];

export default defineConfig({
  plugins: [hardhatEthers],
  solidity: {
    profiles: {
      default: {
        version: "0.8.24"
      },
      production: {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    }
  },
  networks: {
    celo: {
      type: "http",
      chainType: "l1",
      url: process.env.CELO_RPC_URL || "https://forno.celo.org",
      chainId: 42220,
      accounts
    },
    "celo-sepolia": {
      type: "http",
      chainType: "l1",
      url: process.env.CELO_SEPOLIA_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org",
      chainId: 11142220,
      accounts
    }
  }
});
