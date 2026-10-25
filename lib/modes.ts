import type { GameMode } from "@/types";

export const MODES: GameMode[] = ["standard", "polly"];

export const MODE_LABELS: Record<GameMode, string> = {
  standard: "Standard",
  polly: "Polly Wants a Capital",
};

export function isGameMode(value: unknown): value is GameMode {
  return typeof value === "string" && (MODES as string[]).includes(value);
}
