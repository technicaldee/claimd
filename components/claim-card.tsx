"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { MaterialIcon } from "@/components/material-icon";
import { useWallet } from "@/components/wallet-provider";
import { FigureAvatar } from "@/components/figure-avatar";
import { COMMENT_PRICE_CUSD, REACTION_PRICE_CUSD } from "@/lib/payments/celo";
import { fetcher } from "@/lib/fetcher";
import type { ClaimCardData, CommentItem } from "@/lib/types";
import { formatRelativeTime, getClaimCountdown, getClaimHeatLabel, getClaimPoolAmount, getClaimVoteSplit, toCurrency } from "@/lib/utils";

export function ClaimCard({ claim }: { claim: ClaimCardData }) {
  const [state, setState] = useState(claim);
  const [pending, setPending] = useState<"LIKE" | "DISLIKE" | null>(null);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [commentPending, setCommentPending] = useState(false);
  const { walletAddress, connect, sendReactionPayment, sendCommentPayment } = useWallet();
  const primaryFigure = state.figures.find((figure) => figure.primary) ?? state.figures[0];
  const poolAmount = getClaimPoolAmount(state.totalReactions, REACTION_PRICE_CUSD);
  const voteSplit = getClaimVoteSplit(state.likesCount, state.dislikesCount);
  const countdown = getClaimCountdown(state.createdAt);
  const heatLabel = getClaimHeatLabel(state.createdAt);
  const { data: comments = [], mutate: mutateComments } = useSWR<CommentItem[]>(
    commentOpen ? `/api/comments?claimId=${encodeURIComponent(state.id)}` : null,
    fetcher
  );

  async function react(type: "LIKE" | "DISLIKE") {
    setPending(type);

    try {
      if (!walletAddress) {
        await connect();
      }

      const txHash = await sendReactionPayment(state.id, type === "LIKE").catch(() => undefined);
      const response = await fetch("/api/reactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          claimId: state.id,
          walletAddress: walletAddress || "0xLocalPreview00000000000000000000000000000001",
          type,
          txHash
        })
      });

      if (!response.ok) {
        throw new Error("Unable to record reaction");
      }

      setState((current) => ({
        ...current,
        likesCount: type === "LIKE" ? current.likesCount + 1 : current.likesCount,
        dislikesCount: type === "DISLIKE" ? current.dislikesCount + 1 : current.dislikesCount,
        totalReactions: current.totalReactions + 1,
        earnedCusd: Number((current.earnedCusd + REACTION_PRICE_CUSD * 0.7).toFixed(2))
      }));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to react right now");
    } finally {
      setPending(null);
    }
  }

  async function postComment() {
    if (!commentBody.trim()) {
      return;
    }

    setCommentPending(true);

    try {
      if (!walletAddress) {
        await connect();
      }

      const txHash = await sendCommentPayment(state.creatorWallet).catch(() => undefined);
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          claimId: state.id,
          walletAddress: walletAddress || "0xLocalPreview00000000000000000000000000000001",
          body: commentBody.trim(),
          txHash
        })
      });

      if (!response.ok) {
        throw new Error("Unable to post comment");
      }

      setState((current) => ({
        ...current,
        commentsCount: current.commentsCount + 1,
        earnedCusd: Number((current.earnedCusd + COMMENT_PRICE_CUSD * 0.7).toFixed(2))
      }));
      setCommentBody("");
      await mutateComments();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to comment right now");
    } finally {
      setCommentPending(false);
    }
  }

  async function shareClaim() {
    const shareUrl = `${window.location.origin}/figures/${primaryFigure.slug}#claim-${state.id}`;
    const text = `"${state.body}"\n\n${toCurrency(poolAmount)} on the line.\nPick your side: ${shareUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: state.body,
          text: `${toCurrency(poolAmount)} on the line.`,
          url: shareUrl
        });
        return;
      }

      await navigator.clipboard.writeText(text);
      window.alert("Claim link copied");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      window.alert("Unable to share this claim right now");
    }
  }

  return (
    <article
      id={`claim-${state.id}`}
      className="rounded-[24px] border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm transition hover:shadow-editorial"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <FigureAvatar name={primaryFigure.name} imageUrl={primaryFigure.imageUrl} />
          <div>
            <Link href={`/figures/${primaryFigure.slug}`} className="font-headline text-lg font-bold text-on-surface">
              {primaryFigure.name}
            </Link>
            <p className="text-xs font-medium uppercase tracking-wider text-on-secondary-container">
              {primaryFigure.role} • {primaryFigure.country}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full bg-secondary-fixed px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-secondary-fixed">
            {heatLabel}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-secondary-container">
            {formatRelativeTime(state.createdAt)}
          </span>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <p className="font-headline text-3xl font-black leading-tight tracking-tight text-primary">{state.body}</p>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-editorial-gradient p-4 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/65">Current pool</p>
            <p className="mt-2 font-headline text-3xl font-black">{toCurrency(poolAmount)}</p>
            <p className="mt-2 text-xs text-white/75">{state.totalReactions} stakes placed</p>
          </div>
          <div className="rounded-2xl bg-surface-container p-4">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-on-secondary-container">
              <span>Agree</span>
              <span>Disagree</span>
            </div>
            <div className="mt-3 flex items-center justify-between font-headline text-2xl font-black text-primary">
              <span>{voteSplit.agree}%</span>
              <span>{voteSplit.disagree}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-container-highest">
              <div className="h-full bg-primary" style={{ width: `${voteSplit.agree}%` }} />
            </div>
          </div>
          <div className="rounded-2xl bg-surface-container p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-secondary-container">Countdown</p>
            <p className="mt-2 font-headline text-3xl font-black text-primary">{countdown.label}</p>
            <p className="mt-2 text-xs text-on-surface-variant">
              {countdown.ended ? "Momentum is peaking now." : "Back a side before this round cools off."}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-surface-container p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-container-highest text-xs font-black text-primary">
              {state.sourceDomain.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface">{state.sourceTitle || state.sourceDomain}</p>
              <p className="text-xs text-on-secondary-container">{state.sourceDomain}</p>
            </div>
          </div>
          <a href={state.sourceUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary hover:underline">
            View Source
          </a>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-surface-container-high pt-5">
        <div className="grid flex-1 gap-2 md:grid-cols-2">
          <button
            type="button"
            onClick={() => void react("LIKE")}
            disabled={pending !== null}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            <MaterialIcon name="thumb_up" className="text-lg" />
            <span>{pending === "LIKE" ? "Staking..." : `Agree + stake · ${state.likesCount}`}</span>
          </button>
          <button
            type="button"
            onClick={() => void react("DISLIKE")}
            disabled={pending !== null}
            className="flex items-center justify-center gap-2 rounded-xl bg-surface-container-high px-4 py-3 text-sm font-bold text-on-surface transition hover:bg-error-container disabled:opacity-50"
          >
            <MaterialIcon name="thumb_down" className="text-lg" />
            <span>{pending === "DISLIKE" ? "Staking..." : `Disagree + stake · ${state.dislikesCount}`}</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCommentOpen((current) => !current)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container text-on-secondary-container"
          >
            <MaterialIcon name="chat_bubble" className="text-lg" />
          </button>
          <button
            type="button"
            onClick={() => void shareClaim()}
            className="flex items-center gap-2 rounded-xl bg-surface-container px-4 py-2 text-sm font-bold text-primary"
          >
            <MaterialIcon name="share" className="text-base" />
            <span>Share claim</span>
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-surface-container-high pt-4 text-[10px] font-medium opacity-70">
        <div className="flex items-center gap-2">
          <MaterialIcon name="account_balance_wallet" className="text-xs" />
          <span>{state.postedByWallet}</span>
        </div>
        <div className="flex items-center gap-2">
          <MaterialIcon name="schedule" className="text-xs" />
          <span>{formatRelativeTime(state.createdAt)}</span>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-on-secondary-container">
        Each stake adds {REACTION_PRICE_CUSD.toFixed(2)} cUSD to the action. Creators earn when the crowd piles in.
      </p>
      {commentOpen ? (
        <div className="mt-5 space-y-4 rounded-xl border border-outline-variant/10 bg-surface-container p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-lg font-bold text-primary">Paid takes</h3>
            <span className="text-[11px] text-on-secondary-container">
              Replying costs {COMMENT_PRICE_CUSD.toFixed(3)} cUSD
            </span>
          </div>
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="rounded-lg bg-surface-container-lowest p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-primary">{comment.postedByWallet}</span>
                  <span className="text-[11px] text-on-secondary-container">{formatRelativeTime(comment.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm text-on-surface">{comment.body}</p>
              </div>
            ))}
            {comments.length === 0 ? <p className="text-sm text-on-secondary-container">No comments yet.</p> : null}
          </div>
          <div className="space-y-3">
            <textarea
              rows={3}
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
              placeholder="Add your take"
              className="w-full rounded-xl border-0 bg-surface-container-lowest p-3 outline-none"
            />
            <button
              type="button"
              disabled={commentPending || commentBody.trim().length < 2}
              onClick={() => void postComment()}
              className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {commentPending ? "Posting..." : "Post paid take"}
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
