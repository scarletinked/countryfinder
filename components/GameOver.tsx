"use client";

import { useState, useEffect } from "react";
import type { GameMode, GameRound, LeaderboardEntry, Leaderboards as Boards } from "@/types";
import { MODE_INFO, MODE_LABELS, maxScore } from "@/lib/modes";
import { display } from "@/lib/fonts";
import { recordScore } from "@/lib/personalBest";
import LeaderboardCard from "./LeaderboardCard";

interface GameOverProps {
  mode: GameMode;
  totalScore: number;
  rounds: GameRound[];
  onPlayAgain: () => void;
  onHome: () => void;
}

const MAX_ENTRIES = 10;

// The last name saved to a leaderboard on this device, to prefill next time
const NAME_KEY = "homing-parrot:name";

function readSavedName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

function rememberName(name: string) {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    // Storage blocked (private mode etc.); the name just won't be prefilled
  }
}

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

  // Read after mount so the server render and first client render match
  useEffect(() => {
    setNameInput(readSavedName());
  }, []);

  // Remember this device's best score for the home screen
  useEffect(() => {
    recordScore(mode, totalScore);
  }, [mode, totalScore]);

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
    rememberName(name.slice(0, 30));
  }

  const hits = rounds.filter((r) => r.isCorrect).length;
  const info = MODE_INFO[mode];

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:py-8">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-3 border-b border-rule pb-4">
          <button
            onClick={onHome}
            className="group flex items-center gap-3 py-1 pr-3 text-ink transition hover:text-ink-strong"
          >
            <span className="transition-transform group-hover:-translate-x-1">←</span>
            <img src="/icon.svg" alt="" className="h-8 w-8" />
            <span className={`${display.className} text-lg`}>Contents</span>
          </button>
          <span className="text-sm text-ink-muted">
            <span className={`${display.className} mr-1.5`} style={{ color: info.ink }}>
              {info.numeral}
            </span>
            {MODE_LABELS[mode]}
          </span>
        </header>

        {/* Score */}
        <section className="flex flex-col items-center gap-3 pt-2 text-center">
          <p className="text-xs uppercase tracking-[0.14em] text-ink-muted">Journey&apos;s end</p>
          <p className={`${display.className} text-7xl leading-none text-atlas-red sm:text-8xl`}>
            {totalScore}
          </p>
          <p className="text-ink-muted">
            out of {maxScore(mode)} · {hits} of {rounds.length} found
          </p>
          <div className="mt-1 flex gap-1.5" aria-label="Round results">
            {rounds.map((r) => (
              <span
                key={r.roundNumber}
                title={`${r.targetCountry.name}: ${r.score ?? 0} pts`}
                className={`h-2.5 w-2.5 rounded-full ${
                  r.isCorrect ? "bg-atlas-green" : (r.score ?? 0) > 0 ? "bg-atlas-ochre" : "bg-rule"
                }`}
              />
            ))}
          </div>
        </section>

        {/* Name entry */}
        {qualifies && !savedName && (
          <section className="border border-[#9c8a63] bg-paper-deep p-5 sm:p-6">
            <p className={`${display.className} mb-1 text-lg text-ink-strong`}>
              You made the Hall of navigators!
            </p>
            <p className="mb-4 text-sm text-ink-muted">Add your name to claim your spot.</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Your name"
                maxLength={30}
                className="min-w-0 flex-1 border border-[#9c8a63] bg-paper px-4 py-3 text-ink-strong placeholder-ink-muted outline-none transition focus:border-atlas-red"
                autoFocus
              />
              <button
                type="submit"
                disabled={submitting || !nameInput.trim()}
                className="bg-atlas-red px-6 py-3 font-medium text-paper transition hover:brightness-110 disabled:bg-rule disabled:text-ink-muted"
              >
                {submitting ? "Saving…" : "Save score"}
              </button>
            </form>
            {error && <p className="mt-3 text-sm text-atlas-red">{error}</p>}
          </section>
        )}

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={onPlayAgain}
            className="group inline-flex items-center gap-2 bg-atlas-red px-8 py-3.5 text-lg font-medium text-paper transition hover:brightness-110 active:scale-[0.98]"
          >
            Fly again
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </button>
        </div>

        <section className="border-t border-rule pt-5">
          <LeaderboardCard
            leaderboard={boards}
            isHighlighted={(e) => savedName !== null && e.name === savedName && e.score === totalScore}
          />
        </section>
      </div>
    </div>
  );
}
