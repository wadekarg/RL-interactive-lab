/**
 * dqn.ts — Deep Q-Network for Classic CartPole.
 *
 * Architecture: 4 → 128 → 64 → 2 (linear Q-values)
 * Ported from Jordan Lei's PyTorch DQN implementation.
 *
 * Key features:
 *   - Experience replay buffer (random mini-batch sampling)
 *   - Target network (periodically synced from online network)
 *   - ε-greedy exploration with exponential decay
 *   - Adam optimizer with gradient clipping
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
  AdamState,
} from './nnUtils'

// ─── Network structure ────────────────────────────────────────────────────────

interface DQNNetwork {
  W1: number[]  // [128 * 4]
  b1: number[]  // [128]
  W2: number[]  // [64 * 128]
  b2: number[]  // [64]
  W3: number[]  // [2 * 64]
  b3: number[]  // [2]
}

function createDQNNetwork(): DQNNetwork {
  return {
    W1: heInit(128, 4),
    b1: zerosInit(128),
    W2: heInit(64, 128),
    b2: zerosInit(64),
    W3: heInit(2, 64),
    b3: zerosInit(2),
  }
}

function cloneNetwork(src: DQNNetwork): DQNNetwork {
  return {
    W1: [...src.W1], b1: [...src.b1],
    W2: [...src.W2], b2: [...src.b2],
    W3: [...src.W3], b3: [...src.b3],
  }
}

interface DQNForwardResult {
  qValues: number[]
  h1: number[]
  pre1: number[]
  h2: number[]
  pre2: number[]
}

function forwardDQN(net: DQNNetwork, x: number[]): DQNForwardResult {
  const pre1 = linear(net.W1, net.b1, x, 128, 4)
  const h1 = relu(pre1)
  const pre2 = linear(net.W2, net.b2, h1, 64, 128)
  const h2 = relu(pre2)
  const qValues = linear(net.W3, net.b3, h2, 2, 64)
  return { qValues, h1, pre1, h2, pre2 }
}

// ─── Adam state group ─────────────────────────────────────────────────────────

interface DQNAdam {
  W1: AdamState; b1: AdamState
  W2: AdamState; b2: AdamState
  W3: AdamState; b3: AdamState
}

function createDQNAdam(): DQNAdam {
  return {
    W1: adamInit(128 * 4), b1: adamInit(128),
    W2: adamInit(64 * 128), b2: adamInit(64),
    W3: adamInit(2 * 64), b3: adamInit(2),
  }
}

// ─── Experience replay buffer ─────────────────────────────────────────────────

interface Experience {
  state: number[]
  action: number
  reward: number
  nextState: number[]
  done: boolean
}

class ReplayBuffer {
  private buffer: Experience[] = []
  private pos = 0
  readonly capacity: number

  constructor(capacity: number) {
    this.capacity = capacity
  }

  push(exp: Experience): void {
    if (this.buffer.length < this.capacity) {
      this.buffer.push(exp)
    } else {
      this.buffer[this.pos] = exp
    }
    this.pos = (this.pos + 1) % this.capacity
  }

  sample(batchSize: number): Experience[] {
    const n = Math.min(batchSize, this.buffer.length)
    const indices = new Set<number>()
    while (indices.size < n) {
      indices.add(Math.floor(Math.random() * this.buffer.length))
    }
    return Array.from(indices).map((i) => this.buffer[i])
  }

  get size(): number {
    return this.buffer.length
  }
}

// ─── DQNAgent ─────────────────────────────────────────────────────────────────

function stateToArray(s: ClassicCartPoleState): number[] {
  return [s.x, s.xDot, s.theta, s.thetaDot]
}

export class DQNAgent implements Agent<ClassicCartPoleState, ClassicCartPoleAction> {
  private online: DQNNetwork
  private target: DQNNetwork
  private buffer: ReplayBuffer
  private adam: DQNAdam

  private readonly lr: number
  private readonly gamma: number
  private readonly epsilonStart: number
  private readonly epsilonDecay: number
  private readonly epsilonMin: number
  private readonly batchSize: number
  private readonly bufferCapacity: number
  private readonly targetSyncInterval: number

  private currentEpsilon: number
  private stepCount = 0
  private lastQValues = [0, 0]
  private lastTDError = 0

  constructor(
    lr = 0.001,
    gamma = 0.99,
    epsilonStart = 1.0,
    epsilonDecay = 0.9995,
    epsilonMin = 0.05,
    batchSize = 64,
    bufferCapacity = 5000,
    targetSyncInterval = 50,
  ) {
    this.lr = lr
    this.gamma = gamma
    this.epsilonStart = epsilonStart
    this.epsilonDecay = epsilonDecay
    this.epsilonMin = epsilonMin
    this.batchSize = batchSize
    this.bufferCapacity = bufferCapacity
    this.targetSyncInterval = targetSyncInterval
    this.currentEpsilon = epsilonStart

    this.online = createDQNNetwork()
    this.target = cloneNetwork(this.online)
    this.buffer = new ReplayBuffer(bufferCapacity)
    this.adam = createDQNAdam()
  }

  act(state: ClassicCartPoleState): ClassicCartPoleAction {
    const x = stateToArray(state)
    const { qValues } = forwardDQN(this.online, x)
    this.lastQValues = qValues

    if (Math.random() < this.currentEpsilon) {
      return (Math.random() < 0.5 ? 0 : 1) as ClassicCartPoleAction
    }
    return (qValues[0] >= qValues[1] ? 0 : 1) as ClassicCartPoleAction
  }

  learn(
    state: ClassicCartPoleState,
    action: ClassicCartPoleAction,
    reward: number,
    nextState: ClassicCartPoleState,
    done: boolean,
  ): void {
    this.buffer.push({
      state: stateToArray(state),
      action,
      reward,
      nextState: stateToArray(nextState),
      done,
    })

    this.stepCount++
    this.currentEpsilon = Math.max(
      this.epsilonMin,
      this.currentEpsilon * this.epsilonDecay,
    )

    if (this.buffer.size >= this.batchSize) {
      this.trainBatch(this.buffer.sample(this.batchSize))
    }

    if (this.stepCount % this.targetSyncInterval === 0) {
      this.target = cloneNetwork(this.online)
    }
  }

  private trainBatch(batch: Experience[]): void {
    const B = batch.length

    // Gradient accumulators
    const dW1 = zerosInit(128 * 4)
    const db1 = zerosInit(128)
    const dW2 = zerosInit(64 * 128)
    const db2 = zerosInit(64)
    const dW3 = zerosInit(2 * 64)
    const db3 = zerosInit(2)

    let totalTDError = 0

    for (const exp of batch) {
      const { state: s, action: a, reward: r, nextState: ns, done } = exp

      // Compute TD target from target network
      const { qValues: nextQ } = forwardDQN(this.target, ns)
      const tdTarget = done ? r : r + this.gamma * Math.max(nextQ[0], nextQ[1])

      // Forward pass through online network
      const { qValues, h1, pre1, h2, pre2 } = forwardDQN(this.online, s)

      const tdError = tdTarget - qValues[a]
      totalTDError += Math.abs(tdError)

      // dL/dOutput — MSE gradient, averaged over batch
      const dOut: number[] = [0, 0]
      dOut[a] = -(tdError) / B  // d/dQ = -(target - Q) / B

      // Layer 3 backward
      const dH2 = linearBackward(this.online.W3, dOut, 2, 64)
      accumWeightGrad(dW3, dOut, h2, 2, 64)
      accumBiasGrad(db3, dOut)

      // ReLU backward for layer 2
      const dPre2 = dH2.map((v, i) => (pre2[i] > 0 ? v : 0))

      // Layer 2 backward
      const dH1 = linearBackward(this.online.W2, dPre2, 64, 128)
      accumWeightGrad(dW2, dPre2, h1, 64, 128)
      accumBiasGrad(db2, dPre2)

      // ReLU backward for layer 1
      const dPre1 = dH1.map((v, i) => (pre1[i] > 0 ? v : 0))

      // Layer 1 backward
      accumWeightGrad(dW1, dPre1, s, 128, 4)
      accumBiasGrad(db1, dPre1)
    }

    this.lastTDError = totalTDError / B

    // Gradient clipping to [-1, 1]
    const clip = (g: number) => Math.max(-1, Math.min(1, g))
    adamUpdate(this.online.W1, dW1.map(clip), this.adam.W1, this.lr)
    adamUpdate(this.online.b1, db1.map(clip), this.adam.b1, this.lr)
    adamUpdate(this.online.W2, dW2.map(clip), this.adam.W2, this.lr)
    adamUpdate(this.online.b2, db2.map(clip), this.adam.b2, this.lr)
    adamUpdate(this.online.W3, dW3.map(clip), this.adam.W3, this.lr)
    adamUpdate(this.online.b3, db3.map(clip), this.adam.b3, this.lr)
  }

  getValues(): Record<string, number[]> {
    return {
      qValues: [...this.lastQValues],
      epsilon: [this.currentEpsilon],
      bufferSize: [this.buffer.size],
      tdError: [this.lastTDError],
    }
  }

  getCurrentEpsilon(): number {
    return this.currentEpsilon
  }

  getBufferSize(): number {
    return this.buffer.size
  }

  reset(): void {
    this.online = createDQNNetwork()
    this.target = cloneNetwork(this.online)
    this.buffer = new ReplayBuffer(this.bufferCapacity)
    this.adam = createDQNAdam()
    this.currentEpsilon = this.epsilonStart
    this.stepCount = 0
    this.lastQValues = [0, 0]
    this.lastTDError = 0
  }
}
