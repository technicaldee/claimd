import Image from "next/image";
import Link from "next/link";
import { compactWallet } from "@/lib/utils";
import { MaterialIcon } from "@/components/material-icon";
import { useWallet } from "@/components/wallet-provider";

export function TopBar({ active }: { active: "home" | "explore" | "post" | "notifications" | "profile" | "onboarding" | "figure" }) {
  const { walletAddress, connect, connecting, connectionType, isMiniPay } = useWallet();
  const walletLabel = walletAddress
    ? `${compactWallet(walletAddress)} · ${connectionType === "minipay" ? "MiniPay" : "WalletConnect"}`
    : connecting
      ? "Connecting..."
      : isMiniPay
        ? "Continue in MiniPay"
        : "Connect wallet";
  const walletChip = (
    <div className="flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white">
      <MaterialIcon name={isMiniPay ? "account_balance_wallet" : "wallet"} filled className="text-base" />
      <span>{walletLabel}</span>
    </div>
  );
  const showProfileLink = active !== "onboarding" && active !== "profile";

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-full bg-secondary-container">
            <Image src="/logo.png" alt="Claimd logo" fill className="object-cover" priority />
          </div>
          <Link href="/" className="font-headline text-xl font-black tracking-tight text-primary">
            Claimd
          </Link>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {isMiniPay ? (
            walletChip
          ) : (
            <button
              type="button"
              onClick={() => void connect()}
              className="flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <MaterialIcon name="wallet" filled className="text-base" />
              <span>{walletLabel}</span>
            </button>
          )}
          {showProfileLink ? (
            <Link
              href="/profile"
              aria-label="Profile"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-primary transition hover:bg-surface-container-high"
            >
              <MaterialIcon name="person" filled={active === "profile"} className="text-xl" />
            </Link>
          ) : null}
        </div>
      </div>
      <div className="h-px bg-surface-container-high" />
    </header>
  );
}
