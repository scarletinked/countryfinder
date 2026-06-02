import type { LeaderboardEntry } from "@/types";

// Module-level singleton — persists for the lifetime of the Node.js process.
// On Vercel, cold-start instances each have their own copy (acceptable for this game).
const MAX_ENTRIES = 10;
let scores: LeaderboardEntry[] = [];

export function getLeaderboard(): LeaderboardEntry[] {
  return [...scores].sort((a, b) => b.score - a.score);
}

export function isTopTen(score: number): boolean {
  if (scores.length < MAX_ENTRIES) return true;
  const sorted = getLeaderboard();
  return score > sorted[sorted.length - 1].score;
}

export function addEntry(entry: LeaderboardEntry): LeaderboardEntry[] {
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  if (scores.length > MAX_ENTRIES) scores.pop();
  return getLeaderboard();
}
