import type { Agent } from '../types'

/**
 * Upper Confidence Bound (UCB1) agent for Multi-Armed Bandit.
 * Selects arm that maximizes: Q(a) + c * sqrt(ln(t) / N(a))
 */
export class UCBAgent implements Agent<number, number> {
  private estimates: number[]
  private counts: number[]
  private totalSteps: number
  private confidence: number
  private numArms: number

  constructor(numArms: number, confidence: number = 2) {
    this.numArms = numArms
    this.confidence = confidence
    this.estimates = new Array(numArms).fill(0)
    this.counts = new Array(numArms).fill(0)
    this.totalSteps = 0
  }

  act(_state: number): number {
    // Try each arm once first
    for (let i = 0; i < this.numArms; i++) {
      if (this.counts[i] === 0) return i
    }

    // UCB1 selection
    let bestArm = 0
    let bestValue = -Infinity

    for (let i = 0; i < this.numArms; i++) {
      const ucbValue =
        this.estimates[i] +
        this.confidence * Math.sqrt(Math.log(this.totalSteps) / this.counts[i])

      if (ucbValue > bestValue) {
        bestValue = ucbValue
        bestArm = i
      }
    }

    return bestArm
  }

  learn(_state: number, action: number, reward: number): void {
    this.totalSteps++
    this.counts[action]++
    this.estimates[action] +=
      (reward - this.estimates[action]) / this.counts[action]
  }

  getValues(): Record<string, number[]> {
    // Also return UCB values for visualization
    const ucbValues = this.estimates.map((est, i) => {
      if (this.counts[i] === 0) return Infinity
      return est + this.confidence * Math.sqrt(Math.log(this.totalSteps + 1) / this.counts[i])
    })

    return {
      estimates: [...this.estimates],
      counts: [...this.counts],
      ucbValues,
    }
  }

  reset(): void {
    this.estimates = new Array(this.numArms).fill(0)
    this.counts = new Array(this.numArms).fill(0)
    this.totalSteps = 0
  }

  setConfidence(c: number): void {
    this.confidence = c
  }
}
