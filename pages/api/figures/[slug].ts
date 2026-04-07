import type { NextApiRequest, NextApiResponse } from "next";
import { getFigureWall } from "@/lib/server/feed";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const slug = typeof req.query.slug === "string" ? req.query.slug : "";
  const figure = await getFigureWall(slug);

  if (!figure) {
    res.status(404).json({ error: "Figure not found" });
    return;
  }

  res.status(200).json(figure);
}
