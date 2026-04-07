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
import { formatRelativeTime, toCurrency } from "@/lib/utils";

export function ClaimCard({ claim }: { claim: ClaimCardData }) {
  const [state, setState] = useState(claim);
  const [pending, setPending] = useState<"LIKE" | "DISLIKE" | null>(null);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [commentPending, setCommentPending] = useState(false);
  const { walletAddress, connect, sendReactionPayment, sendCommentPayment } = useWallet();
  const primaryFigure = state.figures.find((figure) => figure.primary) ?? state.figures[0];
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

  return (
    <article className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm transition hover:shadow-editorial">
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
        <span className="rounded-full bg-secondary-fixed px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-secondary-fixed">
          Sourced
        </span>
      </div>

      <div className="mb-6 space-y-4">
        <p className="font-headline text-2xl font-bold leading-tight tracking-tight text-primary">{state.body}</p>

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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void react("LIKE")}
            disabled={pending !== null}
            className="flex items-center gap-2 rounded-xl bg-surface-container px-4 py-2 text-sm font-bold text-primary transition hover:bg-secondary-fixed disabled:opacity-50"
          >
            <MaterialIcon name="thumb_up" className="text-lg" />
            <span>{state.likesCount}</span>
          </button>
          <button
            type="button"
            onClick={() => void react("DISLIKE")}
            disabled={pending !== null}
            className="flex items-center gap-2 rounded-xl bg-surface-container px-4 py-2 text-sm font-bold text-on-secondary-container transition hover:bg-error-container disabled:opacity-50"
          >
            <MaterialIcon name="thumb_down" className="text-lg" />
            <span>{state.dislikesCount}</span>
          </button>
          <button
            type="button"
            onClick={() => setCommentOpen((current) => !current)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container text-on-secondary-container"
          >
            <MaterialIcon name="chat_bubble" className="text-lg" />
          </button>
        </div>
        <div className="rounded-xl bg-primary-container px-4 py-2 font-headline text-sm font-extrabold text-white">
          Earned: {toCurrency(state.earnedCusd)}
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
        Reactions cost {REACTION_PRICE_CUSD.toFixed(2)} cUSD each. Creator earns 70% of every paid reaction.
      </p>
      {commentOpen ? (
        <div className="mt-5 space-y-4 rounded-xl border border-outline-variant/10 bg-surface-container p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-lg font-bold text-primary">Comments</h3>
            <span className="text-[11px] text-on-secondary-container">
              Commenting costs {COMMENT_PRICE_CUSD.toFixed(3)} cUSD
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
              placeholder="Add a paid comment"
              className="w-full rounded-xl border-0 bg-surface-container-lowest p-3 outline-none"
            />
            <button
              type="button"
              disabled={commentPending || commentBody.trim().length < 2}
              onClick={() => void postComment()}
              className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {commentPending ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
