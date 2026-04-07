import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { recordComment } from "@/lib/server/claims";
import { getClaimComments } from "@/lib/server/feed";

const createSchema = z.object({
  claimId: z.string(),
  walletAddress: z.string(),
  body: z.string().min(2).max(280),
  txHash: z.string().optional()
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const claimId = typeof req.query.claimId === "string" ? req.query.claimId : "";
    if (!claimId) {
      res.status(400).json({ error: "Missing claimId" });
      return;
    }

    const comments = await getClaimComments(claimId);
    res.status(200).json(comments);
    return;
  }

  if (req.method === "POST") {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid comment payload." });
      return;
    }

    const comment = await recordComment(parsed.data);
    res.status(201).json(comment);
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).end();
}
