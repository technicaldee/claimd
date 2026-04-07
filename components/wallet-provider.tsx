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

  const isMiniPay = typeof window !== "undefined" && Boolean(window.ethereum?.isMiniPay || /MiniPay/i.test(window.navigator.userAgent));
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "https://claimd.app");

  useEffect(() => {
    async function bootstrap() {
      if (!window.ethereum) {
        return;
      }

      const accounts = (await window.ethereum.request({ method: "eth_accounts" }).catch(() => [])) as string[];
      if (accounts[0]) {
        setWalletAddress(accounts[0]);
        setConnectionType(isMiniPay ? "minipay" : "walletconnect");
      }
    }

    void bootstrap();
  }, [isMiniPay]);

  const connectInjected = useCallback(async () => {
    if (!window.ethereum) {
      return false;
    }

    const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[];
    if (accounts[0]) {
      setWalletAddress(accounts[0]);
      setConnectionType(isMiniPay ? "minipay" : "walletconnect");
      return true;
    }

    return false;
  }, [isMiniPay]);

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

  const sendReactionPayment = useCallback(async (claimId?: string, isLike?: boolean) => {
    if (!walletAddress) {
      await connect();
    }

    if (!REACTIONS_TREASURY_ADDRESS) {
      return undefined;
    }

    const providerSource = walletConnectRef.current ?? window.ethereum;
    if (!providerSource) {
      throw new Error("No wallet provider available");
    }

    const provider = new BrowserProvider(providerSource);
    const signer = await provider.getSigner();
    const amount = parseUnits(String(REACTION_PRICE_CUSD), 18);
    const cusd = new Contract(CUSD_TOKEN_ADDRESS, CUSD_ABI, signer);

    if (claimId) {
      const allowance = await cusd.allowance(walletAddress, REACTIONS_TREASURY_ADDRESS);
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
  }, [connect, walletAddress]);

  const sendCommentPayment = useCallback(async (creatorWallet: string) => {
    if (!walletAddress) {
      await connect();
    }

    const providerSource = walletConnectRef.current ?? window.ethereum;
    if (!providerSource) {
      throw new Error("No wallet provider available");
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
  }, [connect, walletAddress]);

  const withdrawCreatorRewards = useCallback(async () => {
    if (!walletAddress) {
      await connect();
    }

    if (!REACTIONS_TREASURY_ADDRESS) {
      throw new Error("Missing treasury contract address");
    }

    const providerSource = walletConnectRef.current ?? window.ethereum;
    if (!providerSource) {
      throw new Error("No wallet provider available");
    }

    const provider = new BrowserProvider(providerSource);
    const signer = await provider.getSigner();
    const treasury = new Contract(REACTIONS_TREASURY_ADDRESS, reactionsTreasuryAbi, signer);
    const tx = await treasury.withdrawCreatorRewards();
    await tx.wait();
    return tx.hash as string;
  }, [connect, walletAddress]);

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
