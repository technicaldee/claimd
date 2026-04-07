import { PrismaClient } from "@prisma/client";
import { execFileSync } from "node:child_process";

const prisma = new PrismaClient();

const WIKIPEDIA_API_BASE = process.env.WIKIPEDIA_API_BASE || "https://en.wikipedia.org/w/api.php";
const USER_AGENT = process.env.SOURCE_VALIDATION_USER_AGENT || "ClaimdBot/1.0 (+http://localhost:3000)";

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function inferCountry(text) {
  const haystack = text.toLowerCase();

  if (haystack.includes("nigeria") || haystack.includes("nigerian") || haystack.includes("lagos") || haystack.includes("abuja")) {
    return "Nigeria";
  }

  if (haystack.includes("ghana") || haystack.includes("ghanaian")) {
    return "Ghana";
  }

  if (haystack.includes("kenya") || haystack.includes("kenyan")) {
    return "Kenya";
  }

  if (haystack.includes("south africa") || haystack.includes("south african")) {
    return "South Africa";
  }

  if (haystack.includes("india") || haystack.includes("indian")) {
    return "India";
  }

  if (haystack.includes("united states") || haystack.includes("american") || haystack.includes("usa")) {
    return "USA";
  }

  if (haystack.includes("united kingdom") || haystack.includes("british") || haystack.includes("england")) {
    return "UK";
  }

  if (haystack.includes("brazil") || haystack.includes("brazilian")) {
    return "Brazil";
  }

  return "Global";
}

function inferCategory(text) {
  const value = text.toLowerCase();

  if (value.includes("president") || value.includes("politician") || value.includes("minister") || value.includes("governor")) {
    return "Politics";
  }
  if (value.includes("football") || value.includes("athlete")) {
    return "Football";
  }
  if (value.includes("actor") || value.includes("actress") || value.includes("singer") || value.includes("artist")) {
    return "Entertainment";
  }
  if (value.includes("business") || value.includes("entrepreneur") || value.includes("founder")) {
    return "Business";
  }
  return "Governance";
}

function shouldReplaceImage(existingImage, nextImage) {
  if (!nextImage) return false;
  if (!existingImage) return true;
  return existingImage.includes("googleusercontent.com/aida-public") || existingImage.includes("placehold");
}

function normalizeFigureName(value) {
  return (value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function preferExistingName(existingName, incomingName, wikipediaTitle) {
  if (!existingName) return incomingName || wikipediaTitle || "Unknown figure";
  if (!incomingName) return existingName;

  const normalizedExisting = normalizeFigureName(existingName);
  const normalizedIncoming = normalizeFigureName(incomingName);
  const normalizedWiki = normalizeFigureName(wikipediaTitle);

  if (normalizedExisting === normalizedIncoming || normalizedExisting === normalizedWiki) {
    return existingName.length >= incomingName.length ? existingName : incomingName;
  }

  return existingName;
}

function isLikelyPublicFigure(figure) {
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

async function fetchWikipediaQuery(query, limit = 6) {
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

  const raw = execFileSync(
    "curl",
    [
      "-sL",
      "--max-time",
      "30",
      "-A",
      USER_AGENT,
      `${WIKIPEDIA_API_BASE}?${params.toString()}`
    ],
    { encoding: "utf8" }
  );

  const data = JSON.parse(raw);
  return Object.values(data.query?.pages || {})
    .map((page) => {
    const description = page.terms?.description?.[0] || page.extract || "Public figure";
    return {
      slug: slugify(page.title),
      name: page.title,
      role: description.split(",")[0] || "Public figure",
      country: inferCountry(`${page.title} ${description}`),
      category: inferCategory(description),
      imageUrl: page.thumbnail?.source || null,
      summary: description,
      wikipediaPageId: page.pageid,
      wikipediaTitle: page.title
    };
    })
    .filter(isLikelyPublicFigure);
}

async function upsertFigure(figure) {
  const existing =
    (figure.wikipediaPageId
      ? await prisma.figure.findUnique({ where: { wikipediaPageId: figure.wikipediaPageId } })
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
    }));

  const data = {
    slug: existing?.slug || figure.slug,
    name: preferExistingName(existing?.name, figure.name, figure.wikipediaTitle),
    role: figure.role,
    country: figure.country,
    category: figure.category,
    imageUrl: shouldReplaceImage(existing?.imageUrl, figure.imageUrl) ? figure.imageUrl : existing?.imageUrl || figure.imageUrl,
    summary: figure.summary || existing?.summary,
    wikipediaPageId: figure.wikipediaPageId,
    wikipediaTitle: figure.wikipediaTitle,
    influenceScore: existing?.influenceScore ?? 60,
    searchBias: existing?.searchBias ?? 0,
    engagementScore: existing?.engagementScore ?? 0
  };

  if (existing) {
    return prisma.figure.update({
      where: { id: existing.id },
      data
    });
  }

  return prisma.figure.create({ data });
}

async function main() {
  const country = process.argv[2] || "Nigeria";
  const queries =
    country.toLowerCase() === "nigeria"
      ? ["Nigeria politician", "Nigeria musician", "Nigeria actor", "Nigeria footballer", "Nigeria entrepreneur"]
      : [`${country} politician`, `${country} musician`, `${country} actor`, `${country} footballer`];

  const existingPlaceholderFigures = await prisma.figure.findMany({
    where: {
      country,
      OR: [{ imageUrl: { contains: "googleusercontent.com/aida-public" } }, { imageUrl: null }]
    },
    select: {
      name: true,
      wikipediaTitle: true
    }
  });

  const unique = new Map();

  for (const query of [
    ...queries,
    ...existingPlaceholderFigures.flatMap((figure) => [figure.wikipediaTitle, figure.name]).filter(Boolean)
  ]) {
    const results = await fetchWikipediaQuery(query, 6);
    for (const figure of results) {
      if (!figure.imageUrl) continue;
      const key = figure.wikipediaPageId ? `wiki:${figure.wikipediaPageId}` : figure.slug;
      if (!unique.has(key)) {
        unique.set(key, figure);
      }
    }
  }

  for (const figure of unique.values()) {
    await upsertFigure(figure);
  }

  const preview = Array.from(unique.values())
    .slice(0, 12)
    .map((figure) => `${figure.name} | ${figure.imageUrl}`)
    .join("\n");

  console.log(`Synced ${unique.size} figures for ${country}`);
  console.log(preview);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
