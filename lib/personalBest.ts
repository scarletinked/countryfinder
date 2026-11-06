import type { GameMode } from "@/types";

// Best score per game on this device, shown on the home screen
const keyFor = (mode: GameMode) => `homing-parrot:best:${mode}`;

export function readBest(mode: GameMode): number | null {
  try {
    const v = Number(localStorage.getItem(keyFor(mode)));
    return v > 0 ? v : null;
  } catch {
    return null;
  }
}

export function recordScore(mode: GameMode, score: number) {
  try {
    if (score > (readBest(mode) ?? 0)) localStorage.setItem(keyFor(mode), String(score));
  } catch {
    // Storage blocked (private mode etc.); the best just won't be remembered
  }
}
