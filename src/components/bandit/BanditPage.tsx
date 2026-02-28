import { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { BanditEnvironment } from '../../environments/bandit'
import { EpsilonGreedyAgent } from '../../algorithms/bandit/epsilonGreedy'
import { UCBAgent } from '../../algorithms/bandit/ucb'
import { ThompsonSamplingAgent } from '../../algorithms/bandit/thompsonSampling'
import { useSimulation } from '../../hooks/useSimulation'
import { useSimulationStore } from '../../store/simulationStore'
import { PlaybackControls } from '../shared/PlaybackControls'
import { HyperparamPanel } from '../shared/HyperparamPanel'
import type { HyperparamConfig } from '../shared/HyperparamPanel'
import { RewardChart } from '../shared/RewardChart'
import { AlgorithmExplainer } from '../shared/AlgorithmExplainer'
import { ArmChart } from './ArmChart'
import { ThompsonViz } from './ThompsonViz'
import { BanditStepBreakdownPanel } from './BanditStepBreakdownPanel'
import { banditAlgorithms, banditIntro, banditParamExplanations } from '../../content/banditExplainer'

type AlgorithmType = 'epsilon-greedy' | 'ucb' | 'thompson-sampling'

export function BanditPage() {
  const [algorithmType, setAlgorithmType] = useState<AlgorithmType>('epsilon-greedy')
  const [numArms, setNumArms] = useState(5)
  const [epsilon, setEpsilon] = useState(0.1)
  const [confidence, setConfidence] = useState(2)
  const [envSeed, setEnvSeed] = useState(0)
  const [maxSteps, setMaxSteps] = useState(5000)
  const [showIntro, setShowIntro] = useState(true)

  const status = useSimulationStore((s) => s.status)
  const totalStepCount = useSimulationStore((s) => s.totalStepCount)
  const isRunning = status === 'running' || status === 'paused'

  const environment = useMemo(
    () => new BanditEnvironment(numArms),
    [numArms, envSeed] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const agent = useMemo(() => {
    switch (algorithmType) {
      case 'epsilon-greedy':
        return new EpsilonGreedyAgent(numArms, epsilon)
      case 'ucb':
        return new UCBAgent(numArms, confidence)
      case 'thompson-sampling':
        return new ThompsonSamplingAgent(numArms)
    }
  }, [algorithmType, numArms, epsilon, confidence, envSeed]) // eslint-disable-line react-hooks/exhaustive-deps

  const { play, pause, step, reset: simReset, history } = useSimulation({
    environment,
    agent,
    maxSteps,
  })

  const handleReset = useCallback(() => {
    simReset()
    setEnvSeed((s) => s + 1)
  }, [simReset])

  // Extract latest values for visualization
  const latestValues = history.length > 0 ? history[history.length - 1].values : null
  const estimates = (latestValues?.estimates ?? new Array(numArms).fill(0)) as number[]
  const counts = (latestValues?.counts ?? new Array(numArms).fill(0)) as number[]
  const lastAction = history.length > 0 ? (history[history.length - 1].action as number) : undefined

  // Thompson-specific values
  const alphas = (latestValues?.alphas ?? new Array(numArms).fill(1)) as number[]
  const betas = (latestValues?.betas ?? new Array(numArms).fill(1)) as number[]

  // Compute stats
  const totalReward = history.reduce((sum, s) => sum + s.reward, 0)
  const bestArmIdx = environment.trueMeans.indexOf(Math.max(...environment.trueMeans))
  const optimalPulls = counts[bestArmIdx] ?? 0
  const optimalRate = history.length > 0 ? ((optimalPulls / history.length) * 100).toFixed(1) : '0.0'

  // Hyperparameter configs per algorithm
  const hyperparams: HyperparamConfig[] = useMemo(() => {
    switch (algorithmType) {
      case 'epsilon-greedy':
        return [{
          key: 'epsilon', label: 'ε (Epsilon)', min: 0, max: 1, step: 0.01,
          value: epsilon, description: banditParamExplanations.epsilon,
        }]
      case 'ucb':
        return [{
          key: 'confidence', label: 'c (Confidence)', min: 0, max: 5, step: 0.1,
          value: confidence, description: banditParamExplanations.confidence,
        }]
      case 'thompson-sampling':
        return []
    }
  }, [algorithmType, epsilon, confidence])

  const handleParamChange = useCallback((key: string, value: number) => {
    if (key === 'epsilon') setEpsilon(value)
    if (key === 'confidence') setConfidence(value)
  }, [])

  const handleAlgorithmChange = useCallback((type: AlgorithmType) => {
    simReset()
    setAlgorithmType(type)
    setEnvSeed((s) => s + 1)
  }, [simReset])

  const handleNumArmsChange = useCallback((val: number) => {
    simReset()
    setNumArms(val)
    setEnvSeed((s) => s + 1)
  }, [simReset])

  const explainer = banditAlgorithms[algorithmType]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      {/* ===== INTRO SECTION ===== */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-text">
              <span className="text-2xl mr-2">🎰</span> The Multi-Armed Bandit Problem
            </h1>
            <p className="text-base text-primary-light mt-1 font-medium">
              The fundamental exploration vs exploitation dilemma
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/bandit-guide"
              className="text-xs font-medium text-primary-light hover:text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 no-underline hover:bg-primary/20 transition-colors"
            >
              Learn the Theory
            </Link>
            <button
              onClick={() => setShowIntro(!showIntro)}
              className="text-xs text-text-muted hover:text-text bg-surface-light px-3 py-1.5 rounded-lg border border-surface-lighter cursor-pointer"
            >
              {showIntro ? 'Hide intro' : 'Show intro'}
            </button>
          </div>
        </div>

        {showIntro && (
          <div className="bg-surface-light rounded-xl border border-surface-lighter p-6 mb-6">
            {/* Story */}
            <div className="mb-5">
              <h3 className="text-sm font-bold text-accent-yellow uppercase tracking-wider mb-2">The Story</h3>
              <p className="text-sm text-text leading-relaxed">{banditIntro.story}</p>
            </div>

            {/* Objective */}
            <div className="mb-5">
              <h3 className="text-sm font-bold text-accent-green uppercase tracking-wider mb-2">The Objective</h3>
              <p className="text-sm text-text leading-relaxed">{banditIntro.objective}</p>
            </div>

            {/* How it works */}
            <div className="mb-5">
              <h3 className="text-sm font-bold text-accent-blue uppercase tracking-wider mb-2">How This Simulation Works</h3>
              <p className="text-sm text-text leading-relaxed">{banditIntro.howItWorks}</p>
            </div>

            {/* What you'll learn */}
            <div className="mb-5">
              <h3 className="text-sm font-bold text-primary-light uppercase tracking-wider mb-2">What You'll Learn</h3>
              <ul className="text-sm text-text-muted space-y-1">
                {banditIntro.whatYouWillLearn.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary-light mt-0.5">-</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Key Terms */}
            <div>
              <h3 className="text-sm font-bold text-accent-red uppercase tracking-wider mb-2">Key Terms</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {banditIntro.keyTerms.map(({ term, definition }) => (
                  <div key={term} className="bg-surface rounded-lg p-3">
                    <span className="text-sm font-bold text-primary-light">{term}: </span>
                    <span className="text-xs text-text-muted">{definition}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== SETUP: Number of Arms ===== */}
      <div className="bg-surface-light rounded-xl border border-surface-lighter p-4 mb-6">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-text">Number of Arms:</label>
            <div className="flex gap-1">
              {[3, 5, 7, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => handleNumArmsChange(n)}
                  disabled={isRunning}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border-0 cursor-pointer transition-colors ${
                    numArms === n
                      ? 'bg-primary text-white'
                      : 'bg-surface text-text-muted hover:text-text hover:bg-surface-lighter'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {n}
                </button>
              ))}
            </div>
            <span className="text-xs text-text-muted ml-2">{banditParamExplanations.numArms}</span>
          </div>
        </div>
      </div>

      {/* ===== ALGORITHM SELECTOR ===== */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Choose a Strategy</h3>
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(banditAlgorithms) as AlgorithmType[]).map((type) => (
            <button
              key={type}
              onClick={() => handleAlgorithmChange(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border-0 cursor-pointer transition-colors ${
                algorithmType === type
                  ? 'bg-primary text-white'
                  : 'bg-surface-light text-text-muted hover:text-text hover:bg-surface-lighter'
              }`}
            >
              {banditAlgorithms[type].name}
            </button>
          ))}
        </div>
      </div>

      {/* ===== MAIN LAYOUT ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left sidebar */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <PlaybackControls
            onPlay={play}
            onPause={pause}
            onStep={step}
            onReset={handleReset}
            maxSteps={maxSteps}
            onMaxStepsChange={setMaxSteps}
          />

          {/* Hyperparameters */}
          {hyperparams.length > 0 && (
            <HyperparamPanel
              params={hyperparams}
              onChange={handleParamChange}
              disabled={isRunning}
            />
          )}
          {algorithmType === 'thompson-sampling' && (
            <div className="p-4 bg-surface-light rounded-xl border border-surface-lighter">
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Hyperparameters</h3>
              <p className="text-xs text-accent-green leading-relaxed">
                Thompson Sampling has <strong>no hyperparameters</strong>. It uses Bayesian probability to
                automatically balance exploration and exploitation. Watch the Beta distribution curves on the right
                to see how the agent's beliefs evolve!
              </p>
            </div>
          )}

          {/* Live Stats */}
          <div className="p-4 bg-surface-light rounded-xl border border-surface-lighter">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Live Stats</h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Total Steps</span>
                <span className="font-mono text-text">{totalStepCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Total Reward</span>
                <span className="font-mono text-text">{totalReward.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Best Arm</span>
                <span className="font-mono text-accent-green">Arm {bestArmIdx}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Optimal Pull %</span>
                <span className="font-mono text-primary-light">{optimalRate}%</span>
              </div>
              <p className="text-xs text-text-muted mt-1">
                "Optimal Pull %" shows how often the agent chose the <em>actual</em> best arm.
                Higher = the strategy identified the best arm faster.
              </p>
            </div>
          </div>

          {/* True means */}
          <div className="p-4 bg-surface-light rounded-xl border border-surface-lighter">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">
              True Arm Means <span className="text-xs font-normal">(hidden from agent)</span>
            </h3>
            <p className="text-xs text-text-muted mb-2">
              These are the actual average rewards. The agent does NOT see these — it must discover them through trial and error.
            </p>
            <div className="flex flex-col gap-1">
              {environment.trueMeans.map((mean, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className={`${i === bestArmIdx ? 'text-accent-green font-bold' : 'text-text-muted'}`}>
                    Arm {i} {i === bestArmIdx ? '(best)' : ''}
                  </span>
                  <span className="font-mono text-text">{mean.toFixed(3)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — visualizations */}
        <div className="lg:col-span-9 flex flex-col gap-4">
          <ArmChart
            estimates={estimates}
            counts={counts}
            trueMeans={environment.trueMeans}
            lastAction={lastAction}
          />

          {algorithmType === 'thompson-sampling' && (
            <ThompsonViz
              alphas={alphas}
              betas={betas}
              numArms={numArms}
            />
          )}

          <BanditStepBreakdownPanel
            algorithmType={algorithmType}
            trueMeans={environment.trueMeans}
            epsilon={epsilon}
            confidence={confidence}
          />

          <RewardChart history={history} />

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
