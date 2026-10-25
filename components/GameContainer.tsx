"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useGameState, ROUNDS_PER_GAME } from "@/hooks/useGameState";
import { loadCountries } from "@/lib/countries";
import { pickCountryForTier, HITS_TO_ADVANCE, TIER_LABELS } from "@/lib/difficulty";
import { isPointInCountry, getDistanceMilesToCountry, getCountryCentroid, findCountryAtPoint } from "@/lib/geo-utils";
import { calculateScore } from "@/lib/scoring";
import WorldMap, { type WorldMapHandle } from "./WorldMap";
import GameHUD from "./GameHUD";
import ZoomControls from "./ZoomControls";
import RoundResult from "./RoundResult";
import GameOver from "./GameOver";
import HomeScreen from "./HomeScreen";
import { CAPITALS } from "@/lib/capitals";
import { MODES } from "@/lib/modes";
import type { CountryFeature, GameMode, Leaderboards } from "@/types";

export default function GameContainer() {
  const [state, dispatch] = useGameState();
  const [allCountries, setAllCountries] = useState<CountryFeature[]>([]);
  const [loadingMap, setLoadingMap] = useState(true);
  const [homeLeaderboards, setHomeLeaderboards] = useState<Record<GameMode, Leaderboards> | null>(null);
  const [parrotDestLngLat, setParrotDestLngLat] = useState<[number, number] | null>(null);
  const [clickedCountryName, setClickedCountryName] = useState<string | null>(null);
  const mapRef = useRef<WorldMapHandle>(null);

  // Load country geodata once
  useEffect(() => {
    loadCountries().then((c) => {
      setAllCountries(c);
      setLoadingMap(false);
    });
  }, []);

  // Fetch both modes' leaderboards whenever the home screen is shown
  useEffect(() => {
    if (state.phase !== "home") return;
    Promise.all(
      MODES.map((m) => fetch(`/api/leaderboard?mode=${m}`).then((r) => r.json() as Promise<Leaderboards>))
    ).then(([standard, polly]) => setHomeLeaderboards({ standard, polly }));
  }, [state.phase]);

  // Clear parrot and clicked country when leaving round-result
  useEffect(() => {
    if (state.phase !== "round-result") {
      setParrotDestLngLat(null);
      setClickedCountryName(null);
    }
  }, [state.phase]);

  const startGame = useCallback(
    (mode: GameMode) => {
      dispatch({ type: "START_GAME", mode, country: pickCountryForTier(allCountries, "easy", new Set()) });
    },
    [allCountries, dispatch]
  );

  const handleMarkerPlace = useCallback(
    (lngLat: [number, number]) => {
      if (state.phase !== "playing") return;
      dispatch({ type: "PLACE_MARKER", lngLat });
    },
    [state.phase, dispatch]
  );

  const handleGuess = useCallback(() => {
    if (!state.markerPosition || state.phase !== "playing") return;
    const target = state.rounds[state.currentRound].targetCountry;
    const isCorrect = isPointInCountry(state.markerPosition, target.feature);
    const distanceMiles = isCorrect
      ? 0
      : getDistanceMilesToCountry(state.markerPosition, target.feature);
    const score = calculateScore(distanceMiles, isCorrect);
    if (!isCorrect) {
      const hit = findCountryAtPoint(state.markerPosition, allCountries);
      setClickedCountryName(hit ? hit.name : null);
    }
    setParrotDestLngLat(getCountryCentroid(target.feature));
    dispatch({ type: "SUBMIT_GUESS", isCorrect, distanceMiles, score });
  }, [state, dispatch, allCountries]);

  const handleNextRound = useCallback(() => {
    const used = new Set(state.rounds.map((r) => r.targetCountry.id));
    const country = pickCountryForTier(allCountries, state.tier, used);
    mapRef.current?.zoomReset();
    setTimeout(() => dispatch({ type: "NEXT_ROUND", country }), 600);
  }, [state.rounds, state.tier, allCountries, dispatch]);


  const handleReturnToMenu = useCallback(() => {
    if (window.confirm("Return to main menu? Your current game will be lost.")) {
      dispatch({ type: "RESET_GAME" });
    }
  }, [dispatch]);

  // ── Home screen ──────────────────────────────────────────
  if (state.phase === "home") {
    return (
      <HomeScreen
        countries={allCountries}
        loading={loadingMap}
        leaderboards={homeLeaderboards}
        onStart={startGame}
      />
    );
  }

  // ── Game Over ─────────────────────────────────────────────
  if (state.phase === "game-over") {
    return (
      <GameOver
        mode={state.mode}
        totalScore={state.totalScore}
        onPlayAgain={() => startGame(state.mode)}
      />
    );
  }

  // ── Playing / Round Result ────────────────────────────────
  const currentRound = state.rounds[state.currentRound];
  const isResult = state.phase === "round-result";
  const capital = state.mode === "polly" ? CAPITALS[currentRound.targetCountry.name] : null;

  return (
    <div className="flex flex-col h-dvh bg-slate-900">
      <GameHUD
        prompt={capital ? `Find ${capital}'s country` : currentRound.targetCountry.name}
        currentRound={state.currentRound + 1}
        totalRounds={ROUNDS_PER_GAME}
        totalScore={state.totalScore}
        tier={currentRound.tier}
        streak={currentRound.tier !== state.tier ? HITS_TO_ADVANCE : state.streak}
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
            capital={capital}
            clickedCountryName={clickedCountryName}
            levelUpTo={currentRound.tier !== state.tier ? TIER_LABELS[state.tier] : null}
            onNext={handleNextRound}
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
