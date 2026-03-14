import type { Agent } from '../types'
import type { ClassicCartPoleState, ClassicCartPoleAction } from '../../environments/classicCartpole'

/**
 * REINFORCE (Monte Carlo Policy Gradient) with linear softmax policy for Classic CartPole.
 *
 * Policy: π(a|s) = softmax(W · φ(s))
 * Features φ(s): [1, x/2.4, v/3.0, θ/0.21, ω/3.5, (θ/0.21)², (ω/3.5)²]  (7 features)
 * Weights: W is 2×7 matrix (2 actions × 7 features)
 *
 * Return normalization (per-episode):
 *   G̃_t = (G_t − mean(G)) / (std(G) + ε)
 *   This is critical: using the same global baseline for all timesteps creates high variance
 *   because G_t naturally decreases across the episode (G_T-1 ≈ 1, G_0 ≈ T).
 *   Per-episode normalization removes this structural bias.
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

  // Display-only baseline: running average of episode returns (not used for learning)
  private displayBaseline = 0
  private episodeCount = 0

  constructor(lr = 0.002, gamma = 0.99) {
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

    // Reward-to-go: G_t = r_t + γ·r_{t+1} + γ²·r_{t+2} + …
    let G = 0
    for (let t = T - 1; t >= 0; t--) {
      G = this.trajectory[t].reward + this.gamma * G
      returns[t] = G
    }

    // Per-episode return normalization: G̃_t = (G_t − μ) / (σ + ε)
    // Fixes the high-variance problem caused by G_t naturally shrinking across the episode.
    const meanG = returns.reduce((a, b) => a + b, 0) / T
    const varG = returns.reduce((a, v) => a + (v - meanG) ** 2, 0) / T
    const stdG = Math.sqrt(varG + 1e-8)

    // Update display baseline (running average of total episode return — for UI only)
    this.episodeCount++
    this.displayBaseline += (returns[0] - this.displayBaseline) / this.episodeCount

    for (let t = 0; t < T; t++) {
      const { state: s, action: a } = this.trajectory[t]
      const normalizedReturn = (returns[t] - meanG) / stdG

      const phi = features(s)
      const logits = this.weights.map((w) =>
        w.reduce((sum, wi, i) => sum + wi * phi[i], 0),
      )
      const probs = softmax(logits)

      // Policy gradient: ∇W = lr · G̃_t · (I(j==a) − π(j|s)) · φ(s)
      for (let j = 0; j < NUM_ACTIONS; j++) {
        const indicator = j === a ? 1 : 0
        const gradScale = (indicator - probs[j]) * normalizedReturn
        for (let f = 0; f < NUM_FEATURES; f++) {
          this.weights[j][f] += this.lr * gradScale * phi[f]
        }
      }
    }

    this.trajectory = []
  }

  getValues(): Record<string, number[]> {
    const flat = this.weights.flat()
    return { weights: flat, baseline: [this.displayBaseline] }
  }

  reset(): void {
    this.weights = Array.from({ length: NUM_ACTIONS }, () =>
      new Array(NUM_FEATURES).fill(0),
    )
    this.trajectory = []
    this.displayBaseline = 0
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
