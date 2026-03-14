/**
 * neuralReinforce.ts — Neural Network REINFORCE for Classic CartPole.
 *
 * Architecture: 4 → 128 → 2 (softmax policy)
 * Ported from Jordan Lei's Policy Gradient implementation.
 *
 * Key features:
 *   - Fully connected neural network policy (vs. linear softmax in reinforce.ts)
 *   - Episode-level Monte Carlo returns with normalization
 *   - Adam optimizer
 *   - No baseline (return normalization replaces it)
 */

import type { Agent } from '../types'
import type { ClassicCartPoleState, ClassicCartPoleAction } from '../../environments/classicCartpole'
import {
  linear,
  relu,
  softmax,
  heInit,
  zerosInit,
  adamInit,
  adamUpdate,
  linearBackward,
  accumWeightGrad,
  accumBiasGrad,
  sampleCategorical,
  AdamState,
} from './nnUtils'

// ─── Trajectory record ────────────────────────────────────────────────────────

interface NRStep {
  x: number[]        // raw state [4]
  h1: number[]       // post-ReLU hidden [128]
  pre1: number[]     // pre-ReLU hidden [128]
  probs: number[]    // action probabilities [2]
  action: number
  reward: number
}

// ─── NeuralReinforceAgent ─────────────────────────────────────────────────────

export class NeuralReinforceAgent implements Agent<ClassicCartPoleState, ClassicCartPoleAction> {
  private W1: number[]          // [128 * 4]
  private b1: number[]          // [128]
  private W2: number[]          // [2 * 128]
  private b2: number[]          // [2]

  private adamW1: AdamState
  private adamB1: AdamState
  private adamW2: AdamState
  private adamB2: AdamState

  private readonly lr: number
  private readonly gamma: number

  private trajectory: NRStep[] = []
  private lastProbs = [0.5, 0.5]

  constructor(lr = 0.005, gamma = 0.99) {
    this.lr = lr
    this.gamma = gamma
    this.W1 = heInit(128, 4)
    this.b1 = zerosInit(128)
    this.W2 = heInit(2, 128)
    this.b2 = zerosInit(2)
    this.adamW1 = adamInit(128 * 4)
    this.adamB1 = adamInit(128)
    this.adamW2 = adamInit(2 * 128)
    this.adamB2 = adamInit(2)
  }

  private forwardPass(x: number[]): { probs: number[], h1: number[], pre1: number[] } {
    const pre1 = linear(this.W1, this.b1, x, 128, 4)
    const h1 = relu(pre1)
    const logits = linear(this.W2, this.b2, h1, 2, 128)
    const probs = softmax(logits)
    return { probs, h1, pre1 }
  }

  act(state: ClassicCartPoleState): ClassicCartPoleAction {
    const x = [state.x, state.xDot, state.theta, state.thetaDot]
    const { probs } = this.forwardPass(x)
    this.lastProbs = probs
    return sampleCategorical(probs) as ClassicCartPoleAction
  }

  learn(
    state: ClassicCartPoleState,
    action: ClassicCartPoleAction,
    reward: number,
    _nextState: ClassicCartPoleState,
    done: boolean,
  ): void {
    // Re-run forward to capture activations for this step
    const x = [state.x, state.xDot, state.theta, state.thetaDot]
    const { probs, h1, pre1 } = this.forwardPass(x)
    this.trajectory.push({ x, h1, pre1, probs, action, reward })

    if (!done) return

    // ── Episode ended: compute returns and update weights ──────────────────

    const T = this.trajectory.length

    // Discounted returns
    const G = new Array<number>(T)
    let g = 0
    for (let t = T - 1; t >= 0; t--) {
      g = this.trajectory[t].reward + this.gamma * g
      G[t] = g
    }

    // Normalize returns (reduces variance, stabilizes learning)
    const mean = G.reduce((a, b) => a + b, 0) / T
    const variance = G.reduce((a, v) => a + (v - mean) ** 2, 0) / T
    const std = Math.sqrt(variance + 1e-9)
    const Gnorm = G.map((v) => (v - mean) / std)

    // Accumulate policy gradients over episode
    const dW1 = zerosInit(128 * 4)
    const db1 = zerosInit(128)
    const dW2 = zerosInit(2 * 128)
    const db2 = zerosInit(2)

    for (let t = 0; t < T; t++) {
      const { x: xt, h1, pre1, probs: pt, action: at } = this.trajectory[t]
      const Gt = Gnorm[t] / T   // average over episode

      // Policy gradient: dL/dlogits[j] = Gt * (probs[j] - I(j==action))
      // (gradient of -log_pi * G w.r.t. logits, for gradient descent)
      const dLogits = pt.map((p, j) => Gt * (p - (j === at ? 1 : 0)))

      // Layer 2 backward
      const dH1 = linearBackward(this.W2, dLogits, 2, 128)
      accumWeightGrad(dW2, dLogits, h1, 2, 128)
      accumBiasGrad(db2, dLogits)

      // ReLU backward
      const dPre1 = dH1.map((v, i) => (pre1[i] > 0 ? v : 0))

      // Layer 1 backward
      accumWeightGrad(dW1, dPre1, xt, 128, 4)
      accumBiasGrad(db1, dPre1)
    }

    // Adam update
    adamUpdate(this.W1, dW1, this.adamW1, this.lr)
    adamUpdate(this.b1, db1, this.adamB1, this.lr)
    adamUpdate(this.W2, dW2, this.adamW2, this.lr)
    adamUpdate(this.b2, db2, this.adamB2, this.lr)

    this.trajectory = []
  }

  getValues(): Record<string, number[]> {
    return {
      probs: [...this.lastProbs],
    }
  }

  reset(): void {
    this.W1 = heInit(128, 4)
    this.b1 = zerosInit(128)
    this.W2 = heInit(2, 128)
    this.b2 = zerosInit(2)
    this.adamW1 = adamInit(128 * 4)
    this.adamB1 = adamInit(128)
    this.adamW2 = adamInit(2 * 128)
    this.adamB2 = adamInit(2)
    this.trajectory = []
    this.lastProbs = [0.5, 0.5]
  }
}
