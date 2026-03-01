/**
 * banditStepBreakdown.ts
 *
 * Pure computation: reconstructs detailed step breakdowns from
 * consecutive MAB history entries for all three algorithms.
 */

import type { SimulationStep } from '../algorithms/types'
import { argmax } from './math'

// ─── Types ───────────────────────────────────────────────────────────────────

type BanditAlgorithm = 'epsilon-greedy' | 'ucb' | 'thompson-sampling'

export interface BanditArmSnapshot {
  arm: number
  prePulls: number
  postPulls: number
  preEstimate: number
  postEstimate: number
  estimateChange: number
  isSelected: boolean
  isBestArm: boolean       // true arm with highest true mean
  trueMean: number
}

/** UCB-specific extras per arm */
export interface UCBArmSnapshot extends BanditArmSnapshot {
  ucbBonus: number
  ucbScore: number
}

/** Thompson-specific extras per arm */
export interface ThompsonArmSnapshot extends BanditArmSnapshot {
  preAlpha: number
  preBeta: number
  postAlpha: number
  postBeta: number
  preMean: number   // alpha / (alpha + beta)
}

export interface BanditStepBreakdown {
  stepIndex: number
  action: number            // arm pulled
  reward: number
  algorithm: BanditAlgorithm
  numArms: number

  // Exploration/exploitation
  isExploration: boolean
  greedyArm: number         // argmax of pre-estimates
  explorationReason: string  // human-readable reason

  // Per-arm data (one of these depending on algorithm)
  arms: BanditArmSnapshot[]
  ucbArms: UCBArmSnapshot[] | null
  thompsonArms: ThompsonArmSnapshot[] | null

  // Update details for selected arm
  preEstimate: number
  postEstimate: number
  prePulls: number
  postPulls: number

  // Algorithm params
  epsilon: number           // only for epsilon-greedy
  confidence: number        // only for UCB
  totalStepsBefore: number  // t before this step (for UCB ln(t))
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function fmt(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) < 1000) return n.toString()
  const s = n.toFixed(3)
  return s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '.0')
}

function getArr(values: Record<string, number[]>, key: string, fallbackLen: number): number[] {
  return values[key] ?? new Array(fallbackLen).fill(0)
}

// ─── Main Computation ────────────────────────────────────────────────────────

export function computeBanditBreakdown(
  history: SimulationStep[],
  stepIndex: number,
  algorithm: BanditAlgorithm,
  trueMeans: number[],
  epsilon: number,
  confidence: number,
): BanditStepBreakdown | null {
  if (stepIndex < 0 || stepIndex >= history.length) return null

  const step = history[stepIndex]
  const action = step.action as number
  const numArms = trueMeans.length
  const bestArmIdx = trueMeans.indexOf(Math.max(...trueMeans))

  // Pre/post values
  const preValues = stepIndex > 0 ? history[stepIndex - 1].values : {}
  const postValues = step.values

  const preEstimates = getArr(preValues, 'estimates', numArms)
  const postEstimates = getArr(postValues, 'estimates', numArms)
  const preCounts = getArr(preValues, 'counts', numArms)
  const postCounts = getArr(postValues, 'counts', numArms)

  const preEstimate = preEstimates[action]
  const postEstimate = postEstimates[action]
  const prePulls = preCounts[action]
  const postPulls = postCounts[action]

  // Total steps before this step (sum of all pre-counts)
  const totalStepsBefore = preCounts.reduce((a, b) => a + b, 0)

  // Exploration detection
  const greedyArm = argmax(preEstimates)
  const allZero = preEstimates.every((v) => v === 0)
  let isExploration = false
  let explorationReason = ''

  if (algorithm === 'epsilon-greedy') {
    if (allZero) {
      explorationReason = 'All estimates are {{v:0}} \u2014 any arm is equally good'
    } else if (action !== greedyArm) {
      isExploration = true
      explorationReason = `Random pick ({{v:\u03B5=${fmt(epsilon)}}}) \u2014 greedy choice was {{arm:${greedyArm}:Arm ${greedyArm}}}`
    } else {
      explorationReason = `Best known arm (greedy, {{v:\u03B5-exploitation}})`
    }
  } else if (algorithm === 'ucb') {
    const hasUnpulled = preCounts.some((c) => c === 0)
    if (hasUnpulled) {
      isExploration = true
      explorationReason = `Initialization \u2014 {{arm:${action}:Arm ${action}}} hadn't been tried yet`
    } else {
      explorationReason = 'Arm with highest UCB score (estimate + exploration bonus)'
    }
  } else {
    // Thompson — always stochastic, describe the posterior
    explorationReason = 'Sampled from each arm\u2019s Beta posterior; highest sample wins'
  }

  // Build base arm snapshots
  const arms: BanditArmSnapshot[] = Array.from({ length: numArms }, (_, i) => ({
    arm: i,
    prePulls: preCounts[i],
    postPulls: postCounts[i],
    preEstimate: preEstimates[i],
    postEstimate: postEstimates[i],
    estimateChange: postEstimates[i] - preEstimates[i],
    isSelected: i === action,
    isBestArm: i === bestArmIdx,
    trueMean: trueMeans[i],
  }))

  // UCB extras
  let ucbArms: UCBArmSnapshot[] | null = null
  if (algorithm === 'ucb') {
    const t = Math.max(totalStepsBefore, 1)
    ucbArms = arms.map((a) => {
      const bonus = a.prePulls > 0
        ? confidence * Math.sqrt(Math.log(t) / a.prePulls)
        : Infinity
      return {
        ...a,
        ucbBonus: bonus,
        ucbScore: a.prePulls > 0 ? a.preEstimate + bonus : Infinity,
      }
    })
  }

  // Thompson extras
  let thompsonArms: ThompsonArmSnapshot[] | null = null
  if (algorithm === 'thompson-sampling') {
    const preAlphas = getArr(preValues, 'alphas', numArms).map((v) => v || 1)
    const preBetas = getArr(preValues, 'betas', numArms).map((v) => v || 1)
    const postAlphas = getArr(postValues, 'alphas', numArms)
    const postBetas = getArr(postValues, 'betas', numArms)

    thompsonArms = arms.map((a, i) => ({
      ...a,
      preAlpha: preAlphas[i],
      preBeta: preBetas[i],
      postAlpha: postAlphas[i],
      postBeta: postBetas[i],
      preMean: preAlphas[i] / (preAlphas[i] + preBetas[i]),
    }))
  }

  return {
    stepIndex,
    action,
    reward: step.reward,
    algorithm,
    numArms,
    isExploration,
    greedyArm,
    explorationReason,
    arms,
    ucbArms,
    thompsonArms,
    preEstimate,
    postEstimate,
    prePulls,
    postPulls,
    epsilon,
    confidence,
    totalStepsBefore,
  }
}

// ─── KaTeX Formula Generation ────────────────────────────────────────────────

export function generateBanditFormula(bd: BanditStepBreakdown): string {
  const a = bd.action
  const r = bd.reward
  const preQ = bd.preEstimate
  const postQ = bd.postEstimate
  const N = bd.postPulls // N(a) after increment

  if (bd.algorithm === 'epsilon-greedy' || bd.algorithm === 'ucb') {
    // Incremental mean update: Q(a) += (r - Q(a)) / N(a)
    const delta = r - preQ
    const step = delta / N

    const lines = [
      `Q(\\text{Arm ${a}}) &\\leftarrow Q(\\text{Arm ${a}}) + \\frac{r - Q(\\text{Arm ${a}})}{N(\\text{Arm ${a}})}`,
      `&= ${fmt(preQ)} + \\frac{${fmt(r)} - ${fmt(preQ)}}{${N}}`,
      `&= ${fmt(preQ)} + \\frac{${fmt(delta)}}{${N}}`,
      `&= ${fmt(preQ)} + ${fmt(step)}`,
      `&= \\boxed{${fmt(postQ)}}`,
    ]

    if (bd.algorithm === 'ucb' && bd.ucbArms) {
      const selected = bd.ucbArms[a]
      if (selected.prePulls > 0 && isFinite(selected.ucbBonus)) {
        const ucbLines = [
          ``,
          `\\text{UCB score (before pull):}`,
          `\\text{UCB}(\\text{Arm ${a}}) &= Q(a) + c\\sqrt{\\frac{\\ln t}{N(a)}}`,
          `&= ${fmt(selected.preEstimate)} + ${fmt(bd.confidence)} \\times \\sqrt{\\frac{\\ln ${bd.totalStepsBefore}}{${selected.prePulls}}}`,
          `&= ${fmt(selected.preEstimate)} + ${fmt(selected.ucbBonus)}`,
          `&= ${fmt(selected.ucbScore)}`,
        ]
        lines.push(...ucbLines)
      }
    }

    return `\\begin{aligned}\n${lines.join(' \\\\\n')}\n\\end{aligned}`
  }

  // Thompson Sampling
  if (bd.thompsonArms) {
    const arm = bd.thompsonArms[a]
    const sigmoid = 1 / (1 + Math.exp(-r))

    const lines = [
      `\\text{Estimate update (incremental mean):}`,
      `Q(\\text{Arm ${a}}) &\\leftarrow ${fmt(preQ)} + \\frac{${fmt(r)} - ${fmt(preQ)}}{${N}} = \\boxed{${fmt(postQ)}}`,
      ``,
      `\\text{Beta posterior update:}`,
      `p &= \\sigma(r) = \\frac{1}{1 + e^{-r}} = \\frac{1}{1 + e^{-${fmt(r)}}} = ${fmt(sigmoid)}`,
      ``,
      `\\text{Bernoulli trial with } p = ${fmt(sigmoid)}:`,
    ]

    if (arm.postAlpha > arm.preAlpha) {
      lines.push(
        `\\alpha_{${a}} &: ${fmt(arm.preAlpha)} \\to ${fmt(arm.postAlpha)} \\quad (\\text{success} \\uparrow)`,
        `\\beta_{${a}} &: ${fmt(arm.preBeta)} \\quad (\\text{unchanged})`,
      )
    } else {
      lines.push(
        `\\alpha_{${a}} &: ${fmt(arm.preAlpha)} \\quad (\\text{unchanged})`,
        `\\beta_{${a}} &: ${fmt(arm.preBeta)} \\to ${fmt(arm.postBeta)} \\quad (\\text{failure} \\uparrow)`,
      )
    }

    return `\\begin{aligned}\n${lines.join(' \\\\\n')}\n\\end{aligned}`
  }

  return ''
}

// ─── Narrative Generation ────────────────────────────────────────────────────

export function generateBanditNarrative(bd: BanditStepBreakdown): string {
  const algoName =
    bd.algorithm === 'epsilon-greedy' ? '\u03B5-Greedy'
    : bd.algorithm === 'ucb' ? 'UCB'
    : 'Thompson Sampling'

  const rewardStr = bd.reward >= 0 ? `+${fmt(bd.reward)}` : fmt(bd.reward)

  let selectionDetail: string
  if (bd.algorithm === 'ucb' && bd.ucbArms) {
    const score = bd.ucbArms[bd.action]
    if (!isFinite(score.ucbScore)) {
      selectionDetail = `(first pull \u2014 initialization)`
    } else {
      selectionDetail = `(UCB score: {{v:${fmt(score.ucbScore)}}})`
    }
  } else if (bd.algorithm === 'thompson-sampling' && bd.thompsonArms) {
    const arm = bd.thompsonArms[bd.action]
    selectionDetail = `(Beta prior: \u03B1={{v:${fmt(arm.preAlpha)}}}, \u03B2={{v:${fmt(arm.preBeta)}}})`
  } else {
    selectionDetail = `(estimate: {{v:${fmt(bd.preEstimate)}}})`
  }

  return `At step {{v:${bd.stepIndex}}}, ${algoName} pulled {{arm:${bd.action}:Arm ${bd.action}}} ${selectionDetail}. ${bd.explorationReason}. Reward: {{r:${rewardStr}}}.\nTrue mean for this arm: {{v:${fmt(bd.arms[bd.action].trueMean)}}}. Estimate updated: {{v:${fmt(bd.preEstimate)}}} \u2192 {{v:${fmt(bd.postEstimate)}}}.`
}
