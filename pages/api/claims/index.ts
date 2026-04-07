import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { createClaim } from "@/lib/server/claims";

const figureSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  name: z.string(),
  role: z.string(),
  country: z.string(),
  category: z.string(),
  imageUrl: z.string().nullish(),
  summary: z.string().nullish(),
  wikipediaPageId: z.number().nullish(),
  wikipediaTitle: z.string().nullish()
});

const requestSchema = z.object({
  claimText: z.string().min(10).max(280),
  sourceUrl: z.string().url(),
  category: z.string(),
  country: z.string(),
  walletAddress: z.string(),
  figures: z.array(figureSchema).min(1),
  validation: z.object({
    ok: z.boolean(),
    reason: z.string().optional(),
    title: z.string().optional(),
    previewImageUrl: z.string().nullable().optional(),
    domain: z.string().optional()
  })
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).end();
    return;
  }

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid claim payload." });
    return;
  }

  if (!parsed.data.validation.ok) {
    res.status(422).json({ error: "Please validate the source before publishing." });
    return;
  }

  try {
    const claim = await createClaim(parsed.data);
    const primaryFigure = claim.figures.find((figure) => figure.primaryFigure)?.figure;

    res.status(201).json({
      id: claim.id,
      primaryFigureSlug: primaryFigure?.slug
    });
  } catch (error) {
    res.status(422).json({
      error: error instanceof Error ? error.message : "Unable to create claim"
    });
  }
}
