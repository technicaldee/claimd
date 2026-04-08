import type { GetServerSideProps } from "next";
import Head from "next/head";
import useSWR from "swr";
import { AppShell } from "@/components/app-shell";
import { ClaimCard } from "@/components/claim-card";
import { useCountry } from "@/components/country-provider";
import { useWallet } from "@/components/wallet-provider";
import { fetcher } from "@/lib/fetcher";
import { getFeed } from "@/lib/server/feed";
import type { ClaimCardData } from "@/lib/types";
import { getClaimCountdown } from "@/lib/utils";

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

  const featuredClaim =
    [...feed].sort((left, right) => {
      if (right.totalReactions !== left.totalReactions) {
        return right.totalReactions - left.totalReactions;
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    })[0] ?? null;

  const picked = new Set<string>(featuredClaim ? [featuredClaim.id] : []);
  const pickClaims = (list: ClaimCardData[]) =>
    list.filter((claim) => {
      if (picked.has(claim.id)) {
        return false;
      }

      picked.add(claim.id);
      return true;
    }).slice(0, 3);

  const trendingClaims = pickClaims([...feed].sort((left, right) => right.totalReactions - left.totalReactions));
  const endingSoonClaims = pickClaims(
    [...feed]
      .filter((claim) => !getClaimCountdown(claim.createdAt).ended)
      .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime())
  );
  const newClaims = pickClaims(
    [...feed].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
  );

  return (
    <AppShell active="home">
      <Head>
        <meta
          name="talentapp:project_verification"
          content="c01c955ca0d0ff08d6cbb3483416886906e8ea2a558a470324539c54cd79fc1352798b42547663f05d47591bed7fe4c7d5a553bb85b224ed7ec8a71f18973731"
        />
      </Head>

      <div className="space-y-10">
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-primary">Live now</p>
            <span className="rounded-full bg-surface-container px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-on-secondary-container">
              {feed.length} markets
            </span>
          </div>
          {featuredClaim ? (
            <ClaimCard claim={featuredClaim} />
          ) : (
            <div className="rounded-[28px] border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-sm">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-primary">No market yet</p>
              <p className="mt-3 font-headline text-4xl font-black text-on-surface">Start the first bet.</p>
            </div>
          )}
        </section>

        <MarketSection title="Trending" emoji="🔥" claims={trendingClaims} />
        <MarketSection title="Ending soon" emoji="⏳" claims={endingSoonClaims} />
        <MarketSection title="New" emoji="🚀" claims={newClaims} />
      </div>
    </AppShell>
  );
}

function MarketSection({ title, emoji, claims }: { title: string; emoji: string; claims: ClaimCardData[] }) {
  if (claims.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xl">{emoji}</span>
        <h2 className="font-headline text-2xl font-black text-on-surface">{title}</h2>
      </div>
      <div className="space-y-4">
        {claims.map((claim) => (
          <ClaimCard key={claim.id} claim={claim} />
        ))}
      </div>
    </section>
  );
}

export const getServerSideProps: GetServerSideProps<HomePageProps> = async () => {
  return {
    props: {
      initialFeed: await getFeed("Global")
    }
  };
};
