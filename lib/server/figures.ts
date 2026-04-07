import { prisma } from "@/lib/prisma";
import { scoreFigureForCountry } from "@/lib/server/ranking";
import { serializeFigure } from "@/lib/server/serializers";
import { fetchWikipediaFiguresForQuery, searchWikipediaFigures, type WikipediaFigureResult } from "@/lib/server/wikipedia";
import { slugify } from "@/lib/utils";
import type { FigureSelectionInput, FigureSummary } from "@/lib/types";

export async function getTrendingFigures(country: string, limit = 8): Promise<FigureSummary[]> {
  const figures = await prisma.figure.findMany({
    take: 30,
    orderBy: [{ influenceScore: "desc" }, { engagementScore: "desc" }]
  });

  return figures
    .map(serializeFigure)
    .sort((left, right) => scoreFigureForCountry(right, country) - scoreFigureForCountry(left, country))
    .slice(0, limit);
}

export async function searchFigures(query: string, country: string) {
  const localMatches = await prisma.figure.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { role: { contains: query } },
        { summary: { contains: query } }
      ]
    },
    take: 12
  });

  const wikipediaMatches = query.trim() ? await searchWikipediaFigures(query.trim()) : [];
  if (wikipediaMatches.length > 0) {
    await cacheWikipediaFigures(wikipediaMatches as WikipediaFigureResult[]);
  }

  const local = localMatches.map(serializeFigure);
  const cachedLocalMatches = query.trim()
    ? (
        await prisma.figure.findMany({
          where: {
            OR: [
              { name: { contains: query } },
              { role: { contains: query } },
              { summary: { contains: query } }
            ]
          },
          take: 16
        })
      ).map(serializeFigure)
    : local;

  const merged = dedupeFigures([...cachedLocalMatches, ...wikipediaMatches]);

  return merged.sort((left, right) => scoreFigureForCountry(right, country) - scoreFigureForCountry(left, country));
}

export async function getFigureBySlug(slug: string) {
  const figure = await prisma.figure.findUnique({
    where: { slug }
  });

  return figure ? serializeFigure(figure) : null;
}

export async function ensureFigures(selections: FigureSelectionInput[]) {
  const figureIds: string[] = [];

  for (const selection of selections) {
    let figure =
      (selection.id &&
        (await prisma.figure.findUnique({
          where: { id: selection.id }
        }))) ||
      (selection.wikipediaPageId
        ? await prisma.figure.findUnique({
            where: { wikipediaPageId: selection.wikipediaPageId }
          })
        : null) ||
      (selection.slug
        ? await prisma.figure.findUnique({
            where: { slug: selection.slug }
          })
        : null);

    if (!figure) {
      figure = await prisma.figure.create({
        data: {
          slug: selection.slug || slugify(selection.name),
          name: selection.name,
          role: selection.role,
          country: selection.country || "Global",
          category: selection.category || "Governance",
          imageUrl: selection.imageUrl,
          summary: selection.summary,
          wikipediaPageId: selection.wikipediaPageId ?? undefined,
          wikipediaTitle: selection.wikipediaTitle,
          influenceScore: 60,
          searchBias: 0,
          engagementScore: 0
        }
      });
    }

    figureIds.push(figure.id);
  }

  return figureIds;
}

export async function cacheWikipediaFigures(figures: WikipediaFigureResult[]) {
  for (const figure of figures) {
    const existing = await findExistingFigureForWikipediaMatch(figure);

    const nextData = {
      slug: existing?.slug || figure.slug,
      name: preferExistingName(existing?.name, figure.name, figure.wikipediaTitle),
      role: figure.role,
      country: figure.country,
      category: figure.category,
      imageUrl:
        shouldReplaceImage(existing?.imageUrl, figure.imageUrl) || !existing?.imageUrl
          ? figure.imageUrl
          : existing.imageUrl,
      summary: figure.summary || existing?.summary,
      wikipediaPageId: figure.wikipediaPageId ?? undefined,
      wikipediaTitle: figure.wikipediaTitle,
      influenceScore: existing?.influenceScore ?? figure.influenceScore,
      searchBias: existing?.searchBias ?? 0,
      engagementScore: existing?.engagementScore ?? 0
    };

    if (existing) {
      await prisma.figure.update({
        where: { id: existing.id },
        data: nextData
      });
    } else {
      await prisma.figure.create({
        data: nextData
      });
    }
  }
}

export async function importCountryFigures(country: string) {
  const queries = buildCountryQueries(country);
  const collected: WikipediaFigureResult[] = [];

  for (const query of queries) {
    const figures = await fetchWikipediaFiguresForQuery(query, 6);
    collected.push(...figures.filter((figure) => figure.imageUrl));
  }

  const deduped = dedupeFigures(collected) as WikipediaFigureResult[];
  await cacheWikipediaFigures(deduped);

  return deduped;
}

function dedupeFigures(figures: FigureSummary[]) {
  const seen = new Set<string>();

  return figures.filter((figure) => {
    const key = figure.wikipediaPageId ? `wiki:${figure.wikipediaPageId}` : figure.slug;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function shouldReplaceImage(existingImage?: string | null, nextImage?: string | null) {
  if (!nextImage) {
    return false;
  }

  if (!existingImage) {
    return true;
  }

  return existingImage.includes("googleusercontent.com/aida-public") || existingImage.includes("placehold");
}

function buildCountryQueries(country: string) {
  const normalized = country.toLowerCase();

  if (normalized === "nigeria") {
    return [
      "Nigeria politician",
      "Nigeria musician",
      "Nigeria actor",
      "Nigeria footballer",
      "Nigeria entrepreneur"
    ];
  }

  return [
    `${country} politician`,
    `${country} musician`,
    `${country} actor`,
    `${country} footballer`
  ];
}

async function findExistingFigureForWikipediaMatch(figure: WikipediaFigureResult) {
  return (
    (figure.wikipediaPageId
      ? await prisma.figure.findUnique({
          where: { wikipediaPageId: figure.wikipediaPageId }
        })
      : null) ||
    (figure.wikipediaTitle
      ? await prisma.figure.findFirst({
          where: {
            OR: [{ wikipediaTitle: figure.wikipediaTitle }, { name: figure.wikipediaTitle }]
          }
        })
      : null) ||
    (await prisma.figure.findFirst({
      where: {
        OR: [{ slug: figure.slug }, { name: figure.name }]
      }
    }))
  );
}

function preferExistingName(existingName?: string | null, incomingName?: string | null, wikipediaTitle?: string | null) {
  if (!existingName) {
    return incomingName || wikipediaTitle || "Unknown figure";
  }

  if (!incomingName) {
    return existingName;
  }

  const normalizedExisting = normalizeFigureName(existingName);
  const normalizedIncoming = normalizeFigureName(incomingName);
  const normalizedWiki = normalizeFigureName(wikipediaTitle || "");

  if (normalizedExisting === normalizedIncoming || normalizedExisting === normalizedWiki) {
    return existingName.length >= incomingName.length ? existingName : incomingName;
  }

  return existingName;
}

function normalizeFigureName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}
