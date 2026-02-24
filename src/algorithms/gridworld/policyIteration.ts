import type { Agent } from '../types'
import type { GridState, GridAction } from '../../environments/gridworld'
import { GridWorldEnvironment } from '../../environments/gridworld'
import { argmax } from '../../utils/math'

/**
 * Policy Iteration: alternates between:
 * 1. Policy Evaluation — compute V^π for current policy
 * 2. Policy Improvement — update policy greedily w.r.t. V
 *
 * Each learn() call does one eval sweep + one improvement sweep.
 */
export class PolicyIterationAgent implements Agent<GridState, GridAction> {
  private env: GridWorldEnvironment
  private V: Map<string, number> = new Map()
  private policy: Map<string, GridAction> = new Map()
  private gamma: number
  private evalSweeps: number
  private sweepsDone = 0

  constructor(env: GridWorldEnvironment, gamma = 0.99, evalSweeps = 10) {
    this.env = env
    this.gamma = gamma
    this.evalSweeps = evalSweeps
    this.initValues()
  }

  private initValues(): void {
    for (const state of this.env.getAllStates()) {
      const key = GridWorldEnvironment.stateKey(state)
      this.V.set(key, 0)
      this.policy.set(key, 0) // initial policy: always go Up
    }
  }

  act(state: GridState): GridAction {
    const key = GridWorldEnvironment.stateKey(state)
    return this.policy.get(key) ?? 0
  }

  learn(_state: GridState, _action: GridAction, _reward: number, _nextState: GridState, _done: boolean): void {
    // Step 1: Policy Evaluation (multiple sweeps)
    for (let sweep = 0; sweep < this.evalSweeps; sweep++) {
      for (const state of this.env.getAllStates()) {
        const key = GridWorldEnvironment.stateKey(state)
        const action = this.policy.get(key) ?? 0
        const { nextState, reward, done } = this.env.step(state, action)
        const nextKey = GridWorldEnvironment.stateKey(nextState)
        const nextV = done ? 0 : (this.V.get(nextKey) ?? 0)
        this.V.set(key, reward + this.gamma * nextV)
      }
    }

    // Step 2: Policy Improvement
    const actions: GridAction[] = [0, 1, 2, 3]
    for (const state of this.env.getAllStates()) {
      const key = GridWorldEnvironment.stateKey(state)
      const qValues = actions.map((action) => {
        const { nextState, reward, done } = this.env.step(state, action)
        const nextKey = GridWorldEnvironment.stateKey(nextState)
        const nextV = done ? 0 : (this.V.get(nextKey) ?? 0)
        return reward + this.gamma * nextV
      })
      this.policy.set(key, argmax(qValues) as GridAction)
    }

    this.sweepsDone++
  }

  getValues(): Record<string, number[]> {
    const result: Record<string, number[]> = {}
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
}
