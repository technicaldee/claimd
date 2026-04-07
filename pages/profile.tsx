import { useState } from "react";
import useSWR from "swr";
import { AppShell } from "@/components/app-shell";
import { ClaimCard } from "@/components/claim-card";
import { FigureTile } from "@/components/figure-tile";
import { MaterialIcon } from "@/components/material-icon";
import { useWallet } from "@/components/wallet-provider";
import { fetcher } from "@/lib/fetcher";
import type { ProfileSnapshot } from "@/lib/types";
import { toCurrency } from "@/lib/utils";

export default function ProfilePage() {
  const { walletAddress, isMiniPay, withdrawCreatorRewards, connect } = useWallet();
  const [withdrawing, setWithdrawing] = useState(false);
  const { data, mutate } = useSWR<ProfileSnapshot>(
    `/api/profile${walletAddress ? `?wallet=${encodeURIComponent(walletAddress)}` : ""}`,
    fetcher
  );

  if (!data) {
    return (
      <AppShell active="profile">
        <div className="rounded-xl bg-surface-container-lowest p-8 shadow-sm">Loading profile…</div>
      </AppShell>
    );
  }

  async function handleWithdraw() {
    try {
      if (!walletAddress) {
        await connect();
      }

      setWithdrawing(true);
      await withdrawCreatorRewards();
      await mutate();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to withdraw rewards");
    } finally {
      setWithdrawing(false);
    }
  }

  return (
    <AppShell active="profile">
      <section className="mb-10 grid gap-8 md:grid-cols-12">
        <div className="space-y-6 md:col-span-4">
          <div>
            <h1 className="font-headline text-5xl font-extrabold tracking-tight text-primary">{data.displayName}</h1>
            <div className="mt-2 flex items-center gap-2 text-on-secondary-container">
              <span className="rounded-md bg-surface-container-high px-2 py-1 text-xs font-mono">{data.walletAddress}</span>
              <MaterialIcon name="content_copy" className="text-sm" />
            </div>
          </div>
          <div className="flex gap-10">
            <div>
              <p className="font-headline text-2xl font-bold text-primary">{data.totalPosts}</p>
              <p className="text-xs uppercase tracking-widest text-on-secondary-container">Total Posts</p>
            </div>
            <div>
              <p className="font-headline text-2xl font-bold text-primary">{data.totalReactionsReceived}</p>
              <p className="text-xs uppercase tracking-widest text-on-secondary-container">Reactions</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-8">
          <div className="relative overflow-hidden rounded-[28px] bg-editorial-gradient p-8 text-white shadow-editorial">
            <div className="absolute right-4 top-4 opacity-10">
              <MaterialIcon name="account_balance_wallet" filled className="text-[120px]" />
            </div>
            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Total Earned</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <h2 className="font-headline text-6xl font-extrabold tracking-tight">{data.totalEarned.toFixed(2)}</h2>
                  <span className="text-2xl font-bold opacity-80">cUSD</span>
                </div>
                <p className="mt-3 text-sm italic text-white/70">From paid likes and dislikes on your sourced claims.</p>
                <p className="mt-4 text-sm font-semibold text-white/85">
                  Available onchain now: {data.availableOnchainRewards.toFixed(2)} cUSD
                </p>
                <p className="mt-2 text-xs text-white/70">
                  {isMiniPay
                    ? `MiniPay withdrawal address auto-detected: ${walletAddress || data.withdrawalAddress}`
                    : `Withdrawal address: ${walletAddress || data.withdrawalAddress}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleWithdraw()}
                disabled={withdrawing || data.availableOnchainRewards <= 0}
                className="rounded-xl bg-secondary-fixed px-8 py-4 font-bold text-on-secondary-fixed disabled:cursor-not-allowed disabled:opacity-60"
              >
                {withdrawing ? "Claiming..." : "Claim Rewards"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-6 flex items-center justify-between border-b border-outline-variant/20 pb-4">
          <div className="font-headline text-xl font-bold text-primary">Followed Figures</div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-on-secondary-container">{data.selectedCountry}</span>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {data.followedFigures.map((figure) => (
            <FigureTile key={figure.id} figure={figure} />
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-3xl font-bold text-primary">My Posts</h2>
          <span className="rounded-full bg-secondary-fixed px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-on-secondary-fixed">
            {toCurrency(data.totalEarned)}
          </span>
        </div>
        {data.recentClaims.map((claim) => (
          <ClaimCard key={claim.id} claim={claim} />
        ))}
      </section>
    </AppShell>
  );
}
