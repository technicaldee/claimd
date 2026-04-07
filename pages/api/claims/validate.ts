import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { validateClaimSource } from "@/lib/server/claims";

const schema = z.object({
  claimText: z.string().min(10),
  sourceUrl: z.string().url(),
  figureNames: z.array(z.string()).min(1)
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).end();
    return;
  }

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ ok: false, reason: "Claim text, source URL, and at least one figure are required." });
    return;
  }

  const result = await validateClaimSource(parsed.data);
  res.status(result.ok ? 200 : 422).json(result);
}
