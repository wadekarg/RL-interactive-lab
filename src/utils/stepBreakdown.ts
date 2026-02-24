/**
 * stepBreakdown.ts
 *
 * Pure computation: reconstructs detailed step/sweep breakdowns from
 * consecutive history entries. No React or side-effects.
 */

import type { SimulationStep } from '../algorithms/types'
import type { GridState, GridAction } from '../environments/gridworld'
import { ACTION_NAMES } from '../environments/gridworld'
import { argmax } from './math'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TDStepBreakdown {
  type: 'td'
  stepIndex: number
  episode: number        // 1-indexed
  stepInEpisode: number  // 0-indexed within episode
  state: GridState
  action: GridAction
  actionName: string
  reward: number
  nextState: GridState
  done: boolean

  // Exploration vs exploitation
  isExploration: boolean
  greedyAction: GridAction
  greedyActionName: string

  // Q-values for the current state
  preQValues: number[]   // all 4 Q(s,·) BEFORE this update
  postQValues: number[]  // all 4 Q(s,·) AFTER this update
  preQ: number           // Q(s,a) before
  postQ: number          // Q(s,a) after

  // Bootstrap details from next state
  nextStatePreQValues: number[]    // Q(s',·) used for bootstrap (pre-update values)
  bootstrapValue: number           // the value used: max Q(s',·) or Q(s',a')
  bootstrapAction: GridAction | null // only meaningful for SARSA
  bootstrapActionName: string | null

  // Update math
  target: number
  tdError: number
  alpha: number
  gamma: number
  algorithm: 'q-learning' | 'sarsa'
}

export interface DPCellChange {
  key: string
  row: number
  col: number
  oldBestValue: number
  newBestValue: number
  delta: number
  bestAction: GridAction
  bestActionName: string
}

export interface DPSweepBreakdown {
  type: 'dp'
  sweepIndex: number       // 1-indexed
  numCellsUpdated: number
  maxDelta: number
  maxDeltaCell: string
  topChanges: DPCellChange[]
  converged: boolean       // maxDelta < 0.001
  algorithm: 'value-iteration' | 'policy-iteration'
  gamma: number
}

export type StepBreakdown = TDStepBreakdown | DPSweepBreakdown

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Format a number for display (3 decimal places, strip unnecessary trailing zeros) */
export function fmt(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) < 1000) return n.toString()
  const s = n.toFixed(3)
  // Keep at least one decimal for non-integers
  return s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '.0')
}

/** Format for KaTeX (always show sign for inline use) */
function fmtSigned(n: number): string {
  return n >= 0 ? `+${fmt(n)}` : fmt(n)
}

function stateKey(s: GridState): string {
  return `${s.row},${s.col}`
}

function getQValues(values: Record<string, number[]>, key: string): number[] {
  return values[key] ?? [0, 0, 0, 0]
}

/**
 * Reconstruct episode number and step-within-episode for a given step index.
 */
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

// ─── TD Breakdown ────────────────────────────────────────────────────────────

export function computeTDBreakdown(
  history: SimulationStep[],
  stepIndex: number,
  algorithm: 'q-learning' | 'sarsa',
  alpha: number,
  gamma: number,
): TDStepBreakdown | null {
  if (stepIndex < 0 || stepIndex >= history.length) return null

  const step = history[stepIndex]
  const state = step.state as GridState
  const action = step.action as GridAction
  const nextState = step.nextState as GridState
  const sk = stateKey(state)
  const nsk = stateKey(nextState)

  // Pre-update Q-values come from the PREVIOUS step's snapshot
  const preValues = stepIndex > 0 ? history[stepIndex - 1].values : {}
  const postValues = step.values

  const preQValues = getQValues(preValues, sk)
  const postQValues = getQValues(postValues, sk)
  const preQ = preQValues[action]
  const postQ = postQValues[action]

  // Next state Q-values (pre-update, used for bootstrap)
  const nextStatePreQValues = getQValues(preValues, nsk)

  // Determine bootstrap
  let bootstrapValue: number
  let bootstrapAction: GridAction | null = null
  let bootstrapActionName: string | null = null

  if (step.done) {
    bootstrapValue = 0
  } else if (algorithm === 'q-learning') {
    // Off-policy: max over next state
    const bestIdx = argmax(nextStatePreQValues)
    bootstrapValue = nextStatePreQValues[bestIdx]
    bootstrapAction = bestIdx as GridAction
    bootstrapActionName = ACTION_NAMES[bestIdx]
  } else {
    // SARSA: use actual next action (which is recorded as the next step's action)
    if (stepIndex + 1 < history.length && !step.done) {
      const nextAction = history[stepIndex + 1].action as GridAction
      bootstrapValue = nextStatePreQValues[nextAction]
      bootstrapAction = nextAction
      bootstrapActionName = ACTION_NAMES[nextAction]
    } else {
      // Terminal or last step — no next action
      bootstrapValue = 0
    }
  }

  const target = step.done ? step.reward : step.reward + gamma * bootstrapValue
  const tdError = target - preQ

  // Exploration check: was this action the greedy choice?
  const greedyAction = argmax(preQValues) as GridAction
  const allEqual = preQValues.every((v) => v === preQValues[0])
  const isExploration = !allEqual && action !== greedyAction

  const { episode, stepInEpisode } = getEpisodeInfo(history, stepIndex)

  return {
    type: 'td',
    stepIndex,
    episode,
    stepInEpisode,
    state,
    action,
    actionName: ACTION_NAMES[action],
    reward: step.reward,
    nextState,
    done: step.done,
    isExploration,
    greedyAction,
    greedyActionName: ACTION_NAMES[greedyAction],
    preQValues,
    postQValues,
    preQ,
    postQ,
    nextStatePreQValues,
    bootstrapValue,
    bootstrapAction,
    bootstrapActionName,
    target,
    tdError,
    alpha,
    gamma,
    algorithm,
  }
}

// ─── DP Breakdown ────────────────────────────────────────────────────────────

export function computeDPBreakdown(
  history: SimulationStep[],
  stepIndex: number,
  algorithm: 'value-iteration' | 'policy-iteration',
  gamma: number,
): DPSweepBreakdown | null {
  if (stepIndex < 0 || stepIndex >= history.length) return null

  const preValues = stepIndex > 0 ? history[stepIndex - 1].values : {}
  const postValues = history[stepIndex].values

  // Collect all cells and their changes
  const allKeys = new Set([...Object.keys(preValues), ...Object.keys(postValues)])
  const changes: DPCellChange[] = []

  for (const key of allKeys) {
    const preQ = preValues[key] ?? [0, 0, 0, 0]
    const postQ = postValues[key] ?? [0, 0, 0, 0]

    const oldBest = Math.max(...preQ)
    const newBest = Math.max(...postQ)
    const delta = Math.abs(newBest - oldBest)

    const bestActionIdx = argmax(postQ)
    const [rowStr, colStr] = key.split(',')

    changes.push({
      key,
      row: parseInt(rowStr, 10),
      col: parseInt(colStr, 10),
      oldBestValue: oldBest,
      newBestValue: newBest,
      delta,
      bestAction: bestActionIdx as GridAction,
      bestActionName: ACTION_NAMES[bestActionIdx],
    })
  }

  // Sort by delta descending
  changes.sort((a, b) => b.delta - a.delta)

  const numCellsUpdated = changes.filter((c) => c.delta > 1e-10).length
  const maxDelta = changes.length > 0 ? changes[0].delta : 0
  const maxDeltaCell = changes.length > 0 ? changes[0].key : ''

  return {
    type: 'dp',
    sweepIndex: stepIndex + 1,  // 1-indexed
    numCellsUpdated,
    maxDelta,
    maxDeltaCell,
    topChanges: changes.slice(0, 5),
    converged: maxDelta < 0.001,
    algorithm,
    gamma,
  }
}

// ─── KaTeX Formula Generation ────────────────────────────────────────────────

export function generateTDFormula(bd: TDStepBreakdown): string {
  const sLabel = `(${bd.state.row},${bd.state.col})`
  const aLabel = `\\text{${bd.actionName}}`
  const stateAction = `Q(${sLabel},\\, ${aLabel})`

  if (bd.done) {
    // Terminal state — no bootstrap
    const lines = [
      `\\text{Target} &= r \\quad \\text{(terminal state)}`,
      `&= ${fmt(bd.reward)}`,
      ``,
      `\\text{TD Error} &= \\text{Target} - Q(s,a)`,
      `&= ${fmt(bd.target)} - ${fmt(bd.preQ)}`,
      `&= ${fmt(bd.tdError)}`,
      ``,
      `${stateAction} &\\leftarrow ${fmt(bd.preQ)} + ${fmt(bd.alpha)} \\times ${fmt(bd.tdError)}`,
      `&= \\boxed{${fmt(bd.postQ)}}`,
    ]
    return `\\begin{aligned}\n${lines.join(' \\\\\n')}\n\\end{aligned}`
  }

  // Non-terminal
  let bootstrapLine: string
  if (bd.algorithm === 'q-learning') {
    bootstrapLine = `\\text{Target} &= r + \\gamma \\cdot \\max_{a'} Q(s',a')`
  } else {
    const naLabel = bd.bootstrapActionName ? `\\text{${bd.bootstrapActionName}}` : `a'`
    bootstrapLine = `\\text{Target} &= r + \\gamma \\cdot Q(s',\\, ${naLabel})`
  }

  const lines = [
    bootstrapLine,
    `&= ${fmt(bd.reward)} + ${fmt(bd.gamma)} \\times ${fmt(bd.bootstrapValue)}`,
    `&= ${fmt(bd.target)}`,
    ``,
    `\\text{TD Error} &= \\text{Target} - Q(s,a)`,
    `&= ${fmt(bd.target)} - ${fmt(bd.preQ)}`,
    `&= ${fmt(bd.tdError)}`,
    ``,
    `${stateAction} &\\leftarrow ${fmt(bd.preQ)} + ${fmt(bd.alpha)} \\times ${fmt(bd.tdError)}`,
    `&= \\boxed{${fmt(bd.postQ)}}`,
  ]
  return `\\begin{aligned}\n${lines.join(' \\\\\n')}\n\\end{aligned}`
}

export function generateDPFormula(bd: DPSweepBreakdown): string {
  if (bd.algorithm === 'value-iteration') {
    return `V(s) \\leftarrow \\max_a \\Big[ R(s,a) + \\gamma \\, V(s') \\Big] \\quad \\text{for all states } s`
  }
  return `V^\\pi(s) = R(s,\\pi(s)) + \\gamma \\, V^\\pi(s') \\quad \\text{then improve } \\pi`
}

// ─── Narrative Generation ────────────────────────────────────────────────────

export function generateTDNarrative(bd: TDStepBreakdown): string {
  const pos = `(${bd.state.row},${bd.state.col})`
  const npos = `(${bd.nextState.row},${bd.nextState.col})`

  let moveType: string
  if (bd.isExploration) {
    moveType = `an EXPLORATION move (random) \u2014 the greedy choice was ${bd.greedyActionName}`
  } else {
    const allZero = bd.preQValues.every((v) => v === 0)
    if (allZero) {
      moveType = `a random move (all Q-values still 0)`
    } else {
      moveType = `a GREEDY move (best known action)`
    }
  }

  let outcome: string
  if (bd.done && bd.reward > 0) {
    outcome = `Boru reached the Water Hole! Reward: ${fmtSigned(bd.reward)}. Episode ${bd.episode} ends.`
  } else if (bd.done && bd.reward < 0) {
    outcome = `Boru encountered a Lion! Penalty: ${fmt(bd.reward)}. Episode ${bd.episode} ends.`
  } else {
    outcome = `Received ${fmt(bd.reward)} step penalty.`
  }

  return `At step ${bd.stepIndex} (episode ${bd.episode}), Boru was at ${pos} and moved ${bd.actionName} to ${npos}. This was ${moveType}. ${outcome}`
}

export function generateDPNarrative(bd: DPSweepBreakdown): string {
  const method = bd.algorithm === 'value-iteration' ? 'Value Iteration' : 'Policy Iteration'
  const convText = bd.converged
    ? 'Values have converged!'
    : `Maximum value change: ${fmt(bd.maxDelta)} at cell (${bd.maxDeltaCell}).`

  return `${method} sweep #${bd.sweepIndex} updated ${bd.numCellsUpdated} cells. ${convText}`
}
