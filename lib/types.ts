export type CountryName =
  | "Global"
  | "Nigeria"
  | "Ghana"
  | "Kenya"
  | "South Africa"
  | "India"
  | "USA"
  | "UK"
  | "Brazil";

export interface CountryOption {
  code: string;
  name: CountryName;
  flagEmoji: string;
  descriptor: string;
}

export interface FigureSummary {
  id: string;
  slug: string;
  name: string;
  role: string;
  country: string;
  category: string;
  imageUrl?: string | null;
  summary?: string | null;
  influenceScore: number;
  engagementScore?: number;
  searchBias?: number;
  source: "local" | "wikipedia";
  wikipediaPageId?: number | null;
  wikipediaTitle?: string | null;
}

export interface ClaimFigureLink {
  id: string;
  slug: string;
  name: string;
  role: string;
  country: string;
  imageUrl?: string | null;
  primary: boolean;
}

export interface ClaimCardData {
  id: string;
  body: string;
  category: string;
  country: string;
  sourceUrl: string;
  sourceDomain: string;
  sourceTitle?: string | null;
  sourcePreviewImageUrl?: string | null;
  postedByWallet: string;
  creatorWallet: string;
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  earnedCusd: number;
  totalReactions: number;
  createdAt: string;
  figures: ClaimFigureLink[];
}

export interface CommentItem {
  id: string;
  body: string;
  postedByWallet: string;
  creatorWallet: string;
  amountCusd: number;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  createdAt: string;
  read: boolean;
}

export interface ProfileSnapshot {
  walletAddress: string;
  displayName: string;
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
}

export interface FigureWallSnapshot {
  figure: FigureSummary;
  trendingClaim: ClaimCardData | null;
  claims: ClaimCardData[];
  timeline: Array<{
    date: string;
    title: string;
    status: string;
  }>;
  engagementVelocity: number;
}

export interface ClaimValidationResult {
  ok: boolean;
  reason?: string;
  title?: string;
  previewImageUrl?: string | null;
  domain?: string;
  score?: number;
}

export interface FigureSelectionInput {
  id?: string;
  slug?: string;
  name: string;
  role: string;
  country: string;
  category: string;
  imageUrl?: string | null;
  summary?: string | null;
  wikipediaPageId?: number | null;
  wikipediaTitle?: string | null;
}
