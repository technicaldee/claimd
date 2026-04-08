import {
  createPublicClient,
  createWalletClient,
  custom,
  encodeFunctionData,
  hexToBigInt,
  http,
  parseAbi,
  type Address,
  type Hex
} from "viem";
import { celo, celoSepolia } from "viem/chains";
import { reactionsTreasuryAbi } from "@/lib/contracts/reactionsTreasuryAbi";
import { toClaimKey } from "@/lib/contracts/claimKey";
import {
  CELO_CHAIN_HEX,
  CELO_CHAIN_ID,
  CELO_RPC_URL,
  CUSD_ABI,
  CUSD_TOKEN_ADDRESS,
  REACTIONS_TREASURY_ADDRESS
} from "@/lib/payments/celo";

type InjectedProvider = NonNullable<Window["ethereum"]>;

type TransactionRequest = {
  from: Address;
  to: Address;
  data: Hex;
  value?: bigint;
  feeCurrency?: Address;
};

const stableTokenAbi = parseAbi(CUSD_ABI);
const treasuryAbi = parseAbi(reactionsTreasuryAbi);
const activeChain = CELO_CHAIN_ID === 44787 ? celoSepolia : celo;

function getPublicClient() {
  return createPublicClient({
    chain: activeChain,
    transport: http(CELO_RPC_URL)
  });
}

export function isMiniPayProvider(provider?: Window["ethereum"]): provider is InjectedProvider {
  return Boolean(provider?.isMiniPay);
}

export async function requestMiniPayAccount(provider: InjectedProvider) {
  const accounts = (await provider.request({
    method: "eth_requestAccounts",
    params: []
  })) as string[];

  return accounts[0];
}

export async function ensureMiniPayChain(provider: InjectedProvider) {
  const currentChainId = (await provider.request({ method: "eth_chainId" }).catch(() => undefined)) as
    | string
    | undefined;

  if (!currentChainId || currentChainId.toLowerCase() === CELO_CHAIN_HEX.toLowerCase()) {
    return;
  }

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CELO_CHAIN_HEX }]
    });
  } catch (error) {
    const typedError = error as { code?: number };
    if (typedError.code !== 4902) {
      throw error;
    }

    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: CELO_CHAIN_HEX,
          chainName: activeChain.name,
          nativeCurrency: activeChain.nativeCurrency,
          rpcUrls: [CELO_RPC_URL],
          blockExplorerUrls: activeChain.blockExplorers?.default ? [activeChain.blockExplorers.default.url] : []
        }
      ]
    });
  }
}

async function sendMiniPayTransaction(provider: InjectedProvider, request: TransactionRequest) {
  await ensureMiniPayChain(provider);

  const publicClient = getPublicClient();
  const walletClient = createWalletClient({
    chain: activeChain,
    transport: custom(provider)
  });
  const gas = await publicClient.estimateGas({
    account: request.from,
    to: request.to,
    data: request.data,
    value: request.value ?? 0n,
    feeCurrency: request.feeCurrency
  });
  const gasPrice = request.feeCurrency
    ? ((await provider.request({
        method: "eth_gasPrice",
        params: [request.feeCurrency]
      })) as Hex)
    : ((await provider.request({
        method: "eth_gasPrice"
      })) as Hex);

  const hash = await walletClient.sendTransaction({
    account: request.from,
    to: request.to,
    data: request.data,
    value: request.value ?? 0n,
    gas,
    gasPrice: hexToBigInt(gasPrice),
    feeCurrency: request.feeCurrency
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") {
    throw new Error("MiniPay transaction failed");
  }

  return hash;
}

export async function miniPayApproveStableToken(provider: InjectedProvider, from: string, spender: string, amount: bigint) {
  return sendMiniPayTransaction(provider, {
    from: from as Address,
    to: CUSD_TOKEN_ADDRESS as Address,
    data: encodeFunctionData({
      abi: stableTokenAbi,
      functionName: "approve",
      args: [spender as Address, amount]
    }),
    feeCurrency: CUSD_TOKEN_ADDRESS as Address
  });
}

export async function miniPayTransferStableToken(provider: InjectedProvider, from: string, to: string, amount: bigint) {
  return sendMiniPayTransaction(provider, {
    from: from as Address,
    to: CUSD_TOKEN_ADDRESS as Address,
    data: encodeFunctionData({
      abi: stableTokenAbi,
      functionName: "transfer",
      args: [to as Address, amount]
    }),
    feeCurrency: CUSD_TOKEN_ADDRESS as Address
  });
}

export async function miniPayReact(provider: InjectedProvider, from: string, claimId: string, isLike: boolean) {
  if (!REACTIONS_TREASURY_ADDRESS) {
    throw new Error("Missing treasury contract address");
  }

  return sendMiniPayTransaction(provider, {
    from: from as Address,
    to: REACTIONS_TREASURY_ADDRESS as Address,
    data: encodeFunctionData({
      abi: treasuryAbi,
      functionName: "react",
      args: [toClaimKey(claimId) as Hex, isLike]
    }),
    feeCurrency: CUSD_TOKEN_ADDRESS as Address
  });
}

export async function miniPayWithdrawCreatorRewards(provider: InjectedProvider, from: string) {
  if (!REACTIONS_TREASURY_ADDRESS) {
    throw new Error("Missing treasury contract address");
  }

  return sendMiniPayTransaction(provider, {
    from: from as Address,
    to: REACTIONS_TREASURY_ADDRESS as Address,
    data: encodeFunctionData({
      abi: treasuryAbi,
      functionName: "withdrawCreatorRewards"
    }),
    feeCurrency: CUSD_TOKEN_ADDRESS as Address
  });
}
