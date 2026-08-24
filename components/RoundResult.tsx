interface RoundResultProps {
  isCorrect: boolean;
  score: number;
  distanceMiles: number;
  countryName: string;
  clickedCountryName: string | null;
  onNext: () => void;
}

export default function RoundResult({
  isCorrect,
  score,
  distanceMiles,
  countryName,
  clickedCountryName,
  onNext,
}: RoundResultProps) {
  return (
    <div className="absolute inset-x-0 top-4 flex justify-center pointer-events-none z-20">
      <button
        onClick={onNext}
        className="bg-slate-900/95 border border-slate-600 rounded-xl p-6 text-center min-w-56 shadow-2xl pointer-events-auto cursor-pointer hover:border-slate-400 transition-colors"
      >
        {isCorrect ? (
          <p className="text-green-400 text-2xl font-bold mb-3">Correct! ✓</p>
        ) : (
          <>
            <p className="text-red-400 text-lg font-bold mb-1">
              No, {countryName} is over here.
            </p>
            {clickedCountryName && (
              <p className="text-slate-300 text-sm mb-1">
                You clicked on {clickedCountryName}.
              </p>
            )}
            <p className="text-slate-400 text-sm mb-3">
              {Math.round(distanceMiles).toLocaleString()} miles away
            </p>
          </>
        )}
        <p className="text-yellow-400 text-3xl font-bold mb-2">+{score} pts</p>
        <p className="text-blue-300 text-sm font-semibold">
          Click here for the next country →
        </p>
      </button>
    </div>
  );
}
