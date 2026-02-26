import type { Environment, StepResult } from './types'

export interface RocketState {
  x: number        // cart position
  xDot: number     // cart velocity
  y: number        // altitude (1.0 = start, 0 = ground)
  yDot: number     // vertical velocity
  theta: number    // pole angle (radians, 0 = upright)
  thetaDot: number // pole angular velocity
}

/** Actions: 0 = push left, 1 = push right, 2 = bottom thrust (no horizontal force) */
export type RocketAction = 0 | 1 | 2

export const ROCKET_ACTION_NAMES = ['Left Thrust', 'Right Thrust', 'Bottom Thrust'] as const

// ─── Physics Constants ─────────────────────────────────────────────────────

const GRAVITY = 9.8
const MASS_CART = 1.0
const MASS_POLE = 0.1
const TOTAL_MASS = MASS_CART + MASS_POLE
const HALF_POLE_LENGTH = 0.5
const POLE_MASS_LENGTH = MASS_POLE * HALF_POLE_LENGTH
const FORCE_MAG = 10.0
const THRUST_MAG = 15.0
const DT = 0.02

// Termination thresholds
const THETA_THRESHOLD = 12 * Math.PI / 180
const X_THRESHOLD = 2.4
const MAX_STEPS = 1000
const SOFT_LANDING_SPEED = 0.5
const SOFT_LANDING_X = 1.0

export type LandingResult = 'flying' | 'landed' | 'crashed'

/** Determine whether the rocket landed softly, crashed, or is still flying */
export function getLandingResult(state: RocketState, done: boolean): LandingResult {
  if (!done) return 'flying'
  if (state.y <= 0) {
    const softLanding =
      Math.abs(state.yDot) < SOFT_LANDING_SPEED &&
      Math.abs(state.theta) < THETA_THRESHOLD &&
      Math.abs(state.x) < SOFT_LANDING_X
    return softLanding ? 'landed' : 'crashed'
  }
  return 'crashed' // airborne violation or timeout
}

/**
 * Rocket Landing environment.
 * A rocket descends from altitude y=1.0 under gravity. The agent applies
 * left, right, or bottom thrust to land softly on the pad.
 */
export class RocketLandingEnvironment implements Environment<RocketState, RocketAction> {
  private stepCount = 0

  reset(): RocketState {
    this.stepCount = 0
    return {
      x: (Math.random() - 0.5) * 0.1,
      xDot: (Math.random() - 0.5) * 0.1,
      y: 1.0,
      yDot: 0,
      theta: (Math.random() - 0.5) * 0.1,
      thetaDot: (Math.random() - 0.5) * 0.1,
    }
  }

  step(state: RocketState, action: RocketAction): StepResult<RocketState> {
    const { x, xDot, y, yDot, theta, thetaDot } = state
    const force = action === 2 ? 0 : action === 1 ? FORCE_MAG : -FORCE_MAG

    const cosTheta = Math.cos(theta)
    const sinTheta = Math.sin(theta)

    const temp = (force + POLE_MASS_LENGTH * thetaDot * thetaDot * sinTheta) / TOTAL_MASS
    const thetaAcc =
      (GRAVITY * sinTheta - cosTheta * temp) /
      (HALF_POLE_LENGTH * (4.0 / 3.0 - (MASS_POLE * cosTheta * cosTheta) / TOTAL_MASS))
    const xAcc = temp - (POLE_MASS_LENGTH * thetaAcc * cosTheta) / TOTAL_MASS

    const upThrust = action === 2 ? THRUST_MAG : 0
    const yAcc = -GRAVITY + upThrust / TOTAL_MASS

    const nextState: RocketState = {
      x: x + DT * xDot,
      xDot: xDot + DT * xAcc,
      y: y + DT * yDot,
      yDot: yDot + DT * yAcc,
      theta: theta + DT * thetaDot,
      thetaDot: thetaDot + DT * thetaAcc,
    }

    this.stepCount++

    const landed = nextState.y <= 0
    const airborneViolation = !landed && (
      Math.abs(nextState.theta) > THETA_THRESHOLD ||
      Math.abs(nextState.x) > X_THRESHOLD
    )
    const timeout = this.stepCount >= MAX_STEPS
    const done = landed || airborneViolation || timeout

    let reward = 1.0

    if (landed) {
      const softLanding =
        Math.abs(nextState.yDot) < SOFT_LANDING_SPEED &&
        Math.abs(nextState.theta) < THETA_THRESHOLD &&
        Math.abs(nextState.x) < SOFT_LANDING_X
      if (softLanding) {
        reward += 10 * (1 - Math.abs(nextState.yDot) / SOFT_LANDING_SPEED)
        reward += 5 * (1 - Math.abs(nextState.x) / SOFT_LANDING_X)
        reward += 5 * (1 - Math.abs(nextState.theta) / THETA_THRESHOLD)
      } else {
        reward = -10
      }
    } else if (airborneViolation) {
      reward = -5
    } else if (timeout) {
      reward = -2
    }

    return { nextState, reward, done }
  }

  getActions(_state: RocketState): RocketAction[] {
    return [0, 1, 2]
  }

  static stateKey(state: RocketState): string {
    return `x=${state.x.toFixed(2)}, v=${state.xDot.toFixed(2)}, y=${state.y.toFixed(2)}, vy=${state.yDot.toFixed(2)}, \u03B8=${state.theta.toFixed(3)}, \u03C9=${state.thetaDot.toFixed(3)}`
  }
}

// ─── Discretization ─────────────────────────────────────────────────────────

export interface RocketDiscretizationConfig {
  xBins: number
  xDotBins: number
  yBins: number
  yDotBins: number
  thetaBins: number
  thetaDotBins: number
}

export const DEFAULT_ROCKET_DISCRETIZATION: RocketDiscretizationConfig = {
  xBins: 6,
  xDotBins: 6,
  yBins: 8,
  yDotBins: 8,
  thetaBins: 12,
  thetaDotBins: 12,
}

function bin(value: number, low: number, high: number, numBins: number): number {
  const clipped = Math.max(low, Math.min(high, value))
  const ratio = (clipped - low) / (high - low)
  const b = Math.floor(ratio * numBins)
  return Math.min(b, numBins - 1)
}

export function discretizeRocket(state: RocketState, config: RocketDiscretizationConfig = DEFAULT_ROCKET_DISCRETIZATION): string {
  const xBin = bin(state.x, -2.4, 2.4, config.xBins)
  const xDotBin = bin(state.xDot, -3.0, 3.0, config.xDotBins)
  const yBin = bin(state.y, 0, 1.0, config.yBins)
  const yDotBin = bin(state.yDot, -5.0, 1.0, config.yDotBins)
  const thetaBin = bin(state.theta, -THETA_THRESHOLD, THETA_THRESHOLD, config.thetaBins)
  const thetaDotBin = bin(state.thetaDot, -3.5, 3.5, config.thetaDotBins)
  return `${xBin},${xDotBin},${yBin},${yDotBin},${thetaBin},${thetaDotBin}`
}
