import { useState } from "react";
import useSWR from "swr";
import { AppShell } from "@/components/app-shell";
import { FigureTile } from "@/components/figure-tile";
import { useCountry } from "@/components/country-provider";
import { fetcher } from "@/lib/fetcher";
import type { FigureSummary } from "@/lib/types";

export default function ExplorePage() {
  const { country } = useCountry();
  const [query, setQuery] = useState("");
  const { data: figures = [] } = useSWR<FigureSummary[]>(
    `/api/figures/search?country=${encodeURIComponent(country)}&q=${encodeURIComponent(query)}`,
    fetcher
  );

  return (
    <AppShell active="explore">
      <section className="mb-8 rounded-[28px] bg-surface-container-lowest p-8 shadow-sm">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-primary">Explore public figures</p>
        <h1 className="font-headline text-5xl font-extrabold tracking-tight text-primary">Search people, browse countries, open reputation walls.</h1>
        <div className="mt-6 rounded-2xl bg-surface-container p-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${country === "Global" ? "public figures" : `${country} figures`} from Wikipedia`}
            className="w-full rounded-xl border-0 bg-transparent px-4 py-4 text-lg outline-none"
          />
        </div>
        <p className="mt-3 text-sm text-on-secondary-container">
          Search results are powered by Wikipedia and re-ranked with Claimd&apos;s country affinity model.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {figures.map((figure) => (
          <FigureTile key={`${figure.source}-${figure.id}`} figure={figure} />
        ))}
      </section>
    </AppShell>
  );
}
