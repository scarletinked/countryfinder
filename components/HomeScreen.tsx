"use client";

import { useEffect, useRef, useState } from "react";
import { Space_Grotesk } from "next/font/google";
import * as d3 from "d3";
import type { CountryFeature, GameMode, Leaderboards } from "@/types";
import { MODES, MODE_LABELS } from "@/lib/modes";

const display = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"] });

type BoardKey = keyof Leaderboards;

const TABS: { key: BoardKey; label: string }[] = [
  { key: "daily", label: "Today" },
  { key: "weekly", label: "This week" },
  { key: "allTime", label: "All time" },
];

const MEDALS = ["#f5c84c", "#cbd5e1", "#d4925a"];

interface HomeScreenProps {
  countries: CountryFeature[];
  loading: boolean;
  leaderboards: Record<GameMode, Leaderboards> | null;
  onStart: (mode: GameMode) => void;
}

export default function HomeScreen({ countries, loading, leaderboards, onStart }: HomeScreenProps) {
  const [tab, setTab] = useState<BoardKey>("daily");
  const [boardMode, setBoardMode] = useState<GameMode>("standard");
  const [featured, setFeatured] = useState<string | null>(null);
  const leaderboard = leaderboards?.[boardMode] ?? null;
  const entries = leaderboard?.[tab] ?? [];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060a13] text-slate-100">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-teal-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[380px] w-[480px] rounded-full bg-amber-400/5 blur-3xl" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:gap-12 sm:px-8 sm:py-8 lg:py-14">
        {/* Top bar */}
        <header className="flex items-center gap-3">
          <img src="/icon.svg" alt="" className="h-9 w-9" />
          <span className={`${display.className} text-lg font-bold tracking-tight`}>
            Homing Parrot
          </span>
        </header>

        {/* Hero */}
        <section className="grid items-center gap-6 sm:gap-10 lg:grid-cols-[1.05fr_1fr]">
          <div className="order-2 flex flex-col gap-4 sm:gap-6 lg:order-1">
            <span className="w-fit rounded-full border border-teal-400/25 bg-teal-400/10 px-3 py-1 text-xs font-medium text-teal-300">
              A geography game · 10 rounds
            </span>
            <h1
              className={`${display.className} text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl`}
            >
              Know where
              <br />
              <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-amber-300 bg-clip-text text-transparent">
                in the world
              </span>
              <br />
              you are.
            </h1>
            <p className="max-w-md text-base text-slate-400 sm:text-lg">
              It&apos;s like a Homing Pigeon, except prettier. We name a country, you drop a
              pin on the map.
            </p>

            <div className="flex flex-wrap gap-2 text-sm">
              <Stat value="100" label="pts for a direct hit" />
              <Stat value="50" label="pts max if you're close" />
              <Stat value="2" label="in a row to level up" />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onStart("standard")}
                disabled={loading}
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 px-8 py-4 text-lg font-semibold text-slate-950 shadow-[0_10px_40px_-10px_rgba(45,212,191,0.6)] transition hover:brightness-110 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
              >
                {loading ? "Loading map…" : "Play Standard"}
                {!loading && (
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                )}
              </button>
              <button
                onClick={() => onStart("polly")}
                disabled={loading}
                className="group flex items-center gap-4 rounded-2xl border border-amber-300/30 bg-amber-300/5 px-5 py-2.5 text-left transition hover:border-amber-300/60 hover:bg-amber-300/10 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
              >
                <span className="flex flex-col items-start">
                  <span className="flex items-center gap-2 font-semibold text-amber-200">
                    {MODE_LABELS.polly}
                    <span className="rounded-full bg-amber-300/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      Harder
                    </span>
                  </span>
                  <span className="text-xs text-slate-400">Find the country from its capital</span>
                </span>
                {!loading && (
                  <span className="text-lg text-amber-200 transition-transform group-hover:translate-x-1">→</span>
                )}
              </button>
            </div>
          </div>

          <div className="relative order-1 mx-auto aspect-square w-full max-w-[220px] sm:max-w-[420px] lg:order-2 lg:max-w-[500px]">
            <Globe countries={countries} onFeature={setFeatured} />
            {featured && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-slate-900/70 px-4 py-1.5 text-sm backdrop-blur-md">
                <span className="text-slate-400">Find </span>
                <span key={featured} className="font-semibold text-amber-300 animate-[fadeIn_.4s_ease]">
                  {featured}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Leaderboard */}
        <section className="mx-auto w-full max-w-xl">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl sm:p-6">
            <div className="mb-4 flex rounded-xl bg-white/5 p-1 text-sm">
              {MODES.map((m) => (
                <button
                  key={m}
                  onClick={() => setBoardMode(m)}
                  className={`flex-1 rounded-lg px-3 py-1.5 font-medium transition ${
                    boardMode === m
                      ? m === "polly"
                        ? "bg-amber-300/15 text-amber-200"
                        : "bg-teal-400/15 text-teal-200"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className={`${display.className} text-xl font-bold`}>Leaderboard</h2>
              <div className="flex rounded-full bg-white/5 p-1 text-xs sm:text-sm">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`whitespace-nowrap rounded-full px-3 py-1.5 font-medium transition ${
                      tab === t.key ? "bg-white text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {!leaderboard ? (
              <p className="py-8 text-center text-sm text-slate-500">Loading scores…</p>
            ) : entries.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No scores yet. Be the first.
              </p>
            ) : (
              <ol className="flex flex-col gap-1">
                {entries.map((entry, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/5"
                  >
                    <span
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={
                        i < 3
                          ? { background: MEDALS[i], color: "#0f172a" }
                          : { background: "rgba(255,255,255,0.06)", color: "#94a3b8" }
                      }
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate">{entry.name}</span>
                    <span className={`${display.className} font-bold tabular-nums text-teal-300`}>
                      {entry.score}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <span className={`${display.className} font-bold text-white`}>{value}</span>
      <span className="text-slate-400">{label}</span>
    </div>
  );
}

// Slowly spinning globe that turns to face a different country every few seconds
function Globe({
  countries,
  onFeature,
}: {
  countries: CountryFeature[];
  onFeature: (name: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || countries.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const candidates = countries.filter((c) => d3.geoArea(c.feature) > 0.004);
    const projection = d3.geoOrthographic().clipAngle(90).precision(0.5);
    const path = d3.geoPath(projection, ctx);
    const graticule = d3.geoGraticule10();
    const sphere = { type: "Sphere" } as d3.GeoPermissibleObjects;

    let size = 0;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      size = canvas.clientWidth;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      projection.scale(size / 2 - 8).translate([size / 2, size / 2]);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let rotation: [number, number] = [0, -15];
    let target: CountryFeature | null = null;
    let from = rotation;
    let to = rotation;
    let tweenStart = 0;
    const TWEEN_MS = 1600;

    const pickNext = (now: number) => {
      target = candidates[Math.floor(Math.random() * candidates.length)];
      const [lng, lat] = d3.geoCentroid(target.feature);
      from = rotation;
      // Take the short way round
      let dLng = -lng - from[0];
      dLng = ((dLng + 540) % 360) - 180;
      to = [from[0] + dLng, Math.max(-35, Math.min(35, -lat))];
      tweenStart = now;
      onFeature(target.name);
    };

    const draw = (now: number) => {
      const t = Math.min(1, (now - tweenStart) / TWEEN_MS);
      const e = d3.easeCubicInOut(t);
      rotation = [from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e];
      projection.rotate(rotation);

      ctx.clearRect(0, 0, size, size);
      const r = projection.scale();
      const cx = size / 2;

      // Ocean
      const ocean = ctx.createRadialGradient(cx - r * 0.35, cx - r * 0.4, r * 0.1, cx, cx, r);
      ocean.addColorStop(0, "#14304a");
      ocean.addColorStop(1, "#070f1c");
      ctx.beginPath();
      path(sphere);
      ctx.fillStyle = ocean;
      ctx.fill();

      // Grid
      ctx.beginPath();
      path(graticule);
      ctx.strokeStyle = "rgba(148,163,184,0.08)";
      ctx.lineWidth = 0.6;
      ctx.stroke();

      // Land
      ctx.beginPath();
      for (const c of countries) path(c.feature);
      ctx.fillStyle = "rgba(45,212,191,0.16)";
      ctx.fill();
      ctx.strokeStyle = "rgba(94,234,212,0.35)";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Featured country + pin
      if (target) {
        ctx.beginPath();
        path(target.feature);
        ctx.fillStyle = `rgba(252,211,77,${0.25 + 0.55 * e})`;
        ctx.fill();
        ctx.strokeStyle = "rgba(252,211,77,0.9)";
        ctx.lineWidth = 1;
        ctx.stroke();

        const p = projection(d3.geoCentroid(target.feature));
        if (p && t === 1) {
          const pulse = ((now - tweenStart - TWEEN_MS) % 1600) / 1600;
          ctx.beginPath();
          ctx.arc(p[0], p[1], 4 + pulse * 18, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(252,211,77,${0.7 * (1 - pulse)})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(p[0], p[1], 4, 0, Math.PI * 2);
          ctx.fillStyle = "#fde68a";
          ctx.fill();
        }
      }

      // Rim light
      ctx.beginPath();
      path(sphere);
      ctx.strokeStyle = "rgba(94,234,212,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    let raf = 0;
    const start = performance.now();
    pickNext(start);
    if (reduceMotion) {
      tweenStart = start - TWEEN_MS;
      draw(start);
      return () => ro.disconnect();
    }

    const loop = (now: number) => {
      if (now - tweenStart > TWEEN_MS + 2600) pickNext(now);
      draw(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [countries, onFeature]);

  return (
    <>
      <div className="absolute inset-[6%] rounded-full bg-teal-400/10 blur-3xl" />
      <canvas ref={canvasRef} className="relative h-full w-full" aria-hidden="true" />
    </>
  );
}
