/**
 * a2c.ts — Advantage Actor-Critic (A2C) for Classic CartPole.
 *
 * Ported from Jordan Lei's Actor-Critic implementation.
 *
 * Architecture:
 *   Actor  (policy):  4 → 128 → 2  (softmax) — via shared SoftmaxNet
 *   Critic (value):   4 → 128 → 1  (linear)
 *
 * Update (per episode):
 *   advantage_t = G_t − V(s_t)
 *   actor_loss  = mean(−log π(a_t|s_t) × advantage_t.detach)
 *   critic_loss = 0.0005 × mean(advantage_t²)
 */

import type { Agent } from '../types'
import type { ClassicCartPoleState, ClassicCartPoleAction } from '../../environments/classicCartpole'
import {
  linear,
  relu,
  heInit,
  zerosInit,
  adamInit,
  adamUpdate,
  linearBackward,
  accumWeightGrad,
  accumBiasGrad,
  sampleCategorical,
  SoftmaxNet,
  AdamState,
} from './nnUtils'
import type { SoftmaxNetStep } from './nnUtils'

// ─── Trajectory record ────────────────────────────────────────────────────────

interface A2CStep extends SoftmaxNetStep {
  // Actor fields come from SoftmaxNetStep (x, h1, pre1, probs, action)
  criH1: number[]
  criPre1: number[]
  value: number
  reward: number
}

// ─── A2CAgent ─────────────────────────────────────────────────────────────────

export class A2CAgent implements Agent<ClassicCartPoleState, ClassicCartPoleAction> {
  private actor: SoftmaxNet    // 4 → 128 → 2 (shared SoftmaxNet)

  // Critic weights: 4 → 128 → 1
  private criW1: number[]; private criB1: number[]
  private criW2: number[]; private criB2: number[]
  private adamCriW1: AdamState; private adamCriB1: AdamState
  private adamCriW2: AdamState; private adamCriB2: AdamState

  private readonly lr: number
  private readonly gamma: number
  private readonly criticScale: number

  private trajectory: A2CStep[] = []
  private lastProbs = [0.5, 0.5]
  private lastValue = 0
  private _lastActorStep: SoftmaxNetStep | null = null

  constructor(lr = 0.005, gamma = 0.99, criticScale = 0.0005) {
    this.lr = lr
    this.gamma = gamma
    this.criticScale = criticScale
    this.actor = new SoftmaxNet(4, 128, 2)
    this.criW1 = heInit(128, 4); this.criB1 = zerosInit(128)
    this.criW2 = heInit(1, 128); this.criB2 = zerosInit(1)
    this.adamCriW1 = adamInit(128 * 4); this.adamCriB1 = adamInit(128)
    this.adamCriW2 = adamInit(1 * 128); this.adamCriB2 = adamInit(1)
  }

  private criticForward(x: number[]) {
    const criPre1 = linear(this.criW1, this.criB1, x, 128, 4)
    const criH1 = relu(criPre1)
    const valueArr = linear(this.criW2, this.criB2, criH1, 1, 128)
    return { value: valueArr[0], criH1, criPre1 }
  }

  act(state: ClassicCartPoleState): ClassicCartPoleAction {
    const x = [state.x, state.xDot, state.theta, state.thetaDot]
    const { probs, h1, pre1 } = this.actor.forward(x)
    const { value } = this.criticForward(x)
    this.lastProbs = probs
    this.lastValue = value
    this._lastActorStep = { x, h1, pre1, probs, action: -1 }
    return sampleCategorical(probs) as ClassicCartPoleAction
  }

  learn(
    state: ClassicCartPoleState,
    action: ClassicCartPoleAction,
    reward: number,
    _nextState: ClassicCartPoleState,
    done: boolean,
  ): void {
    const x = [state.x, state.xDot, state.theta, state.thetaDot]
    const actorStep = this._lastActorStep ?? { x, ...this.actor.forward(x) }
    this._lastActorStep = null
    const { value, criH1, criPre1 } = this.criticForward(x)
    this.trajectory.push({ ...actorStep, action, criH1, criPre1, value, reward })

    if (!done) return

    // ── Episode ended ──────────────────────────────────────────────────────

    const T = this.trajectory.length
    const G = new Array<number>(T)
    let g = 0
    for (let t = T - 1; t >= 0; t--) {
      g = this.trajectory[t].reward + this.gamma * g
      G[t] = g
    }

    const advantages = this.trajectory.map((step, t) => G[t] - step.value)

    // ── Actor update via SoftmaxNet ────────────────────────────────────────
    const dActW1 = zerosInit(128 * 4); const dActB1 = zerosInit(128)
    const dActW2 = zerosInit(2 * 128); const dActB2 = zerosInit(2)

    for (let t = 0; t < T; t++) {
      this.actor.accumulatePolicyGrad(
        dActW1, dActB1, dActW2, dActB2,
        this.trajectory[t],
        advantages[t] / T,
      )
    }
    this.actor.applyGrads(dActW1, dActB1, dActW2, dActB2, this.lr)

    // ── Critic update ──────────────────────────────────────────────────────
    const dCriW1 = zerosInit(128 * 4); const dCriB1 = zerosInit(128)
    const dCriW2 = zerosInit(1 * 128); const dCriB2 = zerosInit(1)

    for (let t = 0; t < T; t++) {
      const { criH1, criPre1 } = this.trajectory[t]
      // L_critic = criticScale * (G_t − V)², dL/dV = −2 * criticScale * advantage / T
      const dOut1 = [-2 * this.criticScale * advantages[t] / T]
      const dCriH1 = linearBackward(this.criW2, dOut1, 1, 128)
      accumWeightGrad(dCriW2, dOut1, criH1, 1, 128)
      accumBiasGrad(dCriB2, dOut1)
      const dCriPre1 = dCriH1.map((v, i) => (criPre1[i] > 0 ? v : 0))
      accumWeightGrad(dCriW1, dCriPre1, this.trajectory[t].x, 128, 4)
      accumBiasGrad(dCriB1, dCriPre1)
    }

    adamUpdate(this.criW1, dCriW1, this.adamCriW1, this.lr)
    adamUpdate(this.criB1, dCriB1, this.adamCriB1, this.lr)
    adamUpdate(this.criW2, dCriW2, this.adamCriW2, this.lr)
    adamUpdate(this.criB2, dCriB2, this.adamCriB2, this.lr)

    this.trajectory = []
  }

  getValues(): Record<string, number[]> {
    return {
      probs: [...this.lastProbs],
      value: [this.lastValue],
    }
  }

  reset(): void {
    this.actor.reset()
    this.criW1 = heInit(128, 4); this.criB1 = zerosInit(128)
    this.criW2 = heInit(1, 128); this.criB2 = zerosInit(1)
    this.adamCriW1 = adamInit(128 * 4); this.adamCriB1 = adamInit(128)
    this.adamCriW2 = adamInit(1 * 128); this.adamCriB2 = adamInit(1)
    this.trajectory = []
    this.lastProbs = [0.5, 0.5]
    this.lastValue = 0
    this._lastActorStep = null
  }
}
