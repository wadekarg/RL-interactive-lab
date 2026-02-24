import type { Environment, StepResult } from './types'

export interface CartPoleState {
  x: number        // cart position
  xDot: number     // cart velocity
  theta: number    // pole angle (radians, 0 = upright)
  thetaDot: number // pole angular velocity
}

/** Actions: 0 = push left, 1 = push right */
export type CartPoleAction = 0 | 1

export const CARTPOLE_ACTION_NAMES = ['Left Thrust', 'Right Thrust'] as const

// ─── Physics Constants (OpenAI Gym CartPole-v1) ─────────────────────────────

const GRAVITY = 9.8
const MASS_CART = 1.0
const MASS_POLE = 0.1
const TOTAL_MASS = MASS_CART + MASS_POLE
const HALF_POLE_LENGTH = 0.5    // half the pole length
const POLE_MASS_LENGTH = MASS_POLE * HALF_POLE_LENGTH
const FORCE_MAG = 10.0
const DT = 0.02                 // time step (seconds)

// Termination thresholds
const THETA_THRESHOLD = 12 * Math.PI / 180  // 12 degrees in radians
const X_THRESHOLD = 2.4
const MAX_STEPS = 500

/**
 * CartPole environment — classic control problem.
 * A pole is attached by an unactuated joint to a cart on a frictionless track.
 * The agent applies a force to the cart (left or right) to keep the pole balanced.
 */
export class CartPoleEnvironment implements Environment<CartPoleState, CartPoleAction> {
  private stepCount = 0

  reset(): CartPoleState {
    this.stepCount = 0
    // Small random initial state (±0.05 on each dimension)
    return {
      x: (Math.random() - 0.5) * 0.1,
      xDot: (Math.random() - 0.5) * 0.1,
      theta: (Math.random() - 0.5) * 0.1,
      thetaDot: (Math.random() - 0.5) * 0.1,
    }
  }

  step(state: CartPoleState, action: CartPoleAction): StepResult<CartPoleState> {
    const { x, xDot, theta, thetaDot } = state
    const force = action === 1 ? FORCE_MAG : -FORCE_MAG

    const cosTheta = Math.cos(theta)
    const sinTheta = Math.sin(theta)

    // Euler integration (matches OpenAI Gym)
    const temp = (force + POLE_MASS_LENGTH * thetaDot * thetaDot * sinTheta) / TOTAL_MASS
    const thetaAcc =
      (GRAVITY * sinTheta - cosTheta * temp) /
      (HALF_POLE_LENGTH * (4.0 / 3.0 - (MASS_POLE * cosTheta * cosTheta) / TOTAL_MASS))
    const xAcc = temp - (POLE_MASS_LENGTH * thetaAcc * cosTheta) / TOTAL_MASS

    const nextState: CartPoleState = {
      x: x + DT * xDot,
      xDot: xDot + DT * xAcc,
      theta: theta + DT * thetaDot,
      thetaDot: thetaDot + DT * thetaAcc,
    }

    this.stepCount++

    const done =
      Math.abs(nextState.theta) > THETA_THRESHOLD ||
      Math.abs(nextState.x) > X_THRESHOLD ||
      this.stepCount >= MAX_STEPS

    return {
      nextState,
      reward: 1.0, // +1 for every step survived
      done,
    }
  }

  getActions(_state: CartPoleState): CartPoleAction[] {
    return [0, 1]
  }

  /** Convert state to string key for display */
  static stateKey(state: CartPoleState): string {
    return `x=${state.x.toFixed(2)}, v=${state.xDot.toFixed(2)}, θ=${state.theta.toFixed(3)}, ω=${state.thetaDot.toFixed(3)}`
  }
}

// ─── Discretization ─────────────────────────────────────────────────────────

export interface DiscretizationConfig {
  xBins: number
  xDotBins: number
  thetaBins: number
  thetaDotBins: number
}

export const DEFAULT_DISCRETIZATION: DiscretizationConfig = {
  xBins: 6,
  xDotBins: 6,
  thetaBins: 12,
  thetaDotBins: 12,
}

/** Bin a single value into [0, numBins-1] */
function bin(value: number, low: number, high: number, numBins: number): number {
  // Clip to range
  const clipped = Math.max(low, Math.min(high, value))
  const ratio = (clipped - low) / (high - low)
  const b = Math.floor(ratio * numBins)
  return Math.min(b, numBins - 1)
}

/** Convert continuous CartPole state to a discrete string key for Q-table lookup */
export function discretize(state: CartPoleState, config: DiscretizationConfig = DEFAULT_DISCRETIZATION): string {
  const xBin = bin(state.x, -2.4, 2.4, config.xBins)
  const xDotBin = bin(state.xDot, -3.0, 3.0, config.xDotBins)
  const thetaBin = bin(state.theta, -THETA_THRESHOLD, THETA_THRESHOLD, config.thetaBins)
  const thetaDotBin = bin(state.thetaDot, -3.5, 3.5, config.thetaDotBins)
  return `${xBin},${xDotBin},${thetaBin},${thetaDotBin}`
}
