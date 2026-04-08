import clsx, { type ClassValue } from "clsx";

const CLAIM_WINDOW_HOURS = 24;

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function toCurrency(value: number, currency = "cUSD") {
  return `${value.toFixed(2)} ${currency}`;
}

export function compactWallet(wallet: string) {
  if (wallet.length <= 10) {
    return wallet;
  }

  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function extractDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

export function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function formatRelativeTime(isoDate: string) {
  const diffMs = new Date(isoDate).getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, "day");
}

export function getClaimPoolAmount(totalReactions: number, unitStake: number) {
  return Number((totalReactions * unitStake).toFixed(2));
}

export function getClaimPools(likesCount: number, dislikesCount: number, unitStake: number) {
  const yesPool = likesCount * unitStake;
  const noPool = dislikesCount * unitStake;
  const totalPool = yesPool + noPool;

  return {
    yesPool: Number(yesPool.toFixed(2)),
    noPool: Number(noPool.toFixed(2)),
    totalPool: Number(totalPool.toFixed(2))
  };
}

export function getClaimVoteSplit(likesCount: number, dislikesCount: number) {
  const totalVotes = likesCount + dislikesCount;
  if (totalVotes === 0) {
    return {
      agree: 50,
      disagree: 50
    };
  }

  const agree = Math.round((likesCount / totalVotes) * 100);
  return {
    agree,
    disagree: 100 - agree
  };
}

export function getPotentialReturnMultiplier(totalPool: number, sidePool: number, stakeAmount: number) {
  const payoutPool = totalPool + stakeAmount;
  const backedSidePool = sidePool + stakeAmount;

  if (backedSidePool <= 0) {
    return 1;
  }

  return Math.max(1, Number((payoutPool / backedSidePool).toFixed(1)));
}

export function formatReturnMultiplier(multiplier: number) {
  return `${multiplier.toFixed(1)}x`;
}

export function getClaimCountdown(isoDate: string) {
  const endAt = new Date(isoDate).getTime() + CLAIM_WINDOW_HOURS * 60 * 60 * 1000;
  const remainingMs = endAt - Date.now();

  if (remainingMs <= 0) {
    return {
      ended: true,
      label: "Closing now"
    };
  }

  const totalMinutes = Math.floor(remainingMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return {
      ended: false,
      label: `${days}d ${hours % 24}h left`
    };
  }

  return {
    ended: false,
    label: `${hours}h ${minutes}m left`
  };
}

export function getClaimHeatLabel(isoDate: string) {
  const ageMs = Date.now() - new Date(isoDate).getTime();
  const ageHours = ageMs / (60 * 60 * 1000);

  if (ageHours <= 2) {
    return "Just started";
  }

  const countdown = getClaimCountdown(isoDate);
  if (!countdown.ended) {
    const endAt = new Date(isoDate).getTime() + CLAIM_WINDOW_HOURS * 60 * 60 * 1000;
    const hoursRemaining = (endAt - Date.now()) / (60 * 60 * 1000);
    if (hoursRemaining <= 3) {
      return "Ending soon";
    }
  }

  return "Trending";
}

export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
