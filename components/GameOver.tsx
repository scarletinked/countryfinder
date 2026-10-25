"use client";

import { useState, useEffect } from "react";
import type { GameMode, GameRound, LeaderboardEntry, Leaderboards as Boards } from "@/types";
import { MODE_LABELS } from "@/lib/modes";
import { display } from "@/lib/fonts";
import LeaderboardCard from "./LeaderboardCard";

interface GameOverProps {
  mode: GameMode;
  totalScore: number;
  rounds: GameRound[];
  onPlayAgain: () => void;
  onHome: () => void;
}

const MAX_ENTRIES = 10;

function qualifiesFor(board: LeaderboardEntry[], score: number): boolean {
  return score > 0 && (board.length < MAX_ENTRIES || score > board[board.length - 1].score);
}

export default function GameOver({ mode, totalScore, rounds, onPlayAgain, onHome }: GameOverProps) {
  const [boards, setBoards] = useState<Boards | null>(null);
  const [qualifies, setQualifies] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [error, setError] = useState("");
  const [savedName, setSavedName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/leaderboard?mode=${mode}`)
      .then((r) => r.json())
      .then((data: Boards) => {
        setBoards(data);
        setQualifies(
          qualifiesFor(data.allTime, totalScore) ||
          qualifiesFor(data.weekly, totalScore) ||
          qualifiesFor(data.daily, totalScore)
        );
      });
  }, [mode, totalScore]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = nameInput.trim();
    if (!name || submitting) return;

    setSubmitting(true);
    setError("");

    const res = await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: totalScore, name, mode }),
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
    setSavedName(name.slice(0, 30));
  }

  const hits = rounds.filter((r) => r.isCorrect).length;
  const isPolly = mode === "polly";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060a13] text-slate-100">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-teal-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[380px] w-[480px] rounded-full bg-amber-400/5 blur-3xl" />

      <div className="relative mx-auto flex max-w-xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:py-8">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-3">
          <button
            onClick={onHome}
            className="group flex items-center gap-3 rounded-full py-1 pr-3 text-slate-300 transition hover:text-white"
          >
            <span className="transition-transform group-hover:-translate-x-1">←</span>
            <img src="/icon.svg" alt="" className="h-8 w-8" />
            <span className={`${display.className} font-bold tracking-tight`}>Home</span>
          </button>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              isPolly
                ? "border-amber-300/30 bg-amber-300/10 text-amber-200"
                : "border-teal-400/25 bg-teal-400/10 text-teal-300"
            }`}
          >
            {MODE_LABELS[mode]}
          </span>
        </header>

        {/* Score */}
        <section className="flex flex-col items-center gap-3 pt-2 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-slate-400">Game over</p>
          <p className={`${display.className} text-7xl font-bold leading-none tracking-tight sm:text-8xl`}>
            <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-amber-300 bg-clip-text text-transparent">
              {totalScore}
            </span>
          </p>
          <p className="text-slate-400">
            out of 1000 · {hits} of {rounds.length} found
          </p>
          <div className="mt-1 flex gap-1.5" aria-label="Round results">
            {rounds.map((r) => (
              <span
                key={r.roundNumber}
                title={`${r.targetCountry.name}: ${r.score ?? 0} pts`}
                className={`h-2.5 w-2.5 rounded-full ${
                  r.isCorrect ? "bg-emerald-400" : (r.score ?? 0) > 0 ? "bg-amber-300" : "bg-white/15"
                }`}
              />
            ))}
          </div>
        </section>

        {/* Name entry */}
        {qualifies && !savedName && (
          <section className="rounded-3xl border border-amber-300/25 bg-amber-300/[0.06] p-5 sm:p-6">
            <p className={`${display.className} mb-1 text-lg font-bold text-amber-200`}>
              You made the leaderboard!
            </p>
            <p className="mb-4 text-sm text-slate-400">Add your name to claim your spot.</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Your name"
                maxLength={30}
                className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none transition focus:border-amber-300/60"
                autoFocus
              />
              <button
                type="submit"
                disabled={submitting || !nameInput.trim()}
                className="rounded-full bg-amber-300 px-6 py-3 font-semibold text-slate-950 transition hover:brightness-110 disabled:bg-white/10 disabled:text-slate-500"
              >
                {submitting ? "Saving…" : "Save score"}
              </button>
            </form>
            {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
          </section>
        )}

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={onPlayAgain}
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 px-8 py-4 text-lg font-semibold text-slate-950 shadow-[0_10px_40px_-10px_rgba(45,212,191,0.6)] transition hover:brightness-110 active:scale-[0.98]"
          >
            Play again
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </button>
        </div>

        <LeaderboardCard
          leaderboard={boards}
          isHighlighted={(e) => savedName !== null && e.name === savedName && e.score === totalScore}
        />
      </div>
    </div>
  );
}
