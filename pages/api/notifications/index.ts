import type { NextApiRequest, NextApiResponse } from "next";
import { getNotifications } from "@/lib/server/feed";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const wallet = typeof req.query.wallet === "string" ? req.query.wallet : undefined;
  const notifications = await getNotifications(wallet);
  res.status(200).json(notifications);
}
