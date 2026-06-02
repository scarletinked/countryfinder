export function calculateScore(distanceMiles: number, isCorrect: boolean): number {
  if (isCorrect) return 100;
  return Math.max(0, 50 - Math.floor(distanceMiles / 100) * 3);
}
