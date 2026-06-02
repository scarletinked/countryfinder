interface GameHUDProps {
  countryName: string;
  currentRound: number;
  totalRounds: number;
  totalScore: number;
}

export default function GameHUD({
  countryName,
  currentRound,
  totalRounds,
  totalScore,
}: GameHUDProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3 bg-slate-800 border-b border-slate-700 flex-shrink-0">
      <div className="text-sm text-slate-400 w-32">
        Round{" "}
        <span className="text-white font-bold">{currentRound}</span> of{" "}
        {totalRounds}
      </div>
      <div className="text-xl font-bold text-white text-center">
        Find:{" "}
        <span className="text-yellow-400">{countryName}</span>
      </div>
      <div className="text-sm text-slate-400 w-32 text-right">
        Score:{" "}
        <span className="text-white font-bold">{totalScore}</span>
      </div>
    </div>
  );
}
