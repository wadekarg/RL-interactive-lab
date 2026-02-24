import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import katex from 'katex'
import { useSimulationStore } from '../../store/simulationStore'
import type { DiscretizationConfig } from '../../environments/cartpole'
import { CARTPOLE_ACTION_NAMES } from '../../environments/cartpole'
import {
  computeCartPoleTDBreakdown,
  computeCartPoleReinforceBreakdown,
  computeCartPoleRandomBreakdown,
  generateCartPoleTDFormula,
  generateCartPoleReinforceFormula,
  generateCartPoleTDNarrative,
  generateCartPoleReinforceNarrative,
  generateCartPoleRandomNarrative,
  fmt,
} from '../../utils/cartpoleStepBreakdown'
import type { CartPoleTDBreakdown, CartPoleReinforceBreakdown, CartPoleRandomBreakdown } from '../../utils/cartpoleStepBreakdown'

// ─── KaTeX renderer ──────────────────────────────────────────────────────────

function RenderedEquation({ tex }: { tex: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current && tex) {
      katex.render(tex, ref.current, {
        throwOnError: false,
        displayMode: true,
      })
    }
  }, [tex])

  return <div ref={ref} className="my-2 overflow-x-auto" />
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface CartPoleStepBreakdownPanelProps {
  algorithmType: 'random' | 'discretized-q' | 'reinforce'
  alpha: number
  gamma: number
  discretizationConfig: DiscretizationConfig
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function CartPoleStepBreakdownPanel({ algorithmType, alpha, gamma, discretizationConfig }: CartPoleStepBreakdownPanelProps) {
  const { history, selectedStepIndex, setSelectedStepIndex } = useSimulationStore()
  const [collapsed, setCollapsed] = useState(false)

  const maxIndex = history.length - 1

  const effectiveIndex = selectedStepIndex !== null
    ? Math.min(selectedStepIndex, maxIndex)
    : maxIndex

  useEffect(() => {
    if (history.length === 0) setSelectedStepIndex(null)
  }, [history.length, setSelectedStepIndex])

  const breakdown = useMemo(() => {
    if (history.length === 0 || effectiveIndex < 0) return null
    if (algorithmType === 'discretized-q') {
      return computeCartPoleTDBreakdown(history, effectiveIndex, alpha, gamma, discretizationConfig)
    }
    if (algorithmType === 'reinforce') {
      return computeCartPoleReinforceBreakdown(history, effectiveIndex)
    }
    return computeCartPoleRandomBreakdown(history, effectiveIndex)
  }, [history, effectiveIndex, algorithmType, alpha, gamma, discretizationConfig])

  const goTo = useCallback((idx: number) => {
    setSelectedStepIndex(Math.max(0, Math.min(idx, maxIndex)))
  }, [maxIndex, setSelectedStepIndex])

  const goPrev = useCallback(() => goTo(effectiveIndex - 1), [effectiveIndex, goTo])
  const goNext = useCallback(() => goTo(effectiveIndex + 1), [effectiveIndex, goTo])

  const [inputValue, setInputValue] = useState('')
  const [inputFocused, setInputFocused] = useState(false)

  useEffect(() => {
    if (!inputFocused) setInputValue(String(effectiveIndex))
  }, [effectiveIndex, inputFocused])

  const commitInput = useCallback(() => {
    const num = parseInt(inputValue, 10)
    if (!isNaN(num)) goTo(num)
    setInputFocused(false)
  }, [inputValue, goTo])

  if (history.length === 0) {
    return (
      <div className="bg-surface-light rounded-xl border border-surface-lighter overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold text-text">Step Breakdown</span>
          <span className="text-xs text-text-muted">Press Play to begin</span>
        </div>
      </div>
    )
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedStepIndex(Number(e.target.value))
  }

  return (
    <div className="bg-surface-light rounded-xl border border-surface-lighter overflow-hidden">
      {/* Header with inline navigation */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 bg-transparent border-0 cursor-pointer p-0 text-left"
        >
          <span className="text-sm font-semibold text-text">Step Breakdown</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            disabled={effectiveIndex <= 0}
            className="p-1 rounded bg-surface text-text-muted hover:text-text hover:bg-surface-lighter disabled:opacity-30 disabled:cursor-not-allowed border-0 cursor-pointer transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" />
            </svg>
          </button>

          <div className="flex items-center gap-1">
            <span className="text-xs text-text-muted">Step</span>
            <input
              type="text"
              inputMode="numeric"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={commitInput}
              onKeyDown={(e) => { if (e.key === 'Enter') commitInput() }}
              className="w-14 px-1.5 py-0.5 rounded text-xs font-mono text-center bg-surface text-text border border-surface-lighter focus:border-primary focus:outline-none"
            />
            <span className="text-xs text-text-muted">/ {maxIndex}</span>
          </div>

          <button
            onClick={goNext}
            disabled={effectiveIndex >= maxIndex}
            className="p-1 rounded bg-surface text-text-muted hover:text-text hover:bg-surface-lighter disabled:opacity-30 disabled:cursor-not-allowed border-0 cursor-pointer transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" />
            </svg>
          </button>

          <span className="w-px h-4 bg-surface-lighter" />

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-xs text-text-muted hover:text-text bg-transparent border-0 cursor-pointer p-0 transition-colors"
          >
            {collapsed ? 'Show' : 'Hide'}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="px-4 pb-4">
          <div className="mb-4">
            <input
              type="range"
              min={0}
              max={maxIndex}
              value={effectiveIndex}
              onChange={handleSliderChange}
              className="w-full accent-primary"
            />
          </div>

          {breakdown && breakdown.type === 'cartpole-td' && <TDView bd={breakdown} />}
          {breakdown && breakdown.type === 'cartpole-reinforce' && <ReinforceView bd={breakdown} />}
          {breakdown && breakdown.type === 'cartpole-random' && <RandomView bd={breakdown} />}
        </div>
      )}
    </div>
  )
}

// ─── TD (Discretized Q-Learning) View ───────────────────────────────────────

function TDView({ bd }: { bd: CartPoleTDBreakdown }) {
  const formula = useMemo(() => generateCartPoleTDFormula(bd), [bd])
  const narrative = useMemo(() => generateCartPoleTDNarrative(bd), [bd])

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface rounded-lg p-3">
        <p className="text-sm text-text leading-relaxed">{narrative}</p>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
          Q-Learning Update
        </h4>
        <div className="bg-surface rounded-lg p-3 overflow-x-auto">
          <RenderedEquation tex={formula} />
        </div>
      </div>

      {/* Q-value table for this discretized state */}
      <div>
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
          Q-values at bin [{bd.discretizedKey}] — Before / After
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-lighter">
                <th className="text-left py-1.5 px-2 text-text-muted font-medium">Action</th>
                <th className="text-right py-1.5 px-2 text-text-muted font-medium">Before</th>
                <th className="text-right py-1.5 px-2 text-text-muted font-medium">After</th>
                <th className="text-right py-1.5 px-2 text-text-muted font-medium">Change</th>
              </tr>
            </thead>
            <tbody>
              {([0, 1] as const).map((a) => {
                const isUpdated = a === bd.action
                const delta = bd.postQValues[a] - bd.preQValues[a]
                return (
                  <tr
                    key={a}
                    className={`border-b border-surface-lighter last:border-0 ${isUpdated ? 'bg-primary/10' : ''}`}
                  >
                    <td className="py-1.5 px-2 text-text">
                      {CARTPOLE_ACTION_NAMES[a]}
                      {isUpdated && <span className="ml-1.5 text-xs text-primary-light font-medium">(updated)</span>}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono text-text-muted">{fmt(bd.preQValues[a])}</td>
                    <td className="py-1.5 px-2 text-right font-mono text-text">{fmt(bd.postQValues[a])}</td>
                    <td className={`py-1.5 px-2 text-right font-mono ${
                      Math.abs(delta) < 1e-10 ? 'text-text-muted' : delta > 0 ? 'text-accent-green' : 'text-accent-red'
                    }`}>
                      {Math.abs(delta) < 1e-10 ? '-' : (delta > 0 ? '+' : '') + fmt(delta)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── REINFORCE View ─────────────────────────────────────────────────────────

function ReinforceView({ bd }: { bd: CartPoleReinforceBreakdown }) {
  const formula = useMemo(() => generateCartPoleReinforceFormula(), [])
  const narrative = useMemo(() => generateCartPoleReinforceNarrative(bd), [bd])

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface rounded-lg p-3">
        <p className="text-sm text-text leading-relaxed">{narrative}</p>
      </div>

      {bd.done && bd.episodeDuration !== null && (
        <div className="bg-surface rounded-lg p-3">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Episode Summary
          </h4>
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-text-muted">Duration: </span>
              <span className="font-mono text-text">{bd.episodeDuration} steps</span>
            </div>
            <div>
              <span className="text-text-muted">Return: </span>
              <span className="font-mono text-text">{bd.episodeReturn}</span>
            </div>
          </div>
          <p className="text-xs text-text-muted mt-2">
            Weights updated using the full episode trajectory. Good actions reinforced, bad actions discouraged.
          </p>
        </div>
      )}

      <div>
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
          Policy Gradient Update Rule
        </h4>
        <div className="bg-surface rounded-lg p-3 overflow-x-auto">
          <RenderedEquation tex={formula} />
        </div>
      </div>
    </div>
  )
}

// ─── Random View ────────────────────────────────────────────────────────────

function RandomView({ bd }: { bd: CartPoleRandomBreakdown }) {
  const narrative = useMemo(() => generateCartPoleRandomNarrative(bd), [bd])

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-surface rounded-lg p-3">
        <p className="text-sm text-text leading-relaxed">{narrative}</p>
      </div>
      <div className="bg-surface rounded-lg p-3">
        <p className="text-xs text-text-muted">
          Random agent — no learning, no Q-values, no policy. Actions are chosen with 50/50 probability.
          This is the baseline that any learning algorithm should beat.
        </p>
      </div>
    </div>
  )
}
