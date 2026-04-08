import { useState } from "react";
import useSWR from "swr";
import { AppShell } from "@/components/app-shell";
import { ClaimCard } from "@/components/claim-card";
import { MaterialIcon } from "@/components/material-icon";
import { useWallet } from "@/components/wallet-provider";
import { fetcher } from "@/lib/fetcher";
import type { ProfileSnapshot } from "@/lib/types";
import { toCurrency } from "@/lib/utils";

export default function ProfilePage() {
  const { walletAddress, withdrawCreatorRewards, connect } = useWallet();
  const [withdrawing, setWithdrawing] = useState(false);
  const { data, mutate } = useSWR<ProfileSnapshot>(
    `/api/profile${walletAddress ? `?wallet=${encodeURIComponent(walletAddress)}` : ""}`,
    fetcher
  );

  if (!data) {
    return (
      <AppShell active="profile">
        <div className="rounded-[28px] bg-surface-container-lowest p-8 shadow-sm">Loading profile…</div>
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
      <div className="space-y-8">
        <section className="rounded-[32px] bg-editorial-gradient p-7 text-white shadow-editorial">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">Profile</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-headline text-4xl font-black tracking-tight">{data.displayName}</h1>
              <p className="mt-2 text-sm font-semibold text-white/75">{data.walletAddress}</p>
            </div>
            <button
              type="button"
              onClick={() => void handleWithdraw()}
              disabled={withdrawing || data.availableOnchainRewards <= 0}
              className="rounded-2xl bg-white px-5 py-3 font-black text-primary disabled:opacity-60"
            >
              {withdrawing ? "Claiming..." : `Claim ${toCurrency(data.availableOnchainRewards)}`}
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ProfileMetric label="Total earnings" value={toCurrency(data.totalEarned)} tone="primary" />
          <ProfileMetric label="Total staked" value={toCurrency(data.totalStaked)} tone="dark" />
          <ProfileMetric label="Wins" value={String(data.winsCount)} tone="light" />
          <ProfileMetric label="Losses" value={String(data.lossesCount)} tone="light" />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-2xl font-black text-on-surface">Your live bets</h2>
            <span className="rounded-full bg-surface-container px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-on-secondary-container">
              {data.totalPosts} created
            </span>
          </div>
          {data.recentClaims.length > 0 ? (
            <div className="space-y-4">
              {data.recentClaims.map((claim) => (
                <ClaimCard key={claim.id} claim={claim} />
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-sm">
              <p className="font-headline text-3xl font-black text-on-surface">No markets yet.</p>
              <p className="mt-2 text-sm font-semibold text-on-secondary-container">
                Start one, let people pick a side, and earn when the pool moves.
              </p>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function ProfileMetric({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "primary" | "dark" | "light";
}) {
  const palette =
    tone === "primary"
      ? "bg-primary text-white"
      : tone === "dark"
        ? "bg-[#09103f] text-white"
        : "bg-surface-container-lowest text-on-surface";

  return (
    <div className={`rounded-[28px] p-6 shadow-sm ${palette}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.22em] opacity-70">{label}</p>
      <div className="mt-3 flex items-center gap-2">
        <MaterialIcon name="trophy" className="text-xl" />
        <p className="font-headline text-3xl font-black">{value}</p>
      </div>
    </div>
  );
}
