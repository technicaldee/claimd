import { BottomNav } from "@/components/bottom-nav";
import { TopBar } from "@/components/top-bar";

export function AppShell({
  active,
  children
}: {
  active: "home" | "explore" | "post" | "notifications" | "profile" | "onboarding" | "figure";
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <TopBar active={active} />
      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 md:px-6 md:pb-12">{children}</main>
      {active !== "onboarding" ? <BottomNav active={active} /> : null}
    </div>
  );
}
