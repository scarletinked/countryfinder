import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getLeaderboard, getWeeklyLeaderboard, getDailyLeaderboard, addEntry } from "@/lib/leaderboard";
import { isProfane } from "@/lib/profanity";
import { isGameMode } from "@/lib/modes";

export async function GET(req: NextRequest) {
  const param = req.nextUrl.searchParams.get("mode") ?? "standard";
  if (!isGameMode(param)) {
    return NextResponse.json({ error: "invalid_mode" }, { status: 400 });
  }

  const [allTime, weekly, daily] = await Promise.all([
    getLeaderboard(param),
    getWeeklyLeaderboard(param),
    getDailyLeaderboard(param),
  ]);
  return NextResponse.json({ allTime, weekly, daily });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const { name, score, mode = "standard" } = body as { name?: unknown; score?: unknown; mode?: unknown };

  if (!isGameMode(mode)) {
    return NextResponse.json({ error: "invalid_mode" }, { status: 400 });
  }

  if (typeof score !== "number" || !isFinite(score) || score <= 0 || score > 1000) {
    return NextResponse.json({ error: "invalid_score" }, { status: 400 });
  }

  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "invalid_name" }, { status: 400 });
  }

  const trimmed = name.trim().slice(0, 30);

  if (isProfane(trimmed)) {
    return NextResponse.json({ error: "profanity" }, { status: 400 });
  }

  const { allTime, weekly, daily } = await addEntry(mode, {
    name: trimmed,
    score: Math.round(score),
    date: new Date().toISOString(),
  });

  return NextResponse.json({ allTime, weekly, daily });
}
