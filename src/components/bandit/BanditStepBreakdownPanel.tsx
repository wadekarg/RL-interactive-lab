import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import katex from 'katex'
import { useSimulationStore } from '../../store/simulationStore'
import {
  computeBanditBreakdown,
  generateBanditFormula,
  generateQUpdateFormula,
  generateUCBBeforeFormula,
  generateUCBAfterFormula,
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

// ─── Styled narrative parser ─────────────────────────────────────────────────
// Tokens: {{v:text}} = bold value, {{arm:idx:text}} = arm chart color, {{r:text}} = reward (green/red)

import { ARM_COLORS } from '../../utils/colors'

const TOKEN_RE = /\{\{(v|arm|r):(.+?)\}\}/g

function StyledNarrative({ text }: { text: string }) {
  const parts: React.ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = TOKEN_RE.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    const [, type, payload] = match
    if (type === 'arm') {
      // payload = "idx:display text"
      const sep = payload.indexOf(':')
      const idx = parseInt(payload.slice(0, sep), 10)
      const label = payload.slice(sep + 1)
      const color = ARM_COLORS[idx % ARM_COLORS.length]
      parts.push(<span key={key++} className="font-semibold" style={{ color }}>{label}</span>)
    } else if (type === 'r') {
      const isNeg = payload.startsWith('-')
      parts.push(<span key={key++} className={`font-semibold ${isNeg ? 'text-accent-red' : 'text-accent-green'}`}>{payload}</span>)
    } else {
      parts.push(<span key={key++} className="font-semibold text-text">{payload}</span>)
    }
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))

  return <>{parts}</>
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

  // Reward stats for this step
  const rewardStats = useMemo(() => {
    if (history.length === 0 || effectiveIndex < 0) return null
    const stepReward = history[effectiveIndex].reward
    let cumulative = 0
    for (let i = 0; i <= effectiveIndex; i++) cumulative += history[i].reward
    let total = cumulative
    for (let i = effectiveIndex + 1; i < history.length; i++) total += history[i].reward
    return { stepReward, cumulative, total }
  }, [history, effectiveIndex])

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

          {breakdown && <BreakdownContent bd={breakdown} rewardStats={rewardStats} />}
        </div>
      )}
    </div>
  )
}

// ─── Breakdown Content ───────────────────────────────────────────────────────

interface RewardStats {
  stepReward: number
  cumulative: number
  total: number
}

function BreakdownContent({ bd, rewardStats }: { bd: BanditStepBreakdown; rewardStats: RewardStats | null }) {
  const formula     = useMemo(() => generateBanditFormula(bd), [bd])
  const qUpdate     = useMemo(() => generateQUpdateFormula(bd), [bd])
  const ucbBefore   = useMemo(() => generateUCBBeforeFormula(bd), [bd])
  const ucbAfter    = useMemo(() => generateUCBAfterFormula(bd), [bd])
  const narrative   = useMemo(() => generateBanditNarrative(bd), [bd])

  const rewardTex = useMemo(() => {
    if (!rewardStats) return ''
    const t = bd.stepIndex
    return `r_{${t}} = ${fmt(rewardStats.stepReward)}`
  }, [bd.stepIndex, rewardStats])

  const cumulativeTex = useMemo(() => {
    if (!rewardStats) return ''
    const t = bd.stepIndex
    return `G_{${t}} = \\sum_{i=0}^{${t}} r_i = ${fmt(rewardStats.cumulative)}`
  }, [bd.stepIndex, rewardStats])

  const algoLabel =
    bd.algorithm === 'epsilon-greedy' ? '\u03B5-Greedy'
    : bd.algorithm === 'ucb' ? 'UCB'
    : 'Thompson Sampling'

  const isUCB = bd.algorithm === 'ucb'

  return (
    <div className="flex flex-col gap-4">
      {/* Narrative */}
      <div className="bg-surface rounded-lg p-3">
        {narrative.split('\n').map((line, i) => (
          <p key={i} className="text-sm text-text-muted leading-relaxed">
            <StyledNarrative text={line} />
          </p>
        ))}
      </div>

      {isUCB ? (
        <>
          {/* Row 1: Q Update | Reward + Cumulative side by side */}
          <div>
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              UCB Update
            </h4>
            <div className="bg-surface rounded-lg">
              <div className="flex">
                <div className="flex-1 min-w-0 p-3">
                  <p className="text-xs font-semibold text-text-muted mb-1">Q(a) Update</p>
                  <RenderedEquation tex={qUpdate} />
                </div>
                <div className="w-px bg-surface-lighter flex-shrink-0" />
                <div className="flex-1 min-w-0 p-3">
                  <p className="text-xs font-semibold text-text-muted mb-1">Reward</p>
                  <RenderedEquation tex={rewardTex} />
                  <RenderedEquation tex={cumulativeTex} />
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: UCB Before | UCB After side by side */}
          <div>
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              UCB Score
            </h4>
            <div className="bg-surface rounded-lg">
              <div className="flex">
                <div className="flex-1 min-w-0 p-3">
                  <p className="text-xs font-semibold text-text-muted mb-0.5">Before Pull</p>
                  <p className="text-xs text-text-muted opacity-60 mb-1">
                    {bd.stepIndex === 0
                      ? 'Step 0 — no previous step, initial state'
                      : (() => {
                          const sel = bd.ucbArms![bd.action]
                          const score = isFinite(sel.ucbScore) ? fmt(sel.ucbScore) : '∞'
                          return `From step ${bd.stepIndex - 1} — Arm ${bd.action} had the highest UCB score (${score}), so it was selected`
                        })()
                    }
                  </p>
                  <RenderedEquation tex={ucbBefore} />
                  {bd.ucbArms && bd.ucbArms[bd.action].prePulls === 0 && (
                    <p className="text-xs text-text-muted mt-1">
                      N(a) = 0 — this arm has never been pulled. UCB = ∞ guarantees it is selected first (forced exploration).
                    </p>
                  )}
                </div>
                <div className="w-px bg-surface-lighter flex-shrink-0" />
                <div className="flex-1 min-w-0 p-3">
                  <p className="text-xs font-semibold text-text-muted mb-0.5">After Pull</p>
                  <p className="text-xs text-text-muted opacity-60 mb-1">updated this step — carries into next</p>
                  <RenderedEquation tex={ucbAfter} />
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Non-UCB: original layout */
        <div>
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            {algoLabel} Update
          </h4>
          <div className="bg-surface rounded-lg p-3 overflow-x-auto">
            <RenderedEquation tex={formula} />
            {rewardTex && (
              <>
                <div className="border-t border-surface-lighter my-2" />
                <RenderedEquation tex={`${rewardTex}, \\qquad ${cumulativeTex}`} />
              </>
            )}
          </div>
        </div>
      )}

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
      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
        All Arms &mdash; UCB Scores (before pull)
      </h4>
      <p className="text-xs text-text-muted mb-2">
        UCB scores are recomputed for <span className="font-semibold text-text">every arm</span> at every step — not just the one pulled.
      </p>
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
