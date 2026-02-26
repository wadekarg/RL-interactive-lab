import { useState, useCallback } from 'react'
import { Accordion, Callout, Eq, ChapterNav, SimButton } from '../../components/shared/GuidePrimitives'

/* ══════════════════════════════════════════
   Shared grid constants (5×5 GridWorld)
   ══════════════════════════════════════════ */

const ROWS = 5
const COLS = 5
const GOAL: [number, number] = [0, 4]
const PIT: [number, number] = [3, 2]
const WALLS = new Set(['1,1', '2,3', '3,3'])
const START: [number, number] = [4, 0]
const ACTIONS = [[-1, 0], [0, 1], [1, 0], [0, -1]] // Up, Right, Down, Left
const ACTION_NAMES = ['Up', 'Right', 'Down', 'Left']

function isWall(r: number, c: number) { return WALLS.has(`${r},${c}`) }
function isGoal(r: number, c: number) { return r === GOAL[0] && c === GOAL[1] }
function isPit(r: number, c: number) { return r === PIT[0] && c === PIT[1] }
function inBounds(r: number, c: number) { return r >= 0 && r < ROWS && c >= 0 && c < COLS }

function stepEnv(r: number, c: number, a: number): { nr: number; nc: number; reward: number; done: boolean } {
  const [dr, dc] = ACTIONS[a]
  let nr = r + dr, nc = c + dc
  if (!inBounds(nr, nc) || isWall(nr, nc)) { nr = r; nc = c }
  if (isGoal(nr, nc)) return { nr, nc, reward: 10, done: true }
  if (isPit(nr, nc)) return { nr, nc, reward: -10, done: true }
  return { nr, nc, reward: -0.1, done: false }
}

function key(r: number, c: number) { return `${r},${c}` }

/* ══════════════════════════════════════════
   Interactive Widget 1: TD Update Visualizer
   Step through a single TD(0) update
   ══════════════════════════════════════════ */

interface TDStep {
  s: [number, number]
  a: number
  r: number
  sNext: [number, number]
  done: boolean
  vOld: number
  vNext: number
  tdError: number
  vNew: number
}

function TDUpdateWidget() {
  const alpha = 0.5
  const gamma = 0.9
  const [V, setV] = useState<Record<string, number>>({})
  const [history, setHistory] = useState<TDStep[]>([])
  const [pos, setPos] = useState<[number, number]>([...START])
  const [episodeDone, setEpisodeDone] = useState(false)

  const getV = useCallback((r: number, c: number) => V[key(r, c)] ?? 0, [V])

  const takeStep = useCallback(() => {
    if (episodeDone) return
    const [r, c] = pos
    // Simple policy: move toward goal with some randomness
    const a = Math.floor(Math.random() * 4)
    const { nr, nc, reward, done } = stepEnv(r, c, a)
    const vOld = V[key(r, c)] ?? 0
    const vNext = done ? 0 : (V[key(nr, nc)] ?? 0)
    const tdError = reward + gamma * vNext - vOld
    const vNew = vOld + alpha * tdError

    const step: TDStep = { s: [r, c], a, r: reward, sNext: [nr, nc], done, vOld, vNext, tdError, vNew }
    setHistory(prev => [...prev, step])
    setV(prev => ({ ...prev, [key(r, c)]: vNew }))
    setPos([nr, nc])
    if (done) setEpisodeDone(true)
  }, [pos, V, episodeDone])

  const reset = useCallback(() => {
    setPos([...START])
    setEpisodeDone(false)
  }, [])

  const fullReset = useCallback(() => {
    setV({})
    setHistory([])
    setPos([...START])
    setEpisodeDone(false)
  }, [])

  const lastStep = history.length > 0 ? history[history.length - 1] : null

  return (
    <div className="bg-surface rounded-xl border border-surface-lighter p-5 my-5">
      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Interactive: TD(0) Update Visualizer</h4>
      <p className="text-xs text-text-muted mb-3">
        Click "Take Step" to move randomly. Watch V(s) update after each step using the TD rule.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Grid */}
        <div className="flex-shrink-0">
          <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `repeat(${COLS}, 2.8rem)` }}>
            {Array.from({ length: ROWS * COLS }, (_, i) => {
              const r = Math.floor(i / COLS), c = i % COLS
              const isStart = r === START[0] && c === START[1]
              const isAgent = r === pos[0] && c === pos[1]
              const wall = isWall(r, c)
              const goal = isGoal(r, c)
              const pit = isPit(r, c)
              const v = getV(r, c)
              const wasUpdated = lastStep && lastStep.s[0] === r && lastStep.s[1] === c

              let bg = 'bg-surface-light'
              if (wall) bg = 'bg-surface-lighter'
              else if (goal) bg = 'bg-accent-green/20'
              else if (pit) bg = 'bg-red-500/20'
              else if (wasUpdated) bg = 'bg-accent-yellow/20'

              return (
                <div key={i} className={`${bg} rounded w-[2.8rem] h-[2.8rem] flex flex-col items-center justify-center relative border ${wasUpdated ? 'border-accent-yellow' : 'border-surface-lighter'}`}>
                  {wall ? (
                    <span className="text-xs text-text-muted">▓</span>
                  ) : (
                    <>
                      {isAgent && <span className="text-sm absolute top-0 left-0.5">🐘</span>}
                      {goal && <span className="text-[10px]">⭐</span>}
                      {pit && <span className="text-[10px]">🕳️</span>}
                      {isStart && !isAgent && <span className="text-[10px] text-text-muted">S</span>}
                      <span className={`text-[9px] font-mono ${v > 0 ? 'text-accent-green' : v < 0 ? 'text-red-400' : 'text-text-muted'}`}>
                        {wall ? '' : v.toFixed(1)}
                      </span>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Controls + formula */}
        <div className="flex-1 min-w-0">
          <div className="flex gap-2 mb-3">
            <button onClick={takeStep} disabled={episodeDone} className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium cursor-pointer hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Take Step
            </button>
            <button onClick={reset} className="px-3 py-1.5 rounded-lg bg-surface-lighter text-text text-xs font-medium cursor-pointer hover:bg-surface-light transition-colors">
              New Episode
            </button>
            <button onClick={fullReset} className="px-3 py-1.5 rounded-lg bg-surface-lighter text-text text-xs font-medium cursor-pointer hover:bg-surface-light transition-colors">
              Reset All
            </button>
          </div>

          {episodeDone && (
            <p className="text-xs font-bold mb-2" style={{ color: lastStep && lastStep.r > 0 ? 'var(--color-accent-green)' : 'var(--color-red-400, #f87171)' }}>
              {lastStep && lastStep.r > 0 ? '⭐ Reached the goal!' : '🕳️ Fell in the pit!'} Click "New Episode" to continue.
            </p>
          )}

          {lastStep && (
            <div className="bg-surface-light rounded-lg p-3 text-xs space-y-1">
              <p className="font-bold text-text mb-1">Last TD Update:</p>
              <p className="text-text-muted">
                State ({lastStep.s[0]},{lastStep.s[1]}) → {ACTION_NAMES[lastStep.a]} → ({lastStep.sNext[0]},{lastStep.sNext[1]})
              </p>
              <p className="text-text-muted">Reward: <span className="font-mono">{lastStep.r.toFixed(1)}</span></p>
              <p className="text-accent-yellow font-mono">
                δ = {lastStep.r.toFixed(1)} + {gamma}×{lastStep.vNext.toFixed(2)} − {lastStep.vOld.toFixed(2)} = {lastStep.tdError.toFixed(3)}
              </p>
              <p className="text-text">
                V({lastStep.s[0]},{lastStep.s[1]}): <span className="text-text-muted">{lastStep.vOld.toFixed(2)}</span> → <span className="font-bold text-primary-light">{lastStep.vNew.toFixed(2)}</span>
              </p>
            </div>
          )}

          <p className="text-[10px] text-text-muted mt-2">α = {alpha}, γ = {gamma} · Steps: {history.length}</p>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   Interactive Widget 2: Q-Learning vs SARSA
   Side-by-side cliff-walking comparison
   ══════════════════════════════════════════ */

// Cliff world: 4×8, bottom row is cliff except start (3,0) and goal (3,7)
const CW_ROWS = 4
const CW_COLS = 8
const CW_START: [number, number] = [3, 0]
const CW_GOAL: [number, number] = [3, 7]

function isCliff(r: number, c: number) {
  return r === 3 && c > 0 && c < 7
}

function cwStep(r: number, c: number, a: number): { nr: number; nc: number; reward: number; done: boolean } {
  const [dr, dc] = ACTIONS[a]
  let nr = r + dr, nc = c + dc
  if (nr < 0 || nr >= CW_ROWS || nc < 0 || nc >= CW_COLS) { nr = r; nc = c }
  if (isCliff(nr, nc)) return { nr: CW_START[0], nc: CW_START[1], reward: -100, done: false }
  if (nr === CW_GOAL[0] && nc === CW_GOAL[1]) return { nr, nc, reward: 0, done: true }
  return { nr, nc, reward: -1, done: false }
}

function epsGreedy(Q: Record<string, number[]>, r: number, c: number, eps: number): number {
  if (Math.random() < eps) return Math.floor(Math.random() * 4)
  const qs = Q[key(r, c)] ?? [0, 0, 0, 0]
  let best = 0
  for (let a = 1; a < 4; a++) if (qs[a] > qs[best]) best = a
  return best
}

function QLvsSARSAWidget() {
  const [results, setResults] = useState<{
    qPaths: number[][]
    sPaths: number[][]
    qReturns: number[]
    sReturns: number[]
  } | null>(null)
  const [running, setRunning] = useState(false)

  const run = useCallback(() => {
    setRunning(true)
    setTimeout(() => {
      const alpha = 0.5, gamma = 1.0, eps = 0.1, episodes = 300

      // Q-Learning
      const Qq: Record<string, number[]> = {}
      const getQ = (s: string) => { if (!Qq[s]) Qq[s] = [0, 0, 0, 0]; return Qq[s] }
      const qReturns: number[] = []

      for (let ep = 0; ep < episodes; ep++) {
        let r = CW_START[0], c = CW_START[1], totalR = 0, steps = 0
        while (steps < 500) {
          const a = epsGreedy(Qq, r, c, eps)
          const { nr, nc, reward, done } = cwStep(r, c, a)
          totalR += reward
          const qs = getQ(key(r, c))
          const qsNext = getQ(key(nr, nc))
          qs[a] += alpha * (reward + gamma * Math.max(...qsNext) - qs[a])
          r = nr; c = nc; steps++
          if (done) break
        }
        qReturns.push(totalR)
      }

      // SARSA
      const Qs: Record<string, number[]> = {}
      const getS = (s: string) => { if (!Qs[s]) Qs[s] = [0, 0, 0, 0]; return Qs[s] }
      const sReturns: number[] = []

      for (let ep = 0; ep < episodes; ep++) {
        let r = CW_START[0], c = CW_START[1], totalR = 0, steps = 0
        let a = epsGreedy(Qs, r, c, eps)
        while (steps < 500) {
          const { nr, nc, reward, done } = cwStep(r, c, a)
          totalR += reward
          const aNext = done ? 0 : epsGreedy(Qs, nr, nc, eps)
          const qs = getS(key(r, c))
          const qsNext = getS(key(nr, nc))
          qs[a] += alpha * (reward + gamma * (done ? 0 : qsNext[aNext]) - qs[a])
          r = nr; c = nc; a = aNext; steps++
          if (done) break
        }
        sReturns.push(totalR)
      }

      // Extract greedy paths
      const extractPath = (Q: Record<string, number[]>) => {
        const path: number[][] = []
        let r = CW_START[0], c = CW_START[1], steps = 0
        path.push([r, c])
        while (steps < 30) {
          const qs = Q[key(r, c)] ?? [0, 0, 0, 0]
          let best = 0
          for (let a = 1; a < 4; a++) if (qs[a] > qs[best]) best = a
          const { nr, nc, done } = cwStep(r, c, best)
          path.push([nr, nc])
          if (done || (nr === r && nc === c)) break
          r = nr; c = nc; steps++
        }
        return path
      }

      setResults({
        qPaths: extractPath(Qq),
        sPaths: extractPath(Qs),
        qReturns,
        sReturns,
      })
      setRunning(false)
    }, 50)
  }, [])

  const avgLast50 = (arr: number[]) => {
    const slice = arr.slice(-50)
    return slice.reduce((s, x) => s + x, 0) / slice.length
  }

  return (
    <div className="bg-surface rounded-xl border border-surface-lighter p-5 my-5">
      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Interactive: Q-Learning vs SARSA (Cliff Walking)</h4>
      <p className="text-xs text-text-muted mb-3">
        Run 300 episodes and compare the learned paths. The bottom row is a cliff — fall and get -100 penalty.
      </p>

      <button
        onClick={run}
        disabled={running}
        className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-medium cursor-pointer hover:bg-primary-dark transition-colors disabled:opacity-50 mb-4"
      >
        {running ? 'Training...' : results ? 'Re-run (300 episodes)' : 'Train Both (300 episodes)'}
      </button>

      {results && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Q-Learning path */}
          {[
            { label: 'Q-Learning (Off-Policy)', paths: results.qPaths, returns: results.qReturns, color: 'accent-blue' },
            { label: 'SARSA (On-Policy)', paths: results.sPaths, returns: results.sReturns, color: 'accent-green' },
          ].map(({ label, paths, returns, color }) => (
            <div key={label}>
              <p className={`text-xs font-bold text-${color} mb-2`}>{label}</p>
              <div className="inline-grid gap-px" style={{ gridTemplateColumns: `repeat(${CW_COLS}, 1.6rem)` }}>
                {Array.from({ length: CW_ROWS * CW_COLS }, (_, i) => {
                  const r = Math.floor(i / CW_COLS), c = i % CW_COLS
                  const isStart = r === CW_START[0] && c === CW_START[1]
                  const isGoalCell = r === CW_GOAL[0] && c === CW_GOAL[1]
                  const cliff = isCliff(r, c)
                  const onPath = paths.some(p => p[0] === r && p[1] === c)

                  let bg = 'bg-surface-light'
                  if (cliff) bg = 'bg-red-500/30'
                  else if (isGoalCell) bg = 'bg-accent-green/30'
                  else if (onPath) bg = `bg-${color}/20`

                  return (
                    <div key={i} className={`${bg} rounded-sm w-[1.6rem] h-[1.6rem] flex items-center justify-center text-[9px] ${onPath && !cliff ? `border border-${color}/50` : 'border border-transparent'}`}>
                      {isStart ? 'S' : isGoalCell ? 'G' : cliff ? '⚡' : onPath ? '•' : ''}
                    </div>
                  )
                })}
              </div>
              <p className="text-[10px] text-text-muted mt-1">
                Avg return (last 50): <span className="font-mono font-bold">{avgLast50(returns).toFixed(1)}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {results && (
        <div className="mt-3 bg-surface-light rounded-lg p-3">
          <p className="text-xs text-text leading-relaxed m-0">
            <strong>Q-Learning</strong> tends to find the <strong>optimal (shortest) path</strong> along the cliff edge, because it updates using max Q — it assumes perfect future play. <strong>SARSA</strong> learns a <strong>safer path</strong> further from the cliff, because it accounts for its own ε-greedy exploration and the risk of random cliff falls.
          </p>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   Interactive Widget 3: TD vs Monte Carlo
   Compare learning speed
   ══════════════════════════════════════════ */

function TDvsMCWidget() {
  const [results, setResults] = useState<{ tdErrors: number[]; mcErrors: number[] } | null>(null)
  const [running, setRunning] = useState(false)

  const run = useCallback(() => {
    setRunning(true)
    setTimeout(() => {
      const alpha = 0.1, gamma = 0.9, episodes = 200

      // True-ish values (pre-computed via many iterations)
      const trueV: Record<string, number> = {}
      // Simple DP sweep to get true values under random policy
      for (let iter = 0; iter < 200; iter++) {
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            if (isWall(r, c) || isGoal(r, c) || isPit(r, c)) continue
            let v = 0
            for (let a = 0; a < 4; a++) {
              const { nr, nc, reward, done } = stepEnv(r, c, a)
              v += 0.25 * (reward + (done ? 0 : gamma * (trueV[key(nr, nc)] ?? 0)))
            }
            trueV[key(r, c)] = v
          }
        }
      }

      const rmse = (V: Record<string, number>) => {
        let sum = 0, count = 0
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            if (isWall(r, c) || isGoal(r, c) || isPit(r, c)) continue
            const diff = (V[key(r, c)] ?? 0) - (trueV[key(r, c)] ?? 0)
            sum += diff * diff
            count++
          }
        }
        return Math.sqrt(sum / count)
      }

      // TD(0) learning
      const Vtd: Record<string, number> = {}
      const tdErrors: number[] = []

      for (let ep = 0; ep < episodes; ep++) {
        let r = START[0], c = START[1], steps = 0
        while (steps < 100) {
          const a = Math.floor(Math.random() * 4)
          const { nr, nc, reward, done } = stepEnv(r, c, a)
          const vOld = Vtd[key(r, c)] ?? 0
          const vNext = done ? 0 : (Vtd[key(nr, nc)] ?? 0)
          Vtd[key(r, c)] = vOld + alpha * (reward + gamma * vNext - vOld)
          r = nr; c = nc; steps++
          if (done) break
        }
        tdErrors.push(rmse(Vtd))
      }

      // MC (every-visit)
      const Vmc: Record<string, number> = {}
      const mcCounts: Record<string, number> = {}
      const mcErrors: number[] = []

      for (let ep = 0; ep < episodes; ep++) {
        const traj: { s: string; r: number }[] = []
        let r = START[0], c = START[1], steps = 0
        while (steps < 100) {
          const a = Math.floor(Math.random() * 4)
          const { nr, nc, reward, done } = stepEnv(r, c, a)
          traj.push({ s: key(r, c), r: reward })
          r = nr; c = nc; steps++
          if (done) break
        }
        // Compute returns and update
        let G = 0
        for (let t = traj.length - 1; t >= 0; t--) {
          G = traj[t].r + gamma * G
          const s = traj[t].s
          mcCounts[s] = (mcCounts[s] ?? 0) + 1
          Vmc[s] = (Vmc[s] ?? 0) + (G - (Vmc[s] ?? 0)) / mcCounts[s]
        }
        mcErrors.push(rmse(Vmc))
      }

      setResults({ tdErrors, mcErrors })
      setRunning(false)
    }, 100)
  }, [])

  return (
    <div className="bg-surface rounded-xl border border-surface-lighter p-5 my-5">
      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Interactive: TD(0) vs Monte Carlo Learning Speed</h4>
      <p className="text-xs text-text-muted mb-3">
        Both learn V(s) under a random policy on the 5×5 grid. TD updates every step; MC waits until episode end. Watch RMSE converge.
      </p>

      <button
        onClick={run}
        disabled={running}
        className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-medium cursor-pointer hover:bg-primary-dark transition-colors disabled:opacity-50 mb-4"
      >
        {running ? 'Running...' : results ? 'Re-run (200 episodes)' : 'Run Comparison (200 episodes)'}
      </button>

      {results && (
        <>
          {/* Simple bar-style convergence chart */}
          <div className="flex gap-4 mb-3">
            {[
              { label: 'TD(0)', errors: results.tdErrors, color: 'accent-blue' },
              { label: 'Monte Carlo', errors: results.mcErrors, color: 'accent-yellow' },
            ].map(({ label, errors, color }) => {
              const checkpoints = [0, 24, 49, 99, 149, 199].filter(i => i < errors.length)
              return (
                <div key={label} className="flex-1">
                  <p className={`text-xs font-bold text-${color} mb-2`}>{label}</p>
                  <div className="space-y-1">
                    {checkpoints.map(i => {
                      const maxErr = Math.max(results.tdErrors[0], results.mcErrors[0], 1)
                      const w = Math.max(2, (errors[i] / maxErr) * 100)
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[9px] text-text-muted w-8 text-right">ep {i + 1}</span>
                          <div className="flex-1 h-3 bg-surface-lighter rounded-full overflow-hidden">
                            <div className={`h-full bg-${color} rounded-full transition-all`} style={{ width: `${w}%` }} />
                          </div>
                          <span className="text-[9px] font-mono text-text-muted w-10">{errors[i].toFixed(2)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-[10px] text-text-muted">
            RMSE = root-mean-squared error vs true values. Lower = better.
          </p>
        </>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   Main Chapter Page
   ══════════════════════════════════════════ */

export function TDLearningPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="mb-8">
        <a href="#/learn" className="text-sm text-primary-light hover:underline no-underline mb-3 inline-block">
          ← All Chapters
        </a>
        <div className="flex items-center gap-3 mb-2">
          <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center text-xl">⚡</span>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-0.5">Chapter 9</p>
            <h1 className="text-3xl font-bold text-text m-0">Temporal Difference Learning</h1>
          </div>
        </div>
        <p className="text-text-muted mt-2">
          TD methods learn from every step without waiting for the episode to end — combining the best of
          Monte Carlo sampling and dynamic programming bootstrapping. This is the engine behind Q-Learning and SARSA.
        </p>
        <div className="flex gap-2 mt-3 flex-wrap">
          {['TD Error', 'Q-Learning', 'SARSA', 'Bootstrapping'].map(tag => (
            <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-surface-light text-text-muted">{tag}</span>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-4">

        <Accordion number={1} title="The Problem: Learning from Experience" defaultOpen>
          <p className="text-sm text-text leading-relaxed">
            In Chapter 7 we saw how <strong>Bellman equations</strong> recursively define value. But those equations assume we know the
            environment's transition probabilities — a luxury we rarely have. In the real world, the agent must <strong>learn from experience</strong>.
          </p>
          <p className="text-sm text-text leading-relaxed">
            There are two classic approaches:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
            <div className="bg-accent-yellow/10 border border-accent-yellow/30 rounded-lg p-3">
              <p className="text-xs font-bold text-accent-yellow mb-1">Monte Carlo (MC)</p>
              <p className="text-xs text-text-muted m-0">
                Play out an entire episode, then work backwards to compute returns. Simple but slow — you have to wait until the end.
              </p>
            </div>
            <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-lg p-3">
              <p className="text-xs font-bold text-accent-blue mb-1">Temporal Difference (TD)</p>
              <p className="text-xs text-text-muted m-0">
                Update after <em>every single step</em> using a bootstrap estimate. Fast, online, and the foundation of modern RL.
              </p>
            </div>
          </div>
          <Callout type="insight">
            TD learning is like updating your GPS arrival time at every intersection, rather than waiting until you arrive to know how long the trip took.
          </Callout>
        </Accordion>

        <Accordion number={2} title="The TD Update Rule">
          <p className="text-sm text-text leading-relaxed">
            The core idea of TD(0) is beautifully simple. After taking action <em>a</em> in state <em>s</em>,
            receiving reward <em>r</em>, and arriving in state <em>s'</em>:
          </p>
          <Eq tex="V(s) \leftarrow V(s) + \alpha \Big[ \underbrace{r + \gamma V(s')}_{\text{TD target}} - V(s) \Big]" />
          <p className="text-sm text-text leading-relaxed">
            The key quantity is the <strong>TD error</strong> (δ):
          </p>
          <Eq tex="\delta = r + \gamma V(s') - V(s)" />
          <p className="text-sm text-text leading-relaxed">
            This is the "surprise" — the difference between what you expected (V(s)) and what you actually got
            (the reward <em>r</em> plus your estimate of what comes next, γV(s')). If δ &gt; 0, things went
            better than expected; if δ &lt; 0, worse.
          </p>
          <div className="bg-surface-light rounded-lg p-3 my-3">
            <p className="text-xs font-bold text-text mb-2">The three ingredients:</p>
            <div className="space-y-1.5">
              <p className="text-xs text-text m-0"><strong>α (learning rate):</strong> How much to adjust — small α means cautious updates</p>
              <p className="text-xs text-text m-0"><strong>γ (discount factor):</strong> How much future estimates matter (from Ch. 3)</p>
              <p className="text-xs text-text m-0"><strong>V(s') (bootstrap):</strong> We use our <em>current estimate</em> of the next state — we don't wait for the true return</p>
            </div>
          </div>
          <Callout type="think">
            Why is bootstrapping powerful? Because you don't need to wait for the episode to end. Each step gives
            you a learning signal immediately. This makes TD work even in continuing (non-episodic) tasks.
          </Callout>
          <TDUpdateWidget />
        </Accordion>

        <Accordion number={3} title="TD vs Monte Carlo">
          <p className="text-sm text-text leading-relaxed">
            Both TD and Monte Carlo learn value functions from experience, but they differ fundamentally in <em>when</em> and <em>how</em> they update:
          </p>
          <div className="overflow-x-auto my-3">
            <table className="text-xs w-full border-collapse">
              <thead>
                <tr className="border-b border-surface-lighter">
                  <th className="text-left py-2 pr-3 text-text-muted font-bold">Property</th>
                  <th className="text-left py-2 px-3 text-accent-blue font-bold">TD(0)</th>
                  <th className="text-left py-2 pl-3 text-accent-yellow font-bold">Monte Carlo</th>
                </tr>
              </thead>
              <tbody className="text-text">
                <tr className="border-b border-surface-lighter/50">
                  <td className="py-2 pr-3 text-text-muted">Updates</td>
                  <td className="py-2 px-3">Every step</td>
                  <td className="py-2 pl-3">End of episode</td>
                </tr>
                <tr className="border-b border-surface-lighter/50">
                  <td className="py-2 pr-3 text-text-muted">Target</td>
                  <td className="py-2 px-3">r + γV(s') (bootstrap)</td>
                  <td className="py-2 pl-3">Actual return G</td>
                </tr>
                <tr className="border-b border-surface-lighter/50">
                  <td className="py-2 pr-3 text-text-muted">Bias</td>
                  <td className="py-2 px-3">Some (from bootstrap)</td>
                  <td className="py-2 pl-3">None (unbiased)</td>
                </tr>
                <tr className="border-b border-surface-lighter/50">
                  <td className="py-2 pr-3 text-text-muted">Variance</td>
                  <td className="py-2 px-3">Lower</td>
                  <td className="py-2 pl-3">Higher</td>
                </tr>
                <tr className="border-b border-surface-lighter/50">
                  <td className="py-2 pr-3 text-text-muted">Continuing tasks</td>
                  <td className="py-2 px-3">✓ Works</td>
                  <td className="py-2 pl-3">✗ Needs episodes</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 text-text-muted">Convergence</td>
                  <td className="py-2 px-3">Typically faster</td>
                  <td className="py-2 pl-3">Typically slower</td>
                </tr>
              </tbody>
            </table>
          </div>
          <Callout type="insight">
            MC uses the <em>true return</em> (no bias, high variance). TD uses a <em>bootstrap estimate</em>
            (some bias, low variance). In practice, TD's bias shrinks as V improves, while its lower variance
            means faster, more stable learning.
          </Callout>
          <TDvsMCWidget />
        </Accordion>

        <Accordion number={4} title="Q-Learning: Off-Policy TD Control">
          <p className="text-sm text-text leading-relaxed">
            TD(0) learns <em>state</em> values V(s). But to act, we need <em>action</em> values Q(s, a).
            <strong> Q-Learning</strong> extends TD to learn Q directly:
          </p>
          <Eq tex="Q(s,a) \leftarrow Q(s,a) + \alpha \Big[ r + \gamma \max_{a'} Q(s', a') - Q(s,a) \Big]" />
          <p className="text-sm text-text leading-relaxed">
            The critical detail: the update uses <strong>max</strong> over next actions. This means Q-Learning
            assumes the agent will act optimally in the future, <em>regardless of what it actually does</em>.
            This is what makes it <strong>off-policy</strong> — it learns about the optimal policy while following
            an exploratory one.
          </p>
          <div className="bg-surface-light rounded-lg p-3 my-3">
            <p className="text-xs font-bold text-text mb-2">Q-Learning algorithm:</p>
            <ol className="text-xs text-text space-y-1 m-0 pl-4">
              <li>Initialize Q(s,a) = 0 for all s, a</li>
              <li>In state s, choose a using ε-greedy on Q</li>
              <li>Take action a, observe reward r, next state s'</li>
              <li>Update: Q(s,a) += α[r + γ·max Q(s',·) − Q(s,a)]</li>
              <li>s ← s', repeat until terminal</li>
            </ol>
          </div>
          <Callout type="insight">
            Q-Learning's max makes it <strong>optimistic</strong> — it always plans for the best case. This drives
            it toward the shortest path, but it can be risky when exploration might cause accidental bad outcomes.
          </Callout>
        </Accordion>

        <Accordion number={5} title="SARSA: On-Policy TD Control">
          <p className="text-sm text-text leading-relaxed">
            <strong>SARSA</strong> (State-Action-Reward-State-Action) is Q-Learning's cautious sibling:
          </p>
          <Eq tex="Q(s,a) \leftarrow Q(s,a) + \alpha \Big[ r + \gamma Q(s', a') - Q(s,a) \Big]" />
          <p className="text-sm text-text leading-relaxed">
            The difference is subtle but profound: instead of max, SARSA uses the <strong>actual next action a'</strong>
            that the agent selects. This makes it <strong>on-policy</strong> — it learns about the policy it's
            actually following, including its exploration mistakes.
          </p>
          <div className="bg-surface-light rounded-lg p-3 my-3">
            <p className="text-xs font-bold text-text mb-2">SARSA algorithm:</p>
            <ol className="text-xs text-text space-y-1 m-0 pl-4">
              <li>Initialize Q(s,a) = 0 for all s, a</li>
              <li>In state s, choose a using ε-greedy on Q</li>
              <li>Take action a, observe reward r, next state s'</li>
              <li>Choose a' using ε-greedy on Q (for s')</li>
              <li>Update: Q(s,a) += α[r + γ·Q(s',a') − Q(s,a)]</li>
              <li>s ← s', a ← a', repeat until terminal</li>
            </ol>
          </div>
          <p className="text-sm text-text leading-relaxed">
            The name comes from the quintuple used in each update: <strong>(S, A, R, S', A')</strong>.
          </p>
          <Callout type="think">
            If your ε-greedy policy sometimes takes random actions near a cliff, SARSA knows this and learns
            to avoid the cliff edge. Q-Learning assumes you'll always act optimally near the cliff — dangerous
            if you actually won't!
          </Callout>
        </Accordion>

        <Accordion number={6} title="Q-Learning vs SARSA: The Cliff Walk">
          <p className="text-sm text-text leading-relaxed">
            The classic <strong>cliff walking</strong> example makes the on-policy vs off-policy difference vivid.
            An agent must navigate from start (S) to goal (G) along a grid. The bottom row is a cliff — step on it and
            you get -100 and restart.
          </p>
          <div className="bg-surface-light rounded-lg p-3 my-3">
            <p className="text-xs font-bold text-text mb-1">What happens:</p>
            <p className="text-xs text-text-muted m-0">
              <strong>Q-Learning</strong> learns the <em>optimal</em> path — right along the cliff edge (shortest route).
              But during training with ε-greedy, random steps sometimes fall off the cliff, causing terrible average returns.
            </p>
            <p className="text-xs text-text-muted mt-2 m-0">
              <strong>SARSA</strong> learns a <em>safer</em> path — one row above the cliff. It "knows" it will sometimes
              explore randomly, so it stays away from the edge. Its training returns are actually better than Q-Learning's.
            </p>
          </div>
          <QLvsSARSAWidget />
          <Callout type="insight">
            Neither algorithm is strictly "better." Q-Learning finds the optimal policy (best if you'll turn off
            exploration later). SARSA finds the best policy <em>given that you'll keep exploring</em> — often safer
            in practice.
          </Callout>
        </Accordion>

        <Accordion number={7} title="See It in Action: GridWorld Lab">
          <p className="text-sm text-text leading-relaxed">
            Everything you've learned in this chapter is running live in our <strong>GridWorld simulator</strong>.
            You can watch Q-Learning and SARSA learn step-by-step on a 5×5 grid with walls, pits, and a goal:
          </p>
          <div className="bg-surface-light rounded-lg p-3 my-3">
            <div className="space-y-2">
              <p className="text-xs text-text m-0">
                <strong>Q-Learning:</strong> Watch the off-policy learner build Q-values and find the shortest path.
                Notice how it boldly navigates near obstacles.
              </p>
              <p className="text-xs text-text m-0">
                <strong>SARSA:</strong> Compare the on-policy learner — it may take a slightly longer but safer route.
              </p>
              <p className="text-xs text-text m-0">
                <strong>Value Iteration & Policy Iteration:</strong> See how DP methods (from Ch. 7) compare — they
                compute optimal values in one sweep but require the full environment model.
              </p>
            </div>
          </div>
          <p className="text-sm text-text leading-relaxed">
            Try adjusting the learning rate α and exploration rate ε. See what happens when ε is very high
            (lots of exploration) vs very low (mostly greedy).
          </p>
          <SimButton label="Open GridWorld Lab" to="/gridworld" />
          <Callout type="try">
            Run Q-Learning for 100 episodes, then switch to SARSA and do the same. Compare their learned
            Q-value tables and paths. Which one finds a shorter path? Which one gets better average returns during training?
          </Callout>
        </Accordion>

      </div>

      <ChapterNav
        prev={{ path: '/learn/exploration-exploitation', label: 'Ch 8: Exploration vs Exploitation' }}
        next={{ path: '/learn/policy-gradients', label: 'Ch 10: Policy Gradients' }}
      />
    </div>
  )
}
