import { useState, useCallback } from 'react'
import { useSimulationStore } from '../../store/simulationStore'

interface PlaybackControlsProps {
  onPlay: () => void
  onPause: () => void
  onStep: () => void
  onReset: () => void
  maxSteps: number
  onMaxStepsChange: (n: number) => void
  showBatch?: boolean
  minSpeed?: number
  maxSpeed?: number
}

const MULTIPLIER_OPTIONS = [1, 5, 10, 50] as const

function formatSteps(n: number): string {
  if (n >= 1000) return `${(n / 1000)}k`
  return String(n)
}

export function PlaybackControls({ onPlay, onPause, onStep, onReset, maxSteps, onMaxStepsChange, showBatch = true, minSpeed = 10, maxSpeed = 1000 }: PlaybackControlsProps) {
  const { status, speed, setSpeed, stepsPerTick, setStepsPerTick, currentStep, totalStepCount } = useSimulationStore()

  const [inputValue, setInputValue] = useState(String(maxSteps))
  const [inputFocused, setInputFocused] = useState(false)

  const commitInput = useCallback(() => {
    const num = parseInt(inputValue.replace(/k/gi, '000').replace(/,/g, ''), 10)
    if (!isNaN(num) && num >= 100 && num <= 10_000_000) {
      onMaxStepsChange(num)
      setInputValue(String(num))
    } else {
      setInputValue(String(maxSteps))
    }
    setInputFocused(false)
  }, [inputValue, maxSteps, onMaxStepsChange])

  return (
    <div className="flex flex-col gap-3 p-4 bg-surface-light rounded-xl border border-surface-lighter">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Controls</h3>
        <span className="text-xs text-text-muted">
          Step: {totalStepCount}{stepsPerTick > 1 && totalStepCount !== currentStep ? ` (${currentStep} displayed)` : ''}
        </span>
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
          min={minSpeed}
          max={maxSpeed}
          step={minSpeed}
          value={minSpeed + maxSpeed - speed}
          onChange={(e) => setSpeed(minSpeed + maxSpeed - Number(e.target.value))}
          className="flex-1 accent-primary"
        />
        <span className="text-xs text-text-muted w-14 text-right">{speed}ms</span>
      </div>

      {/* Steps-per-tick multiplier */}
      {showBatch && (
        <div className="flex items-center gap-3">
          <label className="text-xs text-text-muted whitespace-nowrap">Batch</label>
          <div className="flex gap-1 flex-1">
            {MULTIPLIER_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setStepsPerTick(n)}
                className={`flex-1 px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer transition-colors ${
                  stepsPerTick === n
                    ? 'bg-primary text-white'
                    : 'bg-surface-lighter/50 text-text-muted hover:text-text hover:bg-surface-lighter'
                }`}
              >
                {n === 1 ? '1x' : `${n}x`}
              </button>
            ))}
          </div>
          <span className="text-xs text-text-muted w-14 text-right">{stepsPerTick === 1 ? 'normal' : `${stepsPerTick}/tick`}</span>
        </div>
      )}

      {/* Max steps */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-text-muted whitespace-nowrap">Limit</label>
        <input
          type="text"
          inputMode="numeric"
          value={inputFocused ? inputValue : formatSteps(maxSteps)}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => { setInputFocused(true); setInputValue(String(maxSteps)) }}
          onBlur={commitInput}
          onKeyDown={(e) => { if (e.key === 'Enter') commitInput() }}
          className="flex-1 px-2 py-1 rounded text-xs font-mono bg-surface text-text border border-surface-lighter focus:border-primary focus:outline-none"
        />
        <span className="text-xs text-text-muted w-14 text-right">steps</span>
      </div>
    </div>
  )
}
