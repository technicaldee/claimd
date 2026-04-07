import type { GetServerSideProps } from "next";
import useSWR from "swr";
import { AppShell } from "@/components/app-shell";
import { ClaimCard } from "@/components/claim-card";
import { FigureTile } from "@/components/figure-tile";
import { useCountry } from "@/components/country-provider";
import { useWallet } from "@/components/wallet-provider";
import { fetcher } from "@/lib/fetcher";
import { getFeed } from "@/lib/server/feed";
import { getTrendingFigures } from "@/lib/server/figures";
import type { ClaimCardData, FigureSummary } from "@/lib/types";

interface HomePageProps {
  initialFeed: ClaimCardData[];
  initialFigures: FigureSummary[];
}

export default function HomePage({ initialFeed, initialFigures }: HomePageProps) {
  const { country } = useCountry();
  const { walletAddress } = useWallet();
  const { data: feed = initialFeed } = useSWR<ClaimCardData[]>(
    `/api/feed?country=${encodeURIComponent(country)}${walletAddress ? `&wallet=${encodeURIComponent(walletAddress)}` : ""}`,
    fetcher,
    {
      fallbackData: initialFeed
    }
  );
  const { data: figures = initialFigures } = useSWR<FigureSummary[]>(
    `/api/figures/search?country=${encodeURIComponent(country)}`,
    fetcher,
    { fallbackData: initialFigures }
  );

  return (
    <AppShell active="home">
      <section className="mb-8 grid gap-8 lg:grid-cols-[1.4fr,0.9fr]">
        <div className="rounded-[28px] bg-editorial-gradient p-8 text-white shadow-editorial">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-white/70">The Global Ledger</p>
          <h1 className="font-headline text-5xl font-extrabold tracking-tight">Post claims. Back reactions. Earn from attention.</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/80">
            Claimd is a MiniPay-native public figure feed where every sourced post can earn when the community pays to react.
          </p>
          <div className="mt-8 flex flex-wrap gap-6 border-t border-white/15 pt-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Selected market</p>
              <p className="font-headline text-2xl font-extrabold">{country}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Reaction price</p>
              <p className="font-headline text-2xl font-extrabold">0.01 cUSD</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Creator share</p>
              <p className="font-headline text-2xl font-extrabold">70%</p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] bg-surface-container-lowest p-6 shadow-sm">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">People ranked for {country}</p>
          <div className="space-y-4">
            {figures.slice(0, 3).map((figure) => (
              <FigureTile key={figure.id} figure={figure} />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-on-secondary-container">
            {walletAddress ? "Followed figures first, then popular across your market" : "Popular across your market"}
          </p>
        </div>
        {feed.map((claim) => (
          <ClaimCard key={claim.id} claim={claim} />
        ))}
      </section>
    </AppShell>
  );
}

export const getServerSideProps: GetServerSideProps<HomePageProps> = async () => {
  const [initialFeed, initialFigures] = await Promise.all([getFeed("Global"), getTrendingFigures("Global")]);

  return {
    props: {
      initialFeed,
      initialFigures
    }
  };
};
