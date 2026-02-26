import type { Agent } from '../types'
import type { RocketState, RocketAction } from '../../environments/rocketLanding'
import { randInt } from '../../utils/math'

/**
 * Random agent — picks left, right, or bottom thrust with equal probability.
 * Serves as a baseline: ~20-30 steps per episode on average.
 */
export class RandomAgent implements Agent<RocketState, RocketAction> {
  act(_state: RocketState): RocketAction {
    return randInt(3) as RocketAction
  }

  learn(): void {
    // No learning — pure random
  }

  getValues(): Record<string, number[]> {
    return {}
  }

  reset(): void {
    // Nothing to reset
  }
}
