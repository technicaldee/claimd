import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { AppShell } from "@/components/app-shell";
import { MaterialIcon } from "@/components/material-icon";
import { useCountry } from "@/components/country-provider";
import { useWallet } from "@/components/wallet-provider";
import { fetcher } from "@/lib/fetcher";
import { CLAIM_PRICE_CUSD } from "@/lib/payments/celo";
import type { ClaimValidationResult, FigureSummary } from "@/lib/types";

export default function PostPage() {
  const router = useRouter();
  const { country } = useCountry();
  const { walletAddress, connect, sendClaimPayment } = useWallet();
  const [claimText, setClaimText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [query, setQuery] = useState("");
  const [selectedFigures, setSelectedFigures] = useState<FigureSummary[]>([]);
  const [validation, setValidation] = useState<ClaimValidationResult | null>(null);
  const [saving, setSaving] = useState(false);
  const { data: searchResults = [] } = useSWR<FigureSummary[]>(
    `/api/figures/search?country=${encodeURIComponent(country)}&q=${encodeURIComponent(query)}`,
    fetcher
  );

  const canPost = validation?.ok && claimText.trim().length > 20 && selectedFigures.length > 0 && sourceUrl;
  const previewTitle = useMemo(() => claimText.trim() || "Your claim goes here.", [claimText]);

  async function validateSource() {
    const response = await fetch("/api/claims/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        claimText,
        sourceUrl,
        figureNames: selectedFigures.map((figure) => figure.name)
      })
    });

    const result = (await response.json()) as ClaimValidationResult;
    setValidation(result);
  }

  async function publishClaim() {
    if (!walletAddress) {
      await connect();
    }

    setSaving(true);

    try {
      await sendClaimPayment();

      const response = await fetch("/api/claims", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          claimText,
          sourceUrl,
          category: "Hot Takes",
          country,
          walletAddress: walletAddress || "0xLocalPreview00000000000000000000000000000001",
          figures: selectedFigures,
          validation
        })
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || "Unable to publish claim");
      }

      const payload = (await response.json()) as { id: string };
      await router.push(`/claims/${payload.id}`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to post claim");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell active="post">
      <div className="mx-auto max-w-3xl space-y-8">
        <section className="space-y-3">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-primary">Create a claim</p>
          <h1 className="font-headline text-5xl font-black tracking-tight text-on-surface">Start a bet</h1>
        </section>

        <section className="space-y-6 rounded-[32px] border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm md:p-8">
          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-on-secondary-container">Public figure</label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search public figure"
              className="w-full rounded-2xl border-0 bg-surface-container px-4 py-4 text-on-surface outline-none"
            />
            {selectedFigures.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedFigures.map((figure) => (
                  <button
                    key={figure.id}
                    type="button"
                    onClick={() => setSelectedFigures((current) => current.filter((item) => item.id !== figure.id))}
                    className="rounded-full bg-primary px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-white"
                  >
                    {figure.name} ×
                  </button>
                ))}
              </div>
            ) : null}
            <div className="grid gap-3 md:grid-cols-2">
              {searchResults.slice(0, 6).map((figure) => {
                const selected = selectedFigures.some((item) => item.id === figure.id);
                return (
                  <button
                    key={`${figure.source}-${figure.id}`}
                    type="button"
                    onClick={() => {
                      if (selected) {
                        setSelectedFigures((current) => current.filter((item) => item.id !== figure.id));
                      } else {
                        setSelectedFigures((current) => [figure]);
                      }
                    }}
                    className={`rounded-3xl border px-4 py-4 text-left transition ${
                      selected ? "border-primary bg-primary text-white" : "border-outline-variant/15 bg-surface-container hover:border-primary/30"
                    }`}
                  >
                    <div className="font-headline text-xl font-black">{figure.name}</div>
                    <div className={`mt-1 text-xs font-semibold uppercase tracking-[0.16em] ${selected ? "text-white/75" : "text-on-secondary-container"}`}>
                      {figure.role}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-on-secondary-container">Claim</label>
            <textarea
              rows={4}
              value={claimText}
              onChange={(event) => setClaimText(event.target.value)}
              placeholder="Wizkid is bigger than Davido"
              className="w-full rounded-3xl border-0 bg-surface-container p-4 font-headline text-2xl font-black text-on-surface outline-none"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-on-secondary-container">Source</label>
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder="https://..."
                className="min-w-0 flex-1 rounded-2xl border-0 bg-surface-container px-4 py-4 outline-none"
              />
              <button
                type="button"
                onClick={() => void validateSource()}
                className="rounded-2xl bg-surface-container-high px-6 py-4 font-black text-on-surface"
              >
                Check
              </button>
            </div>
          </div>

          <div className={`rounded-3xl px-4 py-4 ${validation?.ok ? "bg-emerald-50 text-emerald-950" : "bg-surface-container text-on-secondary-container"}`}>
            <div className="flex items-center gap-3">
              <div className={`h-2.5 w-2.5 rounded-full ${validation?.ok ? "bg-emerald-500" : validation ? "bg-error" : "bg-outline"}`} />
              <span className="text-sm font-semibold">
                {validation?.ok ? "Source verified." : validation?.reason || "Add a source and verify before creating."}
              </span>
            </div>
          </div>

          <div className="rounded-[28px] bg-[#09103f] p-6 text-white">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">Preview</p>
            <p className="mt-3 font-headline text-3xl font-black">{previewTitle}</p>
            <div className="mt-4 flex items-center gap-3 text-sm font-semibold text-white/75">
              <span>{selectedFigures[0]?.name || "Pick a figure"}</span>
              <span>•</span>
              <span>Cost: {CLAIM_PRICE_CUSD.toFixed(2)} cUSD</span>
            </div>
          </div>

          <button
            type="button"
            disabled={!canPost || saving}
            onClick={() => void publishClaim()}
            className="flex w-full items-center justify-center gap-2 rounded-3xl bg-primary px-5 py-5 font-headline text-lg font-black text-white disabled:cursor-not-allowed disabled:bg-surface-container-highest disabled:text-outline"
          >
            {saving ? "Creating..." : "Create"}
            <MaterialIcon name={canPost ? "arrow_forward" : "lock"} />
          </button>
        </section>
      </div>
    </AppShell>
  );
}
