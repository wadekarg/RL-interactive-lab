import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import katex from 'katex'
import { useSimulationStore } from '../../store/simulationStore'
import { ACTION_NAMES } from '../../environments/gridworld'
import {
  computeTDBreakdown,
  computeDPBreakdown,
  generateTDFormula,
  generateDPFormula,
  generateTDNarrative,
  generateDPNarrative,
  fmt,
} from '../../utils/stepBreakdown'
import type { TDStepBreakdown, DPSweepBreakdown } from '../../utils/stepBreakdown'

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

interface StepBreakdownPanelProps {
  algorithmType: 'q-learning' | 'sarsa' | 'value-iteration' | 'policy-iteration'
  alpha: number
  gamma: number
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function StepBreakdownPanel({ algorithmType, alpha, gamma }: StepBreakdownPanelProps) {
  const { history, selectedStepIndex, setSelectedStepIndex } = useSimulationStore()
  const [collapsed, setCollapsed] = useState(false)

  const isDPAlgorithm = algorithmType === 'value-iteration' || algorithmType === 'policy-iteration'
  const maxIndex = history.length - 1

  // Default to latest step when history grows and user hasn't manually selected
  const effectiveIndex = selectedStepIndex !== null
    ? Math.min(selectedStepIndex, maxIndex)
    : maxIndex

  // Reset selection when history is cleared
  useEffect(() => {
    if (history.length === 0) setSelectedStepIndex(null)
  }, [history.length, setSelectedStepIndex])

  const breakdown = useMemo(() => {
    if (history.length === 0 || effectiveIndex < 0) return null
    if (isDPAlgorithm) {
      return computeDPBreakdown(history, effectiveIndex, algorithmType as 'value-iteration' | 'policy-iteration', gamma)
    }
    return computeTDBreakdown(history, effectiveIndex, algorithmType as 'q-learning' | 'sarsa', alpha, gamma)
  }, [history, effectiveIndex, algorithmType, alpha, gamma, isDPAlgorithm])

  // Navigation helpers
  const goTo = useCallback((idx: number) => {
    setSelectedStepIndex(Math.max(0, Math.min(idx, maxIndex)))
  }, [maxIndex, setSelectedStepIndex])

  const goPrev = useCallback(() => goTo(effectiveIndex - 1), [effectiveIndex, goTo])
  const goNext = useCallback(() => goTo(effectiveIndex + 1), [effectiveIndex, goTo])

  // Direct input state — kept separate so typing "42" doesn't jump on every keystroke
  const [inputValue, setInputValue] = useState('')
  const [inputFocused, setInputFocused] = useState(false)

  // Sync displayed input when slider/buttons change (but not while user is typing)
  useEffect(() => {
    if (!inputFocused) {
      setInputValue(isDPAlgorithm ? String(effectiveIndex + 1) : String(effectiveIndex))
    }
  }, [effectiveIndex, isDPAlgorithm, inputFocused])

  const commitInput = useCallback(() => {
    const num = parseInt(inputValue, 10)
    if (!isNaN(num)) {
      const idx = isDPAlgorithm ? num - 1 : num  // DP is 1-indexed for display
      goTo(idx)
    }
    setInputFocused(false)
  }, [inputValue, isDPAlgorithm, goTo])

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

  const label = isDPAlgorithm ? 'Sweep' : 'Step'

  return (
    <div className="bg-surface-light rounded-xl border border-surface-lighter overflow-hidden">
      {/* Header with inline navigation */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: title (clickable to collapse) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 bg-transparent border-0 cursor-pointer p-0 text-left"
        >
          <span className="text-sm font-semibold text-text">
            Step Breakdown
          </span>
        </button>

        {/* Right: nav controls + hide toggle */}
        <div className="flex items-center gap-2">
          {/* Prev */}
          <button
            onClick={goPrev}
            disabled={effectiveIndex <= 0}
            className="p-1 rounded bg-surface text-text-muted hover:text-text hover:bg-surface-lighter disabled:opacity-30 disabled:cursor-not-allowed border-0 cursor-pointer transition-colors"
            title={`Previous ${label.toLowerCase()}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" />
            </svg>
          </button>

          {/* Direct step input */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-text-muted">{label}</span>
            <input
              type="text"
              inputMode="numeric"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => { setInputFocused(true); }}
              onBlur={commitInput}
              onKeyDown={(e) => { if (e.key === 'Enter') commitInput() }}
              className="w-14 px-1.5 py-0.5 rounded text-xs font-mono text-center bg-surface text-text border border-surface-lighter focus:border-primary focus:outline-none"
            />
            <span className="text-xs text-text-muted">
              / {isDPAlgorithm ? history.length : maxIndex}
            </span>
          </div>

          {/* Next */}
          <button
            onClick={goNext}
            disabled={effectiveIndex >= maxIndex}
            className="p-1 rounded bg-surface text-text-muted hover:text-text hover:bg-surface-lighter disabled:opacity-30 disabled:cursor-not-allowed border-0 cursor-pointer transition-colors"
            title={`Next ${label.toLowerCase()}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" />
            </svg>
          </button>

          {/* Divider */}
          <span className="w-px h-4 bg-surface-lighter" />

          {/* Hide/Show toggle */}
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
          {/* Slider */}
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

          {breakdown && breakdown.type === 'td' && (
            <TDBreakdownView bd={breakdown} />
          )}
          {breakdown && breakdown.type === 'dp' && (
            <DPBreakdownView bd={breakdown} />
          )}
        </div>
      )}
    </div>
  )
}

// ─── TD Breakdown View ───────────────────────────────────────────────────────

function TDBreakdownView({ bd }: { bd: TDStepBreakdown }) {
  const formula = useMemo(() => generateTDFormula(bd), [bd])
  const narrative = useMemo(() => generateTDNarrative(bd), [bd])

  return (
    <div className="flex flex-col gap-4">
      {/* Narrative */}
      <div className="bg-surface rounded-lg p-3">
        <p className="text-sm text-text leading-relaxed">
          {narrative}
        </p>
      </div>

      {/* Formula */}
      <div>
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
          {bd.algorithm === 'q-learning' ? 'Q-Learning' : 'SARSA'} Update
        </h4>
        <div className="bg-surface rounded-lg p-3 overflow-x-auto">
          <RenderedEquation tex={formula} />
        </div>
      </div>

      {/* Before/After Q-value table */}
      <div>
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
          Q-values at ({bd.state.row},{bd.state.col}) &mdash; Before &rarr; After
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
              {([0, 1, 2, 3] as const).map((a) => {
                const isUpdated = a === bd.action
                const delta = bd.postQValues[a] - bd.preQValues[a]
                return (
                  <tr
                    key={a}
                    className={`border-b border-surface-lighter last:border-0 ${
                      isUpdated ? 'bg-primary/10' : ''
                    }`}
                  >
                    <td className="py-1.5 px-2 text-text">
                      {ACTION_NAMES[a]}
                      {isUpdated && (
                        <span className="ml-1.5 text-xs text-primary-light font-medium">
                          (updated)
                        </span>
                      )}
                      {a === bd.greedyAction && !isUpdated && (
                        <span className="ml-1.5 text-xs text-accent-green font-medium">
                          (greedy)
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono text-text-muted">
                      {fmt(bd.preQValues[a])}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono text-text">
                      {fmt(bd.postQValues[a])}
                    </td>
                    <td className={`py-1.5 px-2 text-right font-mono ${
                      Math.abs(delta) < 1e-10
                        ? 'text-text-muted'
                        : delta > 0
                          ? 'text-accent-green'
                          : 'text-accent-red'
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

      {/* Next state Q-values (bootstrap source) */}
      {!bd.done && (
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Next State Q-values at ({bd.nextState.row},{bd.nextState.col})
            {bd.algorithm === 'q-learning'
              ? ' \u2014 max used for bootstrap'
              : bd.bootstrapActionName
                ? ` \u2014 ${bd.bootstrapActionName} used for bootstrap`
                : ''
            }
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-lighter">
                  <th className="text-left py-1.5 px-2 text-text-muted font-medium">Action</th>
                  <th className="text-right py-1.5 px-2 text-text-muted font-medium">Q-value</th>
                  <th className="text-left py-1.5 px-2 text-text-muted font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                {([0, 1, 2, 3] as const).map((a) => {
                  const isBootstrap = bd.algorithm === 'q-learning'
                    ? bd.nextStatePreQValues[a] === bd.bootstrapValue &&
                      a === (bd.bootstrapAction ?? argmaxArr(bd.nextStatePreQValues))
                    : a === bd.bootstrapAction

                  return (
                    <tr
                      key={a}
                      className={`border-b border-surface-lighter last:border-0 ${
                        isBootstrap ? 'bg-accent-yellow/10' : ''
                      }`}
                    >
                      <td className="py-1.5 px-2 text-text">{ACTION_NAMES[a]}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-text">
                        {fmt(bd.nextStatePreQValues[a])}
                      </td>
                      <td className="py-1.5 px-2 text-xs">
                        {isBootstrap && (
                          <span className="text-accent-yellow font-medium">
                            {bd.algorithm === 'q-learning' ? 'max (bootstrap)' : 'next action (bootstrap)'}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

/** Simple argmax for inline use */
function argmaxArr(arr: number[]): number {
  let maxIdx = 0
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > arr[maxIdx]) maxIdx = i
  }
  return maxIdx
}

// ─── DP Breakdown View ───────────────────────────────────────────────────────

function DPBreakdownView({ bd }: { bd: DPSweepBreakdown }) {
  const formula = useMemo(() => generateDPFormula(bd), [bd])
  const narrative = useMemo(() => generateDPNarrative(bd), [bd])

  return (
    <div className="flex flex-col gap-4">
      {/* Narrative */}
      <div className="bg-surface rounded-lg p-3">
        <p className="text-sm text-text leading-relaxed">
          {narrative}
        </p>
      </div>

      {/* Formula */}
      <div>
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
          Bellman Equation ({bd.algorithm === 'value-iteration' ? 'Value Iteration' : 'Policy Iteration'})
        </h4>
        <div className="bg-surface rounded-lg p-3 overflow-x-auto">
          <RenderedEquation tex={formula} />
        </div>
      </div>

      {/* Top changes table */}
      <div>
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
          Top Cell Value Changes
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-lighter">
                <th className="text-left py-1.5 px-2 text-text-muted font-medium">Cell</th>
                <th className="text-right py-1.5 px-2 text-text-muted font-medium">Old V*</th>
                <th className="text-right py-1.5 px-2 text-text-muted font-medium">New V*</th>
                <th className="text-right py-1.5 px-2 text-text-muted font-medium">Delta</th>
                <th className="text-left py-1.5 px-2 text-text-muted font-medium">Best Action</th>
              </tr>
            </thead>
            <tbody>
              {bd.topChanges.map((c) => (
                <tr key={c.key} className="border-b border-surface-lighter last:border-0">
                  <td className="py-1.5 px-2 font-mono text-text">({c.row},{c.col})</td>
                  <td className="py-1.5 px-2 text-right font-mono text-text-muted">
                    {fmt(c.oldBestValue)}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-text">
                    {fmt(c.newBestValue)}
                  </td>
                  <td className={`py-1.5 px-2 text-right font-mono ${
                    c.delta < 0.001 ? 'text-text-muted' : 'text-accent-yellow'
                  }`}>
                    {fmt(c.delta)}
                  </td>
                  <td className="py-1.5 px-2 text-text">
                    {c.bestActionName}
                  </td>
                </tr>
              ))}
              {bd.topChanges.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-3 text-center text-text-muted text-xs">
                    No changes recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Convergence indicator */}
      <div className="flex items-center gap-3 bg-surface rounded-lg p-3">
        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
          bd.converged
            ? 'bg-accent-green'
            : bd.maxDelta < 0.1
              ? 'bg-accent-yellow'
              : 'bg-accent-red'
        }`} />
        <div className="text-sm">
          <span className="text-text font-medium">
            Max delta: {fmt(bd.maxDelta)}
          </span>
          <span className="text-text-muted ml-2">
            {bd.converged
              ? 'Converged! Values are stable.'
              : bd.maxDelta < 0.1
                ? 'Nearly converged \u2014 values stabilizing.'
                : 'Still converging \u2014 values changing significantly.'
            }
          </span>
        </div>
      </div>
    </div>
  )
}
