"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useWallet } from "@/components/wallet-provider";

export function FollowFigureButton({ figureSlug }: { figureSlug: string }) {
  const { walletAddress, connect } = useWallet();
  const shouldFetch = Boolean(walletAddress);
  const { data, mutate } = useSWR<{ followed: boolean }>(
    shouldFetch ? `/api/follows?wallet=${encodeURIComponent(walletAddress!)}&figureSlug=${encodeURIComponent(figureSlug)}` : null,
    fetcher
  );

  async function toggleFollow() {
    let activeWallet = walletAddress;
    if (!activeWallet) {
      await connect();
      return;
    }

    const nextMethod = data?.followed ? "DELETE" : "POST";
    const response = await fetch("/api/follows", {
      method: nextMethod,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        walletAddress: activeWallet,
        figureSlug
      })
    });

    if (response.ok) {
      const payload = (await response.json()) as { followed: boolean };
      await mutate(payload, false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void toggleFollow()}
      className={`rounded-xl px-5 py-3 font-bold transition ${
        data?.followed ? "bg-secondary-fixed text-on-secondary-fixed" : "bg-primary text-white"
      }`}
    >
      {data?.followed ? "Following" : "Follow Figure"}
    </button>
  );
}
