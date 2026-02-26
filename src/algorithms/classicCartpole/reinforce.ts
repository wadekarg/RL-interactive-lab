import type { Agent } from '../types'
import type { ClassicCartPoleState, ClassicCartPoleAction } from '../../environments/classicCartpole'

/**
 * REINFORCE (Monte Carlo Policy Gradient) with linear softmax policy for Classic CartPole.
 *
 * Policy: π(a|s) = softmax(W · φ(s))
 * Features φ(s): [1, x/2.4, v/3.0, θ/0.21, ω/3.5, (θ/0.21)², (ω/3.5)²]  (7 features)
 * Weights: W is 2×7 matrix (2 actions × 7 features)
 */

interface Transition {
  state: ClassicCartPoleState
  action: ClassicCartPoleAction
  reward: number
}

const NUM_FEATURES = 7
const NUM_ACTIONS = 2

function features(s: ClassicCartPoleState): number[] {
  const xNorm = s.x / 2.4
  const vNorm = s.xDot / 3.0
  const thetaNorm = s.theta / (12 * Math.PI / 180)
  const omegaNorm = s.thetaDot / 3.5
  return [
    1,                         // bias
    xNorm,                     // horizontal position
    vNorm,                     // horizontal velocity
    thetaNorm,                 // tilt
    omegaNorm,                 // angular velocity
    thetaNorm * thetaNorm,     // quadratic angle
    omegaNorm * omegaNorm,     // quadratic angular velocity
  ]
}

function softmax(logits: number[]): number[] {
  const maxLogit = Math.max(...logits)
  const exps = logits.map((l) => Math.exp(l - maxLogit))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum)
}

export class ReinforceAgent implements Agent<ClassicCartPoleState, ClassicCartPoleAction> {
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

  act(state: ClassicCartPoleState): ClassicCartPoleAction {
    const phi = features(state)
    const logits = this.weights.map((w) =>
      w.reduce((sum, wi, i) => sum + wi * phi[i], 0),
    )
    const probs = softmax(logits)

    const r = Math.random()
    return r < probs[0] ? 0 : 1
  }

  learn(state: ClassicCartPoleState, action: ClassicCartPoleAction, reward: number, _nextState: ClassicCartPoleState, done: boolean): void {
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

  getProbs(state: ClassicCartPoleState): number[] {
    const phi = features(state)
    const logits = this.weights.map((w) =>
      w.reduce((sum, wi, i) => sum + wi * phi[i], 0),
    )
    return softmax(logits)
  }
}
