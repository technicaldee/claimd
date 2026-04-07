import type { GetServerSideProps } from "next";
import { AppShell } from "@/components/app-shell";
import { ClaimCard } from "@/components/claim-card";
import { FigureAvatar } from "@/components/figure-avatar";
import { FollowFigureButton } from "@/components/follow-figure-button";
import { MaterialIcon } from "@/components/material-icon";
import { getFigureWall } from "@/lib/server/feed";
import type { FigureWallSnapshot } from "@/lib/types";

type FigureWallProps = FigureWallSnapshot;

export default function FigureWallPage({ figure, trendingClaim, claims, timeline, engagementVelocity }: FigureWallProps) {
  const velocityWidth = `${Math.min(100, Math.max(12, Math.abs(engagementVelocity)))}%`;
  return (
    <AppShell active="figure">
      <section className="mb-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-end">
          <div className="relative">
            <FigureAvatar
              name={figure.name}
              imageUrl={figure.imageUrl}
              className="h-40 w-40 rounded-xl border-4 border-surface-container-lowest bg-surface-container-highest shadow-editorial md:h-48 md:w-48"
              fillClassName="object-cover"
            />
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-headline text-5xl font-extrabold tracking-tight text-primary md:text-6xl">{figure.name}</h1>
              <span className="flex items-center gap-1 rounded-full bg-secondary-fixed px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-on-secondary-fixed">
                <MaterialIcon name="verified" filled className="text-sm" />
                Sourced
              </span>
              <FollowFigureButton figureSlug={figure.slug} />
            </div>
            <p className="max-w-2xl text-xl leading-relaxed text-on-surface-variant">{figure.summary}</p>
            <div className="flex flex-wrap gap-6 border-t border-outline-variant/15 pt-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-secondary-container">Country</span>
                <p className="font-headline text-2xl font-extrabold text-primary">{figure.country}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-secondary-container">Category</span>
                <p className="font-headline text-2xl font-extrabold text-primary">{figure.category}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-secondary-container">Role</span>
                <p className="font-headline text-2xl font-extrabold text-primary">{figure.role}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-12">
        <div className="space-y-6 md:col-span-8">
          {trendingClaim ? (
            <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-8">
              <div className="mb-6 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Trending Now</span>
              </div>
              <h2 className="font-headline text-3xl font-bold leading-tight">{trendingClaim.body}</h2>
              <div className="mt-6 rounded-lg bg-surface-container-low p-6">
                <div className="mb-3 flex items-center gap-4">
                  <MaterialIcon name="description" className="text-primary" />
                  <span className="text-sm font-bold">Supporting Evidence</span>
                </div>
                <p className="text-sm leading-relaxed text-on-surface-variant">{trendingClaim.sourceTitle || trendingClaim.sourceDomain}</p>
              </div>
            </div>
          ) : null}

          <div className="space-y-6">
            {claims.map((claim) => (
              <ClaimCard key={claim.id} claim={claim} />
            ))}
          </div>
        </div>

        <aside className="space-y-6 md:col-span-4">
          <div className="flex h-40 flex-col justify-between rounded-xl bg-primary p-6 text-white">
            <span className="text-[10px] font-bold uppercase tracking-[0.24em] opacity-70">Engagement Velocity</span>
            <div className="font-headline text-4xl font-black">{engagementVelocity >= 0 ? "+" : ""}{engagementVelocity.toFixed(1)}%</div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
              <div className="h-full bg-white" style={{ width: velocityWidth }} />
            </div>
          </div>
          <div className="rounded-xl bg-surface-container-high p-6">
            <h3 className="mb-4 font-headline text-lg font-bold">Activity Timeline</h3>
            <div className="space-y-6">
              {timeline.map((item) => (
                <div key={`${item.date}-${item.title}`} className="border-l-2 border-primary-container pl-4">
                  <p className="mb-1 text-xs font-bold text-on-surface-variant">{item.date}</p>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <div className="mt-2">
                    <span className="rounded-full bg-secondary-fixed px-2 py-0.5 text-[9px] font-black uppercase">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}

export const getServerSideProps: GetServerSideProps<FigureWallProps> = async ({ params }) => {
  const slug = String(params?.slug || "");
  const wall = await getFigureWall(slug);

  if (!wall) {
    return {
      notFound: true
    };
  }

  return {
    props: wall
  };
};
