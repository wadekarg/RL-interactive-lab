import type { Agent } from '../types'
import type { CartPoleState, CartPoleAction } from '../../environments/cartpole'

/**
 * REINFORCE (Monte Carlo Policy Gradient) with linear softmax policy.
 *
 * Policy: π(a|s) = softmax(W · φ(s))
 * Features φ(s): [1, x_norm, v_norm, θ_norm, ω_norm, θ²_norm, ω²_norm]  (7 features)
 * Weights: W is 2×7 matrix (2 actions × 7 features)
 *
 * At the end of each episode, updates weights using policy gradient:
 *   W += lr * Σ_t (R_t - baseline) * ∇ log π(a_t|s_t)
 */

interface Transition {
  state: CartPoleState
  action: CartPoleAction
  reward: number
}

const NUM_FEATURES = 7
const NUM_ACTIONS = 2

/** Extract normalized feature vector from state */
function features(s: CartPoleState): number[] {
  const xNorm = s.x / 2.4
  const vNorm = s.xDot / 3.0
  const thetaNorm = s.theta / (12 * Math.PI / 180)
  const omegaNorm = s.thetaDot / 3.5
  return [
    1,             // bias
    xNorm,
    vNorm,
    thetaNorm,
    omegaNorm,
    thetaNorm * thetaNorm,   // quadratic feature for angle
    omegaNorm * omegaNorm,   // quadratic feature for angular velocity
  ]
}

/** Compute softmax probabilities for each action */
function softmax(logits: number[]): number[] {
  const maxLogit = Math.max(...logits)
  const exps = logits.map((l) => Math.exp(l - maxLogit))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum)
}

export class ReinforceAgent implements Agent<CartPoleState, CartPoleAction> {
  /** Weight matrix: W[action][feature] */
  private weights: number[][]
  private lr: number
  private gamma: number

  /** Episode buffer */
  private trajectory: Transition[] = []
  /** Running baseline (mean return) for variance reduction */
  private baselineReturn = 0
  private episodeCount = 0

  constructor(lr = 0.01, gamma = 0.99) {
    this.lr = lr
    this.gamma = gamma
    this.weights = Array.from({ length: NUM_ACTIONS }, () =>
      new Array(NUM_FEATURES).fill(0),
    )
  }

  act(state: CartPoleState): CartPoleAction {
    const phi = features(state)
    const logits = this.weights.map((w) =>
      w.reduce((sum, wi, i) => sum + wi * phi[i], 0),
    )
    const probs = softmax(logits)

    // Sample from policy
    const r = Math.random()
    return (r < probs[0] ? 0 : 1) as CartPoleAction
  }

  learn(state: CartPoleState, action: CartPoleAction, reward: number, _nextState: CartPoleState, done: boolean): void {
    this.trajectory.push({ state, action, reward })

    if (!done) return

    // Episode ended — compute returns and update weights
    const T = this.trajectory.length
    const returns: number[] = new Array(T)

    // Compute discounted returns from the end
    let G = 0
    for (let t = T - 1; t >= 0; t--) {
      G = this.trajectory[t].reward + this.gamma * G
      returns[t] = G
    }

    // Update baseline (running mean of episode returns)
    this.episodeCount++
    const episodeReturn = returns[0]
    this.baselineReturn += (episodeReturn - this.baselineReturn) / this.episodeCount

    // Policy gradient update
    for (let t = 0; t < T; t++) {
      const { state: s, action: a } = this.trajectory[t]
      const advantage = returns[t] - this.baselineReturn

      const phi = features(s)
      const logits = this.weights.map((w) =>
        w.reduce((sum, wi, i) => sum + wi * phi[i], 0),
      )
      const probs = softmax(logits)

      // ∇ log π(a|s) = φ(s) * (1{a=j} - π(j|s)) for each action j
      for (let j = 0; j < NUM_ACTIONS; j++) {
        const indicator = j === a ? 1 : 0
        const gradScale = (indicator - probs[j]) * advantage
        for (let f = 0; f < NUM_FEATURES; f++) {
          this.weights[j][f] += this.lr * gradScale * phi[f]
        }
      }
    }

    // Clear trajectory for next episode
    this.trajectory = []
  }

  getValues(): Record<string, number[]> {
    // Return weights flattened for visualization
    // Key "weights" → [w00, w01, ..., w06, w10, w11, ..., w16]
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

  /** Get action probabilities for a given state (for visualization) */
  getProbs(state: CartPoleState): number[] {
    const phi = features(state)
    const logits = this.weights.map((w) =>
      w.reduce((sum, wi, i) => sum + wi * phi[i], 0),
    )
    return softmax(logits)
  }
}
