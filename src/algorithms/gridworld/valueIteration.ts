import type { Agent } from '../types'
import type { GridState, GridAction } from '../../environments/gridworld'
import { GridWorldEnvironment } from '../../environments/gridworld'
import { argmax } from '../../utils/math'

/**
 * Value Iteration: Dynamic programming method.
 * Computes optimal value function iteratively, then derives policy.
 *
 * Unlike TD methods, this runs a full sweep of all states per "step".
 * Each call to learn() performs one full Bellman backup sweep.
 */
export class ValueIterationAgent implements Agent<GridState, GridAction> {
  private env: GridWorldEnvironment
  private V: Map<string, number> = new Map()
  private policy: Map<string, GridAction> = new Map()
  private gamma: number
  private sweepsDone = 0

  constructor(env: GridWorldEnvironment, gamma = 0.99) {
    this.env = env
    this.gamma = gamma
    this.initValues()
  }

  private initValues(): void {
    for (const state of this.env.getAllStates()) {
      const key = GridWorldEnvironment.stateKey(state)
      this.V.set(key, 0)
      this.policy.set(key, 0)
    }
  }

  act(state: GridState): GridAction {
    const key = GridWorldEnvironment.stateKey(state)
    return this.policy.get(key) ?? 0
  }

  /**
   * Each learn() call performs one full Bellman sweep over all states.
   * This is fundamentally different from TD learning — it's planning, not learning from experience.
   */
  learn(_state: GridState, _action: GridAction, _reward: number, _nextState: GridState, _done: boolean): void {
    const actions: GridAction[] = [0, 1, 2, 3]

    for (const state of this.env.getAllStates()) {
      const key = GridWorldEnvironment.stateKey(state)
      const qValues: number[] = []

      for (const action of actions) {
        const { nextState, reward, done } = this.env.step(state, action)
        const nextKey = GridWorldEnvironment.stateKey(nextState)
        const nextV = done ? 0 : (this.V.get(nextKey) ?? 0)
        qValues.push(reward + this.gamma * nextV)
      }

      const bestAction = argmax(qValues) as GridAction
      this.V.set(key, qValues[bestAction])
      this.policy.set(key, bestAction)
    }

    this.sweepsDone++
  }

  getValues(): Record<string, number[]> {
    const result: Record<string, number[]> = {}

    // Return Q-values for each state (all 4 actions)
    const actions: GridAction[] = [0, 1, 2, 3]
    for (const state of this.env.getAllStates()) {
      const key = GridWorldEnvironment.stateKey(state)
      const qValues = actions.map((action) => {
        const { nextState, reward, done } = this.env.step(state, action)
        const nextKey = GridWorldEnvironment.stateKey(nextState)
        const nextV = done ? 0 : (this.V.get(nextKey) ?? 0)
        return reward + this.gamma * nextV
      })
      result[key] = qValues
    }

    return result
  }

  reset(): void {
    this.V.clear()
    this.policy.clear()
    this.sweepsDone = 0
    this.initValues()
  }

  setGamma(gamma: number): void {
    this.gamma = gamma
  }

  getSweepsDone(): number {
    return this.sweepsDone
  }
}
