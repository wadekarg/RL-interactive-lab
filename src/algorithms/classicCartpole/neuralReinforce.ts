/**
 * neuralReinforce.ts — Neural Network REINFORCE for Classic CartPole.
 *
 * Architecture: 4 → 128 → 2 (softmax policy) via shared SoftmaxNet.
 * Ported from Jordan Lei's Policy Gradient implementation.
 *
 * Key features:
 *   - Neural network policy (vs. linear softmax in reinforce.ts)
 *   - Episode-level Monte Carlo returns with normalization
 *   - Adam optimizer (managed by SoftmaxNet)
 */

import type { Agent } from '../types'
import type { ClassicCartPoleState, ClassicCartPoleAction } from '../../environments/classicCartpole'
import { zerosInit, sampleCategorical, SoftmaxNet } from './nnUtils'
import type { SoftmaxNetStep } from './nnUtils'

interface NRStep extends SoftmaxNetStep {
  reward: number
}

export class NeuralReinforceAgent implements Agent<ClassicCartPoleState, ClassicCartPoleAction> {
  private net: SoftmaxNet
  private readonly lr: number
  private readonly gamma: number
  private trajectory: NRStep[] = []
  private lastProbs = [0.5, 0.5]

  constructor(lr = 0.005, gamma = 0.99) {
    this.lr = lr
    this.gamma = gamma
    this.net = new SoftmaxNet(4, 128, 2)
  }

  act(state: ClassicCartPoleState): ClassicCartPoleAction {
    const x = [state.x, state.xDot, state.theta, state.thetaDot]
    const { probs, h1, pre1 } = this.net.forward(x)
    this.lastProbs = probs
    // Store forward data so learn() can use it without re-running
    this._lastStep = { x, h1, pre1, probs, action: -1 }
    return sampleCategorical(probs) as ClassicCartPoleAction
  }

  private _lastStep: SoftmaxNetStep | null = null

  learn(
    state: ClassicCartPoleState,
    action: ClassicCartPoleAction,
    reward: number,
    _nextState: ClassicCartPoleState,
    done: boolean,
  ): void {
    // Reuse forward data captured during act(), falling back to re-forward
    const x = [state.x, state.xDot, state.theta, state.thetaDot]
    const step = this._lastStep ?? { x, ...this.net.forward(x) }
    this.trajectory.push({ ...step, action, reward })
    this._lastStep = null

    if (!done) return

    // ── Episode ended: compute normalized returns and update ────────────────
    const T = this.trajectory.length
    const G = new Array<number>(T)
    let g = 0
    for (let t = T - 1; t >= 0; t--) {
      g = this.trajectory[t].reward + this.gamma * g
      G[t] = g
    }

    const mean = G.reduce((a, b) => a + b, 0) / T
    const variance = G.reduce((a, v) => a + (v - mean) ** 2, 0) / T
    const std = Math.sqrt(variance + 1e-9)

    const dW1 = zerosInit(128 * 4); const db1 = zerosInit(128)
    const dW2 = zerosInit(2 * 128); const db2 = zerosInit(2)

    for (let t = 0; t < T; t++) {
      const signal = (G[t] - mean) / std / T
      this.net.accumulatePolicyGrad(dW1, db1, dW2, db2, this.trajectory[t], signal)
    }

    this.net.applyGrads(dW1, db1, dW2, db2, this.lr)
    this.trajectory = []
  }

  getValues(): Record<string, number[]> {
    return { probs: [...this.lastProbs] }
  }

  reset(): void {
    this.net.reset()
    this.trajectory = []
    this.lastProbs = [0.5, 0.5]
    this._lastStep = null
  }
}
