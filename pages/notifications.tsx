import useSWR from "swr";
import { AppShell } from "@/components/app-shell";
import { MaterialIcon } from "@/components/material-icon";
import { useWallet } from "@/components/wallet-provider";
import { fetcher } from "@/lib/fetcher";
import type { NotificationItem } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

export default function NotificationsPage() {
  const { walletAddress } = useWallet();
  const { data: notifications = [] } = useSWR<NotificationItem[]>(
    `/api/notifications${walletAddress ? `?wallet=${encodeURIComponent(walletAddress)}` : ""}`,
    fetcher
  );

  return (
    <AppShell active="notifications">
      <section className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Notifications</p>
        <h1 className="mt-2 font-headline text-5xl font-extrabold tracking-tight text-primary">Signals that matter to your wallet and your watchlist.</h1>
      </section>

      <section className="space-y-4">
        {notifications.map((item) => (
          <article key={item.id} className="rounded-xl bg-surface-container-lowest p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-fixed text-primary">
                  <MaterialIcon name={item.type === "reward" ? "payments" : item.type === "watch" ? "visibility" : "bolt"} filled />
                </div>
                <div>
                  <h2 className="font-headline text-2xl font-bold text-on-surface">{item.title}</h2>
                  <p className="mt-2 text-on-surface-variant">{item.body}</p>
                </div>
              </div>
              <span className="text-xs font-medium text-on-secondary-container">{formatRelativeTime(item.createdAt)}</span>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
