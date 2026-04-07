import type { NextApiRequest, NextApiResponse } from "next";
import { COUNTRY_OPTIONS } from "@/lib/constants/countries";

export default function handler(_: NextApiRequest, res: NextApiResponse) {
  res.status(200).json(COUNTRY_OPTIONS);
}
