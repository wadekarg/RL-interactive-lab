import { useCallback, useEffect, useRef } from 'react'
import { useSimulationStore } from '../store/simulationStore'
import type { Agent } from '../algorithms/types'
import type { Environment } from '../environments/types'

interface UseSimulationOptions<S, A> {
  environment: Environment<S, A>
  agent: Agent<S, A>
  maxSteps?: number
}

/**
 * Core simulation hook — drives the play/pause/step/reset loop.
 * Completely decoupled from specific algorithm or environment.
 */
export function useSimulation<S, A>({ environment, agent, maxSteps = 5000 }: UseSimulationOptions<S, A>) {
  const { status, speed, stepsPerTick, history, addStep, setStatus, setTotalStepCount, reset: resetStore } = useSimulationStore()

  const stateRef = useRef<S>(environment.reset())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stepCountRef = useRef(0)

  // Refs for latest values (avoids stale closures)
  const statusRef = useRef(status)
  const speedRef = useRef(speed)
  const stepsPerTickRef = useRef(stepsPerTick)
  statusRef.current = status
  speedRef.current = speed
  stepsPerTickRef.current = stepsPerTick

  const executeStep = useCallback((silent = false) => {
    const currentState = stateRef.current
    const action = agent.act(currentState)
    const { nextState, reward, done } = environment.step(currentState, action)
    agent.learn(currentState, action, reward, nextState, done)

    stepCountRef.current++

    if (!silent) {
      addStep({
        t: stepCountRef.current - 1,
        state: currentState,
        action,
        reward,
        nextState,
        done,
        values: { ...agent.getValues() },
      })
      setTotalStepCount(stepCountRef.current)
    }

    if (done || stepCountRef.current >= maxSteps) {
      stateRef.current = environment.reset()
    } else {
      stateRef.current = nextState
    }

    return done || stepCountRef.current >= maxSteps
  }, [environment, agent, maxSteps, addStep, setTotalStepCount])

  // Run loop
  useEffect(() => {
    if (status !== 'running') {
      if (timerRef.current) clearTimeout(timerRef.current)
      return
    }

    const tick = () => {
      if (statusRef.current !== 'running') return
      const n = stepsPerTickRef.current
      for (let i = 0; i < n; i++) {
        const isLast = i === n - 1
        const finished = executeStep(!isLast)
        if (finished) {
          setStatus('done')
          return
        }
      }
      timerRef.current = setTimeout(tick, speedRef.current)
    }

    timerRef.current = setTimeout(tick, speedRef.current)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [status, executeStep, setStatus])

  const play = useCallback(() => setStatus('running'), [setStatus])
  const pause = useCallback(() => setStatus('paused'), [setStatus])

  const step = useCallback(() => {
    if (status === 'running') return
    executeStep()
    setStatus('paused')
  }, [status, executeStep, setStatus])

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    agent.reset()
    stateRef.current = environment.reset()
    stepCountRef.current = 0
    resetStore()
  }, [agent, environment, resetStore])

  return { play, pause, step, reset, status, history }
}
