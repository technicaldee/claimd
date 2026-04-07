import type { NextApiRequest, NextApiResponse } from "next";
import { getFeed } from "@/lib/server/feed";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const country = typeof req.query.country === "string" ? req.query.country : "Global";
  const wallet = typeof req.query.wallet === "string" ? req.query.wallet : undefined;
  const feed = await getFeed(country, wallet);
  res.status(200).json(feed);
}
