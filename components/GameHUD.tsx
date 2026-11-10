import type { Tier } from "@/types";
import { HITS_TO_ADVANCE, TIER_LABELS } from "@/lib/difficulty";
import { display } from "@/lib/fonts";

const TIER_STYLES: Record<Tier, string> = {
  easy: "border-atlas-green/40 bg-atlas-green/10 text-atlas-green",
  medium: "border-atlas-ochre/40 bg-atlas-ochre/10 text-atlas-ochre",
  hard: "border-atlas-red/40 bg-atlas-red/10 text-atlas-red",
};

interface GameHUDProps {
  prompt: string;
  currentRound: number;
  totalRounds: number;
  totalScore: number;
  // null for modes without difficulty tiers
  tier: Tier | null;
  streak: number;
  // A fact shown under the prompt, for the hint mode
  hint?: string | null;
}

export default function GameHUD({
  prompt,
  currentRound,
  totalRounds,
  totalScore,
  tier,
  streak,
  hint,
}: GameHUDProps) {
  return (
    <div className="border-b border-rule bg-paper flex-shrink-0">
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex items-center gap-2 text-xs text-ink-muted whitespace-nowrap">
          <span>
            <span className={`${display.className} text-sm text-ink-strong`}>{currentRound}</span>
            <span>/{totalRounds}</span>
          </span>
          {tier && <span
            className={`flex items-center gap-1.5 border px-2 py-0.5 font-medium ${TIER_STYLES[tier]}`}
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
          </span>}
        </div>
        <div className={`${display.className} flex-1 px-2 text-center text-base leading-tight text-atlas-red sm:text-lg`}>
          {prompt}
        </div>
        <div className="text-xs text-ink-muted whitespace-nowrap">
          <span>Score </span>
          <span className={`${display.className} text-sm text-ink-strong`}>{totalScore}</span>
        </div>
      </div>
      {hint && (
        <p className="mx-auto max-w-2xl px-4 pb-2.5 text-center text-sm leading-snug text-ink sm:text-base">
          {hint}
        </p>
      )}
    </div>
  );
}
