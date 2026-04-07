import type { NextApiRequest, NextApiResponse } from "next";
import { getTrendingFigures, searchFigures } from "@/lib/server/figures";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const country = typeof req.query.country === "string" ? req.query.country : "Global";
  const query = typeof req.query.q === "string" ? req.query.q : "";

  const figures = query.trim() ? await searchFigures(query, country) : await getTrendingFigures(country, 12);
  res.status(200).json(figures);
}
