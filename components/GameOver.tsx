"use client";

import { useState, useEffect } from "react";
import type { LeaderboardEntry } from "@/types";

interface GameOverProps {
  totalScore: number;
  onPlayAgain: () => void;
}

export default function GameOver({ totalScore, onPlayAgain }: GameOverProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [qualifies, setQualifies] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data: { leaderboard: LeaderboardEntry[] }) => {
        setLeaderboard(data.leaderboard);
        const board = data.leaderboard;
        const qualif =
          board.length < 10 || totalScore > board[board.length - 1].score;
        setQualifies(qualif);
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

    setLeaderboard(data.leaderboard);
    setSubmitted(true);
  }

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
            🏆 You made the top 10!
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

      {/* Leaderboard */}
      <div className="bg-slate-800 border border-slate-600 rounded-xl p-6 w-full max-w-sm mb-8">
        <h2 className="text-xl font-bold text-white mb-4 text-center">
          🏅 Top Scores
        </h2>
        {loading ? (
          <p className="text-slate-400 text-center">Loading…</p>
        ) : leaderboard.length === 0 ? (
          <p className="text-slate-400 text-center">No scores yet. You&apos;re first!</p>
        ) : (
          <ol className="space-y-2">
            {leaderboard.map((entry, i) => (
              <li
                key={i}
                className={`flex justify-between items-center px-3 py-2 rounded ${
                  entry.score === totalScore && submitted
                    ? "bg-yellow-500/20 border border-yellow-500/40"
                    : "bg-slate-700"
                }`}
              >
                <span className="text-slate-400 w-6 text-sm">{i + 1}.</span>
                <span className="text-white flex-1 ml-2 truncate">
                  {entry.name}
                </span>
                <span className="text-yellow-400 font-bold">{entry.score}</span>
              </li>
            ))}
          </ol>
        )}
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
