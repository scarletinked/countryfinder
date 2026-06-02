interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export default function ZoomControls({ onZoomIn, onZoomOut }: ZoomControlsProps) {
  return (
    <div className="absolute bottom-16 right-4 flex flex-col gap-1 z-10">
      <button
        onClick={onZoomIn}
        className="w-9 h-9 bg-slate-700 hover:bg-slate-600 text-white rounded border border-slate-500 text-xl font-bold flex items-center justify-center shadow-lg transition-colors"
        title="Zoom in"
      >
        +
      </button>
      <button
        onClick={onZoomOut}
        className="w-9 h-9 bg-slate-700 hover:bg-slate-600 text-white rounded border border-slate-500 text-xl font-bold flex items-center justify-center shadow-lg transition-colors"
        title="Zoom out"
      >
        −
      </button>
    </div>
  );
}
