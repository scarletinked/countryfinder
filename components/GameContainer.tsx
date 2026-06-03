"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useGameState, ROUNDS_PER_GAME } from "@/hooks/useGameState";
import { loadCountries, pickRandomCountries } from "@/lib/countries";
import { isPointInCountry, getDistanceMilesToCountry } from "@/lib/geo-utils";
import { calculateScore } from "@/lib/scoring";
import WorldMap, { type WorldMapHandle } from "./WorldMap";
import GameHUD from "./GameHUD";
import ZoomControls from "./ZoomControls";
import RoundResult from "./RoundResult";
import GameOver from "./GameOver";
import type { CountryFeature } from "@/types";

const RESULT_MS = 2500;

export default function GameContainer() {
  const [state, dispatch] = useGameState();
  const [allCountries, setAllCountries] = useState<CountryFeature[]>([]);
  const [loadingMap, setLoadingMap] = useState(true);
  const mapRef = useRef<WorldMapHandle>(null);

  // Load country geodata once
  useEffect(() => {
    loadCountries().then((c) => {
      setAllCountries(c);
      setLoadingMap(false);
    });
  }, []);

  // Auto-advance after round result
  useEffect(() => {
    if (state.phase !== "round-result") return;
    const t = setTimeout(() => dispatch({ type: "NEXT_ROUND" }), RESULT_MS);
    return () => clearTimeout(t);
  }, [state.phase, dispatch]);

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
    dispatch({ type: "SUBMIT_GUESS", isCorrect, distanceMiles, score });
  }, [state, dispatch]);

  const handlePlayAgain = useCallback(() => {
    startGame(pickRandomCountries(allCountries, ROUNDS_PER_GAME));
  }, [allCountries, startGame]);

  // ── Home screen ──────────────────────────────────────────
  if (state.phase === "home") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 gap-6 px-4">
        <h1 className="text-5xl font-bold text-white">🦜 Homing Parrot</h1>
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
    <div className="flex flex-col h-screen bg-slate-900">
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

      {/* Guess button */}
      <div className="flex justify-center px-4 py-3 bg-slate-800 border-t border-slate-700 flex-shrink-0">
        <button
          onClick={handleGuess}
          disabled={!state.markerPosition || isResult}
          className="bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold px-12 py-3 rounded-lg text-lg transition-colors"
        >
          {state.markerPosition ? "Guess!" : "Click the map to place your guess"}
        </button>
      </div>
    </div>
  );
}
