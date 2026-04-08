import Link from "next/link";
import { MaterialIcon } from "@/components/material-icon";
import { TopBar } from "@/components/top-bar";

export function AppShell({
  active,
  children
}: {
  active: "home" | "explore" | "post" | "notifications" | "profile" | "onboarding" | "figure";
  children: React.ReactNode;
}) {
  const showFloatingPostAction = active !== "onboarding" && active !== "post";

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <TopBar active={active} />
      <main className="mx-auto w-full max-w-6xl px-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] pt-6 md:px-6 md:pb-16">{children}</main>
      {showFloatingPostAction ? (
        <Link
          href="/post"
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 z-50 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-5 py-3 font-headline text-sm font-extrabold uppercase tracking-[0.14em] text-white shadow-editorial transition hover:opacity-95 md:bottom-6 md:left-auto md:right-6 md:translate-x-0"
        >
          <MaterialIcon name="add" filled className="text-lg" />
          <span>Start bet</span>
        </Link>
      ) : null}
    </div>
  );
}
