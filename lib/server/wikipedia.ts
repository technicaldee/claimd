import { slugify } from "@/lib/utils";
import type { FigureSummary } from "@/lib/types";
import { inferCountryFromText } from "@/lib/server/ranking";

interface WikipediaPage {
  pageid: number;
  title: string;
  extract?: string;
  thumbnail?: {
    source: string;
  };
  terms?: {
    description?: string[];
  };
}

interface WikipediaResponse {
  query?: {
    pages?: Record<string, WikipediaPage>;
  };
}

export interface WikipediaFigureResult extends FigureSummary {
  source: "wikipedia";
}

export async function searchWikipediaFigures(query: string): Promise<WikipediaFigureResult[]> {
  if (!query.trim()) {
    return [];
  }

  const baseUrl = process.env.WIKIPEDIA_API_BASE || "https://en.wikipedia.org/w/api.php";
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: query,
    gsrlimit: "8",
    prop: "pageimages|pageterms|extracts",
    exintro: "1",
    explaintext: "1",
    exchars: "180",
    pilimit: "max",
    pithumbsize: "300"
  });

  const response = await fetch(`${baseUrl}?${params.toString()}`, {
    headers: {
      "User-Agent": process.env.SOURCE_VALIDATION_USER_AGENT || "ClaimdBot/1.0"
    }
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as WikipediaResponse;
  const pages = Object.values(data.query?.pages ?? {});

  return pages.map(mapWikipediaPageToFigure).filter(isLikelyPublicFigure);
}

function inferCategoryFromText(text: string) {
  const value = text.toLowerCase();

  if (value.includes("president") || value.includes("politician") || value.includes("minister")) {
    return "Politics";
  }

  if (value.includes("football") || value.includes("athlete")) {
    return "Football";
  }

  if (value.includes("actor") || value.includes("singer") || value.includes("artist")) {
    return "Entertainment";
  }

  if (value.includes("business") || value.includes("entrepreneur") || value.includes("founder")) {
    return "Business";
  }

  if (value.includes("economist") || value.includes("scientist")) {
    return "Technology";
  }

  return "Governance";
}

export function mapWikipediaPageToFigure(page: WikipediaPage): WikipediaFigureResult {
  const description = page.terms?.description?.[0] || page.extract || "Public figure";
  const inferredCountry = inferCountryFromText(`${page.title} ${description}`);

  return {
    id: `wiki-${page.pageid}`,
    slug: slugify(page.title),
    name: page.title,
    role: description.split(",")[0] || "Public figure",
    country: inferredCountry,
    category: inferCategoryFromText(description),
    imageUrl: page.thumbnail?.source,
    summary: description,
    influenceScore: 55,
    source: "wikipedia",
    wikipediaPageId: page.pageid,
    wikipediaTitle: page.title
  };
}

export async function fetchWikipediaFiguresForQuery(query: string, limit = 8): Promise<WikipediaFigureResult[]> {
  if (!query.trim()) {
    return [];
  }

  const baseUrl = process.env.WIKIPEDIA_API_BASE || "https://en.wikipedia.org/w/api.php";
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: query,
    gsrlimit: String(limit),
    prop: "pageimages|pageterms|extracts",
    exintro: "1",
    explaintext: "1",
    exchars: "180",
    pilimit: "max",
    pithumbsize: "300"
  });

  const response = await fetch(`${baseUrl}?${params.toString()}`, {
    headers: {
      "User-Agent": process.env.SOURCE_VALIDATION_USER_AGENT || "ClaimdBot/1.0"
    }
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as WikipediaResponse;
  return Object.values(data.query?.pages ?? {}).map(mapWikipediaPageToFigure).filter(isLikelyPublicFigure);
}

export function isLikelyPublicFigure(figure: Pick<WikipediaFigureResult, "name" | "role" | "summary">) {
  const haystack = `${figure.name} ${figure.role} ${figure.summary || ""}`.toLowerCase();

  const blockedPhrases = [
    "election",
    "list of",
    "league",
    "football in",
    "discography",
    " studio album ",
    " single by ",
    "wikimedia list article",
    "party",
    "award"
  ];

  if (blockedPhrases.some((phrase) => haystack.includes(phrase))) {
    return false;
  }

  const personSignals = [
    "politician",
    "president",
    "governor",
    "minister",
    "businessman",
    "businesswoman",
    "entrepreneur",
    "founder",
    "actor",
    "actress",
    "artist",
    "singer",
    "musician",
    "footballer",
    "athlete",
    "pastor",
    "comedian",
    "filmmaker"
  ];

  return personSignals.some((signal) => haystack.includes(signal));
}
