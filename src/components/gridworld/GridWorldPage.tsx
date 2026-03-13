import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { GridWorldEnvironment, CellType } from '../../environments/gridworld'
import type { GridState, GridAction, GridWorldConfig } from '../../environments/gridworld'
import { QLearningAgent } from '../../algorithms/gridworld/qLearning'
import { SarsaAgent } from '../../algorithms/gridworld/sarsa'
import { ValueIterationAgent } from '../../algorithms/gridworld/valueIteration'
import { PolicyIterationAgent } from '../../algorithms/gridworld/policyIteration'
import { useSimulationStore } from '../../store/simulationStore'
import { PlaybackControls } from '../shared/PlaybackControls'
import { RewardChart } from '../shared/RewardChart'
import { AlgorithmExplainer } from '../shared/AlgorithmExplainer'
import { GridCanvas } from './GridCanvas'
import { StepBreakdownPanel } from './StepBreakdownPanel'
import { gridworldAlgorithms, gridworldIntro, gridworldParamExplanations } from '../../content/gridworldExplainer'
import type { Agent } from '../../algorithms/types'

type AlgorithmType = 'q-learning' | 'sarsa' | 'value-iteration' | 'policy-iteration'
type BrushType = 'empty' | 'wall' | 'lion' | 'start' | 'goal'

const BRUSH_META: Record<BrushType, { label: string; emoji: string; description: string }> = {
  empty:  { label: 'Grassland', emoji: '\uD83C\uDF3F', description: 'Open path \u2014 Boru can walk here' },
  wall:   { label: 'Cliff',     emoji: '\u26F0\uFE0F', description: 'Impassable \u2014 Boru cannot cross' },
  lion:   { label: 'Lion',      emoji: '\uD83E\uDD81', description: 'Danger zone \u2014 big penalty' },
  start:  { label: 'Boru Home',  emoji: '\uD83D\uDC18', description: 'Where Boru starts each episode' },
  goal:   { label: 'Water Hole',emoji: '\uD83C\uDFDE\uFE0F', description: 'Boru\'s destination \u2014 big reward' },
}

function createEmptyGrid(rows: number, cols: number): CellType[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(CellType.Empty))
}

function createDefaultGrid(rows: number, cols: number): {
  grid: CellType[][]; startPos: GridState; goalPos: GridState
} {
  const grid = createEmptyGrid(rows, cols)
  const startPos = { row: rows - 1, col: 0 }
  const goalPos = { row: 0, col: cols - 1 }
  grid[startPos.row][startPos.col] = CellType.Start
  grid[goalPos.row][goalPos.col] = CellType.Goal

  // Add some default obstacles for bigger grids
  if (rows >= 5 && cols >= 5) {
    grid[1][1] = CellType.Wall
    grid[1][3] = CellType.Wall
    grid[3][1] = CellType.Wall
    if (rows > 3 && cols > 2) grid[2][2] = CellType.Pit // lion
  }

  return { grid, startPos, goalPos }
}

export function GridWorldPage() {
  const [algorithmType, setAlgorithmType] = useState<AlgorithmType>('q-learning')
  const [alpha, setAlpha] = useState(0.1)
  const [gamma, setGamma] = useState(0.95)
  const [epsilon, setEpsilon] = useState(0.15)
  const [goalReward, setGoalReward] = useState(10)
  const [stepPenalty, setStepPenalty] = useState(-0.1)
  const [lionPenalty, setLionPenalty] = useState(-10)
  const [gridRows, setGridRows] = useState(6)
  const [gridCols, setGridCols] = useState(6)
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [showArrows, setShowArrows] = useState(true)
  const [showQValues, setShowQValues] = useState(false)
  const [showVisits, setShowVisits] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [brush, setBrush] = useState<BrushType>('wall')
  const [maxSteps, setMaxSteps] = useState(10000)
  const [envSeed, setEnvSeed] = useState(0)

  // Grid state (user-editable)
  const [gridData, setGridData] = useState(() => createDefaultGrid(6, 6))

  const { status, speed, stepsPerTick, history, addStep, setStatus, setTotalStepCount, reset: resetStore, totalStepCount } = useSimulationStore()
  const isRunning = status === 'running' || status === 'paused'

  const environment = useMemo(() => {
    const config: GridWorldConfig = {
      rows: gridRows,
      cols: gridCols,
      grid: gridData.grid,
      startPos: gridData.startPos,
      goalPos: gridData.goalPos,
      goalReward,
      stepPenalty,
      pitPenalty: lionPenalty,
    }
    return new GridWorldEnvironment(config)
  }, [gridRows, gridCols, gridData, goalReward, stepPenalty, lionPenalty, envSeed]) // eslint-disable-line react-hooks/exhaustive-deps

  const agent = useMemo((): Agent<GridState, GridAction> => {
    switch (algorithmType) {
      case 'q-learning':
        return new QLearningAgent(alpha, gamma, epsilon)
      case 'sarsa':
        return new SarsaAgent(alpha, gamma, epsilon)
      case 'value-iteration':
        return new ValueIterationAgent(environment, gamma)
      case 'policy-iteration':
        return new PolicyIterationAgent(environment, gamma)
    }
  }, [algorithmType, alpha, gamma, epsilon, environment, envSeed]) // eslint-disable-line react-hooks/exhaustive-deps

  // Simulation loop
  const stateRef = useRef<GridState>(environment.reset())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stepCountRef = useRef(0)
  const episodeRef = useRef(0)
  const statusRef = useRef(status)
  const speedRef = useRef(speed)
  const stepsPerTickRef = useRef(stepsPerTick)
  const maxStepsRef = useRef(maxSteps)
  statusRef.current = status
  speedRef.current = speed
  stepsPerTickRef.current = stepsPerTick
  maxStepsRef.current = maxSteps

  const isDPAlgorithm = algorithmType === 'value-iteration' || algorithmType === 'policy-iteration'

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

    if (done) {
      stateRef.current = environment.reset()
      episodeRef.current++
    } else {
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

  const play = useCallback(() => { setEditMode(false); setStatus('running') }, [setStatus])
  const pause = useCallback(() => setStatus('paused'), [setStatus])

  const step = useCallback(() => {
    if (status === 'running') return
    setEditMode(false)
    executeStep()
    setStatus('paused')
  }, [status, executeStep, setStatus])

  const resetSim = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    agent.reset()
    stateRef.current = environment.reset()
    stepCountRef.current = 0
    episodeRef.current = 0
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
    setAlgorithmType(type)
    setEnvSeed((s) => s + 1)
  }, [resetStore])

  // ===== GRID EDITOR =====
  const handleGridSizeChange = useCallback((r: number, c: number) => {
    resetSim()
    setGridRows(r)
    setGridCols(c)
    setGridData(createDefaultGrid(r, c))
    setEnvSeed((s) => s + 1)
  }, [resetSim])

  const handleCellClick = useCallback((row: number, col: number) => {
    if (!editMode) return
    setGridData((prev) => {
      const newGrid = prev.grid.map((r) => [...r])
      let newStart = { ...prev.startPos }
      let newGoal = { ...prev.goalPos }

      switch (brush) {
        case 'empty':
          newGrid[row][col] = CellType.Empty
          break
        case 'wall':
          if (row === prev.startPos.row && col === prev.startPos.col) return prev
          if (row === prev.goalPos.row && col === prev.goalPos.col) return prev
          newGrid[row][col] = CellType.Wall
          break
        case 'lion':
          if (row === prev.startPos.row && col === prev.startPos.col) return prev
          if (row === prev.goalPos.row && col === prev.goalPos.col) return prev
          newGrid[row][col] = CellType.Pit
          break
        case 'start':
          // Clear old start
          newGrid[prev.startPos.row][prev.startPos.col] = CellType.Empty
          newGrid[row][col] = CellType.Start
          newStart = { row, col }
          break
        case 'goal':
          // Clear old goal
          newGrid[prev.goalPos.row][prev.goalPos.col] = CellType.Empty
          newGrid[row][col] = CellType.Goal
          newGoal = { row, col }
          break
      }

      return { grid: newGrid, startPos: newStart, goalPos: newGoal }
    })
    // Reset simulation when grid changes
    resetStore()
    stepCountRef.current = 0
    episodeRef.current = 0
    setEnvSeed((s) => s + 1)
  }, [editMode, brush, resetStore])

  // Extract latest state
  const latestStep = history.length > 0 ? history[history.length - 1] : null
  const agentPos = latestStep
    ? (latestStep.done ? null : latestStep.nextState as GridState)
    : environment.reset()
  const qValues = (latestStep?.values ?? {}) as Record<string, number[]>

  // Compute visit counts from history
  const visitCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const h of history) {
      const s = h.state as GridState
      const key = `${s.row},${s.col}`
      counts[key] = (counts[key] || 0) + 1
    }
    return counts
  }, [history])

  // Trail: last N positions for footprint rendering
  const trail = useMemo(() => {
    const n = Math.min(history.length, 15)
    return history.slice(-n).map((h) => h.state as GridState)
  }, [history])

  const explainer = gridworldAlgorithms[algorithmType]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      {/* ===== STORY & INTRO ===== */}
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-text">
              <span className="text-2xl mr-2">{'\uD83D\uDC18'}</span> {gridworldIntro.title}
            </h1>
            <p className="text-base text-primary-light mt-1 font-medium">
              Help Boru learn the safest path using Reinforcement Learning
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to="/gridworld-guide"
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
              <p className="text-sm text-text leading-relaxed whitespace-pre-line">{gridworldIntro.story}</p>
            </div>
            <div className="mb-5">
              <h3 className="text-sm font-bold text-accent-green uppercase tracking-wider mb-2">The Objective</h3>
              <p className="text-sm text-text leading-relaxed">{gridworldIntro.objective}</p>
            </div>
            <div className="mb-5">
              <h3 className="text-sm font-bold text-accent-blue uppercase tracking-wider mb-2">How This Simulation Works</h3>
              <p className="text-sm text-text leading-relaxed">{gridworldIntro.howItWorks}</p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-primary-light uppercase tracking-wider mb-2">What You'll Learn</h3>
              <ul className="text-sm text-text-muted space-y-1">
                {gridworldIntro.whatYouWillLearn.map((item, i) => (
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

      {/* ===== GRID SETUP ===== */}
      <div className="bg-surface-light rounded-xl border border-surface-lighter p-4 mb-6">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-text">Grid Size:</label>
            <div className="flex gap-1">
              {[[4,4],[5,5],[6,6],[7,7],[8,8]].map(([r,c]) => (
                <button
                  key={`${r}x${c}`}
                  onClick={() => handleGridSizeChange(r, c)}
                  disabled={isRunning}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border-0 cursor-pointer transition-colors ${
                    gridRows === r && gridCols === c
                      ? 'bg-primary text-white'
                      : 'bg-surface text-text-muted hover:text-text hover:bg-surface-lighter'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {r}x{c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs text-text-muted">{gridworldParamExplanations.gridSize}</span>
          </div>
        </div>
      </div>

      {/* ===== GRID EDITOR ===== */}
      <div className="bg-surface-light rounded-xl border border-surface-lighter p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-text">
              {'\uD83C\uDFA8'} World Editor
            </h3>
            <p className="text-xs text-text-muted mt-1">
              {editMode ? gridworldIntro.gridEditorHelp : 'Toggle Edit Mode to design Boru\'s world'}
            </p>
          </div>
          <button
            onClick={() => { setEditMode(!editMode); if (isRunning) handleReset() }}
            className={`px-4 py-2 rounded-lg text-sm font-medium border-0 cursor-pointer transition-colors ${
              editMode
                ? 'bg-accent-yellow text-black'
                : 'bg-surface text-text-muted hover:text-text hover:bg-surface-lighter'
            }`}
          >
            {editMode ? 'Done Editing' : 'Edit Grid'}
          </button>
        </div>

        {editMode && (
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(BRUSH_META) as BrushType[]).map((b) => (
              <button
                key={b}
                onClick={() => setBrush(b)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border-0 cursor-pointer transition-colors ${
                  brush === b
                    ? 'bg-primary text-white'
                    : 'bg-surface text-text-muted hover:text-text hover:bg-surface-lighter'
                }`}
              >
                <span>{BRUSH_META[b].emoji}</span>
                <span>{BRUSH_META[b].label}</span>
              </button>
            ))}
            <span className="text-xs text-text-muted self-center ml-2">
              {BRUSH_META[brush].description}
            </span>
          </div>
        )}
      </div>

      {/* ===== ALGORITHM SELECTOR ===== */}
      <div className="mb-6">
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Choose an Algorithm</h3>
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(gridworldAlgorithms) as AlgorithmType[]).map((type) => (
            <button
              key={type}
              onClick={() => handleAlgorithmChange(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border-0 cursor-pointer transition-colors ${
                algorithmType === type
                  ? 'bg-primary text-white'
                  : 'bg-surface-light text-text-muted hover:text-text hover:bg-surface-lighter'
              }`}
            >
              {gridworldAlgorithms[type].name}
              <span className="ml-1 text-xs opacity-60">
                {type === 'q-learning' || type === 'sarsa' ? '(TD)' : '(DP)'}
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-2">
          <strong>TD (Temporal Difference):</strong> Boru learns by walking around and experiencing rewards.
          <strong className="ml-2">DP (Dynamic Programming):</strong> Uses a complete map of the world to compute the optimal route — no walking needed.
        </p>
      </div>

      {/* ===== HYPERPARAMETERS — horizontal pane above grid ===== */}
      <div className="bg-surface-light rounded-xl border border-surface-lighter p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            Hyperparameters & Rewards
          </h3>
          {isRunning && (
            <span className="text-xs text-accent-yellow">Reset to change parameters</span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-3">
          {/* TD-specific params */}
          {!isDPAlgorithm && (
            <>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <label className="text-text">{'\u03B1'} Learning Rate</label>
                  <span className="font-mono text-primary-light">{alpha}</span>
                </div>
                <input type="range" min={0.01} max={1} step={0.01} value={alpha}
                  onChange={(e) => setAlpha(Number(e.target.value))} disabled={isRunning}
                  className="w-full accent-primary disabled:opacity-40" />
                <p className="text-xs text-text-muted mt-0.5">{gridworldParamExplanations.alpha}</p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <label className="text-text">{'\u03B5'} Exploration</label>
                  <span className="font-mono text-primary-light">{epsilon}</span>
                </div>
                <input type="range" min={0} max={1} step={0.01} value={epsilon}
                  onChange={(e) => setEpsilon(Number(e.target.value))} disabled={isRunning}
                  className="w-full accent-primary disabled:opacity-40" />
                <p className="text-xs text-text-muted mt-0.5">{gridworldParamExplanations.epsilon}</p>
              </div>
            </>
          )}

          <div>
            <div className="flex justify-between text-sm mb-1">
              <label className="text-text">{'\u03B3'} Discount Factor</label>
              <span className="font-mono text-primary-light">{gamma}</span>
            </div>
            <input type="range" min={0} max={1} step={0.01} value={gamma}
              onChange={(e) => setGamma(Number(e.target.value))} disabled={isRunning}
              className="w-full accent-primary disabled:opacity-40" />
            <p className="text-xs text-text-muted mt-0.5">{gridworldParamExplanations.gamma}</p>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <label className="text-text">{'\uD83C\uDFDE\uFE0F'} Water Hole Reward</label>
              <span className="font-mono text-accent-green">+{goalReward}</span>
            </div>
            <input type="range" min={1} max={50} step={1} value={goalReward}
              onChange={(e) => { setGoalReward(Number(e.target.value)); handleReset() }} disabled={isRunning}
              className="w-full accent-accent-green disabled:opacity-40" />
            <p className="text-xs text-text-muted mt-0.5">{gridworldParamExplanations.goalReward}</p>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <label className="text-text">{'\uD83D\uDC3E'} Step Penalty</label>
              <span className="font-mono text-accent-yellow">{stepPenalty}</span>
            </div>
            <input type="range" min={-2} max={0} step={0.05} value={stepPenalty}
              onChange={(e) => { setStepPenalty(Number(e.target.value)); handleReset() }} disabled={isRunning}
              className="w-full accent-accent-yellow disabled:opacity-40" />
            <p className="text-xs text-text-muted mt-0.5">{gridworldParamExplanations.stepPenalty}</p>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <label className="text-text">{'\uD83E\uDD81'} Lion Penalty</label>
              <span className="font-mono text-accent-red">{lionPenalty}</span>
            </div>
            <input type="range" min={-50} max={-1} step={1} value={lionPenalty}
              onChange={(e) => { setLionPenalty(Number(e.target.value)); handleReset() }} disabled={isRunning}
              className="w-full accent-accent-red disabled:opacity-40" />
            <p className="text-xs text-text-muted mt-0.5">{gridworldParamExplanations.lionPenalty}</p>
          </div>
        </div>
      </div>

      {/* ===== MAIN LAYOUT: Sidebar + Grid ===== */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left sidebar — controls + layers + stats */}
        <div className="md:col-span-4 lg:col-span-3 flex flex-col gap-4">
          <PlaybackControls
            onPlay={play}
            onPause={pause}
            onStep={step}
            onReset={handleReset}
            maxSteps={maxSteps}
            onMaxStepsChange={setMaxSteps}
          />

          {/* Visualization Layers */}
          <div className="p-4 bg-surface-light rounded-xl border border-surface-lighter">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Visualization Layers</h3>
            <div className="flex flex-col gap-3">
              <label className="flex items-start gap-2 text-sm text-text cursor-pointer">
                <input type="checkbox" checked={showQValues} onChange={(e) => setShowQValues(e.target.checked)}
                  className="accent-primary mt-0.5" />
                <div>
                  <span className="font-medium">Q-Triangles</span>
                  <p className="text-xs text-text-muted leading-tight mt-0.5">4 colored triangles per cell. Blue=bad, amber=good.</p>
                </div>
              </label>
              <label className="flex items-start gap-2 text-sm text-text cursor-pointer">
                <input type="checkbox" checked={showArrows} onChange={(e) => setShowArrows(e.target.checked)}
                  className="accent-primary mt-0.5" />
                <div>
                  <span className="font-medium">Arrows</span>
                  <p className="text-xs text-text-muted leading-tight mt-0.5">All 4 directions. Thick amber = best move.</p>
                </div>
              </label>
              <label className="flex items-start gap-2 text-sm text-text cursor-pointer">
                <input type="checkbox" checked={showHeatmap} onChange={(e) => setShowHeatmap(e.target.checked)}
                  className="accent-primary mt-0.5" />
                <div>
                  <span className="font-medium">Value Heatmap</span>
                  <p className="text-xs text-text-muted leading-tight mt-0.5">Cell color = state value. Warm = better.</p>
                </div>
              </label>
              <label className="flex items-start gap-2 text-sm text-text cursor-pointer">
                <input type="checkbox" checked={showVisits} onChange={(e) => setShowVisits(e.target.checked)}
                  className="accent-primary mt-0.5" />
                <div>
                  <span className="font-medium">Exploration Map</span>
                  <p className="text-xs text-text-muted leading-tight mt-0.5">Brighter = visited more. See where Boru wanders.</p>
                </div>
              </label>
            </div>
          </div>

          {/* Stats */}
          <div className="p-4 bg-surface-light rounded-xl border border-surface-lighter">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">
              Boru's Progress
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
                <span className="text-text-muted">Method</span>
                <span className="font-mono text-primary-light text-xs">
                  {isDPAlgorithm ? 'Planning (knows the map)' : 'Learning (trial & error)'}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-1">
                {isDPAlgorithm
                  ? 'Each step is a full planning sweep over all cells. No walking needed.'
                  : 'Boru walks around, bumps into things, and gradually learns from experience.'
                }
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="p-4 bg-surface-light rounded-xl border border-surface-lighter">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2">Legend</h3>
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">{'\uD83D\uDC18'}</span>
                <span className="text-text">Boru the Elephant (agent)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">{'\uD83C\uDFDE\uFE0F'}</span>
                <span className="text-text">Water Hole (goal: +{goalReward})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">{'\uD83E\uDD81'}</span>
                <span className="text-text">Lion (danger: {lionPenalty})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">{'\u26F0\uFE0F'}</span>
                <span className="text-text">Cliff (impassable wall)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">{'\uD83D\uDC3E'}</span>
                <span className="text-text">Each step costs {stepPenalty}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — grid + charts + explainer */}
        <div className="md:col-span-8 lg:col-span-9 flex flex-col gap-4">
          <GridCanvas
            rows={gridRows}
            cols={gridCols}
            grid={gridData.grid}
            agentPos={editMode ? null : agentPos}
            qValues={editMode ? {} : qValues}
            showHeatmap={!editMode && showHeatmap}
            showArrows={!editMode && showArrows}
            showQValues={!editMode && showQValues}
            showVisits={!editMode && showVisits}
            visitCounts={editMode ? {} : visitCounts}
            trail={editMode ? [] : trail}
            onCellClick={editMode ? handleCellClick : undefined}
            editable={editMode}
          />

          <StepBreakdownPanel
            algorithmType={algorithmType}
            alpha={alpha}
            gamma={gamma}
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
