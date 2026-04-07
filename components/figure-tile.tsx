import Link from "next/link";
import { FigureAvatar } from "@/components/figure-avatar";
import type { FigureSummary } from "@/lib/types";

export function FigureTile({ figure }: { figure: FigureSummary }) {
  return (
    <Link
      href={`/figures/${figure.slug}`}
      className="group rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-5 transition hover:-translate-y-0.5 hover:shadow-editorial"
    >
      <div className="mb-4 flex items-center gap-3">
        <FigureAvatar name={figure.name} imageUrl={figure.imageUrl} />
        <div>
          <h3 className="font-headline text-lg font-bold text-primary">{figure.name}</h3>
          <p className="text-xs uppercase tracking-wider text-on-secondary-container">
            {figure.role} • {figure.country}
          </p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-on-surface-variant">{figure.summary}</p>
    </Link>
  );
}
