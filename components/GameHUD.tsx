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
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border-b border-slate-700 flex-shrink-0">
      <div className="text-xs text-slate-400 whitespace-nowrap">
        <span className="text-white font-bold">{currentRound}</span>
        <span className="text-slate-500">/{totalRounds}</span>
      </div>
      <div className="flex-1 text-center text-base font-bold text-yellow-400 truncate px-2">
        {countryName}
      </div>
      <div className="text-xs text-slate-400 whitespace-nowrap">
        <span className="text-slate-500">Score </span>
        <span className="text-white font-bold">{totalScore}</span>
      </div>
    </div>
  );
}
