"use client";

import React, {
  useRef,
  useEffect,
  useMemo,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  geoNaturalEarth1,
  geoPath,
  zoom as d3zoom,
  zoomTransform,
  zoomIdentity,
  select,
  ZoomBehavior,
} from "d3";
import type { CountryFeature } from "@/types";

export interface WorldMapHandle {
  zoomIn: () => void;
  zoomOut: () => void;
}

interface WorldMapProps {
  features: CountryFeature[];
  markerPosition: [number, number] | null;
  highlightId?: number | null;
  onMarkerPlace: (lngLat: [number, number]) => void;
  parrotDestLngLat?: [number, number] | null;
}

const WorldMap = forwardRef<WorldMapHandle, WorldMapProps>(function WorldMap(
  { features, markerPosition, highlightId, onMarkerPlace, parrotDestLngLat },
  ref
) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const parrotGRef = useRef<SVGGElement>(null);
  const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const onMarkerPlaceRef = useRef(onMarkerPlace);
  const zoomStateRef = useRef({ x: 0, y: 0, k: 1 });
  const animFrameRef = useRef<number | null>(null);
  const [zoomState, setZoomState] = useState({ x: 0, y: 0, k: 1 });

  useEffect(() => {
    onMarkerPlaceRef.current = onMarkerPlace;
  });

  const projection = useMemo(
    () => geoNaturalEarth1().scale(153).translate([480, 250]),
    []
  );

  const pathGen = useMemo(() => geoPath().projection(projection), [projection]);

  useImperativeHandle(ref, () => ({
    zoomIn() {
      const svg = svgRef.current;
      const zb = zoomBehaviorRef.current;
      if (svg && zb) select(svg).transition().duration(250).call(zb.scaleBy, 1.5);
    },
    zoomOut() {
      const svg = svgRef.current;
      const zb = zoomBehaviorRef.current;
      if (svg && zb)
        select(svg)
          .transition()
          .duration(250)
          .call(zb.scaleBy, 1 / 1.5);
    },
  }));

  // Set up D3 zoom + click handler once
  useEffect(() => {
    const svg = svgRef.current;
    const g = gRef.current;
    if (!svg || !g) return;

    const zb = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 16])
      .translateExtent([[-160, -80], [1120, 580]])
      .clickDistance(4)
      .on("zoom", (event) => {
        g.setAttribute("transform", event.transform.toString());
        const { x, y, k } = event.transform;
        zoomStateRef.current = { x, y, k };
        setZoomState({ x, y, k });
      });

    zoomBehaviorRef.current = zb;
    select(svg).call(zb);

    function handleClick(event: MouseEvent) {
      const svgEl = svgRef.current;
      if (!svgEl) return;

      const pt = svgEl.createSVGPoint();
      pt.x = event.clientX;
      pt.y = event.clientY;
      const ctm = svgEl.getScreenCTM();
      if (!ctm) return;
      const svgPt = pt.matrixTransform(ctm.inverse());

      const t = zoomTransform(svgEl);
      const [baseX, baseY] = t.invert([svgPt.x, svgPt.y]);

      const coords = projection.invert?.([baseX, baseY]);
      if (coords && isFinite(coords[0]) && isFinite(coords[1])) {
        onMarkerPlaceRef.current(coords as [number, number]);
      }
    }

    svg.addEventListener("click", handleClick);
    return () => {
      svg.removeEventListener("click", handleClick);
      select(svg).on(".zoom", null);
    };
  }, [projection]);

  // Zoom to fit + parrot flight after guess
  useEffect(() => {
    const pg = parrotGRef.current;

    if (!markerPosition || !parrotDestLngLat) {
      if (pg) pg.style.display = "none";
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    const svg = svgRef.current;
    const zb = zoomBehaviorRef.current;

    // Zoom map to show both the clicked point and the target centroid
    if (svg && zb) {
      const p1 = projection(markerPosition);
      const p2 = projection(parrotDestLngLat);
      if (p1 && p2) {
        const padding = 120;
        const cx = (p1[0] + p2[0]) / 2;
        const cy = (p1[1] + p2[1]) / 2;
        const dx = Math.max(Math.abs(p1[0] - p2[0]), 10);
        const dy = Math.max(Math.abs(p1[1] - p2[1]), 10);
        const newK = Math.min(
          (960 - padding * 2) / dx,
          (500 - padding * 2) / dy,
          8
        );
        const k = Math.max(newK, 1);
        const tx = 480 - k * cx;
        const ty = 250 - k * cy;
        select(svg)
          .transition()
          .duration(600)
          .call(zb.transform, zoomIdentity.translate(tx, ty).scale(k));
      }
    }

    // After zoom settles, fly the parrot
    const timer = setTimeout(() => {
      const p1 = projection(markerPosition);
      const p2 = projection(parrotDestLngLat);
      if (!p1 || !p2 || !pg) return;

      const { x, y, k } = zoomStateRef.current;
      const sx = p1[0] * k + x;
      const sy = p1[1] * k + y;
      const ex = p2[0] * k + x;
      const ey = p2[1] * k + y;

      pg.style.display = "";
      pg.setAttribute("transform", `translate(${sx}, ${sy})`);

      const startTime = performance.now();
      const duration = 1000;

      function animate(t: number) {
        const progress = Math.min((t - startTime) / duration, 1);
        const px = sx + (ex - sx) * progress;
        const py = sy + (ey - sy) * progress;
        pg!.setAttribute("transform", `translate(${px}, ${py})`);
        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        } else {
          animFrameRef.current = null;
        }
      }

      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(animate);
    }, 700);

    return () => {
      clearTimeout(timer);
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (pg) pg.style.display = "none";
    };
  }, [markerPosition, parrotDestLngLat, projection]);

  const markerPx = useMemo(
    () => (markerPosition ? projection(markerPosition) : null),
    [markerPosition, projection]
  );

  const screenMarkerPx = useMemo(() => {
    if (!markerPx) return null;
    const [mx, my] = markerPx;
    return [mx * zoomState.k + zoomState.x, my * zoomState.k + zoomState.y] as [number, number];
  }, [markerPx, zoomState]);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 960 500"
      className="w-full h-full cursor-crosshair select-none"
      style={{ background: "#1a3a5c" }}
    >
      <g ref={gRef}>
        {features.map((f) => (
          <path
            key={f.id}
            d={pathGen(f.feature) ?? ""}
            fill={highlightId === f.id ? "#22c55e" : "#475569"}
            stroke={highlightId === f.id ? "#86efac" : "#64748b"}
            strokeWidth={0.5}
          />
        ))}
      </g>

      {screenMarkerPx && (
        <g transform={`translate(${screenMarkerPx[0]}, ${screenMarkerPx[1]})`} style={{ pointerEvents: "none" }}>
          <circle r={7} fill="#ef4444" stroke="white" strokeWidth={2}/>
          <circle r={2} fill="white"/>
        </g>
      )}

      {/* Parrot: hidden by default, shown + animated after guess */}
      <g ref={parrotGRef} style={{ display: "none", pointerEvents: "none" }}>
        {/* white halo for visibility against any background */}
        <circle r={14} fill="white" opacity={0.35}/>
        {/* parrot icon centered at origin, scaled from logo coords */}
        <g transform="scale(0.5) translate(-59, -44)">
          <path d="M 54,56 Q 40,68 37,82" stroke="#00897b" strokeWidth="3.2" fill="none" strokeLinecap="round"/>
          <path d="M 55,58 Q 44,72 44,86" stroke="#26a69a" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
          <path d="M 51,46 Q 48,52 52,59 Q 57,51 62,47 Z" fill="#1b5e20"/>
          <ellipse cx="61" cy="46" rx="9" ry="6.5" fill="#2e7d32" transform="rotate(-20, 61, 46)"/>
          <circle cx="70" cy="37" r="7.5" fill="#43a047"/>
          <path d="M 67,31 Q 69,25 72,30" stroke="#e53935" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
          <path d="M 70,30 Q 73,23 75,28" stroke="#fb8c00" strokeWidth="2" fill="none" strokeLinecap="round"/>
          <circle cx="73" cy="35" r="2.5" fill="#0c1f36"/>
          <circle cx="73.7" cy="34.3" r="0.9" fill="white"/>
          <path d="M 75,36 Q 82,35 80.5,40 Q 75,40 75,36 Z" fill="#f57f17"/>
          <line x1="75" y1="38.5" x2="80.5" y2="40" stroke="#e65100" strokeWidth="0.8"/>
          <path d="M 56,59 Q 53,62 50,63" stroke="#5d4037" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
          <path d="M 58,60 Q 61,63 64,64" stroke="#5d4037" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
        </g>
      </g>
    </svg>
  );
});

export default WorldMap;
