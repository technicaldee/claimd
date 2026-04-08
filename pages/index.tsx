import type { GetServerSideProps } from "next";
import Head from "next/head";
import useSWR from "swr";
import { REACTION_PRICE_CUSD } from "@/lib/payments/celo";
import { AppShell } from "@/components/app-shell";
import { ClaimCard } from "@/components/claim-card";
import { useCountry } from "@/components/country-provider";
import { useWallet } from "@/components/wallet-provider";
import { fetcher } from "@/lib/fetcher";
import { getFeed } from "@/lib/server/feed";
import type { ClaimCardData } from "@/lib/types";
import { getClaimPoolAmount, toCurrency } from "@/lib/utils";

interface HomePageProps {
  initialFeed: ClaimCardData[];
}

export default function HomePage({ initialFeed }: HomePageProps) {
  const { country } = useCountry();
  const { walletAddress } = useWallet();
  const { data: feed = initialFeed } = useSWR<ClaimCardData[]>(
    `/api/feed?country=${encodeURIComponent(country)}${walletAddress ? `&wallet=${encodeURIComponent(walletAddress)}` : ""}`,
    fetcher,
    {
      fallbackData: initialFeed
    }
  );
  const trendingClaims = [...feed].sort((a, b) => b.totalReactions - a.totalReactions).slice(0, 3);
  const featuredClaim = trendingClaims[0] ?? feed[0] ?? null;
  const remainingClaims = featuredClaim ? feed.filter((claim) => claim.id !== featuredClaim.id) : [];
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
      <section className="mb-6 rounded-[28px] bg-editorial-gradient p-6 text-white shadow-editorial md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/70">Live claims</p>
        <h1 className="mt-3 font-headline text-4xl font-extrabold tracking-tight md:text-6xl">
          Pick a side.
          <br />
          Win money.
        </h1>
        <p className="mt-4 max-w-xl text-sm font-semibold uppercase tracking-[0.18em] text-white/80 md:text-base">
          Stake on opinions. Winners take the pool.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/65">Market</p>
            <p className="mt-1 font-headline text-xl font-extrabold">{country}</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/65">Live claims</p>
            <p className="mt-1 font-headline text-xl font-extrabold">{feed.length}</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/65">Top pool</p>
            <p className="mt-1 font-headline text-xl font-extrabold">{leadingPool}</p>
          </div>
        </div>
      </section>

      <section className="mb-10 space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-on-secondary-container">Live now</p>
          <h2 className="mt-2 font-headline text-3xl font-extrabold tracking-tight text-primary">Tap. Stake. Feel it.</h2>
        </div>
        {featuredClaim ? (
          <ClaimCard claim={featuredClaim} />
        ) : (
          <div className="rounded-[24px] bg-surface-container-lowest p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-on-secondary-container">No live claims yet</p>
            <h3 className="mt-3 font-headline text-3xl font-extrabold tracking-tight text-primary">Start the first bet in {country}.</h3>
            <p className="mt-3 max-w-xl text-on-surface-variant">Make the opening claim and let the market decide which side gets paid.</p>
          </div>
        )}
      </section>

      {remainingClaims.length > 0 ? (
        <section id="live-claims" className="space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-on-secondary-container">
              {walletAddress ? "More live claims for your market and watchlist" : "More live claims across your market"}
            </p>
            <h2 className="mt-2 font-headline text-3xl font-extrabold tracking-tight text-primary">Keep the streak going.</h2>
          </div>
          {remainingClaims.map((claim) => (
            <ClaimCard key={claim.id} claim={claim} />
          ))}
        </section>
      ) : null}
    </AppShell>
  );
}

export const getServerSideProps: GetServerSideProps<HomePageProps> = async () => {
  return {
    props: {
      initialFeed: await getFeed("Global")
    }
  };
};
