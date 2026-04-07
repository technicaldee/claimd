import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { recordReaction } from "@/lib/server/claims";

const schema = z.object({
  claimId: z.string(),
  walletAddress: z.string(),
  type: z.enum(["LIKE", "DISLIKE"]),
  txHash: z.string().optional()
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).end();
    return;
  }

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid reaction payload." });
    return;
  }

  const updated = await recordReaction(parsed.data);
  res.status(200).json(updated);
}
