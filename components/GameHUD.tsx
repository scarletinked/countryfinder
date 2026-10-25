import type { Tier } from "@/types";
import { HITS_TO_ADVANCE, TIER_LABELS } from "@/lib/difficulty";

const TIER_STYLES: Record<Tier, string> = {
  easy: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  hard: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

interface GameHUDProps {
  prompt: string;
  currentRound: number;
  totalRounds: number;
  totalScore: number;
  tier: Tier;
  streak: number;
}

export default function GameHUD({
  prompt,
  currentRound,
  totalRounds,
  totalScore,
  tier,
  streak,
}: GameHUDProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border-b border-slate-700 flex-shrink-0">
      <div className="flex items-center gap-2 text-xs text-slate-400 whitespace-nowrap">
        <span>
          <span className="text-white font-bold">{currentRound}</span>
          <span className="text-slate-500">/{totalRounds}</span>
        </span>
        <span
          className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-semibold ${TIER_STYLES[tier]}`}
          title={tier === "hard" ? "Hardest level" : `${HITS_TO_ADVANCE} in a row to level up`}
        >
          {TIER_LABELS[tier]}
          {tier !== "hard" && (
            <span className="flex gap-0.5">
              {Array.from({ length: HITS_TO_ADVANCE }, (_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${i < streak ? "bg-current" : "bg-current opacity-25"}`}
                />
              ))}
            </span>
          )}
        </span>
      </div>
      <div className="flex-1 text-center text-sm sm:text-base font-bold leading-tight text-yellow-400 px-2">
        {prompt}
      </div>
      <div className="text-xs text-slate-400 whitespace-nowrap">
        <span className="text-slate-500">Score </span>
        <span className="text-white font-bold">{totalScore}</span>
      </div>
    </div>
  );
}
