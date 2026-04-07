import { prisma } from "@/lib/prisma";
import { ensureFigures } from "@/lib/server/figures";
import { hasOnchainConfig, registerClaimOnchain } from "@/lib/server/onchain";
import { normalizeText, extractDomain } from "@/lib/utils";
import type { ClaimValidationResult, FigureSelectionInput } from "@/lib/types";

const REACTION_AMOUNT = Number(process.env.NEXT_PUBLIC_DEFAULT_REACTION_PRICE_CUSD || "0.01");
const COMMENT_AMOUNT = Number(process.env.NEXT_PUBLIC_DEFAULT_COMMENT_PRICE_CUSD || "0.005");
const CREATOR_SHARE = Number(process.env.NEXT_PUBLIC_CREATOR_SHARE_PERCENT || "70") / 100;
const PLATFORM_SHARE = Number(process.env.NEXT_PUBLIC_PLATFORM_SHARE_PERCENT || "30") / 100;

function keywordScore(claimText: string, figureNames: string[], pageText: string) {
  const normalizedClaim = normalizeText(claimText);
  const normalizedPage = normalizeText(pageText);
  const claimKeywords = normalizedClaim.split(" ").filter((word) => word.length > 4);
  const figureKeywords = figureNames.flatMap((name) =>
    normalizeText(name)
      .split(" ")
      .filter((word) => word.length > 2)
  );

  const uniqueKeywords = [...new Set([...claimKeywords, ...figureKeywords])];
  const matches = uniqueKeywords.filter((keyword) => normalizedPage.includes(keyword)).length;

  return uniqueKeywords.length === 0 ? 0 : matches / uniqueKeywords.length;
}

function extractMetadata(html: string) {
  const titleMatch = html.match(/<title>(.*?)<\/title>/is);
  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);

  return {
    title: titleMatch?.[1]?.trim() || undefined,
    imageUrl: ogImageMatch?.[1]
  };
}

export async function validateClaimSource(input: {
  claimText: string;
  sourceUrl: string;
  figureNames: string[];
}): Promise<ClaimValidationResult> {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(input.sourceUrl);
  } catch {
    return { ok: false, reason: "Invalid link. Please provide a full URL." };
  }

  const response = await fetch(parsedUrl.toString(), {
    headers: {
      "User-Agent": process.env.SOURCE_VALIDATION_USER_AGENT || "ClaimdBot/1.0"
    }
  }).catch(() => null);

  if (!response || !response.ok) {
    return { ok: false, reason: "Source is unreachable right now." };
  }

  const html = await response.text();
  const metadata = extractMetadata(html);
  const score = keywordScore(input.claimText, input.figureNames, `${metadata.title || ""} ${html.slice(0, 4000)}`);

  if (score < 0.18) {
    return {
      ok: false,
      reason: "The source does not look relevant enough to the selected figures or claim.",
      score
    };
  }

  return {
    ok: true,
    title: metadata.title,
    previewImageUrl: metadata.imageUrl,
    domain: extractDomain(parsedUrl.toString()),
    score
  };
}

export async function createClaim(input: {
  claimText: string;
  sourceUrl: string;
  category: string;
  country: string;
  walletAddress: string;
  figures: FigureSelectionInput[];
  validation: ClaimValidationResult;
}) {
  const normalizedBody = normalizeText(input.claimText);
  const duplicate = await prisma.claim.findFirst({
    where: {
      sourceUrl: input.sourceUrl,
      body: {
        contains: normalizedBody.slice(0, 40)
      }
    }
  });

  if (duplicate) {
    throw new Error("Duplicate claim detected. Try adding a fresher angle or a different source.");
  }

  const user = await prisma.user.upsert({
    where: { walletAddress: input.walletAddress },
    update: {},
    create: {
      walletAddress: input.walletAddress,
      selectedCountry: input.country
    }
  });

  const figureIds = await ensureFigures(input.figures);
  const domain = input.validation.domain || extractDomain(input.sourceUrl);

  const claim = await prisma.claim.create({
    data: {
      body: input.claimText,
      sourceUrl: input.sourceUrl,
      sourceDomain: domain,
      sourceTitle: input.validation.title,
      sourcePreviewImageUrl: input.validation.previewImageUrl,
      country: input.country,
      category: input.category,
      postedByWallet: input.walletAddress,
      creatorId: user.id,
      figures: {
        create: figureIds.map((figureId, index) => ({
          figureId,
          primaryFigure: index === 0
        }))
      }
    },
    include: {
      figures: {
        include: {
          figure: true
        }
      }
    }
  });

  if (hasOnchainConfig()) {
    await registerClaimOnchain(claim.id, input.walletAddress);
  }

  return claim;
}

export async function recordReaction(input: {
  claimId: string;
  walletAddress: string;
  type: "LIKE" | "DISLIKE";
  txHash?: string;
}) {
  const user = await prisma.user.upsert({
    where: { walletAddress: input.walletAddress },
    update: {},
    create: { walletAddress: input.walletAddress }
  });

  const creatorShare = Number((REACTION_AMOUNT * CREATOR_SHARE).toFixed(4));
  const platformShare = Number((REACTION_AMOUNT * PLATFORM_SHARE).toFixed(4));

  await prisma.reaction.create({
    data: {
      claimId: input.claimId,
      userId: user.id,
      type: input.type,
      amountCusd: REACTION_AMOUNT,
      creatorShareCusd: creatorShare,
      platformShareCusd: platformShare,
      txHash: input.txHash
    }
  });

  const updateData =
    input.type === "LIKE"
      ? {
          likesCount: { increment: 1 },
          totalReactions: { increment: 1 },
          earnedCusd: { increment: creatorShare }
        }
      : {
          dislikesCount: { increment: 1 },
          totalReactions: { increment: 1 },
          earnedCusd: { increment: creatorShare }
        };

  return prisma.claim.update({
    where: { id: input.claimId },
    data: updateData
  });
}

export async function recordComment(input: {
  claimId: string;
  walletAddress: string;
  body: string;
  txHash?: string;
}) {
  const user = await prisma.user.upsert({
    where: { walletAddress: input.walletAddress },
    update: {},
    create: { walletAddress: input.walletAddress }
  });

  const creatorShare = Number((COMMENT_AMOUNT * CREATOR_SHARE).toFixed(4));
  const platformShare = Number((COMMENT_AMOUNT * PLATFORM_SHARE).toFixed(4));

  const comment = await prisma.comment.create({
    data: {
      claimId: input.claimId,
      userId: user.id,
      body: input.body,
      postedByWallet: input.walletAddress,
      amountCusd: COMMENT_AMOUNT,
      creatorShareCusd: creatorShare,
      platformShareCusd: platformShare,
      txHash: input.txHash
    }
  });

  await prisma.claim.update({
    where: { id: input.claimId },
    data: {
      commentsCount: { increment: 1 },
      earnedCusd: { increment: creatorShare }
    }
  });

  return comment;
}
