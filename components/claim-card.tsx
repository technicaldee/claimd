"use client";

import { useState } from "react";
import Link from "next/link";
import { MaterialIcon } from "@/components/material-icon";
import { useWallet } from "@/components/wallet-provider";
import { REACTION_PRICE_CUSD } from "@/lib/payments/celo";
import type { ClaimCardData } from "@/lib/types";
import {
  formatReturnMultiplier,
  getClaimCountdown,
  getClaimPools,
  getClaimVoteSplit,
  getPotentialReturnMultiplier,
  toCurrency
} from "@/lib/utils";

type StakeSide = "LIKE" | "DISLIKE";

export function ClaimCard({ claim, detail = false }: { claim: ClaimCardData; detail?: boolean }) {
  const [state, setState] = useState(claim);
  const [selectedSide, setSelectedSide] = useState<StakeSide | null>(null);
  const [pending, setPending] = useState(false);
  const [successState, setSuccessState] = useState<{ side: StakeSide; oppositePercent: number } | null>(null);
  const { walletAddress, connect, sendReactionPayment } = useWallet();
  const primaryFigure = state.figures.find((figure) => figure.primary) ?? state.figures[0];
  const countdown = getClaimCountdown(state.createdAt);
  const split = getClaimVoteSplit(state.likesCount, state.dislikesCount);
  const pools = getClaimPools(state.likesCount, state.dislikesCount, REACTION_PRICE_CUSD);
  const yesReturn = getPotentialReturnMultiplier(pools.totalPool, pools.yesPool, REACTION_PRICE_CUSD);
  const noReturn = getPotentialReturnMultiplier(pools.totalPool, pools.noPool, REACTION_PRICE_CUSD);

  async function confirmStake() {
    if (!selectedSide || countdown.ended) {
      return;
    }

    setPending(true);

    try {
      if (!walletAddress) {
        await connect();
      }

      const txHash = await sendReactionPayment(state.id, selectedSide === "LIKE");
      const response = await fetch("/api/reactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          claimId: state.id,
          walletAddress: walletAddress || "0xLocalPreview00000000000000000000000000000001",
          type: selectedSide,
          txHash
        })
      });

      if (!response.ok) {
        throw new Error("Unable to record reaction");
      }

      setState((current) => ({
        ...current,
        likesCount: selectedSide === "LIKE" ? current.likesCount + 1 : current.likesCount,
        dislikesCount: selectedSide === "DISLIKE" ? current.dislikesCount + 1 : current.dislikesCount,
        totalReactions: current.totalReactions + 1,
        earnedCusd: Number((current.earnedCusd + REACTION_PRICE_CUSD * 0.7).toFixed(2))
      }));
      setSuccessState({
        side: selectedSide,
        oppositePercent: selectedSide === "LIKE" ? split.disagree : split.agree
      });
      setSelectedSide(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to back this side right now");
    } finally {
      setPending(false);
    }
  }

  const selectedMultiplier =
    selectedSide === "LIKE" ? yesReturn : selectedSide === "DISLIKE" ? noReturn : 1;
  const selectedLabel = selectedSide === "LIKE" ? "YES" : "NO";

  return (
    <>
      <article className="overflow-hidden rounded-[28px] border border-outline-variant/10 bg-surface-container-lowest shadow-sm">
        <div className="space-y-6 p-6 md:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">Live now</p>
              <Link href={`/claims/${state.id}`} className="mt-3 block">
                <h2 className="font-headline text-3xl font-black leading-tight tracking-tight text-on-surface md:text-4xl">
                  {state.body}
                </h2>
              </Link>
            </div>
            <div className="rounded-full bg-primary px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white">
              {countdown.label}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl bg-editorial-gradient p-5 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/70">Pool</p>
              <p className="mt-3 font-headline text-4xl font-black">{toCurrency(pools.totalPool)}</p>
            </div>

            <div className="rounded-3xl bg-surface-container p-5">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-on-secondary-container">
                <span>Yes</span>
                <span>No</span>
              </div>
              <div className="mt-3 flex items-end justify-between gap-4">
                <div>
                  <div className="font-headline text-3xl font-black text-primary">{split.agree}%</div>
                  <div className="text-xs font-semibold text-on-secondary-container">{toCurrency(pools.yesPool)}</div>
                </div>
                <div className="text-right">
                  <div className="font-headline text-3xl font-black text-on-surface">{split.disagree}%</div>
                  <div className="text-xs font-semibold text-on-secondary-container">{toCurrency(pools.noPool)}</div>
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-container-highest">
                <div className="h-full bg-primary" style={{ width: `${split.agree}%` }} />
              </div>
            </div>

            <div className="rounded-3xl bg-[#09103f] p-5 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/65">Time left</p>
              <p className="mt-3 font-headline text-4xl font-black">{countdown.label}</p>
            </div>
          </div>

          {successState ? (
            <div className="rounded-3xl border border-emerald-300/60 bg-emerald-50 px-4 py-4 text-emerald-950">
              <p className="text-sm font-black uppercase tracking-[0.18em]">You backed {successState.side === "LIKE" ? "YES" : "NO"}</p>
              <p className="mt-1 text-sm font-semibold">
                You are ahead of {successState.oppositePercent}% of users right now.
              </p>
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              disabled={countdown.ended || pending}
              onClick={() => {
                setSelectedSide("LIKE");
                setSuccessState(null);
              }}
              className="rounded-3xl bg-primary px-5 py-5 text-left text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white/70">Back yes</div>
              <div className="mt-2 font-headline text-3xl font-black">YES</div>
              <div className="mt-1 text-sm font-semibold">possible {formatReturnMultiplier(yesReturn)}</div>
            </button>
            <button
              type="button"
              disabled={countdown.ended || pending}
              onClick={() => {
                setSelectedSide("DISLIKE");
                setSuccessState(null);
              }}
              className="rounded-3xl bg-surface-container-high px-5 py-5 text-left text-on-surface transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-on-secondary-container">Back no</div>
              <div className="mt-2 font-headline text-3xl font-black">NO</div>
              <div className="mt-1 text-sm font-semibold">possible {formatReturnMultiplier(noReturn)}</div>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/10 pt-4 text-sm text-on-secondary-container">
            <div className="flex items-center gap-2">
              <MaterialIcon name="trending_up" className="text-base" />
              <span className="font-semibold">{primaryFigure.name}</span>
            </div>
            {detail ? (
              <a href={state.sourceUrl} target="_blank" rel="noreferrer" className="font-bold text-primary hover:underline">
                View source
              </a>
            ) : (
              <Link href={`/claims/${state.id}`} className="font-bold text-primary hover:underline">
                View market
              </Link>
            )}
          </div>

          {detail ? (
            <div className="rounded-3xl bg-emerald-50 px-4 py-4 text-emerald-950">
              <p className="text-[11px] font-black uppercase tracking-[0.2em]">Creator earned</p>
              <p className="mt-1 font-headline text-3xl font-black">{toCurrency(state.earnedCusd)}</p>
            </div>
          ) : null}
        </div>
      </article>

      {selectedSide ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/45 p-4 md:items-center">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Back {selectedLabel}</p>
                <h3 className="mt-2 font-headline text-2xl font-black text-on-surface">{state.body}</h3>
              </div>
              <button type="button" onClick={() => setSelectedSide(null)} className="rounded-full bg-surface-container p-2 text-on-surface">
                <MaterialIcon name="close" className="text-lg" />
              </button>
            </div>

            <div className="mt-6 space-y-4 rounded-3xl bg-surface-container-low p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-on-secondary-container">Pool</span>
                <span className="font-headline text-2xl font-black text-primary">{toCurrency(pools.totalPool)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-on-secondary-container">Your return if {selectedLabel} wins</span>
                <span className="font-headline text-2xl font-black text-on-surface">
                  {formatReturnMultiplier(selectedMultiplier)}
                </span>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                className="rounded-2xl bg-primary px-4 py-3 font-black text-white"
              >
                {REACTION_PRICE_CUSD.toFixed(2)}
              </button>
            </div>

            <button
              type="button"
              onClick={() => void confirmStake()}
              disabled={pending}
              className="mt-6 flex w-full items-center justify-center rounded-3xl bg-primary px-5 py-4 font-headline text-lg font-black text-white disabled:opacity-60"
            >
              {pending ? "Confirming..." : "Confirm"}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
