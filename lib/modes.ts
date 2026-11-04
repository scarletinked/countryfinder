import type { GameMode } from "@/types";

export const MODES: GameMode[] = ["standard", "polly", "states", "statehouse"];

export const MODE_LABELS: Record<GameMode, string> = {
  standard: "Standard",
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
  // Tailwind classes for this mode's accent text, badge, and its card when picked
  accent: string;
  badge: string;
  selected: string;
}

export const MODE_INFO: Record<GameMode, ModeInfo> = {
  standard: {
    map: "world", capitals: false, tiers: true, noun: "country",
    blurb: "We name a country, you find it on the world map",
    accent: "text-teal-300",
    badge: "border-teal-400/25 bg-teal-400/10 text-teal-300",
    selected: "border-teal-300/70 bg-teal-400/10 ring-1 ring-teal-300/40",
  },
  polly: {
    map: "world", capitals: true, tiers: true, noun: "country",
    blurb: "We name a capital, you find its country",
    accent: "text-amber-200",
    badge: "border-amber-300/30 bg-amber-300/10 text-amber-200",
    selected: "border-amber-300/70 bg-amber-300/10 ring-1 ring-amber-300/40",
  },
  states: {
    map: "us", capitals: false, tiers: false, noun: "state",
    blurb: "We name a state, you find it on the US map",
    accent: "text-sky-200",
    badge: "border-sky-300/30 bg-sky-300/10 text-sky-200",
    selected: "border-sky-300/70 bg-sky-300/10 ring-1 ring-sky-300/40",
  },
  statehouse: {
    map: "us", capitals: true, tiers: false, noun: "state",
    blurb: "We name a state capital, you find its state",
    accent: "text-rose-200",
    badge: "border-rose-300/30 bg-rose-300/10 text-rose-200",
    selected: "border-rose-300/70 bg-rose-300/10 ring-1 ring-rose-300/40",
  },
};

export function isGameMode(value: unknown): value is GameMode {
  return typeof value === "string" && (MODES as string[]).includes(value);
}
