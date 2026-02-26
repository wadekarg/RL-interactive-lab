/** Core environment interface — all environments implement this */
export interface Environment<S, A> {
  reset(): S
  step(state: S, action: A): StepResult<S>
  getActions(state: S): A[]
}

export interface StepResult<S> {
  nextState: S
  reward: number
  done: boolean
  info?: Record<string, unknown>
}
