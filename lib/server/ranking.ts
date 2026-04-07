import type { ClaimCardData, CountryName, FigureSummary } from "@/lib/types";
import { COUNTRY_PROFILES } from "@/lib/constants/countries";

function getProfile(country: string) {
  return COUNTRY_PROFILES[(country in COUNTRY_PROFILES ? country : "Global") as CountryName];
}

export function inferCountryFromText(text: string) {
  const haystack = text.toLowerCase();
  const winner = Object.entries(COUNTRY_PROFILES)
    .map(([country, profile]) => {
      const score = profile.keywords.reduce(
        (sum, keyword) => sum + (haystack.includes(keyword.toLowerCase()) ? 1 : 0),
        0
      );

      return { country, score };
    })
    .sort((a, b) => b.score - a.score)[0];

  return winner && winner.score > 0 ? winner.country : "Global";
}

export function scoreFigureForCountry(figure: FigureSummary, country: string) {
  if (country === "Global") {
    return figure.influenceScore + (figure.engagementScore ?? 0) + (figure.searchBias ?? 0);
  }

  const profile = getProfile(country);
  let score = figure.influenceScore * 0.55 + (figure.engagementScore ?? 0) * 0.45;

  if (figure.country === country) {
    score += 65;
  } else if (profile.region === getProfile(figure.country).region) {
    score += 18;
  }

  score += (profile.preferredCategories[figure.category] ?? 0.2) * 20;

  if (profile.preferredRoles.some((role) => figure.role.includes(role))) {
    score += 14;
  }

  if ((figure.searchBias ?? 0) > 0) {
    score += figure.searchBias ?? 0;
  }

  return score;
}

export function scoreClaimForCountry(claim: ClaimCardData, country: string, followedFigureIds: string[] = []) {
  const baseFigure = claim.figures.find((figure) => figure.primary) ?? claim.figures[0];
  const profile = getProfile(country);
  const engagementScore = Math.min(36, claim.totalReactions * 0.85);
  const earningsScore = Math.min(18, claim.earnedCusd * 2.1);
  const commentScore = Math.min(12, claim.commentsCount * 1.6);
  const recencyHours = (Date.now() - new Date(claim.createdAt).getTime()) / 3600000;
  const recencyScore = Math.max(0, 30 - recencyHours * 1.75);
  const exactCountryBonus = baseFigure?.country === country || claim.country === country ? 48 : 0;
  const regionalBonus =
    baseFigure && profile.region === getProfile(baseFigure.country).region ? 12 : 0;
  const categoryBonus = (profile.preferredCategories[claim.category] ?? 0.2) * 14;
  const followedBonus = claim.figures.some((figure) => followedFigureIds.includes(figure.id)) ? 120 : 0;

  return (
    engagementScore +
    earningsScore +
    commentScore +
    recencyScore +
    exactCountryBonus +
    regionalBonus +
    categoryBonus +
    followedBonus
  );
}
