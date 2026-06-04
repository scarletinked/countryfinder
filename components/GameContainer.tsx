"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useGameState, ROUNDS_PER_GAME } from "@/hooks/useGameState";
import { loadCountries, pickRandomCountries } from "@/lib/countries";
import { isPointInCountry, getDistanceMilesToCountry, getCountryCentroid } from "@/lib/geo-utils";
import { calculateScore } from "@/lib/scoring";
import WorldMap, { type WorldMapHandle } from "./WorldMap";
import GameHUD from "./GameHUD";
import ZoomControls from "./ZoomControls";
import RoundResult from "./RoundResult";
import GameOver from "./GameOver";
import type { CountryFeature, LeaderboardEntry } from "@/types";

const RESULT_MS = 2500;

export default function GameContainer() {
  const [state, dispatch] = useGameState();
  const [allCountries, setAllCountries] = useState<CountryFeature[]>([]);
  const [loadingMap, setLoadingMap] = useState(true);
  const [homeLeaderboard, setHomeLeaderboard] = useState<{
    allTime: LeaderboardEntry[];
    weekly: LeaderboardEntry[];
    daily: LeaderboardEntry[];
  } | null>(null);
  const [parrotDestLngLat, setParrotDestLngLat] = useState<[number, number] | null>(null);
  const mapRef = useRef<WorldMapHandle>(null);

  // Load country geodata once
  useEffect(() => {
    loadCountries().then((c) => {
      setAllCountries(c);
      setLoadingMap(false);
    });
  }, []);

  // Fetch leaderboard whenever the home screen is shown
  useEffect(() => {
    if (state.phase !== "home") return;
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data: { allTime: LeaderboardEntry[]; weekly: LeaderboardEntry[]; daily: LeaderboardEntry[] }) =>
        setHomeLeaderboard(data)
      );
  }, [state.phase]);

  // Auto-advance after round result
  useEffect(() => {
    if (state.phase !== "round-result") return;
    const t = setTimeout(() => dispatch({ type: "NEXT_ROUND" }), RESULT_MS);
    return () => clearTimeout(t);
  }, [state.phase, dispatch]);

  // Clear parrot when leaving round-result
  useEffect(() => {
    if (state.phase !== "round-result") setParrotDestLngLat(null);
  }, [state.phase]);

  const startGame = useCallback(
    (countries: CountryFeature[]) => {
      dispatch({ type: "START_GAME", countries });
    },
    [dispatch]
  );

  const handleStart = useCallback(() => {
    startGame(pickRandomCountries(allCountries, ROUNDS_PER_GAME));
  }, [allCountries, startGame]);

  const handleMarkerPlace = useCallback(
    (lngLat: [number, number]) => {
      if (state.phase !== "playing") return;
      dispatch({ type: "PLACE_MARKER", lngLat });
    },
    [state.phase, dispatch]
  );

  const handleGuess = useCallback(() => {
    if (!state.markerPosition || state.phase !== "playing") return;
    const target = state.countries[state.currentRound];
    const isCorrect = isPointInCountry(state.markerPosition, target.feature);
    const distanceMiles = isCorrect
      ? 0
      : getDistanceMilesToCountry(state.markerPosition, target.feature);
    const score = calculateScore(distanceMiles, isCorrect);
    setParrotDestLngLat(getCountryCentroid(target.feature));
    dispatch({ type: "SUBMIT_GUESS", isCorrect, distanceMiles, score });
  }, [state, dispatch]);

  const handlePlayAgain = useCallback(() => {
    startGame(pickRandomCountries(allCountries, ROUNDS_PER_GAME));
  }, [allCountries, startGame]);

  const handleReturnToMenu = useCallback(() => {
    if (window.confirm("Return to main menu? Your current game will be lost.")) {
      dispatch({ type: "RESET_GAME" });
    }
  }, [dispatch]);

  // ── Home screen ──────────────────────────────────────────
  if (state.phase === "home") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 gap-6 px-4 py-10">
        <img src="/logo.svg" alt="Homing Parrot" className="w-80" />
        <p className="text-yellow-400 text-lg italic text-center">
          It&apos;s like a Homing Pigeon, except prettier.
        </p>
        <p className="text-slate-400 text-base text-center max-w-md">
          10 rounds. Find each country on the map. Score up to 100 pts for a
          direct hit, or up to 50 pts based on how close you get.
        </p>
        {loadingMap ? (
          <p className="text-slate-500">Loading map data…</p>
        ) : (
          <button
            onClick={handleStart}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-10 py-4 rounded-xl text-xl transition-colors shadow-lg"
          >
            Start Game
          </button>
        )}
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-3xl">
          {(
            [
              { label: "☀️ Today", entries: homeLeaderboard?.daily ?? [] },
              { label: "📅 This Week", entries: homeLeaderboard?.weekly ?? [] },
              { label: "🏅 All Time", entries: homeLeaderboard?.allTime ?? [] },
            ] as { label: string; entries: LeaderboardEntry[] }[]
          ).map(({ label, entries }) => (
            <div
              key={label}
              className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex-1"
            >
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">
                {label}
              </h2>
              {entries.length === 0 ? (
                <p className="text-slate-500 text-xs text-center">No scores yet</p>
              ) : (
                <ol className="space-y-1">
                  {entries.map((entry, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-slate-500 w-4 text-right text-xs">{i + 1}.</span>
                      <span className="text-white flex-1 truncate">{entry.name}</span>
                      <span className="text-yellow-400 font-bold">{entry.score}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Game Over ─────────────────────────────────────────────
  if (state.phase === "game-over") {
    return (
      <GameOver totalScore={state.totalScore} onPlayAgain={handlePlayAgain} />
    );
  }

  // ── Playing / Round Result ────────────────────────────────
  const currentRound = state.rounds[state.currentRound];
  const isResult = state.phase === "round-result";

  return (
    <div className="flex flex-col h-dvh bg-slate-900">
      <GameHUD
        countryName={currentRound.targetCountry.name}
        currentRound={state.currentRound + 1}
        totalRounds={ROUNDS_PER_GAME}
        totalScore={state.totalScore}
      />

      <div className="relative flex-1 overflow-hidden">
        <WorldMap
          ref={mapRef}
          features={allCountries}
          markerPosition={state.markerPosition}
          highlightId={isResult ? currentRound.targetCountry.id : null}
          onMarkerPlace={handleMarkerPlace}
          parrotDestLngLat={parrotDestLngLat}
        />

        <ZoomControls
          onZoomIn={() => mapRef.current?.zoomIn()}
          onZoomOut={() => mapRef.current?.zoomOut()}
        />

        {isResult && currentRound.score !== null && (
          <RoundResult
            isCorrect={currentRound.isCorrect ?? false}
            score={currentRound.score}
            distanceMiles={currentRound.distanceMiles ?? 0}
            countryName={currentRound.targetCountry.name}
          />
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center gap-2 px-3 py-3 bg-slate-800 border-t border-slate-700 flex-shrink-0">
        <button
          onClick={handleGuess}
          disabled={!state.markerPosition || isResult}
          className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-lg text-base sm:text-lg transition-colors"
        >
          {state.markerPosition ? "Guess!" : "Tap the map to place your guess"}
        </button>
        <button
          onClick={handleReturnToMenu}
          className="text-slate-400 hover:text-white text-sm transition-colors px-2 py-1 whitespace-nowrap flex-shrink-0"
        >
          Menu
        </button>
      </div>
    </div>
  );
}
