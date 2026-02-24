import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import katex from 'katex'
import { useSimulationStore } from '../../store/simulationStore'
import {
  computeBanditBreakdown,
  generateBanditFormula,
  generateBanditNarrative,
  fmt,
} from '../../utils/banditStepBreakdown'
import type {
  BanditStepBreakdown,
  BanditArmSnapshot,
  UCBArmSnapshot,
  ThompsonArmSnapshot,
} from '../../utils/banditStepBreakdown'

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

interface BanditStepBreakdownPanelProps {
  algorithmType: 'epsilon-greedy' | 'ucb' | 'thompson-sampling'
  trueMeans: number[]
  epsilon: number
  confidence: number
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function BanditStepBreakdownPanel({
  algorithmType,
  trueMeans,
  epsilon,
  confidence,
}: BanditStepBreakdownPanelProps) {
  const { history, selectedStepIndex, setSelectedStepIndex } = useSimulationStore()
  const [collapsed, setCollapsed] = useState(false)

  const maxIndex = history.length - 1

  const effectiveIndex = selectedStepIndex !== null
    ? Math.min(selectedStepIndex, maxIndex)
    : maxIndex

  useEffect(() => {
    if (history.length === 0) setSelectedStepIndex(null)
  }, [history.length, setSelectedStepIndex])

  // Navigation
  const goTo = useCallback((idx: number) => {
    setSelectedStepIndex(Math.max(0, Math.min(idx, maxIndex)))
  }, [maxIndex, setSelectedStepIndex])

  const goPrev = useCallback(() => goTo(effectiveIndex - 1), [effectiveIndex, goTo])
  const goNext = useCallback(() => goTo(effectiveIndex + 1), [effectiveIndex, goTo])

  // Direct input
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

  const breakdown = useMemo(() => {
    if (history.length === 0 || effectiveIndex < 0) return null
    return computeBanditBreakdown(history, effectiveIndex, algorithmType, trueMeans, epsilon, confidence)
  }, [history, effectiveIndex, algorithmType, trueMeans, epsilon, confidence])

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
          {/* Prev */}
          <button
            onClick={goPrev}
            disabled={effectiveIndex <= 0}
            className="p-1 rounded bg-surface text-text-muted hover:text-text hover:bg-surface-lighter disabled:opacity-30 disabled:cursor-not-allowed border-0 cursor-pointer transition-colors"
            title="Previous step"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" />
            </svg>
          </button>

          {/* Direct input */}
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

          {/* Next */}
          <button
            onClick={goNext}
            disabled={effectiveIndex >= maxIndex}
            className="p-1 rounded bg-surface text-text-muted hover:text-text hover:bg-surface-lighter disabled:opacity-30 disabled:cursor-not-allowed border-0 cursor-pointer transition-colors"
            title="Next step"
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

          {breakdown && <BreakdownContent bd={breakdown} />}
        </div>
      )}
    </div>
  )
}

// ─── Breakdown Content ───────────────────────────────────────────────────────

function BreakdownContent({ bd }: { bd: BanditStepBreakdown }) {
  const formula = useMemo(() => generateBanditFormula(bd), [bd])
  const narrative = useMemo(() => generateBanditNarrative(bd), [bd])

  const algoLabel =
    bd.algorithm === 'epsilon-greedy' ? '\u03B5-Greedy'
    : bd.algorithm === 'ucb' ? 'UCB'
    : 'Thompson Sampling'

  return (
    <div className="flex flex-col gap-4">
      {/* Narrative */}
      <div className="bg-surface rounded-lg p-3">
        <p className="text-sm text-text leading-relaxed">{narrative}</p>
      </div>

      {/* Formula */}
      <div>
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
          {algoLabel} Update
        </h4>
        <div className="bg-surface rounded-lg p-3 overflow-x-auto">
          <RenderedEquation tex={formula} />
        </div>
      </div>

      {/* Arm table — algorithm-specific */}
      {bd.algorithm === 'ucb' && bd.ucbArms
        ? <UCBArmTable arms={bd.ucbArms} action={bd.action} />
        : bd.algorithm === 'thompson-sampling' && bd.thompsonArms
          ? <ThompsonArmTable arms={bd.thompsonArms} action={bd.action} />
          : <BaseArmTable arms={bd.arms} action={bd.action} />
      }
    </div>
  )
}

// ─── Epsilon-Greedy Arm Table ────────────────────────────────────────────────

function BaseArmTable({ arms, action: _action }: { arms: BanditArmSnapshot[]; action: number }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
        All Arms &mdash; Before &rarr; After
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-lighter">
              <th className="text-left py-1.5 px-2 text-text-muted font-medium">Arm</th>
              <th className="text-right py-1.5 px-2 text-text-muted font-medium">Pulls</th>
              <th className="text-right py-1.5 px-2 text-text-muted font-medium">Estimate (Before)</th>
              <th className="text-right py-1.5 px-2 text-text-muted font-medium">Estimate (After)</th>
              <th className="text-right py-1.5 px-2 text-text-muted font-medium">Change</th>
              <th className="text-right py-1.5 px-2 text-text-muted font-medium">True Mean</th>
            </tr>
          </thead>
          <tbody>
            {arms.map((a) => (
              <tr
                key={a.arm}
                className={`border-b border-surface-lighter last:border-0 ${
                  a.isSelected ? 'bg-primary/10' : ''
                }`}
              >
                <td className="py-1.5 px-2 text-text">
                  Arm {a.arm}
                  {a.isSelected && <span className="ml-1.5 text-xs text-primary-light font-medium">(pulled)</span>}
                  {a.isBestArm && <span className="ml-1 text-xs text-accent-green font-medium">(best)</span>}
                </td>
                <td className="py-1.5 px-2 text-right font-mono text-text-muted">{a.postPulls}</td>
                <td className="py-1.5 px-2 text-right font-mono text-text-muted">{fmt(a.preEstimate)}</td>
                <td className="py-1.5 px-2 text-right font-mono text-text">{fmt(a.postEstimate)}</td>
                <td className={`py-1.5 px-2 text-right font-mono ${
                  Math.abs(a.estimateChange) < 1e-10
                    ? 'text-text-muted'
                    : a.estimateChange > 0 ? 'text-accent-green' : 'text-accent-red'
                }`}>
                  {Math.abs(a.estimateChange) < 1e-10 ? '-' : (a.estimateChange > 0 ? '+' : '') + fmt(a.estimateChange)}
                </td>
                <td className="py-1.5 px-2 text-right font-mono text-text-muted">{fmt(a.trueMean)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── UCB Arm Table ───────────────────────────────────────────────────────────

function UCBArmTable({ arms, action: _action }: { arms: UCBArmSnapshot[]; action: number }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
        All Arms &mdash; UCB Scores (before pull)
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-lighter">
              <th className="text-left py-1.5 px-2 text-text-muted font-medium">Arm</th>
              <th className="text-right py-1.5 px-2 text-text-muted font-medium">Pulls</th>
              <th className="text-right py-1.5 px-2 text-text-muted font-medium">Q(a)</th>
              <th className="text-right py-1.5 px-2 text-text-muted font-medium">Bonus</th>
              <th className="text-right py-1.5 px-2 text-text-muted font-medium">UCB Score</th>
              <th className="text-right py-1.5 px-2 text-text-muted font-medium">True Mean</th>
            </tr>
          </thead>
          <tbody>
            {arms.map((a) => (
              <tr
                key={a.arm}
                className={`border-b border-surface-lighter last:border-0 ${
                  a.isSelected ? 'bg-primary/10' : ''
                }`}
              >
                <td className="py-1.5 px-2 text-text">
                  Arm {a.arm}
                  {a.isSelected && <span className="ml-1.5 text-xs text-primary-light font-medium">(pulled)</span>}
                  {a.isBestArm && <span className="ml-1 text-xs text-accent-green font-medium">(best)</span>}
                </td>
                <td className="py-1.5 px-2 text-right font-mono text-text-muted">{a.prePulls}</td>
                <td className="py-1.5 px-2 text-right font-mono text-text-muted">{fmt(a.preEstimate)}</td>
                <td className="py-1.5 px-2 text-right font-mono text-accent-yellow">
                  {isFinite(a.ucbBonus) ? fmt(a.ucbBonus) : '\u221E'}
                </td>
                <td className={`py-1.5 px-2 text-right font-mono font-medium ${
                  a.isSelected ? 'text-primary-light' : 'text-text'
                }`}>
                  {isFinite(a.ucbScore) ? fmt(a.ucbScore) : '\u221E'}
                </td>
                <td className="py-1.5 px-2 text-right font-mono text-text-muted">{fmt(a.trueMean)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Thompson Sampling Arm Table ─────────────────────────────────────────────

function ThompsonArmTable({ arms, action: _action }: { arms: ThompsonArmSnapshot[]; action: number }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
        All Arms &mdash; Beta Posteriors
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-lighter">
              <th className="text-left py-1.5 px-2 text-text-muted font-medium">Arm</th>
              <th className="text-right py-1.5 px-2 text-text-muted font-medium">Pulls</th>
              <th className="text-right py-1.5 px-2 text-text-muted font-medium">&alpha;</th>
              <th className="text-right py-1.5 px-2 text-text-muted font-medium">&beta;</th>
              <th className="text-right py-1.5 px-2 text-text-muted font-medium">Prior Mean</th>
              <th className="text-right py-1.5 px-2 text-text-muted font-medium">Estimate</th>
              <th className="text-right py-1.5 px-2 text-text-muted font-medium">True Mean</th>
            </tr>
          </thead>
          <tbody>
            {arms.map((a) => {
              const alphaChanged = a.postAlpha !== a.preAlpha
              const betaChanged = a.postBeta !== a.preBeta
              return (
                <tr
                  key={a.arm}
                  className={`border-b border-surface-lighter last:border-0 ${
                    a.isSelected ? 'bg-primary/10' : ''
                  }`}
                >
                  <td className="py-1.5 px-2 text-text">
                    Arm {a.arm}
                    {a.isSelected && <span className="ml-1.5 text-xs text-primary-light font-medium">(pulled)</span>}
                    {a.isBestArm && <span className="ml-1 text-xs text-accent-green font-medium">(best)</span>}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-text-muted">{a.postPulls}</td>
                  <td className={`py-1.5 px-2 text-right font-mono ${
                    a.isSelected && alphaChanged ? 'text-accent-green font-medium' : 'text-text-muted'
                  }`}>
                    {fmt(a.postAlpha)}
                    {a.isSelected && alphaChanged && <span className="text-xs"> (+1)</span>}
                  </td>
                  <td className={`py-1.5 px-2 text-right font-mono ${
                    a.isSelected && betaChanged ? 'text-accent-red font-medium' : 'text-text-muted'
                  }`}>
                    {fmt(a.postBeta)}
                    {a.isSelected && betaChanged && <span className="text-xs"> (+1)</span>}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-text-muted">
                    {fmt(a.preMean)}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-text">
                    {fmt(a.postEstimate)}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-text-muted">{fmt(a.trueMean)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
