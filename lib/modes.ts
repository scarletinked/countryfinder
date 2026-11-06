import type { GameMode } from "@/types";

export const MODES: GameMode[] = ["standard", "polly", "states", "statehouse"];

// The "standard" key is kept so existing leaderboard scores carry over; only its display name changed
export const MODE_LABELS: Record<GameMode, string> = {
  standard: "International Flight",
  polly: "Polly Wants a Capital",
  states: "United Squawks of America",
  statehouse: "Polly Wants a Statehouse",
};

export interface ModeInfo {
  map: "world" | "us";
  // Prompt with the capital instead of the place's own name
  capitals: boolean;
  // Climb easy → hard tiers; otherwise every pick is random
  tiers: boolean;
  noun: "country" | "state";
  // One line for the game picker
  blurb: string;
  // Chapter numeral on the home screen
  numeral: string;
  // Ink color for this mode's numeral and badge: red for the world, blue for the US
  ink: string;
}

export const MODE_INFO: Record<GameMode, ModeInfo> = {
  standard: {
    map: "world", capitals: false, tiers: true, noun: "country", numeral: "I",
    blurb: "Countries of the world, easy to hard",
    ink: "#b23a2e",
  },
  polly: {
    map: "world", capitals: true, tiers: true, noun: "country", numeral: "II",
    blurb: "From capital to country",
    ink: "#b23a2e",
  },
  states: {
    map: "us", capitals: false, tiers: false, noun: "state", numeral: "III",
    blurb: "All fifty states",
    ink: "#2e5d7a",
  },
  statehouse: {
    map: "us", capitals: true, tiers: false, noun: "state", numeral: "IV",
    blurb: "From state capital to state",
    ink: "#2e5d7a",
  },
};

export function isGameMode(value: unknown): value is GameMode {
  return typeof value === "string" && (MODES as string[]).includes(value);
}
