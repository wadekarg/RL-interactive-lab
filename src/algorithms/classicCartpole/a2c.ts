/**
 * a2c.ts — Advantage Actor-Critic (A2C) for Classic CartPole.
 *
 * Ported from Jordan Lei's Actor-Critic implementation.
 *
 * Architecture:
 *   Actor  (policy):  4 → 128 → 2  (softmax — probability of left/right)
 *   Critic (value):   4 → 128 → 1  (linear  — estimates V(s))
 *
 * Update (per episode):
 *   advantage_t = G_t − V(s_t)
 *   actor_loss  = mean(−log π(a_t|s_t) × advantage_t.detach)
 *   critic_loss = 0.0005 × mean(advantage_t²)
 *
 * Both actor and critic use separate Adam optimizers.
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

interface A2CStep {
  x: number[]           // state [4]
  // Actor activations
  actH1: number[]       // post-ReLU [128]
  actPre1: number[]     // pre-ReLU [128]
  probs: number[]       // π(·|s) [2]
  action: number
  // Critic activations
  criH1: number[]       // post-ReLU [128]
  criPre1: number[]     // pre-ReLU [128]
  value: number         // V(s)
  reward: number
}

// ─── A2CAgent ─────────────────────────────────────────────────────────────────

export class A2CAgent implements Agent<ClassicCartPoleState, ClassicCartPoleAction> {
  // Actor weights: 4 → 128 → 2
  private actW1: number[]    // [128 * 4]
  private actB1: number[]    // [128]
  private actW2: number[]    // [2 * 128]
  private actB2: number[]    // [2]

  // Critic weights: 4 → 128 → 1
  private criW1: number[]    // [128 * 4]
  private criB1: number[]    // [128]
  private criW2: number[]    // [1 * 128]
  private criB2: number[]    // [1]

  // Adam states
  private adamActW1: AdamState; private adamActB1: AdamState
  private adamActW2: AdamState; private adamActB2: AdamState
  private adamCriW1: AdamState; private adamCriB1: AdamState
  private adamCriW2: AdamState; private adamCriB2: AdamState

  private readonly lr: number
  private readonly gamma: number
  private readonly criticScale: number   // = 0.0005 from Jordan's impl

  private trajectory: A2CStep[] = []
  private lastProbs = [0.5, 0.5]
  private lastValue = 0

  constructor(lr = 0.005, gamma = 0.99, criticScale = 0.0005) {
    this.lr = lr
    this.gamma = gamma
    this.criticScale = criticScale
    this.actW1 = heInit(128, 4); this.actB1 = zerosInit(128)
    this.actW2 = heInit(2, 128); this.actB2 = zerosInit(2)
    this.criW1 = heInit(128, 4); this.criB1 = zerosInit(128)
    this.criW2 = heInit(1, 128); this.criB2 = zerosInit(1)
    this.adamActW1 = adamInit(128 * 4); this.adamActB1 = adamInit(128)
    this.adamActW2 = adamInit(2 * 128); this.adamActB2 = adamInit(2)
    this.adamCriW1 = adamInit(128 * 4); this.adamCriB1 = adamInit(128)
    this.adamCriW2 = adamInit(1 * 128); this.adamCriB2 = adamInit(1)
  }

  private actorForward(x: number[]) {
    const actPre1 = linear(this.actW1, this.actB1, x, 128, 4)
    const actH1 = relu(actPre1)
    const logits = linear(this.actW2, this.actB2, actH1, 2, 128)
    const probs = softmax(logits)
    return { probs, actH1, actPre1 }
  }

  private criticForward(x: number[]) {
    const criPre1 = linear(this.criW1, this.criB1, x, 128, 4)
    const criH1 = relu(criPre1)
    const valueArr = linear(this.criW2, this.criB2, criH1, 1, 128)
    return { value: valueArr[0], criH1, criPre1 }
  }

  act(state: ClassicCartPoleState): ClassicCartPoleAction {
    const x = [state.x, state.xDot, state.theta, state.thetaDot]
    const { probs } = this.actorForward(x)
    const { value } = this.criticForward(x)
    this.lastProbs = probs
    this.lastValue = value
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
    const { probs, actH1, actPre1 } = this.actorForward(x)
    const { value, criH1, criPre1 } = this.criticForward(x)

    this.trajectory.push({ x, actH1, actPre1, probs, action, criH1, criPre1, value, reward })

    if (!done) return

    // ── Episode ended: compute returns and advantages ──────────────────────

    const T = this.trajectory.length
    const G = new Array<number>(T)
    let g = 0
    for (let t = T - 1; t >= 0; t--) {
      g = this.trajectory[t].reward + this.gamma * g
      G[t] = g
    }

    // advantage_t = G_t - V(s_t)
    const advantages = this.trajectory.map((step, t) => G[t] - step.value)

    // ── Actor gradients ────────────────────────────────────────────────────
    const dActW1 = zerosInit(128 * 4); const dActB1 = zerosInit(128)
    const dActW2 = zerosInit(2 * 128); const dActB2 = zerosInit(2)

    for (let t = 0; t < T; t++) {
      const { x: xt, actH1, actPre1, probs: pt, action: at } = this.trajectory[t]
      const adv = advantages[t] / T  // average over episode (detached from critic)

      // dL_actor/dlogits[j] = adv * (probs[j] - I(j==action))
      const dLogits = pt.map((p, j) => adv * (p - (j === at ? 1 : 0)))

      const dActH1 = linearBackward(this.actW2, dLogits, 2, 128)
      accumWeightGrad(dActW2, dLogits, actH1, 2, 128)
      accumBiasGrad(dActB2, dLogits)

      const dActPre1 = dActH1.map((v, i) => (actPre1[i] > 0 ? v : 0))
      accumWeightGrad(dActW1, dActPre1, xt, 128, 4)
      accumBiasGrad(dActB1, dActPre1)
    }

    // ── Critic gradients ───────────────────────────────────────────────────
    const dCriW1 = zerosInit(128 * 4); const dCriB1 = zerosInit(128)
    const dCriW2 = zerosInit(1 * 128); const dCriB2 = zerosInit(1)

    for (let t = 0; t < T; t++) {
      const { x: xt, criH1, criPre1 } = this.trajectory[t]
      const adv = advantages[t]

      // L_critic = criticScale * (G_t - V)^2, so dL/dV = -2 * criticScale * advantage / T
      const dOut1 = [-2 * this.criticScale * adv / T]

      const dCriH1 = linearBackward(this.criW2, dOut1, 1, 128)
      accumWeightGrad(dCriW2, dOut1, criH1, 1, 128)
      accumBiasGrad(dCriB2, dOut1)

      const dCriPre1 = dCriH1.map((v, i) => (criPre1[i] > 0 ? v : 0))
      accumWeightGrad(dCriW1, dCriPre1, xt, 128, 4)
      accumBiasGrad(dCriB1, dCriPre1)
    }

    // ── Adam updates ───────────────────────────────────────────────────────
    adamUpdate(this.actW1, dActW1, this.adamActW1, this.lr)
    adamUpdate(this.actB1, dActB1, this.adamActB1, this.lr)
    adamUpdate(this.actW2, dActW2, this.adamActW2, this.lr)
    adamUpdate(this.actB2, dActB2, this.adamActB2, this.lr)

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
    this.actW1 = heInit(128, 4); this.actB1 = zerosInit(128)
    this.actW2 = heInit(2, 128); this.actB2 = zerosInit(2)
    this.criW1 = heInit(128, 4); this.criB1 = zerosInit(128)
    this.criW2 = heInit(1, 128); this.criB2 = zerosInit(1)
    this.adamActW1 = adamInit(128 * 4); this.adamActB1 = adamInit(128)
    this.adamActW2 = adamInit(2 * 128); this.adamActB2 = adamInit(2)
    this.adamCriW1 = adamInit(128 * 4); this.adamCriB1 = adamInit(128)
    this.adamCriW2 = adamInit(1 * 128); this.adamCriB2 = adamInit(1)
    this.trajectory = []
    this.lastProbs = [0.5, 0.5]
    this.lastValue = 0
  }
}
