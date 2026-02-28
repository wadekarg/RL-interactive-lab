/**
 * rocketLandingStepBreakdown.ts
 *
 * Pure computation: generates step breakdowns for Rocket Landing algorithms.
 * No React or side-effects.
 */

import type { SimulationStep } from '../algorithms/types'
import type { RocketState, RocketAction } from '../environments/rocketLanding'
import { ROCKET_ACTION_NAMES, discretizeRocket, getLandingResult } from '../environments/rocketLanding'
import type { RocketDiscretizationConfig } from '../environments/rocketLanding'
import { argmax } from './math'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RocketTDBreakdown {
  type: 'rocket-td'
  stepIndex: number
  episode: number
  stepInEpisode: number
  state: RocketState
  action: RocketAction
  actionName: string
  reward: number
  nextState: RocketState
  done: boolean
  discretizedKey: string
  nextDiscretizedKey: string

  isExploration: boolean
  greedyAction: RocketAction
  greedyActionName: string

  preQValues: number[]
  postQValues: number[]
  preQ: number
  postQ: number
  bootstrapValue: number
  target: number
  tdError: number
  alpha: number
  gamma: number
}

export interface RocketReinforceBreakdown {
  type: 'rocket-reinforce'
  stepIndex: number
  episode: number
  stepInEpisode: number
  state: RocketState
  action: RocketAction
  actionName: string
  reward: number
  nextState: RocketState
  done: boolean
  episodeDuration: number | null
  episodeReturn: number | null
  features: number[]
  featureLabels: string[]
  probabilities: number[]
  baseline: number
}

export interface RocketRandomBreakdown {
  type: 'rocket-random'
  stepIndex: number
  episode: number
  stepInEpisode: number
  state: RocketState
  action: RocketAction
  actionName: string
  reward: number
  done: boolean
}

export type RocketBreakdown = RocketTDBreakdown | RocketReinforceBreakdown | RocketRandomBreakdown

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function fmt(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) < 1000) return n.toString()
  const s = n.toFixed(3)
  return s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '.0')
}

function getQValues(values: Record<string, number[]>, key: string): number[] {
  return values[key] ?? [0, 0, 0]
}

function getEpisodeInfo(history: SimulationStep[], stepIndex: number): {
  episode: number
  stepInEpisode: number
} {
  let episode = 1
  let stepInEpisode = 0
  for (let i = 0; i <= stepIndex; i++) {
    if (i === 0) {
      episode = 1
      stepInEpisode = 0
    } else if (history[i - 1].done) {
      episode++
      stepInEpisode = 0
    } else {
      stepInEpisode++
    }
  }
  return { episode, stepInEpisode }
}

function getEpisodeDuration(history: SimulationStep[], stepIndex: number): number | null {
  let end = stepIndex
  while (end < history.length && !history[end].done) end++
  if (end >= history.length) return null

  let start = stepIndex
  while (start > 0 && !history[start - 1].done) start--

  return end - start + 1
}

function getEpisodeReturn(history: SimulationStep[], stepIndex: number): number | null {
  let end = stepIndex
  while (end < history.length && !history[end].done) end++
  if (end >= history.length) return null

  let start = stepIndex
  while (start > 0 && !history[start - 1].done) start--

  let total = 0
  for (let i = start; i <= end; i++) {
    total += history[i].reward
  }
  return Math.round(total * 100) / 100
}

// ─── REINFORCE feature/probability helpers ──────────────────────────────────

const NUM_ROCKET_FEATURES = 11
const NUM_ROCKET_ACTIONS = 3
const ROCKET_FEATURE_LABELS = ['bias', 'x', 'v', 'y', 'vy', '\u03B8', '\u03C9', '\u03B8\u00B2', '\u03C9\u00B2', 'y\u00B2', 'vy\u00B2']

function rocketFeatures(s: RocketState): number[] {
  const xNorm = s.x / 2.4
  const vNorm = s.xDot / 3.0
  const yNorm = s.y / 1.0
  const vyNorm = s.yDot / 5.0
  const thetaNorm = s.theta / (12 * Math.PI / 180)
  const omegaNorm = s.thetaDot / 3.5
  return [1, xNorm, vNorm, yNorm, vyNorm, thetaNorm, omegaNorm, thetaNorm * thetaNorm, omegaNorm * omegaNorm, yNorm * yNorm, vyNorm * vyNorm]
}

function softmax(logits: number[]): number[] {
  const maxLogit = Math.max(...logits)
  const exps = logits.map((l) => Math.exp(l - maxLogit))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum)
}

function computeProbsFromWeights(flatWeights: number[], numActions: number, numFeatures: number, phi: number[]): number[] {
  const logits: number[] = []
  for (let a = 0; a < numActions; a++) {
    let sum = 0
    for (let f = 0; f < numFeatures; f++) {
      sum += flatWeights[a * numFeatures + f] * phi[f]
    }
    logits.push(sum)
  }
  return softmax(logits)
}

// ─── TD Breakdown (Discretized Q-Learning) ──────────────────────────────────

export function computeRocketTDBreakdown(
  history: SimulationStep[],
  stepIndex: number,
  alpha: number,
  gamma: number,
  discretizationConfig: RocketDiscretizationConfig,
): RocketTDBreakdown | null {
  if (stepIndex < 0 || stepIndex >= history.length) return null

  const step = history[stepIndex]
  const state = step.state as RocketState
  const action = step.action as RocketAction
  const nextState = step.nextState as RocketState

  const sk = discretizeRocket(state, discretizationConfig)
  const nsk = discretizeRocket(nextState, discretizationConfig)

  const preValues = stepIndex > 0 ? history[stepIndex - 1].values : {}
  const postValues = step.values

  const preQValues = getQValues(preValues, sk)
  const postQValues = getQValues(postValues, sk)
  const preQ = preQValues[action]
  const postQ = postQValues[action]

  const nextPreQ = getQValues(preValues, nsk)
  const bootstrapValue = step.done ? 0 : Math.max(...nextPreQ)
  const target = step.reward + (step.done ? 0 : gamma * bootstrapValue)
  const tdError = target - preQ

  const greedyAction = argmax(preQValues) as RocketAction
  const allEqual = preQValues.every((v) => v === preQValues[0])
  const isExploration = !allEqual && action !== greedyAction

  const { episode, stepInEpisode } = getEpisodeInfo(history, stepIndex)

  return {
    type: 'rocket-td',
    stepIndex,
    episode,
    stepInEpisode,
    state,
    action,
    actionName: ROCKET_ACTION_NAMES[action],
    reward: step.reward,
    nextState,
    done: step.done,
    discretizedKey: sk,
    nextDiscretizedKey: nsk,
    isExploration,
    greedyAction,
    greedyActionName: ROCKET_ACTION_NAMES[greedyAction],
    preQValues,
    postQValues,
    preQ,
    postQ,
    bootstrapValue,
    target,
    tdError,
    alpha,
    gamma,
  }
}

// ─── REINFORCE Breakdown ────────────────────────────────────────────────────

export function computeRocketReinforceBreakdown(
  history: SimulationStep[],
  stepIndex: number,
): RocketReinforceBreakdown | null {
  if (stepIndex < 0 || stepIndex >= history.length) return null

  const step = history[stepIndex]
  const state = step.state as RocketState
  const action = step.action as RocketAction
  const nextState = step.nextState as RocketState

  const { episode, stepInEpisode } = getEpisodeInfo(history, stepIndex)
  const duration = getEpisodeDuration(history, stepIndex)
  const episodeReturn = getEpisodeReturn(history, stepIndex)

  // Compute features and probabilities from stored weights
  const phi = rocketFeatures(state)
  const flatWeights = step.values?.weights ?? new Array(NUM_ROCKET_ACTIONS * NUM_ROCKET_FEATURES).fill(0)
  const probs = computeProbsFromWeights(flatWeights, NUM_ROCKET_ACTIONS, NUM_ROCKET_FEATURES, phi)
  const baseline = step.values?.baseline?.[0] ?? 0

  return {
    type: 'rocket-reinforce',
    stepIndex,
    episode,
    stepInEpisode,
    state,
    action,
    actionName: ROCKET_ACTION_NAMES[action],
    reward: step.reward,
    nextState,
    done: step.done,
    episodeDuration: duration,
    episodeReturn,
    features: phi,
    featureLabels: ROCKET_FEATURE_LABELS,
    probabilities: probs,
    baseline,
  }
}

// ─── Random Breakdown ───────────────────────────────────────────────────────

export function computeRocketRandomBreakdown(
  history: SimulationStep[],
  stepIndex: number,
): RocketRandomBreakdown | null {
  if (stepIndex < 0 || stepIndex >= history.length) return null

  const step = history[stepIndex]
  const state = step.state as RocketState
  const action = step.action as RocketAction

  const { episode, stepInEpisode } = getEpisodeInfo(history, stepIndex)

  return {
    type: 'rocket-random',
    stepIndex,
    episode,
    stepInEpisode,
    state,
    action,
    actionName: ROCKET_ACTION_NAMES[action],
    reward: step.reward,
    done: step.done,
  }
}

// ─── Formula Generation ─────────────────────────────────────────────────────

export function generateRocketTDFormula(bd: RocketTDBreakdown): string {
  const stateAction = `Q(\\text{${bd.discretizedKey}},\\, \\text{${bd.actionName}})`

  if (bd.done) {
    const lines = [
      `\\text{Target} &= r \\quad \\text{(terminal state, no future)}`,
      `&= ${fmt(bd.reward)}`,
      ``,
      `\\delta &= \\text{Target} - Q_{\\text{old}} = ${fmt(bd.target)} - ${fmt(bd.preQ)} = ${fmt(bd.tdError)}`,
      ``,
      `${stateAction} &\\leftarrow ${fmt(bd.preQ)} + ${fmt(bd.alpha)} \\times ${fmt(bd.tdError)}`,
      `&= \\boxed{${fmt(bd.postQ)}}`,
    ]
    return `\\begin{aligned}\n${lines.join(' \\\\\n')}\n\\end{aligned}`
  }

  const lines = [
    `\\text{Target} &= r + \\gamma \\cdot \\max_{a'} Q(s',a') \\quad \\text{(reward + discounted best future)}`,
    `&= ${fmt(bd.reward)} + ${fmt(bd.gamma)} \\times ${fmt(bd.bootstrapValue)}`,
    `&= ${fmt(bd.target)}`,
    ``,
    `\\delta &= \\text{Target} - Q_{\\text{old}} = ${fmt(bd.target)} - ${fmt(bd.preQ)} = ${fmt(bd.tdError)}`,
    ``,
    `${stateAction} &\\leftarrow ${fmt(bd.preQ)} + ${fmt(bd.alpha)} \\times ${fmt(bd.tdError)}`,
    `&= \\boxed{${fmt(bd.postQ)}}`,
  ]
  return `\\begin{aligned}\n${lines.join(' \\\\\n')}\n\\end{aligned}`
}

export function generateRocketReinforceFormula(): string {
  return `\\theta \\leftarrow \\theta + \\alpha \\sum_{t=0}^{T-1} (G_t - b) \\, \\nabla_\\theta \\log \\pi_\\theta(a_t | s_t)`
}

// ─── Narrative Generation ───────────────────────────────────────────────────

export function generateRocketTDNarrative(bd: RocketTDBreakdown): string {
  const moveType = bd.isExploration
    ? `an EXPLORATION move (\u03B5-random) \u2014 the greedy choice was ${bd.greedyActionName}`
    : bd.preQValues.every((v) => v === 0)
      ? 'a random move (all Q-values still 0 \u2014 no experience yet)'
      : `a GREEDY move (best known action, Q=${fmt(bd.preQ)})`

  let outcome: string
  if (bd.done) {
    const result = getLandingResult(bd.nextState, bd.done)
    if (result === 'landed') {
      outcome = `Soft landing! Episode ${bd.episode} ends after ${bd.stepInEpisode + 1} steps.`
    } else {
      outcome = `Crashed! Episode ${bd.episode} ends after ${bd.stepInEpisode + 1} steps (y=${bd.nextState.y.toFixed(2)}).`
    }
  } else {
    outcome = `The rocket descends (y=${bd.nextState.y.toFixed(2)}, +${fmt(bd.reward)} reward). Step ${bd.stepInEpisode + 1} of episode ${bd.episode}.`
  }

  const tdInterpretation = bd.tdError > 0.001
    ? `TD error is positive (+${fmt(bd.tdError)}) \u2014 outcome was better than expected, so Q-value increases.`
    : bd.tdError < -0.001
      ? `TD error is negative (${fmt(bd.tdError)}) \u2014 outcome was worse than expected, so Q-value decreases.`
      : `TD error is near zero \u2014 prediction matched reality, minimal update.`

  return `The rocket fired ${bd.actionName} (${moveType}). Bin [${bd.discretizedKey}] \u2192 [${bd.nextDiscretizedKey}]. ${outcome} ${tdInterpretation}`
}

export function generateRocketReinforceNarrative(bd: RocketReinforceBreakdown): string {
  const probStr = `\u03C0(${bd.actionName}) = ${(bd.probabilities[bd.action] * 100).toFixed(1)}%`
  const bestIdx = bd.probabilities.indexOf(Math.max(...bd.probabilities))
  const preferredAction = ROCKET_ACTION_NAMES[bestIdx as RocketAction]
  const isUniform = bd.probabilities.every((p) => Math.abs(p - bd.probabilities[0]) < 0.05)
  const policyNote = isUniform
    ? 'Policy is roughly uniform across actions.'
    : `Policy currently prefers ${preferredAction}.`

  if (bd.done) {
    const result = getLandingResult(bd.nextState, bd.done)
    const resultText = result === 'landed' ? 'Soft landing!' : 'Crashed!'
    const durText = bd.episodeDuration !== null
      ? `Episode ${bd.episode} lasted ${bd.episodeDuration} steps (return: ${bd.episodeReturn}).`
      : `Episode ${bd.episode} ended.`
    const baselineNote = bd.episodeReturn !== null
      ? bd.episodeReturn > bd.baseline
        ? ` Return > baseline (${fmt(bd.baseline)}) \u2014 actions in this episode get reinforced.`
        : ` Return < baseline (${fmt(bd.baseline)}) \u2014 actions in this episode get discouraged.`
      : ''
    return `The rocket fired ${bd.actionName} (${probStr}). ${resultText} ${durText}${baselineNote} Weights updated using the full trajectory.`
  }

  return `The rocket fired ${bd.actionName} (${probStr}). Descending (y=${bd.nextState.y.toFixed(2)}). Step ${bd.stepInEpisode + 1} of episode ${bd.episode}. ${policyNote} No weight update until episode ends.`
}

export function generateRocketRandomNarrative(bd: RocketRandomBreakdown): string {
  if (bd.done) {
    return `The rocket fired ${bd.actionName} (random, 33% each). Episode ended after ${bd.stepInEpisode + 1} steps. No learning \u2014 this is the baseline to beat.`
  }
  return `The rocket fired ${bd.actionName} (random, 33% each). Step ${bd.stepInEpisode + 1} of episode ${bd.episode}. Each action has equal probability \u2014 no state information used.`
}
