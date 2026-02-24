import { useSimulationStore } from '../../store/simulationStore'

interface PlaybackControlsProps {
  onPlay: () => void
  onPause: () => void
  onStep: () => void
  onReset: () => void
}

export function PlaybackControls({ onPlay, onPause, onStep, onReset }: PlaybackControlsProps) {
  const { status, speed, setSpeed, currentStep } = useSimulationStore()

  return (
    <div className="flex flex-col gap-3 p-4 bg-surface-light rounded-xl border border-surface-lighter">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Controls</h3>
        <span className="text-xs text-text-muted">Step: {currentStep}</span>
      </div>

      <div className="flex gap-2">
        {status === 'running' ? (
          <button
            onClick={onPause}
            className="flex-1 px-4 py-2 bg-accent-yellow/20 text-accent-yellow rounded-lg font-medium text-sm hover:bg-accent-yellow/30 transition-colors border-0 cursor-pointer"
          >
            ⏸ Pause
          </button>
        ) : (
          <button
            onClick={onPlay}
            disabled={status === 'done'}
            className="flex-1 px-4 py-2 bg-accent-green/20 text-accent-green rounded-lg font-medium text-sm hover:bg-accent-green/30 transition-colors border-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ▶ Play
          </button>
        )}

        <button
          onClick={onStep}
          disabled={status === 'running' || status === 'done'}
          className="flex-1 px-4 py-2 bg-accent-blue/20 text-accent-blue rounded-lg font-medium text-sm hover:bg-accent-blue/30 transition-colors border-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ⏭ Step
        </button>

        <button
          onClick={onReset}
          className="flex-1 px-4 py-2 bg-accent-red/20 text-accent-red rounded-lg font-medium text-sm hover:bg-accent-red/30 transition-colors border-0 cursor-pointer"
        >
          ↺ Reset
        </button>
      </div>

      {/* Speed slider */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-text-muted whitespace-nowrap">Speed</label>
        <input
          type="range"
          min={10}
          max={1000}
          step={10}
          value={1010 - speed}
          onChange={(e) => setSpeed(1010 - Number(e.target.value))}
          className="flex-1 accent-primary"
        />
        <span className="text-xs text-text-muted w-14 text-right">{speed}ms</span>
      </div>
    </div>
  )
}
