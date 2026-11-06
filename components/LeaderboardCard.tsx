"use client";

import { useState } from "react";
import { display } from "@/lib/fonts";
import type { LeaderboardEntry, Leaderboards } from "@/types";

type BoardKey = keyof Leaderboards;

const TABS: { key: BoardKey; label: string }[] = [
  { key: "daily", label: "Today" },
  { key: "weekly", label: "This week" },
  { key: "allTime", label: "All time" },
];

interface LeaderboardCardProps {
  leaderboard: Leaderboards | null;
  // Shown under the title, e.g. which game the board is for
  subtitle?: string;
  isHighlighted?: (entry: LeaderboardEntry) => boolean;
}

export default function LeaderboardCard({ leaderboard, subtitle, isHighlighted }: LeaderboardCardProps) {
  const [tab, setTab] = useState<BoardKey>("daily");
  const entries = leaderboard?.[tab] ?? [];

  return (
    <div>
      <h2 className={`${display.className} text-xl font-medium text-ink-strong`}>Hall of navigators</h2>
      {subtitle && <p className="text-sm text-ink-muted">{subtitle}</p>}
      <div className="mb-3 mt-2 flex gap-4 text-sm">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-0.5 transition ${
              tab === t.key
                ? "border-b-2 border-atlas-red text-ink-strong"
                : "border-b-2 border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!leaderboard ? (
        <p className="py-6 text-sm text-ink-muted">Loading scores…</p>
      ) : entries.length === 0 ? (
        <p className="py-6 text-sm text-ink-muted">No scores yet. Be the first.</p>
      ) : (
        <ol>
          {entries.map((entry, i) => (
            <li
              key={i}
              className={`flex items-baseline gap-3 border-b border-dotted border-[#cdbb94] px-1 py-1.5 ${
                isHighlighted?.(entry) ? "bg-paper-deep" : ""
              }`}
            >
              <span
                className={`${display.className} w-5 text-right text-sm`}
                style={{ color: i < 3 ? "#b23a2e" : "#7a6a4f" }}
              >
                {i + 1}
              </span>
              <span className="flex-1 truncate">{entry.name}</span>
              <span className={`${display.className} tabular-nums text-ink-strong`}>{entry.score}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
