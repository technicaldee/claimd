import type { CountryOption, CountryName } from "@/lib/types";

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: "global", name: "Global", flagEmoji: "🌍", descriptor: "World-wide coverage" },
  { code: "ng", name: "Nigeria", flagEmoji: "🇳🇬", descriptor: "Politics, music, football, culture" },
  { code: "gh", name: "Ghana", flagEmoji: "🇬🇭", descriptor: "Government, entertainment, business" },
  { code: "ke", name: "Kenya", flagEmoji: "🇰🇪", descriptor: "Public service, innovation, sport" },
  { code: "za", name: "South Africa", flagEmoji: "🇿🇦", descriptor: "Politics, media, business" },
  { code: "in", name: "India", flagEmoji: "🇮🇳", descriptor: "Policy, founders, cinema" },
  { code: "us", name: "USA", flagEmoji: "🇺🇸", descriptor: "Politics, creators, tech" },
  { code: "uk", name: "UK", flagEmoji: "🇬🇧", descriptor: "Politics, football, media" },
  { code: "br", name: "Brazil", flagEmoji: "🇧🇷", descriptor: "Football, policy, entertainment" }
];

export const COUNTRY_PROFILES: Record<
  CountryName,
  {
    keywords: string[];
    region: string;
    preferredCategories: Record<string, number>;
    preferredRoles: string[];
  }
> = {
  Global: {
    keywords: ["world", "global", "international"],
    region: "global",
    preferredCategories: {
      Politics: 0.9,
      Governance: 0.85,
      Music: 0.8,
      Business: 0.8,
      Technology: 0.8,
      Football: 0.75,
      Entertainment: 0.75
    },
    preferredRoles: ["President", "Founder", "Artist", "Governor", "Minister"]
  },
  Nigeria: {
    keywords: ["nigeria", "nigerian", "lagos", "abuja", "naija"],
    region: "africa-west",
    preferredCategories: {
      Politics: 1,
      Governance: 0.95,
      Music: 0.95,
      Football: 0.88,
      Entertainment: 0.86,
      Business: 0.8
    },
    preferredRoles: ["President", "Governor", "Minister", "Artist", "Footballer"]
  },
  Ghana: {
    keywords: ["ghana", "ghanaian", "accra"],
    region: "africa-west",
    preferredCategories: {
      Politics: 0.95,
      Governance: 0.9,
      Entertainment: 0.85,
      Business: 0.82,
      Music: 0.8
    },
    preferredRoles: ["President", "Minister", "Artist", "Entrepreneur"]
  },
  Kenya: {
    keywords: ["kenya", "kenyan", "nairobi"],
    region: "africa-east",
    preferredCategories: {
      Politics: 0.95,
      Governance: 0.9,
      Technology: 0.88,
      Athletics: 0.86,
      Business: 0.82
    },
    preferredRoles: ["President", "Governor", "Founder", "Athlete"]
  },
  "South Africa": {
    keywords: ["south africa", "south african", "johannesburg", "cape town"],
    region: "africa-south",
    preferredCategories: {
      Politics: 0.94,
      Entertainment: 0.88,
      Business: 0.87,
      Football: 0.82
    },
    preferredRoles: ["President", "Minister", "Artist", "Businessperson"]
  },
  India: {
    keywords: ["india", "indian", "new delhi", "mumbai", "bollywood"],
    region: "asia-south",
    preferredCategories: {
      Politics: 0.95,
      Technology: 0.9,
      Entertainment: 0.88,
      Business: 0.86
    },
    preferredRoles: ["Prime Minister", "Actor", "Founder", "Minister"]
  },
  USA: {
    keywords: ["united states", "usa", "american", "washington", "hollywood"],
    region: "north-america",
    preferredCategories: {
      Politics: 0.95,
      Technology: 0.92,
      Entertainment: 0.88,
      Business: 0.9,
      Sports: 0.82
    },
    preferredRoles: ["President", "Founder", "Actor", "Senator"]
  },
  UK: {
    keywords: ["united kingdom", "uk", "british", "london", "england"],
    region: "europe-west",
    preferredCategories: {
      Politics: 0.95,
      Football: 0.9,
      Entertainment: 0.86,
      Business: 0.82
    },
    preferredRoles: ["Prime Minister", "Footballer", "Artist", "Member of Parliament"]
  },
  Brazil: {
    keywords: ["brazil", "brazilian", "sao paulo", "rio"],
    region: "south-america",
    preferredCategories: {
      Politics: 0.9,
      Football: 0.95,
      Entertainment: 0.86,
      Business: 0.8
    },
    preferredRoles: ["President", "Footballer", "Artist"]
  }
};

export function isCountryName(value: string): value is CountryName {
  return COUNTRY_OPTIONS.some((option) => option.name === value);
}
