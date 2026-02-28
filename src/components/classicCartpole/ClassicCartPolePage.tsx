import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ClassicCartPoleEnvironment, getBalanceResult } from '../../environments/classicCartpole'
import type { ClassicCartPoleState, ClassicCartPoleAction, ClassicDiscretizationConfig, BalanceResult } from '../../environments/classicCartpole'
import { RandomAgent } from '../../algorithms/classicCartpole/randomAgent'
import { DiscretizedQLearningAgent } from '../../algorithms/classicCartpole/discretizedQLearning'
import { ReinforceAgent } from '../../algorithms/classicCartpole/reinforce'
import { useSimulationStore } from '../../store/simulationStore'
import { PlaybackControls } from '../shared/PlaybackControls'
import { AlgorithmExplainer } from '../shared/AlgorithmExplainer'
import { TestStandCanvas } from './TestStandCanvas'
import { EpisodeDurationChart } from '../shared/EpisodeDurationChart'
import { ClassicStepBreakdownPanel } from './ClassicStepBreakdownPanel'
import { classicCartpoleAlgorithms, classicCartpoleIntro, classicCartpoleParamExplanations } from '../../content/classicCartpoleExplainer'
import type { Agent } from '../../algorithms/types'

type AlgorithmType = 'random' | 'discretized-q' | 'reinforce'

export function ClassicCartPolePage() {
  const [algorithmType, setAlgorithmType] = useState<AlgorithmType>('discretized-q')
  const [alpha, setAlpha] = useState(0.1)
  const [gamma, setGamma] = useState(0.99)
  const [epsilon, setEpsilon] = useState(0.1)
  const [lr, setLr] = useState(0.01)
  const [bins, setBins] = useState(6)
  const [epsilonDecay, setEpsilonDecay] = useState(0.995)
  const [epsilonMin, setEpsilonMin] = useState(0.01)
  const [showIntro, setShowIntro] = useState(true)
  const [maxSteps, setMaxSteps] = useState(100000)
  const [envSeed, setEnvSeed] = useState(0)

  const { status, speed, stepsPerTick, history, addStep, setStatus, setTotalStepCount, reset: resetStore, totalStepCount } = useSimulationStore()
  const isRunning = status === 'running' || status === 'paused'

  const [episodeDurations, setEpisodeDurations] = useState<number[]>([])
  const [balanceResults, setBalanceResults] = useState<BalanceResult[]>([])
  const episodeDurationsRef = useRef(episodeDurations)
  episodeDurationsRef.current = episodeDurations

  const discretizationConfig = useMemo((): ClassicDiscretizationConfig => ({
    xBins: bins,
    xDotBins: bins,
    thetaBins: bins * 2,
    thetaDotBins: bins * 2,
  }), [bins])

  const environment = useMemo(() => {
    return new ClassicCartPoleEnvironment()
  }, [envSeed]) // eslint-disable-line react-hooks/exhaustive-deps

  const agent = useMemo((): Agent<ClassicCartPoleState, ClassicCartPoleAction> => {
    switch (algorithmType) {
      case 'random':
        return new RandomAgent()
      case 'discretized-q':
        return new DiscretizedQLearningAgent(alpha, gamma, epsilon, discretizationConfig, epsilonDecay, epsilonMin)
      case 'reinforce':
        return new ReinforceAgent(lr, gamma)
    }
  }, [algorithmType, alpha, gamma, epsilon, lr, discretizationConfig, epsilonDecay, epsilonMin, envSeed]) // eslint-disable-line react-hooks/exhaustive-deps

  const stateRef = useRef<ClassicCartPoleState>(environment.reset())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stepCountRef = useRef(0)
  const episodeRef = useRef(0)
  const stepsInEpisodeRef = useRef(0)
  const statusRef = useRef(status)
  const speedRef = useRef(speed)
  const stepsPerTickRef = useRef(stepsPerTick)
  const maxStepsRef = useRef(maxSteps)
  const lastActionRef = useRef<ClassicCartPoleAction | null>(null)
  const lastBalanceResultRef = useRef<BalanceResult>('balancing')
  statusRef.current = status
  speedRef.current = speed
  stepsPerTickRef.current = stepsPerTick
  maxStepsRef.current = maxSteps

  const executeStep = useCallback((silent = false) => {
    const currentState = stateRef.current
    const action = agent.act(currentState) as ClassicCartPoleAction
    const { nextState, reward, done } = environment.step(currentState, action)
    agent.learn(currentState, action, reward, nextState, done)

    lastActionRef.current = action
    stepsInEpisodeRef.current++
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

    if (done) {
      const duration = stepsInEpisodeRef.current
      const result = getBalanceResult(duration, done)
      lastBalanceResultRef.current = result
      setEpisodeDurations((prev) => [...prev, duration])
      setBalanceResults((prev) => [...prev, result])
      stateRef.current = environment.reset()
      episodeRef.current++
      stepsInEpisodeRef.current = 0
      lastActionRef.current = null
    } else {
      lastBalanceResultRef.current = 'balancing'
      stateRef.current = nextState
    }

    return stepCountRef.current >= maxStepsRef.current
  }, [environment, agent, addStep, setTotalStepCount])

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
        const maxed = executeStep(!isLast)
        if (maxed) { setStatus('done'); return }
      }
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
    lastBalanceResultRef.current = 'balancing'
    setEpisodeDurations([])
    setBalanceResults([])
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
    lastBalanceResultRef.current = 'balancing'
    setEpisodeDurations([])
    setBalanceResults([])
    setAlgorithmType(type)
    setEnvSeed((s) => s + 1)
  }, [resetStore])

  const latestStep = history.length > 0 ? history[history.length - 1] : null
  const currentCartState = latestStep
    ? (latestStep.nextState as ClassicCartPoleState)
    : stateRef.current
  const latestDone = latestStep?.done ?? false

  const balanceResult: BalanceResult = latestDone && stepsInEpisodeRef.current === 0 && balanceResults.length > 0
    ? balanceResults[balanceResults.length - 1]
    : 'balancing'

  const solvedCount = balanceResults.filter((r) => r === 'solved').length
  const successEpisodes = balanceResults.map((r) => r === 'solved')

  const explainer = classicCartpoleAlgorithms[algorithmType]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      {/* ===== STORY & INTRO ===== */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-text">
              <img src={`${import.meta.env.BASE_URL}cartpole.png`} alt="" className="inline-block w-10 h-10 mr-2 align-middle" /> {classicCartpoleIntro.title}
            </h1>
            <p className="text-base text-primary-light mt-1 font-medium">
              The classic RL benchmark {'\u2014'} keep the pole balanced
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
              <p className="text-sm text-text leading-relaxed whitespace-pre-line">{classicCartpoleIntro.story}</p>
            </div>
            <div className="mb-5">
              <h3 className="text-sm font-bold text-accent-green uppercase tracking-wider mb-2">The Objective</h3>
              <p className="text-sm text-text leading-relaxed">{classicCartpoleIntro.objective}</p>
            </div>
            <div className="mb-5">
              <h3 className="text-sm font-bold text-accent-blue uppercase tracking-wider mb-2">How This Simulation Works</h3>
              <p className="text-sm text-text leading-relaxed">{classicCartpoleIntro.howItWorks}</p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary-light uppercase tracking-wider mb-2">What You'll Learn</h3>
              <ul className="text-sm text-text-muted space-y-1">
                {classicCartpoleIntro.whatYouWillLearn.map((item, i) => (
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
          {(Object.keys(classicCartpoleAlgorithms) as AlgorithmType[]).map((type) => (
            <button
              key={type}
              onClick={() => handleAlgorithmChange(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border-0 cursor-pointer transition-colors ${
                algorithmType === type
                  ? 'bg-primary text-white'
                  : 'bg-surface-light text-text-muted hover:text-text hover:bg-surface-lighter'
              }`}
            >
              {classicCartpoleAlgorithms[type].name}
              <span className="ml-1 text-xs opacity-60">
                {type === 'random' ? '(baseline)' : type === 'discretized-q' ? '(value-based)' : '(policy gradient)'}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-2">
          <strong>Baseline:</strong> Random pushes, no learning.
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
                <p className="text-xs text-text-muted mt-0.5">{classicCartpoleParamExplanations.alpha}</p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <label className="text-text">{'\u03B5'} Exploration</label>
                  <span className="font-mono text-primary-light">{epsilon}</span>
                </div>
                <input type="range" min={0} max={0.5} step={0.01} value={epsilon}
                  onChange={(e) => setEpsilon(Number(e.target.value))} disabled={isRunning}
                  className="w-full accent-primary disabled:opacity-40" />
                <p className="text-xs text-text-muted mt-0.5">{classicCartpoleParamExplanations.epsilon}</p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <label className="text-text">Bins per dimension</label>
                  <span className="font-mono text-primary-light">{bins}</span>
                </div>
                <input type="range" min={3} max={10} step={1} value={bins}
                  onChange={(e) => setBins(Number(e.target.value))} disabled={isRunning}
                  className="w-full accent-primary disabled:opacity-40" />
                <p className="text-xs text-text-muted mt-0.5">{classicCartpoleParamExplanations.bins}</p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <label className="text-text">{'\u03B5'} Decay Rate</label>
                  <span className="font-mono text-primary-light">{epsilonDecay}</span>
                </div>
                <input type="range" min={0.9} max={1.0} step={0.001} value={epsilonDecay}
                  onChange={(e) => setEpsilonDecay(Number(e.target.value))} disabled={isRunning}
                  className="w-full accent-primary disabled:opacity-40" />
                <p className="text-xs text-text-muted mt-0.5">{classicCartpoleParamExplanations.epsilonDecay}</p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <label className="text-text">{'\u03B5'} Minimum</label>
                  <span className="font-mono text-primary-light">{epsilonMin}</span>
                </div>
                <input type="range" min={0} max={0.2} step={0.01} value={epsilonMin}
                  onChange={(e) => setEpsilonMin(Number(e.target.value))} disabled={isRunning}
                  className="w-full accent-primary disabled:opacity-40" />
                <p className="text-xs text-text-muted mt-0.5">{classicCartpoleParamExplanations.epsilonMin}</p>
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
              <p className="text-xs text-text-muted mt-0.5">{classicCartpoleParamExplanations.lr}</p>
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
              <p className="text-xs text-text-muted mt-0.5">{classicCartpoleParamExplanations.gamma}</p>
            </div>
          )}

          {algorithmType === 'random' && (
            <div className="col-span-full">
              <p className="text-sm text-text-muted italic">
                Random agent has no hyperparameters — actions are chosen with equal probability.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ===== MAIN LAYOUT ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 flex flex-col gap-4">
          <PlaybackControls
            onPlay={play}
            onPause={pause}
            onStep={step}
            onReset={handleReset}
            maxSteps={maxSteps}
            onMaxStepsChange={setMaxSteps}
          />

          <div className="p-4 bg-surface-light rounded-xl border border-surface-lighter">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">
              Training Progress
            </h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Total Steps</span>
                <span className="font-mono text-text">{totalStepCount}</span>
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
                  <div className="flex justify-between">
                    <span className="text-text-muted">Solved (500)</span>
                    <span className="font-mono text-accent-green">{solvedCount}</span>
                  </div>
                </>
              )}
              {algorithmType === 'discretized-q' && agent instanceof DiscretizedQLearningAgent && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Current {'\u03B5'}</span>
                  <span className="font-mono text-accent-yellow">{agent.getCurrentEpsilon().toFixed(4)}</span>
                </div>
              )}
            </div>
          </div>

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

          <div className="p-4 bg-surface-light rounded-xl border border-surface-lighter">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Legend</h3>
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex items-center gap-2">
                <img src={`${import.meta.env.BASE_URL}cartpole.png`} alt="" className="inline-block w-6 h-6" />
                <span className="text-text">Cart with pole</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-2 bg-yellow-500 rounded-sm inline-block" />
                <span className="text-text">Track (x={'\u00B1'}2.4)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">{'\u2B05\uFE0F'}</span>
                <span className="text-text">Push Left (action 0)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">{'\u27A1\uFE0F'}</span>
                <span className="text-text">Push Right (action 1)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-accent-green font-bold">500</span>
                <span className="text-text">Balanced for 500 steps = solved!</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-accent-red font-bold">Fell</span>
                <span className="text-text">|{'\u03B8'}| &gt; 12{'\u00B0'} or |x| &gt; 2.4</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-9 flex flex-col gap-4">
          <TestStandCanvas
            state={currentCartState}
            action={lastActionRef.current}
            done={latestDone}
            balanceResult={balanceResult}
            episode={episodeRef.current + 1}
            stepInEpisode={stepsInEpisodeRef.current}
          />

          <ClassicStepBreakdownPanel
            algorithmType={algorithmType}
            alpha={alpha}
            gamma={gamma}
            discretizationConfig={discretizationConfig}
          />

          <EpisodeDurationChart
            durations={episodeDurations}
            successEpisodes={successEpisodes}
            successLabel="Solved"
            referenceLine={500}
          />

          <AlgorithmExplainer
            name={explainer.name}
            description={explainer.description}
            sections={explainer.sections}
          />

          {/* Footer teaser */}
          <div className="bg-surface-light rounded-xl border border-surface-lighter p-4 text-center">
            <p className="text-sm text-text mb-2">
              Mastered CartPole? Ready for a harder challenge?
            </p>
            <Link
              to="/rocket-landing"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium no-underline hover:bg-primary-dark transition-colors"
            >
              <span>{'\uD83D\uDE80'}</span> Try Rocket Landing
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
