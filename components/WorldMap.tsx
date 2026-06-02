"use client";

import React, {
  useRef,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  geoNaturalEarth1,
  geoPath,
  zoom as d3zoom,
  zoomTransform,
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
}

const WorldMap = forwardRef<WorldMapHandle, WorldMapProps>(function WorldMap(
  { features, markerPosition, highlightId, onMarkerPlace },
  ref
) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const onMarkerPlaceRef = useRef(onMarkerPlace);

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
      });

    zoomBehaviorRef.current = zb;
    select(svg).call(zb);

    function handleClick(event: MouseEvent) {
      const svgEl = svgRef.current;
      if (!svgEl) return;

      // Convert screen → SVG coordinate space
      const pt = svgEl.createSVGPoint();
      pt.x = event.clientX;
      pt.y = event.clientY;
      const ctm = svgEl.getScreenCTM();
      if (!ctm) return;
      const svgPt = pt.matrixTransform(ctm.inverse());

      // Invert zoom transform to get base SVG coordinates
      const t = zoomTransform(svgEl);
      const [baseX, baseY] = t.invert([svgPt.x, svgPt.y]);

      // Invert map projection to get geographic coordinates
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

  // Marker pixel position (in base SVG coordinate space — the <g> zoom transform applies automatically)
  const markerPx = useMemo(
    () => (markerPosition ? projection(markerPosition) : null),
    [markerPosition, projection]
  );

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
        {markerPx && (
          <g style={{ pointerEvents: "none" }}>
            <circle
              cx={markerPx[0]}
              cy={markerPx[1]}
              r={7}
              fill="#ef4444"
              stroke="white"
              strokeWidth={2}
            />
            <circle cx={markerPx[0]} cy={markerPx[1]} r={2} fill="white" />
          </g>
        )}
      </g>
    </svg>
  );
});

export default WorldMap;
