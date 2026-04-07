import { prisma } from "@/lib/prisma";
import { getTrendingFigures } from "@/lib/server/figures";
import { getCreatorAccruedOnchain } from "@/lib/server/onchain";
import { scoreClaimForCountry } from "@/lib/server/ranking";
import {
  serializeClaim,
  serializeComment,
  serializeFigure,
  serializeNotification,
  serializeProfile
} from "@/lib/server/serializers";

export async function getFeed(country: string, walletAddress?: string) {
  const user = walletAddress
    ? await prisma.user.findUnique({
        where: { walletAddress },
        include: {
          follows: true
        }
      })
    : null;
  const followedFigureIds = user?.follows.map((follow) => follow.figureId) ?? [];

  const claims = await prisma.claim.findMany({
    where: {
      status: "APPROVED"
    },
    include: {
      figures: {
        include: {
          figure: true
        }
      }
    },
    take: 24,
    orderBy: [{ createdAt: "desc" }]
  });

  return claims
    .map(serializeClaim)
    .sort(
      (left, right) =>
        scoreClaimForCountry(right, country, followedFigureIds) -
        scoreClaimForCountry(left, country, followedFigureIds)
    );
}

export async function getFigureWall(slug: string) {
  const figure = await prisma.figure.findUnique({
    where: { slug }
  });

  if (!figure) {
    return null;
  }

  const figureClaims = await prisma.claim.findMany({
    where: {
      figures: {
        some: {
          figureId: figure.id
        }
      }
    },
    include: {
      figures: {
        include: {
          figure: true
        }
      }
    },
    orderBy: [{ totalReactions: "desc" }, { createdAt: "desc" }],
    take: 12
  });

  const serializedClaims = figureClaims.map(serializeClaim);
  const trendingClaim =
    serializedClaims
      .filter((claim) => claim.likesCount > 0)
      .sort((left, right) => {
        if (right.likesCount !== left.likesCount) {
          return right.likesCount - left.likesCount;
        }

        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      })[0] ||
    serializedClaims
      .slice()
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())[0] ||
    null;
  const claimIds = figureClaims.map((claim) => claim.id);
  const [recentReactions, previousReactions, recentComments, previousComments] = await Promise.all([
    prisma.reaction.count({
      where: {
        claimId: { in: claimIds },
        createdAt: { gte: new Date(Date.now() - 24 * 3600000) }
      }
    }),
    prisma.reaction.count({
      where: {
        claimId: { in: claimIds },
        createdAt: {
          gte: new Date(Date.now() - 48 * 3600000),
          lt: new Date(Date.now() - 24 * 3600000)
        }
      }
    }),
    prisma.comment.count({
      where: {
        claimId: { in: claimIds },
        createdAt: { gte: new Date(Date.now() - 24 * 3600000) }
      }
    }),
    prisma.comment.count({
      where: {
        claimId: { in: claimIds },
        createdAt: {
          gte: new Date(Date.now() - 48 * 3600000),
          lt: new Date(Date.now() - 24 * 3600000)
        }
      }
    })
  ]);

  const recentEngagement = recentReactions + recentComments;
  const previousEngagement = previousReactions + previousComments;
  const engagementVelocity =
    previousEngagement === 0
      ? recentEngagement > 0
        ? 100
        : 0
      : Math.round(((recentEngagement - previousEngagement) / previousEngagement) * 1000) / 10;

  return {
    figure: serializeFigure(figure),
    trendingClaim,
    claims: serializedClaims,
    engagementVelocity,
    timeline: serializedClaims.slice(0, 2).map((claim) => ({
      date: new Date(claim.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }),
      title: claim.body,
      status: claim.likesCount >= claim.dislikesCount ? "Verified" : "Disputed"
    }))
  };
}

export async function getNotifications(walletAddress?: string) {
  const user =
    walletAddress &&
    (await prisma.user.findUnique({
      where: { walletAddress }
    }));

  const notifications = await prisma.notification.findMany({
    where: user ? { userId: user.id } : undefined,
    take: 20,
    orderBy: { createdAt: "desc" }
  });

  return notifications.map(serializeNotification);
}

export async function getProfile(walletAddress?: string) {
  const requestedUser =
    walletAddress &&
    (await prisma.user.findUnique({
      where: { walletAddress }
    }));

  const user =
    requestedUser ||
    (!walletAddress
      ? await prisma.user.findFirst({
          orderBy: { createdAt: "asc" }
        })
      : null);

  if (!user && walletAddress) {
    const availableOnchainRewards = await getCreatorAccruedOnchain(walletAddress).catch(() => 0);

    return serializeProfile({
      walletAddress,
      displayName: "Claimd Creator",
      selectedCountry: "Global",
      totalPosts: 0,
      totalReactionsReceived: 0,
      totalEarned: 0,
      availableOnchainRewards,
      withdrawalAddress: walletAddress,
      followedFigures: await getTrendingFigures("Global", 4),
      recentClaims: []
    });
  }

  if (!user) {
    return null;
  }

  const claims = await prisma.claim.findMany({
    where: { postedByWallet: user.walletAddress },
    include: {
      figures: {
        include: {
          figure: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 8
  });

  const followedFigureRecords = await prisma.userFigureFollow.findMany({
    where: { userId: user.id },
    include: { figure: true },
    orderBy: { createdAt: "desc" },
    take: 8
  });

  const followedFigures =
    followedFigureRecords.length > 0
      ? followedFigureRecords.map((record) => serializeFigure(record.figure))
      : await getTrendingFigures(user.selectedCountry, 4);
  const totalReactionsReceived = claims.reduce((sum, claim) => sum + claim.totalReactions, 0);
  const totalEarned = claims.reduce((sum, claim) => sum + claim.earnedCusd, 0);
  const availableOnchainRewards = await getCreatorAccruedOnchain(user.walletAddress).catch(() => 0);

  return serializeProfile({
    walletAddress: user.walletAddress,
    displayName: user.displayName,
    selectedCountry: user.selectedCountry,
    totalPosts: claims.length,
    totalReactionsReceived,
    totalEarned,
    availableOnchainRewards,
    withdrawalAddress: user.walletAddress,
    followedFigures,
    recentClaims: claims.map(serializeClaim)
  });
}

export async function getClaimComments(claimId: string) {
  const comments = await prisma.comment.findMany({
    where: { claimId },
    include: {
      claim: {
        select: {
          postedByWallet: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 30
  });

  return comments.map(serializeComment);
}
