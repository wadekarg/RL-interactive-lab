import type { Agent } from '../types'
import type { RocketState, RocketAction } from '../../environments/rocketLanding'

/**
 * REINFORCE (Monte Carlo Policy Gradient) with linear softmax policy.
 *
 * Policy: π(a|s) = softmax(W · φ(s))
 * Features φ(s): [1, x_norm, v_norm, y_norm, vy_norm, θ_norm, ω_norm, θ²_norm, ω²_norm, y²_norm, vy²_norm]  (11 features)
 * Weights: W is 3×11 matrix (3 actions × 11 features)
 */

interface Transition {
  state: RocketState
  action: RocketAction
  reward: number
}

const NUM_FEATURES = 11
const NUM_ACTIONS = 3

function features(s: RocketState): number[] {
  const xNorm = s.x / 2.4
  const vNorm = s.xDot / 3.0
  const yNorm = s.y / 1.0
  const vyNorm = s.yDot / 5.0
  const thetaNorm = s.theta / (12 * Math.PI / 180)
  const omegaNorm = s.thetaDot / 3.5
  return [
    1,
    xNorm,
    vNorm,
    yNorm,
    vyNorm,
    thetaNorm,
    omegaNorm,
    thetaNorm * thetaNorm,
    omegaNorm * omegaNorm,
    yNorm * yNorm,
    vyNorm * vyNorm,
  ]
}

function softmax(logits: number[]): number[] {
  const maxLogit = Math.max(...logits)
  const exps = logits.map((l) => Math.exp(l - maxLogit))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum)
}

export class ReinforceAgent implements Agent<RocketState, RocketAction> {
  private weights: number[][]
  private lr: number
  private gamma: number
  private trajectory: Transition[] = []
  private baselineReturn = 0
  private episodeCount = 0

  constructor(lr = 0.01, gamma = 0.99) {
    this.lr = lr
    this.gamma = gamma
    this.weights = Array.from({ length: NUM_ACTIONS }, () =>
      new Array(NUM_FEATURES).fill(0),
    )
  }

  act(state: RocketState): RocketAction {
    const phi = features(state)
    const logits = this.weights.map((w) =>
      w.reduce((sum, wi, i) => sum + wi * phi[i], 0),
    )
    const probs = softmax(logits)

    const r = Math.random()
    let cumulative = 0
    for (let i = 0; i < probs.length - 1; i++) {
      cumulative += probs[i]
      if (r < cumulative) return i as RocketAction
    }
    return (probs.length - 1) as RocketAction
  }

  learn(state: RocketState, action: RocketAction, reward: number, _nextState: RocketState, done: boolean): void {
    this.trajectory.push({ state, action, reward })

    if (!done) return

    const T = this.trajectory.length
    const returns: number[] = new Array(T)

    let G = 0
    for (let t = T - 1; t >= 0; t--) {
      G = this.trajectory[t].reward + this.gamma * G
      returns[t] = G
    }

    this.episodeCount++
    const episodeReturn = returns[0]
    this.baselineReturn += (episodeReturn - this.baselineReturn) / this.episodeCount

    for (let t = 0; t < T; t++) {
      const { state: s, action: a } = this.trajectory[t]
      const advantage = returns[t] - this.baselineReturn

      const phi = features(s)
      const logits = this.weights.map((w) =>
        w.reduce((sum, wi, i) => sum + wi * phi[i], 0),
      )
      const probs = softmax(logits)

      for (let j = 0; j < NUM_ACTIONS; j++) {
        const indicator = j === a ? 1 : 0
        const gradScale = (indicator - probs[j]) * advantage
        for (let f = 0; f < NUM_FEATURES; f++) {
          this.weights[j][f] += this.lr * gradScale * phi[f]
        }
      }
    }

    this.trajectory = []
  }

  getValues(): Record<string, number[]> {
    const flat = this.weights.flat()
    return { weights: flat, baseline: [this.baselineReturn] }
  }

  reset(): void {
    this.weights = Array.from({ length: NUM_ACTIONS }, () =>
      new Array(NUM_FEATURES).fill(0),
    )
    this.trajectory = []
    this.baselineReturn = 0
    this.episodeCount = 0
  }

  setParams(lr: number, gamma: number): void {
    this.lr = lr
    this.gamma = gamma
  }

  getProbs(state: RocketState): number[] {
    const phi = features(state)
    const logits = this.weights.map((w) =>
      w.reduce((sum, wi, i) => sum + wi * phi[i], 0),
    )
    return softmax(logits)
  }
}
