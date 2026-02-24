/** Core agent interface — all algorithms implement this */
export interface Agent<S, A> {
  act(state: S): A
  learn(state: S, action: A, reward: number, nextState: S, done: boolean): void
  /** Returns readable snapshot of internal values for visualization */
  getValues(): Record<string, number[]>
  reset(): void
}

/** A single recorded simulation step for replay/visualization */
export interface SimulationStep {
  t: number
  state: unknown
  action: unknown
  reward: number
  nextState: unknown
  done: boolean
  /** Snapshot of agent values at this timestep */
  values: Record<string, number[]>
}

export type SimulationStatus = 'idle' | 'running' | 'paused' | 'done'
