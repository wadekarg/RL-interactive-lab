import type { Agent } from '../types'
import type { GridState, GridAction } from '../../environments/gridworld'
import { GridWorldEnvironment } from '../../environments/gridworld'
import { argmax, randInt } from '../../utils/math'

/**
 * Q-Learning: Off-policy TD control.
 * Updates: Q(s,a) += α[r + γ·max_a' Q(s',a') - Q(s,a)]
 */
export class QLearningAgent implements Agent<GridState, GridAction> {
  private qTable: Map<string, number[]> = new Map()
  private alpha: number
  private gamma: number
  private epsilon: number
  private numActions = 4

  constructor(alpha = 0.1, gamma = 0.99, epsilon = 0.1) {
    this.alpha = alpha
    this.gamma = gamma
    this.epsilon = epsilon
  }

  private getQ(key: string): number[] {
    if (!this.qTable.has(key)) {
      this.qTable.set(key, new Array(this.numActions).fill(0))
    }
    return this.qTable.get(key)!
  }

  act(state: GridState): GridAction {
    if (Math.random() < this.epsilon) {
      return randInt(this.numActions) as GridAction
    }
    const key = GridWorldEnvironment.stateKey(state)
    return argmax(this.getQ(key)) as GridAction
  }

  learn(state: GridState, action: GridAction, reward: number, nextState: GridState, done: boolean): void {
    const key = GridWorldEnvironment.stateKey(state)
    const nextKey = GridWorldEnvironment.stateKey(nextState)
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
}
