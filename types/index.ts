import type { Feature, Geometry } from "geojson";

// A country, or a US state in the US modes
export interface CountryFeature {
  id: number;
  name: string;
  feature: Feature<Geometry>;
}

export type Tier = "easy" | "medium" | "hard";

export type GameMode = "standard" | "polly" | "states" | "statehouse" | "provinces" | "provcapitals" | "birds";

// Which map a mode is played on
export type MapKind = "world" | "us" | "ca";

export interface GameRound {
  roundNumber: number;
  targetCountry: CountryFeature;
  tier: Tier;
  clickedLngLat: [number, number] | null;
  score: number | null;
  distanceMiles: number | null;
  isCorrect: boolean | null;
}

export type GamePhase = "home" | "playing" | "round-result" | "game-over";

export interface GameState {
  phase: GamePhase;
  mode: GameMode;
  currentRound: number;
  tier: Tier;
  streak: number;
  rounds: GameRound[];
  totalScore: number;
  markerPosition: [number, number] | null;
}

export type GameAction =
  | { type: "START_GAME"; mode: GameMode; country: CountryFeature }
  | { type: "PLACE_MARKER"; lngLat: [number, number] }
  | {
      type: "SUBMIT_GUESS";
      isCorrect: boolean;
      distanceMiles: number;
      score: number;
    }
  | { type: "NEXT_ROUND"; country: CountryFeature }
  | { type: "RESET_GAME" };

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

export interface Leaderboards {
  allTime: LeaderboardEntry[];
  weekly: LeaderboardEntry[];
  daily: LeaderboardEntry[];
}
