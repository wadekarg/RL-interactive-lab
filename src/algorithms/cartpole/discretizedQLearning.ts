import type { Agent } from '../types'
import type { CartPoleState, CartPoleAction } from '../../environments/cartpole'
import type { DiscretizationConfig } from '../../environments/cartpole'
import { discretize, DEFAULT_DISCRETIZATION } from '../../environments/cartpole'
import { argmax, randInt } from '../../utils/math'

/**
 * Q-Learning over discretized CartPole state space.
 * Bridges GridWorld's tabular Q-Learning to continuous domains
 * by binning the 4 continuous state variables into discrete buckets.
 */
export class DiscretizedQLearningAgent implements Agent<CartPoleState, CartPoleAction> {
  private qTable: Map<string, number[]> = new Map()
  private alpha: number
  private gamma: number
  private epsilon: number
  private discretizationConfig: DiscretizationConfig
  private numActions = 2

  constructor(
    alpha = 0.1,
    gamma = 0.99,
    epsilon = 0.1,
    discretizationConfig: DiscretizationConfig = DEFAULT_DISCRETIZATION,
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

  act(state: CartPoleState): CartPoleAction {
    if (Math.random() < this.epsilon) {
      return randInt(this.numActions) as CartPoleAction
    }
    const key = discretize(state, this.discretizationConfig)
    return argmax(this.getQ(key)) as CartPoleAction
  }

  learn(state: CartPoleState, action: CartPoleAction, reward: number, nextState: CartPoleState, done: boolean): void {
    const key = discretize(state, this.discretizationConfig)
    const nextKey = discretize(nextState, this.discretizationConfig)
    const q = this.getQ(key)
    const nextQ = this.getQ(nextKey)

    // Off-policy: use max over next state actions
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

  setDiscretization(config: DiscretizationConfig): void {
    this.discretizationConfig = config
  }
}
