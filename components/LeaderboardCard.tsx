"use client";

import { useState, type ReactNode } from "react";
import { display } from "@/lib/fonts";
import type { LeaderboardEntry, Leaderboards } from "@/types";

type BoardKey = keyof Leaderboards;

const TABS: { key: BoardKey; label: string }[] = [
  { key: "daily", label: "Today" },
  { key: "weekly", label: "This week" },
  { key: "allTime", label: "All time" },
];

const MEDALS = ["#f5c84c", "#cbd5e1", "#d4925a"];

interface LeaderboardCardProps {
  leaderboard: Leaderboards | null;
  // Rendered above the title, e.g. a mode switch
  header?: ReactNode;
  isHighlighted?: (entry: LeaderboardEntry) => boolean;
}

export default function LeaderboardCard({ leaderboard, header, isHighlighted }: LeaderboardCardProps) {
  const [tab, setTab] = useState<BoardKey>("daily");
  const entries = leaderboard?.[tab] ?? [];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl sm:p-6">
      {header}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className={`${display.className} text-xl font-bold`}>Leaderboard</h2>
        <div className="flex rounded-full bg-white/5 p-1 text-xs sm:text-sm">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 font-medium transition ${
                tab === t.key ? "bg-white text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {!leaderboard ? (
        <p className="py-8 text-center text-sm text-slate-500">Loading scores…</p>
      ) : entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No scores yet. Be the first.</p>
      ) : (
        <ol className="flex flex-col gap-1">
          {entries.map((entry, i) => (
            <li
              key={i}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                isHighlighted?.(entry)
                  ? "bg-teal-400/10 ring-1 ring-teal-400/40"
                  : "hover:bg-white/5"
              }`}
            >
              <span
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={
                  i < 3
                    ? { background: MEDALS[i], color: "#0f172a" }
                    : { background: "rgba(255,255,255,0.06)", color: "#94a3b8" }
                }
              >
                {i + 1}
              </span>
              <span className="flex-1 truncate">{entry.name}</span>
              <span className={`${display.className} font-bold tabular-nums text-teal-300`}>
                {entry.score}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
