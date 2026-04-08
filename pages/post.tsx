import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { AppShell } from "@/components/app-shell";
import { MaterialIcon } from "@/components/material-icon";
import { useCountry } from "@/components/country-provider";
import { useWallet } from "@/components/wallet-provider";
import { fetcher } from "@/lib/fetcher";
import type { ClaimValidationResult, FigureSummary } from "@/lib/types";

const defaultCategories = ["Politics", "Governance", "Music", "Entertainment", "Business", "Football", "Technology"];

export default function PostPage() {
  const router = useRouter();
  const { country } = useCountry();
  const { walletAddress, connect } = useWallet();
  const [category, setCategory] = useState("Politics");
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

  const canPost = validation?.ok && claimText.length > 20 && selectedFigures.length > 0 && sourceUrl;
  const previewTitle = useMemo(() => {
    if (claimText.trim()) {
      return claimText.trim();
    }

    return "Your sourced claim preview will appear here.";
  }, [claimText]);

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
      const response = await fetch("/api/claims", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          claimText,
          sourceUrl,
          category,
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

      const payload = (await response.json()) as { primaryFigureSlug: string };
      await router.push(`/figures/${payload.primaryFigureSlug}`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to post claim");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell active="post">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10">
          <h1 className="font-headline text-5xl font-extrabold tracking-tight text-primary">Start a Bet</h1>
          <div className="mt-5 flex items-start gap-3 rounded-xl border-l-4 border-primary bg-secondary-container p-4">
            <MaterialIcon name="info" className="mt-0.5 text-primary" />
            <p className="text-sm leading-relaxed text-on-secondary-container">
              Start a debate people can instantly back with money. Keep it sharp, tag at least one public figure, and attach a source link if you have one.
            </p>
          </div>
        </header>

        <div className="rounded-[28px] border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm md:p-10">
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="font-headline text-lg font-bold text-primary">Who is this about?</label>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search a public figure (e.g. Burna Boy)"
                className="w-full rounded-xl border-0 bg-surface-container-highest px-4 py-4 outline-none ring-0"
              />
              {selectedFigures.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedFigures.map((figure) => (
                    <button
                      key={figure.id}
                      type="button"
                      onClick={() => setSelectedFigures((current) => current.filter((item) => item.id !== figure.id))}
                      className="rounded-full bg-secondary-fixed px-3 py-1 text-xs font-bold text-on-secondary-fixed"
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
                          setSelectedFigures((current) => [...current, figure]);
                        }
                      }}
                      className={`rounded-xl border p-4 text-left transition ${selected ? "border-primary bg-primary text-white" : "border-outline-variant/15 bg-surface-container hover:border-primary/30"}`}
                    >
                      <div className="font-headline text-lg font-bold">{figure.name}</div>
                      <div className={`text-xs uppercase tracking-wider ${selected ? "text-white/75" : "text-on-secondary-container"}`}>
                        {figure.role} • {figure.country}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-outline">Category</label>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full rounded-xl border-0 bg-surface-container-highest px-4 py-4 outline-none"
                >
                  {defaultCategories.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-outline">Country context</label>
                <div className="flex items-center gap-3 rounded-xl bg-surface-container px-4 py-4 text-on-surface">
                  <MaterialIcon name="language" className="text-outline" />
                  <span>{country}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="font-headline text-lg font-bold text-primary">What are people betting on?</label>
              <textarea
                rows={4}
                value={claimText}
                onChange={(event) => setClaimText(event.target.value)}
                placeholder="Write the take people will argue over."
                className="w-full rounded-xl border-0 bg-surface-container-highest p-4 outline-none"
              />
              <div className="text-right text-[10px] font-bold uppercase tracking-[0.2em] text-outline">{claimText.length} / 280</div>
            </div>

            <div className="space-y-3">
              <label className="font-headline text-lg font-bold text-primary">Source link</label>
              <div className="flex flex-col gap-4 md:flex-row">
                <input
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  placeholder="https://news.source.com/article"
                  className="min-w-0 flex-1 rounded-xl border-0 bg-surface-container-highest px-4 py-4 outline-none"
                />
                <button
                  type="button"
                  onClick={() => void validateSource()}
                  className="rounded-xl bg-editorial-gradient px-8 py-4 font-semibold text-white transition hover:opacity-90"
                >
                  Check source
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-surface-container-low p-4">
              <div className={`h-2 w-2 rounded-full ${validation?.ok ? "bg-emerald-500" : validation ? "bg-error" : "bg-outline"}`} />
              <span className="text-sm text-on-surface-variant">
                {validation?.ok
                  ? `Validation passed${validation.title ? `: ${validation.title}` : ""}`
                  : validation?.reason || "Validation pending. Add a URL and verify it before starting this bet."}
              </span>
            </div>

            <div className="border-t border-outline-variant/10 pt-8">
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-outline">Live card preview</p>
              <div className="rounded-xl bg-surface-container p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-highest font-headline font-bold text-primary">
                    {selectedFigures[0]?.name.slice(0, 2) || "PF"}
                  </div>
                  <div>
                    <div className="font-headline font-bold text-primary">{selectedFigures.map((figure) => figure.name).join(", ") || "Selected figures"}</div>
                    <div className="text-xs text-on-secondary-container">{category} • {country}</div>
                  </div>
                </div>
                <p className="font-headline text-xl font-bold text-on-surface">{previewTitle}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-on-secondary-container">
                  <span>Pool starts at 0.00 cUSD</span>
                  <span>24h countdown</span>
                  <span>Agree vs disagree</span>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                disabled={!canPost || saving}
                onClick={() => void publishClaim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-5 font-headline text-lg font-extrabold text-white disabled:cursor-not-allowed disabled:bg-surface-container-highest disabled:text-outline"
              >
                {saving ? "Starting..." : "Start this bet"}
                <MaterialIcon name={canPost ? "send" : "lock"} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
