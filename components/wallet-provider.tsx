"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { BrowserProvider, Contract, parseUnits } from "ethers";
import EthereumProvider from "@walletconnect/ethereum-provider";
import {
  CELO_CHAIN_ID,
  COMMENT_PRICE_CUSD,
  CUSD_ABI,
  CUSD_TOKEN_ADDRESS,
  PLATFORM_WALLET_ADDRESS,
  REACTION_PRICE_CUSD,
  REACTIONS_TREASURY_ADDRESS
} from "@/lib/payments/celo";
import {
  ensureMiniPayChain,
  isMiniPayProvider,
  miniPayApproveStableToken,
  miniPayReact,
  miniPayTransferStableToken,
  miniPayWithdrawCreatorRewards,
  requestMiniPayAccount
} from "@/lib/payments/minipay";
import { reactionsTreasuryAbi } from "@/lib/contracts/reactionsTreasuryAbi";
import { toClaimKey } from "@/lib/contracts/claimKey";

type ConnectionType = "minipay" | "walletconnect" | "disconnected";

interface WalletContextValue {
  walletAddress?: string;
  connectionType: ConnectionType;
  isMiniPay: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  sendReactionPayment: (claimId?: string, isLike?: boolean) => Promise<string | undefined>;
  withdrawCreatorRewards: () => Promise<string | undefined>;
  sendCommentPayment: (creatorWallet: string) => Promise<string | undefined>;
}

declare global {
  interface Window {
    ethereum?: {
      isMiniPay?: boolean;
      request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
      on?: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string>();
  const [connectionType, setConnectionType] = useState<ConnectionType>("disconnected");
  const [connecting, setConnecting] = useState(false);
  const walletConnectRef = useRef<EthereumProvider | null>(null);

  const isMiniPay =
    typeof window !== "undefined" && Boolean(window.ethereum?.isMiniPay || /MiniPay/i.test(window.navigator.userAgent));
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "https://claimd.app");

  const syncInjectedAccount = useCallback(
    async (requestAccounts: boolean) => {
      if (!window.ethereum) {
        return undefined;
      }

      const provider = window.ethereum;
      const shouldUseMiniPayRequest = requestAccounts && isMiniPayProvider(provider);
      const accounts = shouldUseMiniPayRequest
        ? [await requestMiniPayAccount(provider)].filter(Boolean)
        : ((await provider.request({ method: "eth_accounts" }).catch(() => [])) as string[]);

      const account = accounts[0];
      if (account) {
        setWalletAddress(account);
        setConnectionType(isMiniPayProvider(provider) ? "minipay" : "walletconnect");
        return account;
      }

      setWalletAddress(undefined);
      setConnectionType("disconnected");
      return undefined;
    },
    []
  );

  useEffect(() => {
    void syncInjectedAccount(isMiniPay);
  }, [isMiniPay, syncInjectedAccount]);

  useEffect(() => {
    if (!window.ethereum?.on) {
      return;
    }

    const handleAccountsChanged = (accounts: unknown) => {
      const nextAccount = Array.isArray(accounts) && typeof accounts[0] === "string" ? accounts[0] : undefined;
      setWalletAddress(nextAccount);
      setConnectionType(nextAccount ? (isMiniPayProvider(window.ethereum) ? "minipay" : "walletconnect") : "disconnected");
    };
    const handleChainChanged = () => {
      void syncInjectedAccount(false);
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [syncInjectedAccount]);

  const connectInjected = useCallback(async () => {
    if (!window.ethereum) {
      return false;
    }

    if (isMiniPayProvider(window.ethereum)) {
      await ensureMiniPayChain(window.ethereum).catch(() => undefined);
    }

    const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
    if (accounts[0]) {
      setWalletAddress(accounts[0]);
      setConnectionType(isMiniPayProvider(window.ethereum) ? "minipay" : "walletconnect");
      return true;
    }

    return false;
  }, []);

  const connectWalletConnect = useCallback(async () => {
    if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
      throw new Error("Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID");
    }

    const provider = await EthereumProvider.init({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
      chains: [CELO_CHAIN_ID],
      optionalChains: [44787],
      showQrModal: true,
      metadata: {
        name: "Claimd",
        description: "MiniPay-native public figure feed with paid reactions",
        url: appUrl,
        icons: [`${appUrl}/logo.png`]
      }
    });

    await provider.enable();
    walletConnectRef.current = provider;
    const account = provider.accounts[0];

    if (account) {
      setWalletAddress(account);
      setConnectionType("walletconnect");
    }
  }, [appUrl]);

  const connect = useCallback(async () => {
    setConnecting(true);

    try {
      const injectedConnected = await connectInjected();
      if (!injectedConnected) {
        await connectWalletConnect();
      }
    } finally {
      setConnecting(false);
    }
  }, [connectInjected, connectWalletConnect]);

  const ensureWalletAddress = useCallback(async () => {
    if (walletAddress) {
      return walletAddress;
    }

    const injectedAccount = await syncInjectedAccount(isMiniPay);
    if (injectedAccount) {
      return injectedAccount;
    }

    await connect();
    return walletConnectRef.current?.accounts[0] || (await syncInjectedAccount(false));
  }, [connect, isMiniPay, syncInjectedAccount, walletAddress]);

  const sendReactionPayment = useCallback(async (claimId?: string, isLike?: boolean) => {
    const activeWallet = await ensureWalletAddress();

    if (!REACTIONS_TREASURY_ADDRESS) {
      return undefined;
    }

    if (!activeWallet) {
      throw new Error("Connect a wallet to continue");
    }

    const providerSource = walletConnectRef.current ?? window.ethereum;
    if (!providerSource) {
      throw new Error("No wallet provider available");
    }

    if (isMiniPayProvider(window.ethereum) && window.ethereum) {
      const amount = parseUnits(String(REACTION_PRICE_CUSD), 18);
      if (claimId) {
        const readProvider = new BrowserProvider(window.ethereum);
        const readOnlyToken = new Contract(CUSD_TOKEN_ADDRESS, CUSD_ABI, readProvider);
        const allowance = await readOnlyToken.allowance(activeWallet, REACTIONS_TREASURY_ADDRESS);
        if (allowance < amount) {
          await miniPayApproveStableToken(window.ethereum, activeWallet, REACTIONS_TREASURY_ADDRESS, amount);
        }

        return miniPayReact(window.ethereum, activeWallet, claimId, Boolean(isLike));
      }

      return miniPayTransferStableToken(window.ethereum, activeWallet, REACTIONS_TREASURY_ADDRESS, amount);
    }

    const provider = new BrowserProvider(providerSource);
    const signer = await provider.getSigner();
    const amount = parseUnits(String(REACTION_PRICE_CUSD), 18);
    const cusd = new Contract(CUSD_TOKEN_ADDRESS, CUSD_ABI, signer);

    if (claimId) {
      const allowance = await cusd.allowance(activeWallet, REACTIONS_TREASURY_ADDRESS);
      if (allowance < amount) {
        const approveTx = await cusd.approve(REACTIONS_TREASURY_ADDRESS, amount);
        await approveTx.wait();
      }

      const treasury = new Contract(REACTIONS_TREASURY_ADDRESS, reactionsTreasuryAbi, signer);
      const tx = await treasury.react(toClaimKey(claimId), Boolean(isLike));
      await tx.wait();
      return tx.hash as string;
    }

    const tx = await cusd.transfer(REACTIONS_TREASURY_ADDRESS, amount);
    await tx.wait();
    return tx.hash as string;
  }, [ensureWalletAddress]);

  const sendCommentPayment = useCallback(async (creatorWallet: string) => {
    const activeWallet = await ensureWalletAddress();

    if (!activeWallet) {
      throw new Error("Connect a wallet to continue");
    }

    const providerSource = walletConnectRef.current ?? window.ethereum;
    if (!providerSource) {
      throw new Error("No wallet provider available");
    }

    if (isMiniPayProvider(window.ethereum) && window.ethereum) {
      const creatorAmount = parseUnits(String((COMMENT_PRICE_CUSD * 0.7).toFixed(4)), 18);
      const platformAmount = parseUnits(String((COMMENT_PRICE_CUSD * 0.3).toFixed(4)), 18);

      const creatorTxHash = await miniPayTransferStableToken(window.ethereum, activeWallet, creatorWallet, creatorAmount);
      if (PLATFORM_WALLET_ADDRESS) {
        await miniPayTransferStableToken(window.ethereum, activeWallet, PLATFORM_WALLET_ADDRESS, platformAmount);
      }

      return creatorTxHash;
    }

    const provider = new BrowserProvider(providerSource);
    const signer = await provider.getSigner();
    const cusd = new Contract(CUSD_TOKEN_ADDRESS, CUSD_ABI, signer);
    const creatorAmount = parseUnits(String((COMMENT_PRICE_CUSD * 0.7).toFixed(4)), 18);
    const platformAmount = parseUnits(String((COMMENT_PRICE_CUSD * 0.3).toFixed(4)), 18);

    const creatorTx = await cusd.transfer(creatorWallet, creatorAmount);
    await creatorTx.wait();

    if (PLATFORM_WALLET_ADDRESS) {
      const platformTx = await cusd.transfer(PLATFORM_WALLET_ADDRESS, platformAmount);
      await platformTx.wait();
    }

    return creatorTx.hash as string;
  }, [ensureWalletAddress]);

  const withdrawCreatorRewards = useCallback(async () => {
    const activeWallet = await ensureWalletAddress();

    if (!activeWallet) {
      throw new Error("Connect a wallet to continue");
    }

    if (!REACTIONS_TREASURY_ADDRESS) {
      throw new Error("Missing treasury contract address");
    }

    const providerSource = walletConnectRef.current ?? window.ethereum;
    if (!providerSource) {
      throw new Error("No wallet provider available");
    }

    if (isMiniPayProvider(window.ethereum) && window.ethereum) {
      return miniPayWithdrawCreatorRewards(window.ethereum, activeWallet);
    }

    const provider = new BrowserProvider(providerSource);
    const signer = await provider.getSigner();
    const treasury = new Contract(REACTIONS_TREASURY_ADDRESS, reactionsTreasuryAbi, signer);
    const tx = await treasury.withdrawCreatorRewards();
    await tx.wait();
    return tx.hash as string;
  }, [ensureWalletAddress]);

  const value = useMemo(
    () => ({
      walletAddress,
      connectionType,
      isMiniPay,
      connecting,
      connect,
      sendReactionPayment,
      withdrawCreatorRewards,
      sendCommentPayment
    }),
    [
      walletAddress,
      connectionType,
      isMiniPay,
      connecting,
      connect,
      sendReactionPayment,
      withdrawCreatorRewards,
      sendCommentPayment
    ]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }

  return context;
}
