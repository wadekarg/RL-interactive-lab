import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CartPoleEnvironment } from '../../environments/cartpole'
import type { CartPoleState, CartPoleAction, DiscretizationConfig } from '../../environments/cartpole'
import { RandomAgent } from '../../algorithms/cartpole/randomAgent'
import { DiscretizedQLearningAgent } from '../../algorithms/cartpole/discretizedQLearning'
import { ReinforceAgent } from '../../algorithms/cartpole/reinforce'
import { useSimulationStore } from '../../store/simulationStore'
import { PlaybackControls } from '../shared/PlaybackControls'
import { AlgorithmExplainer } from '../shared/AlgorithmExplainer'
import { RocketCanvas } from './RocketCanvas'
import { EpisodeDurationChart } from './EpisodeDurationChart'
import { CartPoleStepBreakdownPanel } from './CartPoleStepBreakdownPanel'
import { cartpoleAlgorithms, cartpoleIntro, cartpoleParamExplanations } from '../../content/cartpoleExplainer'
import type { Agent, SimulationStep } from '../../algorithms/types'

type AlgorithmType = 'random' | 'discretized-q' | 'reinforce'

export function CartPolePage() {
  const [algorithmType, setAlgorithmType] = useState<AlgorithmType>('discretized-q')
  const [alpha, setAlpha] = useState(0.1)
  const [gamma, setGamma] = useState(0.99)
  const [epsilon, setEpsilon] = useState(0.1)
  const [lr, setLr] = useState(0.01)
  const [bins, setBins] = useState(8)
  const [showIntro, setShowIntro] = useState(true)
  const [envSeed, setEnvSeed] = useState(0)

  const { status, speed, history, addStep, setStatus, reset: resetStore, currentStep } = useSimulationStore()
  const isRunning = status === 'running' || status === 'paused'

  // Episode tracking
  const [episodeDurations, setEpisodeDurations] = useState<number[]>([])
  const episodeDurationsRef = useRef(episodeDurations)
  episodeDurationsRef.current = episodeDurations

  const discretizationConfig = useMemo((): DiscretizationConfig => ({
    xBins: bins,
    xDotBins: bins,
    thetaBins: bins * 2,
    thetaDotBins: bins * 2,
  }), [bins])

  const environment = useMemo(() => {
    return new CartPoleEnvironment()
  }, [envSeed]) // eslint-disable-line react-hooks/exhaustive-deps

  const agent = useMemo((): Agent<CartPoleState, CartPoleAction> => {
    switch (algorithmType) {
      case 'random':
        return new RandomAgent()
      case 'discretized-q':
        return new DiscretizedQLearningAgent(alpha, gamma, epsilon, discretizationConfig)
      case 'reinforce':
        return new ReinforceAgent(lr, gamma)
    }
  }, [algorithmType, alpha, gamma, epsilon, lr, discretizationConfig, envSeed]) // eslint-disable-line react-hooks/exhaustive-deps

  // Simulation loop (inline, matches GridWorldPage pattern)
  const stateRef = useRef<CartPoleState>(environment.reset())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stepCountRef = useRef(0)
  const episodeRef = useRef(0)
  const stepsInEpisodeRef = useRef(0)
  const statusRef = useRef(status)
  const speedRef = useRef(speed)
  const lastActionRef = useRef<CartPoleAction | null>(null)
  statusRef.current = status
  speedRef.current = speed

  const executeStep = useCallback(() => {
    const currentState = stateRef.current
    const action = agent.act(currentState) as CartPoleAction
    const { nextState, reward, done } = environment.step(currentState, action)
    agent.learn(currentState, action, reward, nextState, done)

    lastActionRef.current = action
    stepsInEpisodeRef.current++

    const step: SimulationStep = {
      t: stepCountRef.current,
      state: currentState,
      action,
      reward,
      nextState,
      done,
      values: { ...agent.getValues() },
    }

    addStep(step)
    stepCountRef.current++

    if (done) {
      const duration = stepsInEpisodeRef.current  // capture before resetting
      setEpisodeDurations((prev) => [...prev, duration])
      stateRef.current = environment.reset()
      episodeRef.current++
      stepsInEpisodeRef.current = 0
      lastActionRef.current = null
    } else {
      stateRef.current = nextState
    }

    return stepCountRef.current >= 100000
  }, [environment, agent, addStep])

  useEffect(() => {
    if (status !== 'running') {
      if (timerRef.current) clearTimeout(timerRef.current)
      return
    }
    const tick = () => {
      if (statusRef.current !== 'running') return
      const maxed = executeStep()
      if (maxed) { setStatus('done'); return }
      timerRef.current = setTimeout(tick, speedRef.current)
    }
    timerRef.current = setTimeout(tick, speedRef.current)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [status, executeStep, setStatus])

  const play = useCallback(() => setStatus('running'), [setStatus])
  const pause = useCallback(() => setStatus('paused'), [setStatus])

  const step = useCallback(() => {
    if (status === 'running') return
    executeStep()
    setStatus('paused')
  }, [status, executeStep, setStatus])

  const resetSim = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    agent.reset()
    stateRef.current = environment.reset()
    stepCountRef.current = 0
    episodeRef.current = 0
    stepsInEpisodeRef.current = 0
    lastActionRef.current = null
    setEpisodeDurations([])
    resetStore()
  }, [agent, environment, resetStore])

  const handleReset = useCallback(() => {
    resetSim()
    setEnvSeed((s) => s + 1)
  }, [resetSim])

  const handleAlgorithmChange = useCallback((type: AlgorithmType) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    resetStore()
    stepCountRef.current = 0
    episodeRef.current = 0
    stepsInEpisodeRef.current = 0
    lastActionRef.current = null
    setEpisodeDurations([])
    setAlgorithmType(type)
    setEnvSeed((s) => s + 1)
  }, [resetStore])

  // Extract latest state for visualization
  const latestStep = history.length > 0 ? history[history.length - 1] : null
  const currentCartState = latestStep
    ? (latestStep.done ? latestStep.nextState as CartPoleState : latestStep.nextState as CartPoleState)
    : stateRef.current
  const latestDone = latestStep?.done ?? false
  const survived500 = latestDone && stepsInEpisodeRef.current === 0 && episodeDurations.length > 0 && episodeDurations[episodeDurations.length - 1] >= 500

  const explainer = cartpoleAlgorithms[algorithmType]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      {/* ===== STORY & INTRO ===== */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-text">
              <span className="text-2xl mr-2">{'\uD83D\uDE80'}</span> {cartpoleIntro.title}
            </h1>
            <p className="text-base text-primary-light mt-1 font-medium">
              Help Dabak land safely on Mars using Reinforcement Learning
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/cartpole-guide"
              className="text-xs font-medium text-primary-light hover:text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 no-underline hover:bg-primary/20 transition-colors"
            >
              Learn the Theory
            </Link>
            <button
              onClick={() => setShowIntro(!showIntro)}
              className="text-xs text-text-muted hover:text-text bg-surface-light px-3 py-1.5 rounded-lg border border-surface-lighter cursor-pointer"
            >
              {showIntro ? 'Hide story' : 'Show story'}
            </button>
          </div>
        </div>

        {showIntro && (
          <div className="bg-surface-light rounded-xl border border-surface-lighter p-6 mb-6">
            <div className="mb-5">
              <h3 className="text-sm font-bold text-accent-yellow uppercase tracking-wider mb-2">The Story</h3>
              <p className="text-sm text-text leading-relaxed whitespace-pre-line">{cartpoleIntro.story}</p>
            </div>
            <div className="mb-5">
              <h3 className="text-sm font-bold text-accent-green uppercase tracking-wider mb-2">The Objective</h3>
              <p className="text-sm text-text leading-relaxed">{cartpoleIntro.objective}</p>
            </div>
            <div className="mb-5">
              <h3 className="text-sm font-bold text-accent-blue uppercase tracking-wider mb-2">How This Simulation Works</h3>
              <p className="text-sm text-text leading-relaxed">{cartpoleIntro.howItWorks}</p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary-light uppercase tracking-wider mb-2">What You'll Learn</h3>
              <ul className="text-sm text-text-muted space-y-1">
                {cartpoleIntro.whatYouWillLearn.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary-light mt-0.5">-</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* ===== ALGORITHM SELECTOR ===== */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Choose an Algorithm</h3>
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(cartpoleAlgorithms) as AlgorithmType[]).map((type) => (
            <button
              key={type}
              onClick={() => handleAlgorithmChange(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border-0 cursor-pointer transition-colors ${
                algorithmType === type
                  ? 'bg-primary text-white'
                  : 'bg-surface-light text-text-muted hover:text-text hover:bg-surface-lighter'
              }`}
            >
              {cartpoleAlgorithms[type].name}
              <span className="ml-1 text-xs opacity-60">
                {type === 'random' ? '(baseline)' : type === 'discretized-q' ? '(value-based)' : '(policy gradient)'}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-2">
          <strong>Baseline:</strong> Random actions, no learning.
          <strong className="ml-2">Value-based:</strong> Discretized Q-table with {'\u03B5'}-greedy.
          <strong className="ml-2">Policy Gradient:</strong> REINFORCE with linear softmax policy.
        </p>
      </div>

      {/* ===== HYPERPARAMETERS ===== */}
      <div className="bg-surface-light rounded-xl border border-surface-lighter p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            Hyperparameters
          </h3>
          {isRunning && (
            <span className="text-xs text-accent-yellow">Reset to change parameters</span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-3">
          {algorithmType === 'discretized-q' && (
            <>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <label className="text-text">{'\u03B1'} Learning Rate</label>
                  <span className="font-mono text-primary-light">{alpha}</span>
                </div>
                <input type="range" min={0.01} max={1} step={0.01} value={alpha}
                  onChange={(e) => setAlpha(Number(e.target.value))} disabled={isRunning}
                  className="w-full accent-primary disabled:opacity-40" />
                <p className="text-xs text-text-muted mt-0.5">{cartpoleParamExplanations.alpha}</p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <label className="text-text">{'\u03B5'} Exploration</label>
                  <span className="font-mono text-primary-light">{epsilon}</span>
                </div>
                <input type="range" min={0} max={0.5} step={0.01} value={epsilon}
                  onChange={(e) => setEpsilon(Number(e.target.value))} disabled={isRunning}
                  className="w-full accent-primary disabled:opacity-40" />
                <p className="text-xs text-text-muted mt-0.5">{cartpoleParamExplanations.epsilon}</p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <label className="text-text">Bins per dimension</label>
                  <span className="font-mono text-primary-light">{bins}</span>
                </div>
                <input type="range" min={3} max={16} step={1} value={bins}
                  onChange={(e) => setBins(Number(e.target.value))} disabled={isRunning}
                  className="w-full accent-primary disabled:opacity-40" />
                <p className="text-xs text-text-muted mt-0.5">{cartpoleParamExplanations.bins}</p>
              </div>
            </>
          )}

          {algorithmType === 'reinforce' && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <label className="text-text">Learning Rate</label>
                <span className="font-mono text-primary-light">{lr}</span>
              </div>
              <input type="range" min={0.001} max={0.1} step={0.001} value={lr}
                onChange={(e) => setLr(Number(e.target.value))} disabled={isRunning}
                className="w-full accent-primary disabled:opacity-40" />
              <p className="text-xs text-text-muted mt-0.5">{cartpoleParamExplanations.lr}</p>
            </div>
          )}

          {algorithmType !== 'random' && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <label className="text-text">{'\u03B3'} Discount Factor</label>
                <span className="font-mono text-primary-light">{gamma}</span>
              </div>
              <input type="range" min={0.9} max={1} step={0.005} value={gamma}
                onChange={(e) => setGamma(Number(e.target.value))} disabled={isRunning}
                className="w-full accent-primary disabled:opacity-40" />
              <p className="text-xs text-text-muted mt-0.5">{cartpoleParamExplanations.gamma}</p>
            </div>
          )}

          {algorithmType === 'random' && (
            <div className="col-span-full">
              <p className="text-sm text-text-muted italic">
                Random agent has no hyperparameters — actions are chosen with 50/50 probability.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ===== MAIN LAYOUT: Sidebar + Rocket ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left sidebar */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <PlaybackControls
            onPlay={play}
            onPause={pause}
            onStep={step}
            onReset={handleReset}
          />

          {/* Stats */}
          <div className="p-4 bg-surface-light rounded-xl border border-surface-lighter">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">
              Dabak's Progress
            </h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Total Steps</span>
                <span className="font-mono text-text">{currentStep}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Episodes</span>
                <span className="font-mono text-text">{episodeRef.current}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Current Episode</span>
                <span className="font-mono text-text">{stepsInEpisodeRef.current} steps</span>
              </div>
              {episodeDurations.length > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Best Episode</span>
                    <span className="font-mono text-accent-green">{Math.max(...episodeDurations)} steps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Avg (last 20)</span>
                    <span className="font-mono text-primary-light">
                      {(episodeDurations.slice(-20).reduce((a, b) => a + b, 0) / Math.min(episodeDurations.length, 20)).toFixed(0)} steps
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* State panel */}
          <div className="p-4 bg-surface-light rounded-xl border border-surface-lighter">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Current State</h3>
            <div className="flex flex-col gap-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-text-muted">Position (x)</span>
                <span className="text-text">{currentCartState.x.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Velocity (v)</span>
                <span className="text-text">{currentCartState.xDot.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Angle ({'\u03B8'})</span>
                <span className="text-text">{(currentCartState.theta * 180 / Math.PI).toFixed(2)}{'\u00B0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Angular vel ({'\u03C9'})</span>
                <span className="text-text">{currentCartState.thetaDot.toFixed(3)}</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="p-4 bg-surface-light rounded-xl border border-surface-lighter">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Legend</h3>
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">{'\uD83D\uDE80'}</span>
                <span className="text-text">Dabak the Rocket (agent)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-2 bg-yellow-500 rounded-sm inline-block" />
                <span className="text-text">Landing Pad (stay within x={'\u00B1'}2.4)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">{'\u2B05\uFE0F'}</span>
                <span className="text-text">Left Thrust (action 0)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">{'\u27A1\uFE0F'}</span>
                <span className="text-text">Right Thrust (action 1)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-accent-red font-bold">12{'\u00B0'}</span>
                <span className="text-text">Max tilt before crash</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-accent-green font-bold">500</span>
                <span className="text-text">Steps for perfect landing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — rocket + charts + explainer */}
        <div className="lg:col-span-9 flex flex-col gap-4">
          <RocketCanvas
            state={currentCartState}
            action={lastActionRef.current}
            done={latestDone}
            survived500={survived500}
            episode={episodeRef.current + 1}
            stepInEpisode={stepsInEpisodeRef.current}
          />

          <CartPoleStepBreakdownPanel
            algorithmType={algorithmType}
            alpha={alpha}
            gamma={gamma}
            discretizationConfig={discretizationConfig}
          />

          <EpisodeDurationChart durations={episodeDurations} />

          <AlgorithmExplainer
            name={explainer.name}
            description={explainer.description}
            sections={explainer.sections}
          />
        </div>
      </div>
    </div>
  )
}
