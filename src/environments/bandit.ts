import type { Environment, StepResult } from './types'

/**
 * Multi-Armed Bandit environment.
 *
 * State is always 0 (single state).
 * Action is the arm index [0, k).
 * Each arm has a fixed mean reward (Gaussian with variance 1).
 */
export class BanditEnvironment implements Environment<number, number> {
  readonly numArms: number
  readonly trueMeans: number[]

  constructor(numArms: number = 10, trueMeans?: number[]) {
    this.numArms = numArms
    this.trueMeans = trueMeans ?? BanditEnvironment.generateMeans(numArms)
  }

  reset(): number {
    return 0 // single state
  }

  step(_state: number, action: number): StepResult<number> {
    // Reward is sampled from N(trueMean[action], 1)
    const mean = this.trueMeans[action]
    const reward = mean + randn()
    return { nextState: 0, reward, done: false }
  }

  getActions(_state: number): number[] {
    return Array.from({ length: this.numArms }, (_, i) => i)
  }

  static generateMeans(k: number): number[] {
    // Generate k means from N(0, 1), spread them out a bit
    return Array.from({ length: k }, () => randn() * 1.5)
  }
}

function randn(): number {
  const u1 = Math.random()
  const u2 = Math.random()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}
