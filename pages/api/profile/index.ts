import type { NextApiRequest, NextApiResponse } from "next";
import { getProfile } from "@/lib/server/feed";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const wallet = typeof req.query.wallet === "string" ? req.query.wallet : undefined;
  const profile = await getProfile(wallet);

  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.status(200).json(profile);
}
