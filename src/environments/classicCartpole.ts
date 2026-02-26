import type { Environment, StepResult } from './types'

export interface ClassicCartPoleState {
  x: number        // cart position
  xDot: number     // cart velocity
  theta: number    // pole angle (radians, 0 = upright)
  thetaDot: number // pole angular velocity
}

/** Actions: 0 = push left, 1 = push right */
export type ClassicCartPoleAction = 0 | 1

export const CLASSIC_ACTION_NAMES = ['Push Left', 'Push Right'] as const

// ─── Physics Constants (OpenAI Gym CartPole-v1) ─────────────────────────────

const GRAVITY = 9.8
const MASS_CART = 1.0
const MASS_POLE = 0.1
const TOTAL_MASS = MASS_CART + MASS_POLE
const HALF_POLE_LENGTH = 0.5
const POLE_MASS_LENGTH = MASS_POLE * HALF_POLE_LENGTH
const FORCE_MAG = 10.0
const DT = 0.02

// Termination thresholds
const THETA_THRESHOLD = 12 * Math.PI / 180  // 12 degrees
const X_THRESHOLD = 2.4
const MAX_STEPS = 500

export type BalanceResult = 'balancing' | 'solved' | 'fell'

/** Determine whether the cart-pole is balancing, solved (500 steps), or fell */
export function getBalanceResult(steps: number, done: boolean): BalanceResult {
  if (!done) return 'balancing'
  if (steps >= MAX_STEPS) return 'solved'
  return 'fell'
}

/**
 * Classic CartPole-v1 environment.
 * A cart slides on a frictionless track with a pole balanced on top.
 * The agent pushes left or right to keep the pole upright.
 */
export class ClassicCartPoleEnvironment implements Environment<ClassicCartPoleState, ClassicCartPoleAction> {
  private stepCount = 0

  reset(): ClassicCartPoleState {
    this.stepCount = 0
    return {
      x: (Math.random() - 0.5) * 0.1,
      xDot: (Math.random() - 0.5) * 0.1,
      theta: (Math.random() - 0.5) * 0.1,
      thetaDot: (Math.random() - 0.5) * 0.1,
    }
  }

  step(state: ClassicCartPoleState, action: ClassicCartPoleAction): StepResult<ClassicCartPoleState> {
    const { x, xDot, theta, thetaDot } = state
    const force = action === 1 ? FORCE_MAG : -FORCE_MAG

    const cosTheta = Math.cos(theta)
    const sinTheta = Math.sin(theta)

    // Horizontal dynamics (Euler integration, matches OpenAI Gym)
    const temp = (force + POLE_MASS_LENGTH * thetaDot * thetaDot * sinTheta) / TOTAL_MASS
    const thetaAcc =
      (GRAVITY * sinTheta - cosTheta * temp) /
      (HALF_POLE_LENGTH * (4.0 / 3.0 - (MASS_POLE * cosTheta * cosTheta) / TOTAL_MASS))
    const xAcc = temp - (POLE_MASS_LENGTH * thetaAcc * cosTheta) / TOTAL_MASS

    const nextState: ClassicCartPoleState = {
      x: x + DT * xDot,
      xDot: xDot + DT * xAcc,
      theta: theta + DT * thetaDot,
      thetaDot: thetaDot + DT * thetaAcc,
    }

    this.stepCount++

    const tiltViolation = Math.abs(nextState.theta) > THETA_THRESHOLD
    const driftViolation = Math.abs(nextState.x) > X_THRESHOLD
    const solved = this.stepCount >= MAX_STEPS
    const done = tiltViolation || driftViolation || solved

    const reward = 1.0  // +1 per step

    return { nextState, reward, done }
  }

  getActions(_state: ClassicCartPoleState): ClassicCartPoleAction[] {
    return [0, 1]
  }

  getStepCount(): number {
    return this.stepCount
  }

  static stateKey(state: ClassicCartPoleState): string {
    return `x=${state.x.toFixed(2)}, v=${state.xDot.toFixed(2)}, \u03B8=${state.theta.toFixed(3)}, \u03C9=${state.thetaDot.toFixed(3)}`
  }
}

// ─── Discretization ─────────────────────────────────────────────────────────

export interface ClassicDiscretizationConfig {
  xBins: number
  xDotBins: number
  thetaBins: number
  thetaDotBins: number
}

export const DEFAULT_CLASSIC_DISCRETIZATION: ClassicDiscretizationConfig = {
  xBins: 6,
  xDotBins: 6,
  thetaBins: 12,
  thetaDotBins: 12,
}

function bin(value: number, low: number, high: number, numBins: number): number {
  const clipped = Math.max(low, Math.min(high, value))
  const ratio = (clipped - low) / (high - low)
  const b = Math.floor(ratio * numBins)
  return Math.min(b, numBins - 1)
}

/** Convert continuous classic CartPole state to a discrete string key */
export function discretizeClassic(state: ClassicCartPoleState, config: ClassicDiscretizationConfig = DEFAULT_CLASSIC_DISCRETIZATION): string {
  const xBin = bin(state.x, -2.4, 2.4, config.xBins)
  const xDotBin = bin(state.xDot, -3.0, 3.0, config.xDotBins)
  const thetaBin = bin(state.theta, -THETA_THRESHOLD, THETA_THRESHOLD, config.thetaBins)
  const thetaDotBin = bin(state.thetaDot, -3.5, 3.5, config.thetaDotBins)
  return `${xBin},${xDotBin},${thetaBin},${thetaDotBin}`
}
