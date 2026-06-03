"use client";

import { useState, useEffect } from "react";
import type { LeaderboardEntry } from "@/types";

interface Boards {
  allTime: LeaderboardEntry[];
  weekly: LeaderboardEntry[];
  daily: LeaderboardEntry[];
}

interface GameOverProps {
  totalScore: number;
  onPlayAgain: () => void;
}

const MAX_ENTRIES = 10;

function qualifiesFor(board: LeaderboardEntry[], score: number): boolean {
  return board.length < MAX_ENTRIES || score > board[board.length - 1].score;
}

export default function GameOver({ totalScore, onPlayAgain }: GameOverProps) {
  const [boards, setBoards] = useState<Boards>({ allTime: [], weekly: [], daily: [] });
  const [qualifies, setQualifies] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data: Boards) => {
        setBoards(data);
        setQualifies(
          qualifiesFor(data.allTime, totalScore) ||
          qualifiesFor(data.weekly, totalScore) ||
          qualifiesFor(data.daily, totalScore)
        );
        setLoading(false);
      });
  }, [totalScore]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = nameInput.trim();
    if (!name || submitting) return;

    setSubmitting(true);
    setError("");

    const res = await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: totalScore, name }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(
        data.error === "profanity"
          ? "Please choose an appropriate name."
          : "Something went wrong. Please try again."
      );
      return;
    }

    setBoards(data);
    setSubmitted(true);
  }

  const sections: { label: string; entries: LeaderboardEntry[] }[] = [
    { label: "☀️ Today", entries: boards.daily },
    { label: "📅 This Week", entries: boards.weekly },
    { label: "🏅 All Time", entries: boards.allTime },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 px-4 py-8">
      <h1 className="text-4xl font-bold text-white mb-2">Game Over</h1>
      <p className="text-2xl text-yellow-400 font-bold mb-8">
        Your score: {totalScore} / 1000
      </p>

      {/* Name entry */}
      {qualifies && !submitted && !loading && (
        <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 mb-8 w-full max-w-sm">
          <p className="text-green-400 font-bold text-lg mb-3 text-center">
            🏆 You made the leaderboard!
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Enter your name"
              maxLength={30}
              className="bg-slate-700 border border-slate-500 text-white rounded px-3 py-2 placeholder-slate-400 focus:outline-none focus:border-yellow-400"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={submitting || !nameInput.trim()}
              className="bg-yellow-500 hover:bg-yellow-400 disabled:bg-slate-600 disabled:text-slate-400 text-slate-900 font-bold py-2 rounded transition-colors"
            >
              {submitting ? "Saving…" : "Save Score"}
            </button>
          </form>
        </div>
      )}

      {/* Leaderboards */}
      <div className="flex flex-col md:flex-row gap-4 w-full max-w-3xl mb-8">
        {sections.map(({ label, entries }) => (
          <div
            key={label}
            className="bg-slate-800 border border-slate-600 rounded-xl p-4 flex-1"
          >
            <h2 className="text-sm font-bold text-white mb-3 text-center">{label}</h2>
            {loading ? (
              <p className="text-slate-400 text-center text-sm">Loading…</p>
            ) : entries.length === 0 ? (
              <p className="text-slate-400 text-center text-sm">No scores yet</p>
            ) : (
              <ol className="space-y-1">
                {entries.map((entry, i) => (
                  <li
                    key={i}
                    className={`flex items-center gap-2 px-2 py-1 rounded text-sm ${
                      entry.score === totalScore && submitted
                        ? "bg-yellow-500/20 border border-yellow-500/40"
                        : ""
                    }`}
                  >
                    <span className="text-slate-400 w-5 text-xs">{i + 1}.</span>
                    <span className="text-white flex-1 truncate">{entry.name}</span>
                    <span className="text-yellow-400 font-bold">{entry.score}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onPlayAgain}
        className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-lg text-lg transition-colors"
      >
        Play Again
      </button>
    </div>
  );
}
