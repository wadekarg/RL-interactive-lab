/**
 * cartpoleStepBreakdown.ts
 *
 * Pure computation: generates step breakdowns for CartPole algorithms.
 * No React or side-effects.
 */

import type { SimulationStep } from '../algorithms/types'
import type { CartPoleState, CartPoleAction } from '../environments/cartpole'
import { CARTPOLE_ACTION_NAMES, discretize } from '../environments/cartpole'
import type { DiscretizationConfig } from '../environments/cartpole'
import { argmax } from './math'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CartPoleTDBreakdown {
  type: 'cartpole-td'
  stepIndex: number
  episode: number
  stepInEpisode: number
  state: CartPoleState
  action: CartPoleAction
  actionName: string
  reward: number
  nextState: CartPoleState
  done: boolean
  discretizedKey: string
  nextDiscretizedKey: string

  isExploration: boolean
  greedyAction: CartPoleAction
  greedyActionName: string

  preQValues: number[]
  postQValues: number[]
  preQ: number
  postQ: number
  target: number
  tdError: number
  alpha: number
  gamma: number
}

export interface CartPoleReinforceBreakdown {
  type: 'cartpole-reinforce'
  stepIndex: number
  episode: number
  stepInEpisode: number
  state: CartPoleState
  action: CartPoleAction
  actionName: string
  reward: number
  nextState: CartPoleState
  done: boolean
  episodeDuration: number | null  // null if episode still running
  episodeReturn: number | null
}

export interface CartPoleRandomBreakdown {
  type: 'cartpole-random'
  stepIndex: number
  episode: number
  stepInEpisode: number
  state: CartPoleState
  action: CartPoleAction
  actionName: string
  reward: number
  done: boolean
}

export type CartPoleBreakdown = CartPoleTDBreakdown | CartPoleReinforceBreakdown | CartPoleRandomBreakdown

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function fmt(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) < 1000) return n.toString()
  const s = n.toFixed(3)
  return s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '.0')
}

function getQValues(values: Record<string, number[]>, key: string): number[] {
  return values[key] ?? [0, 0]
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

/** Find the duration of the episode containing stepIndex */
function getEpisodeDuration(history: SimulationStep[], stepIndex: number): number | null {
  // Find the end of this episode
  let end = stepIndex
  while (end < history.length && !history[end].done) end++
  if (end >= history.length) return null // Episode not finished yet

  // Find the start of this episode
  let start = stepIndex
  while (start > 0 && !history[start - 1].done) start--

  return end - start + 1
}

// ─── TD Breakdown (Discretized Q-Learning) ──────────────────────────────────

export function computeCartPoleTDBreakdown(
  history: SimulationStep[],
  stepIndex: number,
  alpha: number,
  gamma: number,
  discretizationConfig: DiscretizationConfig,
): CartPoleTDBreakdown | null {
  if (stepIndex < 0 || stepIndex >= history.length) return null

  const step = history[stepIndex]
  const state = step.state as CartPoleState
  const action = step.action as CartPoleAction
  const nextState = step.nextState as CartPoleState

  const sk = discretize(state, discretizationConfig)
  const nsk = discretize(nextState, discretizationConfig)

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

  const greedyAction = argmax(preQValues) as CartPoleAction
  const allEqual = preQValues.every((v) => v === preQValues[0])
  const isExploration = !allEqual && action !== greedyAction

  const { episode, stepInEpisode } = getEpisodeInfo(history, stepIndex)

  return {
    type: 'cartpole-td',
    stepIndex,
    episode,
    stepInEpisode,
    state,
    action,
    actionName: CARTPOLE_ACTION_NAMES[action],
    reward: step.reward,
    nextState,
    done: step.done,
    discretizedKey: sk,
    nextDiscretizedKey: nsk,
    isExploration,
    greedyAction,
    greedyActionName: CARTPOLE_ACTION_NAMES[greedyAction],
    preQValues,
    postQValues,
    preQ,
    postQ,
    target,
    tdError,
    alpha,
    gamma,
  }
}

// ─── REINFORCE Breakdown ────────────────────────────────────────────────────

export function computeCartPoleReinforceBreakdown(
  history: SimulationStep[],
  stepIndex: number,
): CartPoleReinforceBreakdown | null {
  if (stepIndex < 0 || stepIndex >= history.length) return null

  const step = history[stepIndex]
  const state = step.state as CartPoleState
  const action = step.action as CartPoleAction
  const nextState = step.nextState as CartPoleState

  const { episode, stepInEpisode } = getEpisodeInfo(history, stepIndex)
  const duration = getEpisodeDuration(history, stepIndex)
  const episodeReturn = duration !== null ? duration : null

  return {
    type: 'cartpole-reinforce',
    stepIndex,
    episode,
    stepInEpisode,
    state,
    action,
    actionName: CARTPOLE_ACTION_NAMES[action],
    reward: step.reward,
    nextState,
    done: step.done,
    episodeDuration: duration,
    episodeReturn,
  }
}

// ─── Random Breakdown ───────────────────────────────────────────────────────

export function computeCartPoleRandomBreakdown(
  history: SimulationStep[],
  stepIndex: number,
): CartPoleRandomBreakdown | null {
  if (stepIndex < 0 || stepIndex >= history.length) return null

  const step = history[stepIndex]
  const state = step.state as CartPoleState
  const action = step.action as CartPoleAction

  const { episode, stepInEpisode } = getEpisodeInfo(history, stepIndex)

  return {
    type: 'cartpole-random',
    stepIndex,
    episode,
    stepInEpisode,
    state,
    action,
    actionName: CARTPOLE_ACTION_NAMES[action],
    reward: step.reward,
    done: step.done,
  }
}

// ─── Formula Generation ─────────────────────────────────────────────────────

export function generateCartPoleTDFormula(bd: CartPoleTDBreakdown): string {
  const stateAction = `Q(\\text{${bd.discretizedKey}},\\, \\text{${bd.actionName}})`

  if (bd.done) {
    const lines = [
      `\\text{Target} &= r \\quad \\text{(terminal)}`,
      `&= ${fmt(bd.reward)}`,
      ``,
      `\\text{TD Error} &= ${fmt(bd.target)} - ${fmt(bd.preQ)} = ${fmt(bd.tdError)}`,
      ``,
      `${stateAction} &\\leftarrow ${fmt(bd.preQ)} + ${fmt(bd.alpha)} \\times ${fmt(bd.tdError)}`,
      `&= \\boxed{${fmt(bd.postQ)}}`,
    ]
    return `\\begin{aligned}\n${lines.join(' \\\\\n')}\n\\end{aligned}`
  }

  const lines = [
    `\\text{Target} &= r + \\gamma \\cdot \\max_{a'} Q(s',a')`,
    `&= ${fmt(bd.reward)} + ${fmt(bd.gamma)} \\times ${fmt(bd.target - bd.reward > 0 ? (bd.target - bd.reward) / bd.gamma : 0)}`,
    `&= ${fmt(bd.target)}`,
    ``,
    `\\text{TD Error} &= ${fmt(bd.target)} - ${fmt(bd.preQ)} = ${fmt(bd.tdError)}`,
    ``,
    `${stateAction} &\\leftarrow ${fmt(bd.preQ)} + ${fmt(bd.alpha)} \\times ${fmt(bd.tdError)}`,
    `&= \\boxed{${fmt(bd.postQ)}}`,
  ]
  return `\\begin{aligned}\n${lines.join(' \\\\\n')}\n\\end{aligned}`
}

export function generateCartPoleReinforceFormula(): string {
  return `\\theta \\leftarrow \\theta + \\alpha \\sum_{t=0}^{T-1} (G_t - b) \\, \\nabla_\\theta \\log \\pi_\\theta(a_t | s_t)`
}

// ─── Narrative Generation ───────────────────────────────────────────────────

export function generateCartPoleTDNarrative(bd: CartPoleTDBreakdown): string {
  const moveType = bd.isExploration
    ? `an EXPLORATION move (random) — the greedy choice was ${bd.greedyActionName}`
    : bd.preQValues.every((v) => v === 0)
      ? 'a random move (all Q-values still 0)'
      : 'a GREEDY move (best known action)'

  const outcome = bd.done
    ? `Mission failed! Episode ${bd.episode} ends after ${bd.stepInEpisode + 1} steps.`
    : `Bhrigu survives (+1 reward). Step ${bd.stepInEpisode + 1} of episode ${bd.episode}.`

  return `Bhrigu fired ${bd.actionName} (${moveType}). Bin [${bd.discretizedKey}] → [${bd.nextDiscretizedKey}]. ${outcome}`
}

export function generateCartPoleReinforceNarrative(bd: CartPoleReinforceBreakdown): string {
  const durText = bd.episodeDuration !== null
    ? `Episode ${bd.episode} lasted ${bd.episodeDuration} steps.`
    : `Episode ${bd.episode} in progress.`

  const outcome = bd.done
    ? `Mission ended. ${durText} Weights will be updated using the full episode trajectory.`
    : `Bhrigu survives. Step ${bd.stepInEpisode + 1} of episode ${bd.episode}.`

  return `Bhrigu fired ${bd.actionName}. ${outcome}`
}

export function generateCartPoleRandomNarrative(bd: CartPoleRandomBreakdown): string {
  const outcome = bd.done
    ? `Mission failed after ${bd.stepInEpisode + 1} steps. No learning — random baseline.`
    : `Step ${bd.stepInEpisode + 1} of episode ${bd.episode}. Firing randomly.`

  return `Bhrigu fired ${bd.actionName} (random). ${outcome}`
}
