import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const walletAddress =
    typeof req.query.wallet === "string"
      ? req.query.wallet
      : typeof req.body?.walletAddress === "string"
        ? req.body.walletAddress
        : "";
  const figureSlug =
    typeof req.query.figureSlug === "string"
      ? req.query.figureSlug
      : typeof req.body?.figureSlug === "string"
        ? req.body.figureSlug
        : "";

  if (!walletAddress || !figureSlug) {
    res.status(400).json({ error: "wallet and figureSlug are required" });
    return;
  }

  const user = await prisma.user.upsert({
    where: { walletAddress },
    update: {},
    create: { walletAddress }
  });
  const figure = await prisma.figure.findUnique({ where: { slug: figureSlug } });

  if (!figure) {
    res.status(404).json({ error: "Figure not found" });
    return;
  }

  if (req.method === "GET") {
    const follow = await prisma.userFigureFollow.findUnique({
      where: {
        userId_figureId: {
          userId: user.id,
          figureId: figure.id
        }
      }
    });

    res.status(200).json({ followed: Boolean(follow) });
    return;
  }

  if (req.method === "POST") {
    await prisma.userFigureFollow.upsert({
      where: {
        userId_figureId: {
          userId: user.id,
          figureId: figure.id
        }
      },
      update: {},
      create: {
        userId: user.id,
        figureId: figure.id
      }
    });

    res.status(200).json({ followed: true });
    return;
  }

  if (req.method === "DELETE") {
    await prisma.userFigureFollow.deleteMany({
      where: {
        userId: user.id,
        figureId: figure.id
      }
    });

    res.status(200).json({ followed: false });
    return;
  }

  res.setHeader("Allow", "GET, POST, DELETE");
  res.status(405).end();
}
