import Image from "next/image";
import Link from "next/link";
import { compactWallet, cn } from "@/lib/utils";
import { MaterialIcon } from "@/components/material-icon";
import { useWallet } from "@/components/wallet-provider";

export function TopBar({ active }: { active: "home" | "explore" | "post" | "notifications" | "profile" | "onboarding" | "figure" }) {
  const { walletAddress, connect, connecting, connectionType, isMiniPay } = useWallet();

  const links = [
    { href: "/", label: "Home", key: "home" },
    { href: "/explore", label: "Explore", key: "explore" },
    { href: "/profile", label: "Profile", key: "profile" }
  ] as const;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-full bg-secondary-container">
            <Image src="/logo.png" alt="Claimd logo" fill className="object-cover" priority />
          </div>
          <Link href="/" className="font-headline text-xl font-black tracking-tight text-primary">
            Claimd
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-6 md:flex">
            {links.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className={cn(
                  "rounded-xl px-3 py-1 font-headline text-lg font-bold tracking-tight transition-colors",
                  active === link.key ? "text-primary" : "text-on-surface-variant hover:bg-surface-container"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => void connect()}
            className="flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <MaterialIcon name={isMiniPay ? "account_balance_wallet" : "wallet"} filled className="text-base" />
            <span>
              {walletAddress
                ? `${compactWallet(walletAddress)} · ${connectionType === "minipay" ? "MiniPay" : "WalletConnect"}`
                : connecting
                  ? "Connecting..."
                  : "Connect wallet"}
            </span>
          </button>
        </div>
      </div>
      <div className="h-px bg-surface-container-high" />
    </header>
  );
}
