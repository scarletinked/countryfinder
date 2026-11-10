import type { CountryFeature, Tier } from "@/types";

// Correct guesses needed at a level to move up a tier; misses in between don't reset the count
export const HITS_TO_ADVANCE = 3;

export const TIER_LABELS: Record<Tier, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

// Big, famous, or distinctively shaped
const EASY = new Set([
  "United States", "Canada", "Mexico", "Brazil", "Argentina", "Chile", "Peru",
  "Colombia", "Cuba", "Greenland",
  "United Kingdom", "Ireland", "France", "Spain", "Portugal", "Germany", "Italy",
  "Greece", "Iceland", "Norway", "Sweden", "Finland", "Poland", "Ukraine",
  "Russia", "Türkiye (Turkey)",
  "Egypt", "Morocco", "South Africa", "Nigeria", "Kenya", "Ethiopia",
  "Madagascar", "Algeria", "Libya",
  "Saudi Arabia", "Iran", "Iraq", "Israel", "India", "Pakistan", "Afghanistan",
  "China", "Japan", "South Korea", "Mongolia", "Kazakhstan", "Thailand",
  "Vietnam", "Indonesia", "Philippines", "Australia", "New Zealand",
]);

// Small or easily confused with their neighbours
const HARD = new Set([
  "Benin", "Burkina Faso", "Burundi", "Central African Republic", "Comoros",
  "Republic of the Congo", "Djibouti", "Equatorial Guinea", "Eritrea", "Gabon",
  "Gambia", "Guinea", "Guinea-Bissau", "Lesotho", "Liberia", "Malawi", "Rwanda",
  "Sierra Leone", "Togo", "Eswatini", "South Sudan",
  "Belize", "El Salvador", "Honduras", "Nicaragua", "Guyana", "Suriname",
  "Trinidad and Tobago",
  "Albania", "Bosnia and Herzegovina", "Montenegro", "North Macedonia",
  "Moldova", "Slovenia", "Slovakia", "Luxembourg", "Latvia", "Lithuania",
  "Estonia",
  "Armenia", "Azerbaijan", "Kyrgyzstan", "Tajikistan", "Turkmenistan",
  "Bahrain", "Qatar", "Kuwait", "Lebanon", "Bhutan", "Laos", "Timor-Leste",
  "Fiji",
]);

export function tierOf(country: CountryFeature): Tier {
  if (EASY.has(country.name)) return "easy";
  if (HARD.has(country.name)) return "hard";
  return "medium";
}

export function pickCountryForTier(
  countries: CountryFeature[],
  tier: Tier,
  excludeIds: Set<number>
): CountryFeature {
  const pool = countries.filter((c) => tierOf(c) === tier && !excludeIds.has(c.id));
  // Fall back to any unused country if a tier ever runs dry
  return pool.length > 0 ? pickAny(pool, new Set()) : pickAny(countries, excludeIds);
}

// Any unused place, ignoring tiers
export function pickAny(places: CountryFeature[], excludeIds: Set<number>): CountryFeature {
  const options = places.filter((c) => !excludeIds.has(c.id));
  return options[Math.floor(Math.random() * options.length)];
}

export function nextTierState(
  tier: Tier,
  hits: number,
  isCorrect: boolean
): { tier: Tier; hits: number } {
  // A miss doesn't wipe out the correct guesses already made at this level
  if (!isCorrect) return { tier, hits };
  if (tier === "hard") return { tier, hits: hits + 1 };
  if (hits + 1 >= HITS_TO_ADVANCE) {
    return { tier: tier === "easy" ? "medium" : "hard", hits: 0 };
  }
  return { tier, hits: hits + 1 };
}
