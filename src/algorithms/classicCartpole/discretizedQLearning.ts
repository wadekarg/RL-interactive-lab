import type { Agent } from '../types'
import type { ClassicCartPoleState, ClassicCartPoleAction } from '../../environments/classicCartpole'
import type { ClassicDiscretizationConfig } from '../../environments/classicCartpole'
import { discretizeClassic, DEFAULT_CLASSIC_DISCRETIZATION } from '../../environments/classicCartpole'
import { argmax, randInt } from '../../utils/math'

/**
 * Q-Learning over discretized classic CartPole state space.
 * Bins the 4 continuous state variables (x, xDot, theta, thetaDot)
 * into discrete buckets. Default: 6×6×12×12 = 5,184 states.
 *
 * Both α and ε decay per episode — constant α prevents Q-values from stabilizing.
 */
export class DiscretizedQLearningAgent implements Agent<ClassicCartPoleState, ClassicCartPoleAction> {
  private qTable: Map<string, number[]> = new Map()
  private alpha: number          // initial learning rate
  private gamma: number
  private epsilon: number        // initial exploration rate
  private epsilonDecay: number
  private epsilonMin: number
  private currentEpsilon: number
  private currentAlpha: number   // decayed learning rate
  private readonly alphaDecay = 0.999
  private readonly alphaMin = 0.1
  private episodeCount = 0
  private discretizationConfig: ClassicDiscretizationConfig
  private numActions = 2

  constructor(
    alpha = 0.5,
    gamma = 0.99,
    epsilon = 1.0,
    discretizationConfig: ClassicDiscretizationConfig = DEFAULT_CLASSIC_DISCRETIZATION,
    epsilonDecay = 0.995,
    epsilonMin = 0.05,
  ) {
    this.alpha = alpha
    this.gamma = gamma
    this.epsilon = epsilon
    this.epsilonDecay = epsilonDecay
    this.epsilonMin = epsilonMin
    this.currentEpsilon = epsilon
    this.currentAlpha = alpha
    this.discretizationConfig = discretizationConfig
  }

  private getQ(key: string): number[] {
    if (!this.qTable.has(key)) {
      this.qTable.set(key, new Array(this.numActions).fill(0))
    }
    return this.qTable.get(key)!
  }

  act(state: ClassicCartPoleState): ClassicCartPoleAction {
    if (Math.random() < this.currentEpsilon) {
      return randInt(this.numActions) as ClassicCartPoleAction
    }
    const key = discretizeClassic(state, this.discretizationConfig)
    return argmax(this.getQ(key)) as ClassicCartPoleAction
  }

  learn(state: ClassicCartPoleState, action: ClassicCartPoleAction, reward: number, nextState: ClassicCartPoleState, done: boolean): void {
    const key = discretizeClassic(state, this.discretizationConfig)
    const nextKey = discretizeClassic(nextState, this.discretizationConfig)
    const q = this.getQ(key)
    const nextQ = this.getQ(nextKey)

    const target = done ? reward : reward + this.gamma * Math.max(...nextQ)
    q[action] += this.currentAlpha * (target - q[action])

    if (done) {
      this.episodeCount++
      // Decay ε per episode
      this.currentEpsilon = Math.max(
        this.epsilonMin,
        this.epsilon * Math.pow(this.epsilonDecay, this.episodeCount),
      )
      // Decay α per episode — constant α prevents convergence
      this.currentAlpha = Math.max(
        this.alphaMin,
        this.alpha * Math.pow(this.alphaDecay, this.episodeCount),
      )
    }
  }

  getValues(): Record<string, number[]> {
    const result: Record<string, number[]> = {}
    for (const [key, values] of this.qTable) {
      result[key] = [...values]
    }
    return result
  }

  getCurrentEpsilon(): number {
    return this.currentEpsilon
  }

  reset(): void {
    this.qTable.clear()
    this.episodeCount = 0
    this.currentEpsilon = this.epsilon
    this.currentAlpha = this.alpha
  }

  setParams(alpha: number, gamma: number, epsilon: number): void {
    this.alpha = alpha
    this.gamma = gamma
    this.epsilon = epsilon
  }

  setDiscretization(config: ClassicDiscretizationConfig): void {
    this.discretizationConfig = config
  }
}
