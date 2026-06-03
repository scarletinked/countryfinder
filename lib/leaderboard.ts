import { kv } from "@vercel/kv";
import type { LeaderboardEntry } from "@/types";

const KEY = "leaderboard";
const MAX_ENTRIES = 10;

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const scores = (await kv.get<LeaderboardEntry[]>(KEY)) ?? [];
  return [...scores].sort((a, b) => b.score - a.score);
}

export async function isTopTen(score: number): Promise<boolean> {
  const scores = await getLeaderboard();
  if (scores.length < MAX_ENTRIES) return true;
  return score > scores[scores.length - 1].score;
}

export async function addEntry(entry: LeaderboardEntry): Promise<LeaderboardEntry[]> {
  const scores = await getLeaderboard();
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  if (scores.length > MAX_ENTRIES) scores.pop();
  await kv.set(KEY, scores);
  return scores;
}
