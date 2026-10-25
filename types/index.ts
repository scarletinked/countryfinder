import type { Feature, Geometry } from "geojson";

export interface CountryFeature {
  id: number;
  name: string;
  feature: Feature<Geometry>;
}

export type Tier = "easy" | "medium" | "hard";

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
  currentRound: number;
  tier: Tier;
  streak: number;
  rounds: GameRound[];
  totalScore: number;
  markerPosition: [number, number] | null;
}

export type GameAction =
  | { type: "START_GAME"; country: CountryFeature }
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
