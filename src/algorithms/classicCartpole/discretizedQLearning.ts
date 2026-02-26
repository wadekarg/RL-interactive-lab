import type { Agent } from '../types'
import type { ClassicCartPoleState, ClassicCartPoleAction } from '../../environments/classicCartpole'
import type { ClassicDiscretizationConfig } from '../../environments/classicCartpole'
import { discretizeClassic, DEFAULT_CLASSIC_DISCRETIZATION } from '../../environments/classicCartpole'
import { argmax, randInt } from '../../utils/math'

/**
 * Q-Learning over discretized classic CartPole state space.
 * Bins the 4 continuous state variables (x, xDot, theta, thetaDot)
 * into discrete buckets. Default: 6×6×12×12 = 5,184 states.
 */
export class DiscretizedQLearningAgent implements Agent<ClassicCartPoleState, ClassicCartPoleAction> {
  private qTable: Map<string, number[]> = new Map()
  private alpha: number
  private gamma: number
  private epsilon: number
  private discretizationConfig: ClassicDiscretizationConfig
  private numActions = 2

  constructor(
    alpha = 0.1,
    gamma = 0.99,
    epsilon = 0.1,
    discretizationConfig: ClassicDiscretizationConfig = DEFAULT_CLASSIC_DISCRETIZATION,
  ) {
    this.alpha = alpha
    this.gamma = gamma
    this.epsilon = epsilon
    this.discretizationConfig = discretizationConfig
  }

  private getQ(key: string): number[] {
    if (!this.qTable.has(key)) {
      this.qTable.set(key, new Array(this.numActions).fill(0))
    }
    return this.qTable.get(key)!
  }

  act(state: ClassicCartPoleState): ClassicCartPoleAction {
    if (Math.random() < this.epsilon) {
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
    q[action] += this.alpha * (target - q[action])
  }

  getValues(): Record<string, number[]> {
    const result: Record<string, number[]> = {}
    for (const [key, values] of this.qTable) {
      result[key] = [...values]
    }
    return result
  }

  reset(): void {
    this.qTable.clear()
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
