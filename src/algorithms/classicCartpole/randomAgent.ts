import type { Agent } from '../types'
import type { ClassicCartPoleState, ClassicCartPoleAction } from '../../environments/classicCartpole'
import { randInt } from '../../utils/math'

/**
 * Random agent — pushes left or right with equal probability.
 * Serves as a baseline: typically falls within ~20-40 steps.
 */
export class RandomAgent implements Agent<ClassicCartPoleState, ClassicCartPoleAction> {
  act(_state: ClassicCartPoleState): ClassicCartPoleAction {
    return randInt(2) as ClassicCartPoleAction
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
