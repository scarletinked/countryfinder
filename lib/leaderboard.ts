import { Redis } from "@upstash/redis";
import { startOfDay, startOfWeek } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import type { LeaderboardEntry } from "@/types";

const redis = Redis.fromEnv();

const KEY = "leaderboard";
const WEEK_KEY = "leaderboard:week";
const DAY_KEY = "leaderboard:day";
const MAX_ENTRIES = 10;
const TZ = "America/Los_Angeles";

function getDayStart(): Date {
  const zoned = toZonedTime(new Date(), TZ);
  return fromZonedTime(startOfDay(zoned), TZ);
}

function getWeekStart(): Date {
  const zoned = toZonedTime(new Date(), TZ);
  const monday = startOfWeek(zoned, { weekStartsOn: 1 });
  return fromZonedTime(startOfDay(monday), TZ);
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const scores = (await redis.get<LeaderboardEntry[]>(KEY)) ?? [];
  return [...scores].sort((a, b) => b.score - a.score);
}

export async function getWeeklyLeaderboard(): Promise<LeaderboardEntry[]> {
  const scores = (await redis.get<LeaderboardEntry[]>(WEEK_KEY)) ?? [];
  const weekStart = getWeekStart();
  return scores
    .filter((e) => new Date(e.date) >= weekStart)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES);
}

export async function getDailyLeaderboard(): Promise<LeaderboardEntry[]> {
  const scores = (await redis.get<LeaderboardEntry[]>(DAY_KEY)) ?? [];
  const dayStart = getDayStart();
  return scores
    .filter((e) => new Date(e.date) >= dayStart)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES);
}

export async function isQualifying(score: number): Promise<boolean> {
  const [allTime, weekly, daily] = await Promise.all([
    getLeaderboard(),
    getWeeklyLeaderboard(),
    getDailyLeaderboard(),
  ]);
  const qualifiesFor = (board: LeaderboardEntry[]) =>
    board.length < MAX_ENTRIES || score > board[board.length - 1].score;
  return qualifiesFor(allTime) || qualifiesFor(weekly) || qualifiesFor(daily);
}

export async function addEntry(
  entry: LeaderboardEntry
): Promise<{ allTime: LeaderboardEntry[]; weekly: LeaderboardEntry[]; daily: LeaderboardEntry[] }> {
  const weekStart = getWeekStart();
  const dayStart = getDayStart();

  const [storedAll, storedWeek, storedDay] = await Promise.all([
    getLeaderboard(),
    redis.get<LeaderboardEntry[]>(WEEK_KEY).then((s) => s ?? []),
    redis.get<LeaderboardEntry[]>(DAY_KEY).then((s) => s ?? []),
  ]);

  // All-time: add, sort, keep top 10
  const allTime = [...storedAll, entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES);

  // Weekly: drop stale, add, sort, keep top 10
  const weekly = [...storedWeek.filter((e) => new Date(e.date) >= weekStart), entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES);

  // Daily: drop stale, add, sort, keep top 10
  const daily = [...storedDay.filter((e) => new Date(e.date) >= dayStart), entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES);

  await Promise.all([
    redis.set(KEY, allTime),
    redis.set(WEEK_KEY, weekly),
    redis.set(DAY_KEY, daily),
  ]);

  return { allTime, weekly, daily };
}
