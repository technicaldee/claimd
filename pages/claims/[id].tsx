import type { GetServerSideProps } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ClaimCard } from "@/components/claim-card";
import { MaterialIcon } from "@/components/material-icon";
import { getClaimById } from "@/lib/server/feed";
import type { ClaimCardData } from "@/lib/types";

interface ClaimDetailPageProps {
  claim: ClaimCardData;
}

export default function ClaimDetailPage({ claim }: ClaimDetailPageProps) {
  const primaryFigure = claim.figures.find((figure) => figure.primary) ?? claim.figures[0];

  return (
    <AppShell active="figure">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-primary">
          <MaterialIcon name="arrow_back" className="text-base" />
          <span>Back to feed</span>
        </Link>

        <div className="rounded-[28px] bg-surface-container-low p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-secondary-container">Market</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-headline text-3xl font-black text-on-surface">{primaryFigure.name}</h1>
            <span className="rounded-full bg-surface-container-high px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-on-secondary-container">
              {primaryFigure.role}
            </span>
          </div>
        </div>

        <ClaimCard claim={claim} detail />
      </div>
    </AppShell>
  );
}

export const getServerSideProps: GetServerSideProps<ClaimDetailPageProps> = async ({ params }) => {
  const id = String(params?.id || "");
  const claim = await getClaimById(id);

  if (!claim) {
    return {
      notFound: true
    };
  }

  return {
    props: {
      claim
    }
  };
};
