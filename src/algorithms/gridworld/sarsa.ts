import type { Agent } from '../types'
import type { GridState, GridAction } from '../../environments/gridworld'
import { GridWorldEnvironment } from '../../environments/gridworld'
import { argmax, randInt } from '../../utils/math'

/**
 * SARSA: On-policy TD control.
 * Updates: Q(s,a) += α[r + γ·Q(s',a') - Q(s,a)]
 * where a' is the actual next action (not the max).
 */
export class SarsaAgent implements Agent<GridState, GridAction> {
  private qTable: Map<string, number[]> = new Map()
  private alpha: number
  private gamma: number
  private epsilon: number
  private numActions = 4
  private nextAction: GridAction | null = null

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

  private selectAction(state: GridState): GridAction {
    if (Math.random() < this.epsilon) {
      return randInt(this.numActions) as GridAction
    }
    const key = GridWorldEnvironment.stateKey(state)
    return argmax(this.getQ(key)) as GridAction
  }

  act(state: GridState): GridAction {
    // SARSA needs to use the pre-selected next action if available
    if (this.nextAction !== null) {
      const action = this.nextAction
      this.nextAction = null
      return action
    }
    return this.selectAction(state)
  }

  learn(state: GridState, action: GridAction, reward: number, nextState: GridState, done: boolean): void {
    const key = GridWorldEnvironment.stateKey(state)
    const nextKey = GridWorldEnvironment.stateKey(nextState)
    const q = this.getQ(key)

    // On-policy: use actual next action
    this.nextAction = this.selectAction(nextState)
    const nextQ = this.getQ(nextKey)
    const target = done ? reward : reward + this.gamma * nextQ[this.nextAction]
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
    this.nextAction = null
  }

  setParams(alpha: number, gamma: number, epsilon: number): void {
    this.alpha = alpha
    this.gamma = gamma
    this.epsilon = epsilon
  }
}
