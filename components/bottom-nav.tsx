import Link from "next/link";
import { cn } from "@/lib/utils";
import { MaterialIcon } from "@/components/material-icon";

const items = [
  { href: "/", label: "Home", icon: "home", key: "home" },
  { href: "/explore", label: "Explore", icon: "search", key: "explore" },
  { href: "/post", label: "Start", icon: "add_box", key: "post" },
  { href: "/notifications", label: "Alerts", icon: "notifications", key: "notifications" },
  { href: "/profile", label: "Profile", icon: "person", key: "profile" }
] as const;

export function BottomNav({ active }: { active: string }) {
  return (
    <nav
      className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-outline-variant/15 bg-white/90 px-4 pt-3 backdrop-blur md:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
    >
      {items.map((item) => {
        const selected = active === item.key;

        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center rounded-xl px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider transition",
              selected ? "scale-95 bg-secondary-fixed text-primary" : "text-on-secondary-container opacity-80"
            )}
          >
            <MaterialIcon name={item.icon} filled={selected} className="text-xl" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
