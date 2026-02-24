import type { Agent } from '../types'
import { argmax, randInt } from '../../utils/math'

/**
 * ε-greedy agent for Multi-Armed Bandit.
 * With probability ε, explores a random arm.
 * Otherwise, exploits the arm with highest estimated value.
 */
export class EpsilonGreedyAgent implements Agent<number, number> {
  private estimates: number[]
  private counts: number[]
  private epsilon: number
  private numArms: number

  constructor(numArms: number, epsilon: number = 0.1) {
    this.numArms = numArms
    this.epsilon = epsilon
    this.estimates = new Array(numArms).fill(0)
    this.counts = new Array(numArms).fill(0)
  }

  act(_state: number): number {
    if (Math.random() < this.epsilon) {
      return randInt(this.numArms) // explore
    }
    return argmax(this.estimates) // exploit
  }

  learn(_state: number, action: number, reward: number): void {
    this.counts[action]++
    // Incremental mean update: Q(a) += (r - Q(a)) / N(a)
    this.estimates[action] +=
      (reward - this.estimates[action]) / this.counts[action]
  }

  getValues(): Record<string, number[]> {
    return {
      estimates: [...this.estimates],
      counts: [...this.counts],
    }
  }

  reset(): void {
    this.estimates = new Array(this.numArms).fill(0)
    this.counts = new Array(this.numArms).fill(0)
  }

  setEpsilon(epsilon: number): void {
    this.epsilon = epsilon
  }
}
