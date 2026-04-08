import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import useSWR from "swr";
import { REACTION_PRICE_CUSD } from "@/lib/payments/celo";
import { AppShell } from "@/components/app-shell";
import { ClaimCard } from "@/components/claim-card";
import { FigureTile } from "@/components/figure-tile";
import { useCountry } from "@/components/country-provider";
import { useWallet } from "@/components/wallet-provider";
import { fetcher } from "@/lib/fetcher";
import { getFeed } from "@/lib/server/feed";
import { getTrendingFigures } from "@/lib/server/figures";
import type { ClaimCardData, FigureSummary } from "@/lib/types";
import { getClaimCountdown, getClaimPoolAmount, getClaimVoteSplit, toCurrency } from "@/lib/utils";

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
  const trendingClaims = [...feed].sort((a, b) => b.totalReactions - a.totalReactions).slice(0, 3);
  const endingSoonClaims = [...feed]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(0, 3);
  const justStartedClaims = [...feed]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);
  const leadingPool = trendingClaims[0]
    ? toCurrency(getClaimPoolAmount(trendingClaims[0].totalReactions, REACTION_PRICE_CUSD))
    : "0.00 cUSD";

  return (
    <AppShell active="home">
      <Head>
        <meta
          name="talentapp:project_verification"
          content="c01c955ca0d0ff08d6cbb3483416886906e8ea2a558a470324539c54cd79fc1352798b42547663f05d47591bed7fe4c7d5a553bb85b224ed7ec8a71f18973731"
        />
      </Head>
      <section className="mb-8 grid gap-8 lg:grid-cols-[1.35fr,0.95fr]">
        <div className="rounded-[28px] bg-editorial-gradient p-8 text-white shadow-editorial">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-white/70">Live Claims</p>
          <h1 className="font-headline text-5xl font-extrabold tracking-tight md:text-6xl">Pick a side. Put money on it.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/85">
            People argue online for free. On Claimd, every hot take carries a pool, a timer, and real money tension.
          </p>
          <p className="mt-3 max-w-2xl text-sm font-semibold uppercase tracking-[0.18em] text-white/65">
            A place where opinions have money behind them.
          </p>
          <div className="mt-8 flex flex-wrap gap-6 border-t border-white/15 pt-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Selected market</p>
              <p className="font-headline text-2xl font-extrabold">{country}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Live claims</p>
              <p className="font-headline text-2xl font-extrabold">{feed.length}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Top pool</p>
              <p className="font-headline text-2xl font-extrabold">{leadingPool}</p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/post" className="rounded-xl bg-white px-5 py-3 font-headline text-base font-extrabold text-primary">
              Start a bet
            </Link>
            <a href="#live-claims" className="rounded-xl border border-white/20 px-5 py-3 font-semibold text-white">
              Jump into live claims
            </a>
          </div>
        </div>

        <div className="space-y-4">
          <MomentumStrip title="Trending claims" claims={trendingClaims} />
          <MomentumStrip title="Ending soon" claims={endingSoonClaims} />
          <MomentumStrip title="Just started" claims={justStartedClaims} />
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-on-secondary-container">Watchlist</p>
          <h2 className="mt-2 font-headline text-3xl font-extrabold tracking-tight text-primary">Names moving money in {country}</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {figures.slice(0, 3).map((figure) => (
            <FigureTile key={figure.id} figure={figure} />
          ))}
        </div>
      </section>

      <section id="live-claims" className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-on-secondary-container">
              {walletAddress ? "Live claims for your watchlist and market" : "Live claims across your market"}
            </p>
            <h2 className="mt-2 font-headline text-3xl font-extrabold tracking-tight text-primary">Argue. Stake. Win.</h2>
          </div>
          <Link href="/post" className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white">
            Start a bet
          </Link>
        </div>
        {feed.map((claim) => (
          <ClaimCard key={claim.id} claim={claim} />
        ))}
      </section>
    </AppShell>
  );
}

function MomentumStrip({ title, claims }: { title: string; claims: ClaimCardData[] }) {
  return (
    <div className="rounded-[24px] bg-surface-container-lowest p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">{title}</p>
      </div>
      <div className="space-y-3">
        {claims.map((claim) => {
          const primaryFigure = claim.figures.find((figure) => figure.primary) ?? claim.figures[0];
          const split = getClaimVoteSplit(claim.likesCount, claim.dislikesCount);
          const countdown = getClaimCountdown(claim.createdAt);
          const poolAmount = getClaimPoolAmount(claim.totalReactions, REACTION_PRICE_CUSD);

          return (
            <Link
              key={claim.id}
              href={`/figures/${primaryFigure.slug}#claim-${claim.id}`}
              className="block rounded-2xl bg-surface-container p-4 transition hover:bg-surface-container-high"
            >
              <p className="font-headline text-lg font-bold leading-tight text-primary">{claim.body}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-on-surface-variant">
                <span>{toCurrency(poolAmount)} pool</span>
                <span>{split.agree}% agree</span>
                <span>{countdown.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
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
