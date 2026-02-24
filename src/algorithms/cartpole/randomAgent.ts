import type { Agent } from '../types'
import type { CartPoleState, CartPoleAction } from '../../environments/cartpole'
import { randInt } from '../../utils/math'

/**
 * Random agent — picks left or right with equal probability.
 * Serves as a baseline: ~20-30 steps per episode on average.
 */
export class RandomAgent implements Agent<CartPoleState, CartPoleAction> {
  act(_state: CartPoleState): CartPoleAction {
    return randInt(2) as CartPoleAction
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
