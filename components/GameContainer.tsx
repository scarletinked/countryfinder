"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useGameState } from "@/hooks/useGameState";
import { loadCountries } from "@/lib/countries";
import { loadStates } from "@/lib/states";
import { loadProvinces } from "@/lib/provinces";
import { pickAny, pickCountryForTier, HITS_TO_ADVANCE, TIER_LABELS } from "@/lib/difficulty";
import { getDistanceMilesToCountry, getLandmarkPoint, possessive } from "@/lib/geo-utils";
import { calculateScore } from "@/lib/scoring";
import WorldMap, { type WorldMapHandle } from "./WorldMap";
import GameHUD from "./GameHUD";
import ZoomControls from "./ZoomControls";
import RoundResult from "./RoundResult";
import GameOver from "./GameOver";
import HomeScreen from "./HomeScreen";
import { CAPITALS } from "@/lib/capitals";
import { STATE_CAPITALS } from "@/lib/stateCapitals";
import { PROVINCE_CAPITALS, TERRITORIES } from "@/lib/provinceCapitals";
import { MODES, MODE_INFO } from "@/lib/modes";
import type { CountryFeature, GameMode, Leaderboards, MapKind, Tier } from "@/types";

// How far outside the target's outline, in on-screen pixels, a guess still counts as a hit
const TAP_TOLERANCE_PX = 6;

const CAPITALS_BY_MAP: Record<MapKind, Record<string, string>> = {
  world: CAPITALS,
  us: STATE_CAPITALS,
  ca: PROVINCE_CAPITALS,
};

export default function GameContainer() {
  const [state, dispatch] = useGameState();
  const [allCountries, setAllCountries] = useState<CountryFeature[]>([]);
  const [allStates, setAllStates] = useState<CountryFeature[]>([]);
  const [allProvinces, setAllProvinces] = useState<CountryFeature[]>([]);
  const [loadingMap, setLoadingMap] = useState(true);
  const [homeLeaderboards, setHomeLeaderboards] = useState<Record<GameMode, Leaderboards> | null>(null);
  const [parrotDestLngLat, setParrotDestLngLat] = useState<[number, number] | null>(null);
  const [clickedCountryName, setClickedCountryName] = useState<string | null>(null);
  const mapRef = useRef<WorldMapHandle>(null);

  // Load country, state and province geodata once
  useEffect(() => {
    Promise.all([loadCountries(), loadStates(), loadProvinces()]).then(([c, s, p]) => {
      setAllCountries(c);
      setAllStates(s);
      setAllProvinces(p);
      setLoadingMap(false);
    });
  }, []);

  // Fetch every mode's leaderboards whenever the home screen is shown
  useEffect(() => {
    if (state.phase !== "home") return;
    Promise.all(
      MODES.map((m) => fetch(`/api/leaderboard?mode=${m}`).then((r) => r.json() as Promise<Leaderboards>))
    ).then((boards) =>
      setHomeLeaderboards(Object.fromEntries(MODES.map((m, i) => [m, boards[i]])) as Record<GameMode, Leaderboards>)
    );
  }, [state.phase]);

  const mode = MODE_INFO[state.mode];
  // Everything drawn on the map, and the places a round can ask about
  // (DC and the Canadian territories are drawn but never asked)
  const featuresFor = useCallback(
    (map: MapKind) => ({ world: allCountries, us: allStates, ca: allProvinces })[map],
    [allCountries, allStates, allProvinces]
  );
  const mapFeatures = featuresFor(mode.map);
  const targetsFor = useCallback(
    (m: GameMode) => {
      const { map } = MODE_INFO[m];
      const capitals = CAPITALS_BY_MAP[map];
      return map === "world" ? allCountries : featuresFor(map).filter((p) => capitals[p.name]);
    },
    [allCountries, featuresFor]
  );
  const pickTarget = useCallback(
    (m: GameMode, tier: Tier, used: Set<number>) =>
      MODE_INFO[m].tiers
        ? pickCountryForTier(targetsFor(m), tier, used)
        : pickAny(targetsFor(m), used),
    [targetsFor]
  );

  // Clear parrot and clicked country when leaving round-result
  useEffect(() => {
    if (state.phase !== "round-result") {
      setParrotDestLngLat(null);
      setClickedCountryName(null);
    }
  }, [state.phase]);

  const startGame = useCallback(
    (m: GameMode) => {
      dispatch({ type: "START_GAME", mode: m, country: pickTarget(m, "easy", new Set()) });
    },
    [pickTarget, dispatch]
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
    // Judge only by the shapes as drawn, so the result always matches what the player sees
    const drawnIds = mapRef.current?.countryIdsAt(state.markerPosition) ?? [];
    const hit = mapFeatures.find((c) => c.id === drawnIds.find((id) => id !== target.id)) ?? null;
    // A tap on sea just outside the target still counts; a tap inside a different country never does
    const isCorrect =
      drawnIds.includes(target.id) ||
      (drawnIds.length === 0 &&
        (mapRef.current?.screenDistancePx(state.markerPosition, target.feature) ?? Infinity) <=
          TAP_TOLERANCE_PX);
    const distanceMiles = isCorrect
      ? 0
      : getDistanceMilesToCountry(state.markerPosition, target.feature);
    const score = calculateScore(distanceMiles, isCorrect);
    if (!isCorrect) {
      setClickedCountryName(hit ? hit.name : null);
    }
    setParrotDestLngLat(getLandmarkPoint(target.feature));
    dispatch({ type: "SUBMIT_GUESS", isCorrect, distanceMiles, score });
  }, [state, dispatch, mapFeatures]);

  // Set while the delayed advance is pending, so extra clicks on "Next" do nothing
  const advancingRef = useRef(false);
  useEffect(() => {
    if (state.phase === "round-result") advancingRef.current = false;
  }, [state.phase]);

  const handleNextRound = useCallback(() => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    const used = new Set(state.rounds.map((r) => r.targetCountry.id));
    const country = pickTarget(state.mode, state.tier, used);
    mapRef.current?.zoomReset();
    setTimeout(() => dispatch({ type: "NEXT_ROUND", country }), 600);
  }, [state.rounds, state.mode, state.tier, pickTarget, dispatch]);


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
        rounds={state.rounds}
        onPlayAgain={() => startGame(state.mode)}
        onHome={() => dispatch({ type: "RESET_GAME" })}
      />
    );
  }

  // ── Playing / Round Result ────────────────────────────────
  const currentRound = state.rounds[state.currentRound];
  const isResult = state.phase === "round-result";
  const targetName = currentRound.targetCountry.name;
  const capital = mode.capitals
    ? CAPITALS_BY_MAP[mode.map][targetName]
    : null;
  const leveledUp = mode.tiers && currentRound.tier !== state.tier;
  // Canada mixes provinces and territories, so name each one right
  const noun = TERRITORIES.has(targetName) && mode.map === "ca" ? "territory" : mode.noun;

  return (
    <div className="flex flex-col h-dvh bg-paper">
      <GameHUD
        prompt={capital ? `Find ${possessive(capital)} ${noun}` : targetName}
        currentRound={state.currentRound + 1}
        totalRounds={mode.rounds}
        totalScore={state.totalScore}
        tier={mode.tiers ? currentRound.tier : null}
        streak={leveledUp ? HITS_TO_ADVANCE : state.streak}
      />

      <div className="relative flex-1 overflow-hidden">
        <WorldMap
          ref={mapRef}
          features={mapFeatures}
          map={mode.map}
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
            countryName={targetName}
            capital={capital}
            clickedCountryName={clickedCountryName}
            levelUpTo={leveledUp ? TIER_LABELS[state.tier] : null}
            noun={noun}
            nextNoun={mode.map === "ca" ? "one" : mode.noun}
            onNext={handleNextRound}
          />
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center gap-2 px-3 py-3 bg-paper border-t border-rule flex-shrink-0">
        <button
          onClick={handleGuess}
          disabled={!state.markerPosition || isResult}
          className="flex-1 bg-atlas-red hover:brightness-110 disabled:bg-paper-deep disabled:text-ink-muted disabled:hover:brightness-100 text-paper font-medium py-3 text-base sm:text-lg transition"
        >
          {state.markerPosition ? "Guess!" : "Tap the map to place your guess"}
        </button>
        <button
          onClick={handleReturnToMenu}
          className="text-ink-muted hover:text-ink-strong text-sm transition-colors px-2 py-1 whitespace-nowrap flex-shrink-0"
        >
          Menu
        </button>
      </div>
    </div>
  );
}
