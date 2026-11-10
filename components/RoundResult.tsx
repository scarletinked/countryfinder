import { display } from "@/lib/fonts";
import { possessive } from "@/lib/geo-utils";

interface RoundResultProps {
  isCorrect: boolean;
  score: number;
  distanceMiles: number;
  countryName: string;
  capital: string | null;
  clickedCountryName: string | null;
  // Capital of the place that was clicked, in the capital modes
  clickedCapital?: string | null;
  levelUpTo: string | null;
  noun: string;
  // Word for the next round's place, e.g. "country"
  nextNoun: string;
  // Say which country it was on a correct guess, since the prompt never named it
  revealName?: boolean;
  onNext: () => void;
}

export default function RoundResult({
  isCorrect,
  score,
  distanceMiles,
  countryName,
  capital,
  clickedCountryName,
  clickedCapital = null,
  levelUpTo,
  noun,
  nextNoun,
  revealName = false,
  onNext,
}: RoundResultProps) {
  return (
    <div className="absolute inset-x-0 top-4 flex justify-center pointer-events-none z-20">
      <button
        onClick={onNext}
        className="mx-4 min-w-56 max-w-sm cursor-pointer border border-[#9c8a63] bg-paper/95 p-6 text-center text-ink shadow-[0_8px_30px_-8px_rgba(58,47,34,0.45)] pointer-events-auto transition-colors hover:bg-paper"
      >
        {isCorrect ? (
          <p className={`${display.className} mb-3 text-atlas-green ${capital || revealName ? "text-xl" : "text-2xl"}`}>
            {capital
              ? `Yes, ${possessive(capital)} ${noun} is ${countryName}!`
              : revealName
                ? `Yes, it's ${countryName}!`
                : "Correct! ✓"}
          </p>
        ) : (
          <>
            <p className={`${display.className} mb-1 text-lg text-atlas-red`}>
              {capital
                ? `Nope! ${possessive(capital)} ${noun} is ${countryName}. It's over here.`
                : `No, ${countryName} is over here.`}
            </p>
            {clickedCountryName && (
              <p className="mb-1 text-sm text-ink">
                You clicked on {clickedCountryName}
                {clickedCapital ? `, whose capital is ${clickedCapital}` : ""}.
              </p>
            )}
            <p className="mb-3 text-sm text-ink-muted">
              {Math.round(distanceMiles).toLocaleString()} miles away
            </p>
          </>
        )}
        <p className={`${display.className} mb-2 text-3xl text-ink-strong`}>+{score} pts</p>
        {levelUpTo && (
          <p className="mb-2 text-sm font-medium text-atlas-green">
            Level up! Next up: {levelUpTo} countries
          </p>
        )}
        <p className="text-sm font-medium text-atlas-blue">Click here for the next {nextNoun} →</p>
      </button>
    </div>
  );
}
