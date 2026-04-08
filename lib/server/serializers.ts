import type { ClaimCardData, CommentItem, FigureSummary, NotificationItem, ProfileSnapshot } from "@/lib/types";
import { compactWallet } from "@/lib/utils";

type FigureRecord = {
  id: string;
  slug: string;
  name: string;
  role: string;
  country: string;
  category: string;
  imageUrl: string | null;
  summary: string | null;
  influenceScore: number;
  engagementScore: number;
  searchBias: number;
  wikipediaPageId: number | null;
  wikipediaTitle: string | null;
};

type ClaimWithRelations = {
  id: string;
  body: string;
  sourceUrl: string;
  sourceDomain: string;
  sourceTitle: string | null;
  sourcePreviewImageUrl: string | null;
  country: string;
  category: string;
  postedByWallet: string;
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  earnedCusd: number;
  totalReactions: number;
  createdAt: Date;
  figures: Array<{
    primaryFigure: boolean;
    figure: FigureRecord;
  }>;
};

export function serializeFigure(record: FigureRecord): FigureSummary {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    role: record.role,
    country: record.country,
    category: record.category,
    imageUrl: record.imageUrl,
    summary: record.summary,
    influenceScore: record.influenceScore,
    engagementScore: record.engagementScore,
    searchBias: record.searchBias,
    source: "local",
    wikipediaPageId: record.wikipediaPageId,
    wikipediaTitle: record.wikipediaTitle
  };
}

export function serializeClaim(record: ClaimWithRelations): ClaimCardData {
  return {
    id: record.id,
    body: record.body,
    sourceUrl: record.sourceUrl,
    sourceDomain: record.sourceDomain,
    sourceTitle: record.sourceTitle,
    sourcePreviewImageUrl: record.sourcePreviewImageUrl,
    category: record.category,
    country: record.country,
    postedByWallet: compactWallet(record.postedByWallet),
    creatorWallet: record.postedByWallet,
    likesCount: record.likesCount,
    dislikesCount: record.dislikesCount,
    commentsCount: record.commentsCount,
    earnedCusd: record.earnedCusd,
    totalReactions: record.totalReactions,
    createdAt: record.createdAt.toISOString(),
    figures: record.figures.map((link) => ({
      id: link.figure.id,
      slug: link.figure.slug,
      name: link.figure.name,
      role: link.figure.role,
      country: link.figure.country,
      imageUrl: link.figure.imageUrl,
      primary: link.primaryFigure
    }))
  };
}

export function serializeComment(record: {
  id: string;
  body: string;
  postedByWallet: string;
  amountCusd: number;
  createdAt: Date;
  claim: {
    postedByWallet: string;
  };
}): CommentItem {
  return {
    id: record.id,
    body: record.body,
    postedByWallet: compactWallet(record.postedByWallet),
    creatorWallet: record.claim.postedByWallet,
    amountCusd: record.amountCusd,
    createdAt: record.createdAt.toISOString()
  };
}

export function serializeNotification(record: {
  id: string;
  title: string;
  body: string;
  type: string;
  createdAt: Date;
  read: boolean;
}): NotificationItem {
  return {
    id: record.id,
    title: record.title,
    body: record.body,
    type: record.type,
    createdAt: record.createdAt.toISOString(),
    read: record.read
  };
}

export function serializeProfile(input: {
  walletAddress: string;
  displayName: string | null;
  selectedCountry: string;
  totalPosts: number;
  totalStaked: number;
  winsCount: number;
  lossesCount: number;
  totalReactionsReceived: number;
  totalEarned: number;
  availableOnchainRewards: number;
  withdrawalAddress: string;
  followedFigures: FigureSummary[];
  recentClaims: ClaimCardData[];
}): ProfileSnapshot {
  return {
    walletAddress: compactWallet(input.walletAddress),
    displayName: input.displayName || "Claimd Creator",
    selectedCountry: input.selectedCountry,
    totalPosts: input.totalPosts,
    totalStaked: input.totalStaked,
    winsCount: input.winsCount,
    lossesCount: input.lossesCount,
    totalReactionsReceived: input.totalReactionsReceived,
    totalEarned: input.totalEarned,
    availableOnchainRewards: input.availableOnchainRewards,
    withdrawalAddress: compactWallet(input.withdrawalAddress),
    followedFigures: input.followedFigures,
    recentClaims: input.recentClaims
  };
}
