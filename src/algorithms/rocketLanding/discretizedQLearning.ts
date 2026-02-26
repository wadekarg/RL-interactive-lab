import type { Agent } from '../types'
import type { RocketState, RocketAction } from '../../environments/rocketLanding'
import type { RocketDiscretizationConfig } from '../../environments/rocketLanding'
import { discretizeRocket, DEFAULT_ROCKET_DISCRETIZATION } from '../../environments/rocketLanding'
import { argmax, randInt } from '../../utils/math'

/**
 * Q-Learning over discretized Rocket Landing state space.
 * Bins the 6 continuous state variables (x, xDot, y, yDot, theta, thetaDot)
 * into discrete buckets.
 */
export class DiscretizedQLearningAgent implements Agent<RocketState, RocketAction> {
  private qTable: Map<string, number[]> = new Map()
  private alpha: number
  private gamma: number
  private epsilon: number
  private discretizationConfig: RocketDiscretizationConfig
  private numActions = 3

  constructor(
    alpha = 0.1,
    gamma = 0.99,
    epsilon = 0.1,
    discretizationConfig: RocketDiscretizationConfig = DEFAULT_ROCKET_DISCRETIZATION,
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

  act(state: RocketState): RocketAction {
    if (Math.random() < this.epsilon) {
      return randInt(this.numActions) as RocketAction
    }
    const key = discretizeRocket(state, this.discretizationConfig)
    return argmax(this.getQ(key)) as RocketAction
  }

  learn(state: RocketState, action: RocketAction, reward: number, nextState: RocketState, done: boolean): void {
    const key = discretizeRocket(state, this.discretizationConfig)
    const nextKey = discretizeRocket(nextState, this.discretizationConfig)
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

  setDiscretization(config: RocketDiscretizationConfig): void {
    this.discretizationConfig = config
  }
}
