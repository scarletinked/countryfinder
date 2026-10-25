import { Redis } from "@upstash/redis";
import { startOfDay, startOfWeek } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import type { GameMode, LeaderboardEntry, Leaderboards } from "@/types";

const redis = Redis.fromEnv();

const MAX_ENTRIES = 10;
const TZ = "America/Los_Angeles";

// Standard keeps the original unprefixed keys so its existing scores carry over
function keysFor(mode: GameMode) {
  const base = mode === "standard" ? "leaderboard" : `${mode}:leaderboard`;
  return { all: base, week: `${base}:week`, day: `${base}:day` };
}

function getDayStart(): Date {
  const zoned = toZonedTime(new Date(), TZ);
  return fromZonedTime(startOfDay(zoned), TZ);
}

function getWeekStart(): Date {
  const zoned = toZonedTime(new Date(), TZ);
  const monday = startOfWeek(zoned, { weekStartsOn: 1 });
  return fromZonedTime(startOfDay(monday), TZ);
}

export async function getLeaderboard(mode: GameMode): Promise<LeaderboardEntry[]> {
  const scores = (await redis.get<LeaderboardEntry[]>(keysFor(mode).all)) ?? [];
  return [...scores].sort((a, b) => b.score - a.score);
}

export async function getWeeklyLeaderboard(mode: GameMode): Promise<LeaderboardEntry[]> {
  const scores = (await redis.get<LeaderboardEntry[]>(keysFor(mode).week)) ?? [];
  const weekStart = getWeekStart();
  return scores
    .filter((e) => new Date(e.date) >= weekStart)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES);
}

export async function getDailyLeaderboard(mode: GameMode): Promise<LeaderboardEntry[]> {
  const scores = (await redis.get<LeaderboardEntry[]>(keysFor(mode).day)) ?? [];
  const dayStart = getDayStart();
  return scores
    .filter((e) => new Date(e.date) >= dayStart)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES);
}

export async function isQualifying(mode: GameMode, score: number): Promise<boolean> {
  if (score <= 0) return false;
  const [allTime, weekly, daily] = await Promise.all([
    getLeaderboard(mode),
    getWeeklyLeaderboard(mode),
    getDailyLeaderboard(mode),
  ]);
  const qualifiesFor = (board: LeaderboardEntry[]) =>
    board.length < MAX_ENTRIES || score > board[board.length - 1].score;
  return qualifiesFor(allTime) || qualifiesFor(weekly) || qualifiesFor(daily);
}

export async function addEntry(mode: GameMode, entry: LeaderboardEntry): Promise<Leaderboards> {
  const weekStart = getWeekStart();
  const dayStart = getDayStart();
  const keys = keysFor(mode);

  const [storedAll, storedWeek, storedDay] = await Promise.all([
    getLeaderboard(mode),
    redis.get<LeaderboardEntry[]>(keys.week).then((s) => s ?? []),
    redis.get<LeaderboardEntry[]>(keys.day).then((s) => s ?? []),
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
    redis.set(keys.all, allTime),
    redis.set(keys.week, weekly),
    redis.set(keys.day, daily),
  ]);

  return { allTime, weekly, daily };
}
