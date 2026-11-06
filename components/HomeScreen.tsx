"use client";

import { useEffect, useMemo, useState } from "react";
import * as d3 from "d3";
import type { CountryFeature, GameMode, Leaderboards } from "@/types";
import { MODES, MODE_INFO, MODE_LABELS } from "@/lib/modes";
import { display } from "@/lib/fonts";
import { getLandmarkPoint } from "@/lib/geo-utils";
import { readBest } from "@/lib/personalBest";
import LeaderboardCard from "./LeaderboardCard";

interface HomeScreenProps {
  countries: CountryFeature[];
  loading: boolean;
  leaderboards: Record<GameMode, Leaderboards> | null;
  onStart: (mode: GameMode) => void;
}

export default function HomeScreen({ countries, loading, leaderboards, onStart }: HomeScreenProps) {
  const [selected, setSelected] = useState<GameMode>("standard");
  const [bests, setBests] = useState<Partial<Record<GameMode, number | null>>>({});

  // Read after mount so the server render and first client render match
  useEffect(() => {
    setBests(Object.fromEntries(MODES.map((m) => [m, readBest(m)])));
  }, []);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <HeroMap countries={countries} />

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-6 sm:px-8 sm:py-8 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] md:gap-10">
        {/* Contents: the four games */}
        <section>
          <h2 className={`${display.className} mb-2 text-xl font-medium text-ink-strong`}>Contents</h2>
          <div role="radiogroup" aria-label="Pick a game" className="border-b border-rule">
            {MODES.map((m) => (
              <Chapter
                key={m}
                mode={m}
                best={bests[m] ?? null}
                selected={selected === m}
                onSelect={() => setSelected(m)}
              />
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <button
              onClick={() => onStart(selected)}
              disabled={loading}
              className="group inline-flex items-center justify-center gap-2 bg-atlas-red px-6 py-3 text-base font-medium text-paper transition hover:brightness-110 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? "Unrolling the maps…" : `Begin chapter ${MODE_INFO[selected].numeral}`}
              {!loading && <span className="transition-transform group-hover:translate-x-1">→</span>}
            </button>
            <span className="text-sm text-ink-muted">100 pts a direct hit, up to 50 if close</span>
          </div>
        </section>

        {/* Leaderboard for the picked game */}
        <section className="border-rule md:border-l md:pl-8">
          <LeaderboardCard
            leaderboard={leaderboards?.[selected] ?? null}
            subtitle={MODE_LABELS[selected]}
          />
        </section>
      </div>
    </div>
  );
}

function Chapter({
  mode,
  best,
  selected,
  onSelect,
}: {
  mode: GameMode;
  best: number | null;
  selected: boolean;
  onSelect: () => void;
}) {
  const info = MODE_INFO[mode];
  return (
    <button
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`grid w-full grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 border-t border-rule px-2 py-3 text-left transition ${
        selected ? "bg-paper-deep" : "hover:bg-paper-deep/50"
      }`}
    >
      <span className={`${display.className} text-xl`} style={{ color: info.ink }}>
        {info.numeral}
      </span>
      <span className="min-w-0">
        <span className={`block font-medium ${selected ? "text-ink-strong" : "text-ink"}`}>
          {MODE_LABELS[mode]}
        </span>
        <span className="block text-sm text-ink-muted">{info.blurb}</span>
      </span>
      <span className="text-right text-xs leading-tight text-ink-muted">
        Your best
        <br />
        <span className={`${display.className} text-base text-ink`}>{best ?? "—"}</span>
      </span>
    </button>
  );
}

// Old-paper world map strip that flies a dotted path to a different country every few seconds
function HeroMap({ countries }: { countries: CountryFeature[] }) {
  const { projection, path, graticule, candidates } = useMemo(() => {
    const projection = d3.geoNaturalEarth1().scale(153).translate([480, 250]);
    const path = d3.geoPath(projection);
    // Big enough to see, and inside the band of latitudes the strip shows
    const candidates = countries.filter((c) => {
      const [, lat] = getLandmarkPoint(c.feature);
      return d3.geoArea(c.feature) > 0.004 && lat > -35 && lat < 48;
    });
    return { projection, path, graticule: path(d3.geoGraticule10()) ?? "", candidates };
  }, [countries]);

  const [stops, setStops] = useState<{ from: CountryFeature | null; to: CountryFeature | null }>({
    from: null,
    to: null,
  });

  useEffect(() => {
    if (candidates.length === 0) return;
    const pick = () => candidates[Math.floor(Math.random() * candidates.length)];
    setStops({ from: null, to: pick() });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setStops((s) => ({ from: s.to, to: pick() })), 3800);
    return () => clearInterval(id);
  }, [candidates]);

  const pinAt = (c: CountryFeature | null) => (c ? projection(getLandmarkPoint(c.feature)) : null);
  const a = pinAt(stops.from);
  const b = pinAt(stops.to);
  const flight =
    a && b
      ? `M${a[0]},${a[1]} Q${(a[0] + b[0]) / 2},${Math.min(a[1], b[1]) - 60} ${b[0]},${b[1]}`
      : null;

  return (
    <div className="relative h-[210px] overflow-hidden border-b border-rule bg-[#dfe9e4] sm:h-[300px]">
      <svg
        viewBox="0 0 960 500"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <path d={graticule} fill="none" stroke="#b8cbc2" strokeWidth={0.6} />
        {countries.map((c) => (
          <path
            key={c.id}
            d={path(c.feature) ?? ""}
            fill={c.id === stops.to?.id ? "#e3a594" : "#e9dcbc"}
            stroke={c.id === stops.to?.id ? "#b23a2e" : "#9c8a63"}
            strokeWidth={0.6}
            className="transition-[fill] duration-700"
          />
        ))}
        {flight && (
          <path
            key={flight}
            d={flight}
            fill="none"
            stroke="#b23a2e"
            strokeWidth={1.6}
            strokeDasharray="5 5"
            className="animate-[fadeIn_.6s_ease]"
          />
        )}
        {b && (
          <g key={stops.to?.id} transform={`translate(${b[0]},${b[1]})`}>
            <circle r={5} fill="none" stroke="#b23a2e" strokeWidth={1.4} className="animate-[pulseRing_1.8s_ease-out_infinite]" />
            <circle r={5} fill="#b23a2e" stroke="#f6efdf" strokeWidth={1.5} />
          </g>
        )}
      </svg>

      {stops.to && (
        <div className="absolute right-3 top-3 border border-[#9c8a63] bg-paper px-3 py-1 text-sm sm:right-5 sm:top-4">
          <span className="text-ink-muted">Find </span>
          <span key={stops.to.id} className={`${display.className} text-atlas-red animate-[fadeIn_.4s_ease]`}>
            {stops.to.name}
          </span>
        </div>
      )}

      <div className="absolute bottom-3 left-3 border border-[#9c8a63] bg-paper/95 px-4 py-3 sm:bottom-5 sm:left-6 sm:px-5">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-ink-muted">
          <img src="/icon.svg" alt="" className="h-5 w-5" />
          A geography game in ten rounds
        </div>
        <h1 className={`${display.className} text-3xl leading-none text-ink-strong sm:text-5xl`}>
          Homing Parrot
        </h1>
      </div>
    </div>
  );
}
