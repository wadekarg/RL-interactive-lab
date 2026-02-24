import type { Agent } from '../types'
import { sampleBeta } from '../../utils/math'

/**
 * Thompson Sampling agent for Multi-Armed Bandit.
 *
 * Maintains Beta(alpha, beta) posterior for each arm.
 * Maps Gaussian rewards to [0,1] via sigmoid for Beta compatibility.
 * Samples from each posterior and picks the arm with highest sample.
 */
export class ThompsonSamplingAgent implements Agent<number, number> {
  /** Success counts (alpha - 1) for Beta distribution */
  alphas: number[]
  /** Failure counts (beta - 1) for Beta distribution */
  betas: number[]
  private counts: number[]
  private estimates: number[]
  private numArms: number

  constructor(numArms: number) {
    this.numArms = numArms
    this.alphas = new Array(numArms).fill(1) // uniform prior
    this.betas = new Array(numArms).fill(1)
    this.counts = new Array(numArms).fill(0)
    this.estimates = new Array(numArms).fill(0)
  }

  act(_state: number): number {
    let bestArm = 0
    let bestSample = -Infinity

    for (let i = 0; i < this.numArms; i++) {
      const sample = sampleBeta(this.alphas[i], this.betas[i])
      if (sample > bestSample) {
        bestSample = sample
        bestArm = i
      }
    }

    return bestArm
  }

  learn(_state: number, action: number, reward: number): void {
    this.counts[action]++
    this.estimates[action] +=
      (reward - this.estimates[action]) / this.counts[action]

    // Convert reward to success/failure using sigmoid
    const p = 1 / (1 + Math.exp(-reward))
    // Use Bernoulli trial based on sigmoid probability
    if (Math.random() < p) {
      this.alphas[action] += 1
    } else {
      this.betas[action] += 1
    }
  }

  getValues(): Record<string, number[]> {
    return {
      estimates: [...this.estimates],
      counts: [...this.counts],
      alphas: [...this.alphas],
      betas: [...this.betas],
    }
  }

  reset(): void {
    this.alphas = new Array(this.numArms).fill(1)
    this.betas = new Array(this.numArms).fill(1)
    this.counts = new Array(this.numArms).fill(0)
    this.estimates = new Array(this.numArms).fill(0)
  }
}
