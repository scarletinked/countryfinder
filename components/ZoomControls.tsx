interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const BUTTON =
  "w-9 h-9 bg-paper hover:bg-paper-deep text-ink-strong border border-[#9c8a63] text-xl flex items-center justify-center shadow-sm transition-colors";

export default function ZoomControls({ onZoomIn, onZoomOut }: ZoomControlsProps) {
  return (
    <div className="absolute bottom-16 right-4 flex flex-col gap-1 z-10">
      <button onClick={onZoomIn} className={BUTTON} title="Zoom in">
        +
      </button>
      <button onClick={onZoomOut} className={BUTTON} title="Zoom out">
        −
      </button>
    </div>
  );
}
