import { useState, useRef, useEffect, useCallback } from 'react'
import { Accordion, Callout, Eq, ChapterNav } from '../../components/shared/GuidePrimitives'
import { useThemeColors } from '../../hooks/useThemeColors'

/* ══════════════════════════════════════════
   Interactive Widget: Grid State Explorer
   Click on a grid to see how state changes
   ══════════════════════════════════════════ */

function GridStateWidget() {
  const [pos, setPos] = useState({ row: 2, col: 2 })
  const gridSize = 5

  const move = useCallback((dr: number, dc: number) => {
    setPos((p) => ({
      row: Math.max(0, Math.min(gridSize - 1, p.row + dr)),
      col: Math.max(0, Math.min(gridSize - 1, p.col + dc)),
    }))
  }, [])

  return (
    <div className="bg-surface rounded-xl border border-surface-lighter p-5 my-5">
      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Interactive: Discrete State Space</h4>

      <div className="flex items-start gap-6 flex-wrap">
        {/* Grid */}
        <div className="flex flex-col gap-1">
          {Array.from({ length: gridSize }, (_, r) => (
            <div key={r} className="flex gap-1">
              {Array.from({ length: gridSize }, (_, c) => (
                <button
                  key={c}
                  onClick={() => setPos({ row: r, col: c })}
                  className={`w-10 h-10 rounded border-0 cursor-pointer text-xs font-mono transition-all ${
                    pos.row === r && pos.col === c
                      ? 'bg-primary text-white scale-110'
                      : 'bg-surface-light text-text-muted hover:bg-surface-lighter'
                  }`}
                >
                  {r},{c}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Info panel */}
        <div className="flex-1 min-w-[200px]">
          <div className="bg-surface-light rounded-lg p-4 mb-3">
            <p className="text-xs font-bold text-text-muted mb-2">Current State:</p>
            <p className="text-lg font-mono font-bold text-primary-light mb-1">
              s = ({pos.row}, {pos.col})
            </p>
            <p className="text-xs text-text-muted m-0">
              This is a <strong>discrete</strong> state — one of exactly {gridSize * gridSize} possible positions.
              Every cell is a distinct state the agent can be in.
            </p>
          </div>

          {/* Action buttons */}
          <p className="text-xs font-bold text-text-muted mb-2">Actions (discrete):</p>
          <div className="grid grid-cols-3 gap-1 w-28">
            <div />
            <button onClick={() => move(-1, 0)} className="px-2 py-1.5 rounded bg-surface-light text-text-muted text-xs border-0 cursor-pointer hover:bg-surface-lighter">{'\u2191'}</button>
            <div />
            <button onClick={() => move(0, -1)} className="px-2 py-1.5 rounded bg-surface-light text-text-muted text-xs border-0 cursor-pointer hover:bg-surface-lighter">{'\u2190'}</button>
            <div className="px-2 py-1.5 rounded bg-surface-lighter/30 text-text-muted text-[10px] text-center">4 dirs</div>
            <button onClick={() => move(0, 1)} className="px-2 py-1.5 rounded bg-surface-light text-text-muted text-xs border-0 cursor-pointer hover:bg-surface-lighter">{'\u2192'}</button>
            <div />
            <button onClick={() => move(1, 0)} className="px-2 py-1.5 rounded bg-surface-light text-text-muted text-xs border-0 cursor-pointer hover:bg-surface-lighter">{'\u2193'}</button>
            <div />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   Interactive Widget: Continuous State Explorer
   A pendulum that shows continuous state values
   ══════════════════════════════════════════ */

/* Physics constants for the pendulum */
const GRAVITY = 9.81       // m/s²
const ROD_LENGTH = 1.0     // m (visual length is scaled separately)
const BOB_MASS = 1.5       // kg
const DAMPING = 0.15       // light damping so it swings for a while
const DT = 1 / 60          // physics timestep (s)
const VISUAL_LEN = 85      // pixels

function ContinuousStateWidget() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const colors = useThemeColors()

  // Physics state stored in refs so the animation loop doesn't cause re-render storms
  const thetaRef = useRef(Math.PI / 4)   // start at 45°
  const omegaRef = useRef(0)             // start at rest
  const dragging = useRef(false)
  const rafRef = useRef<number>(0)

  // Display state — updated at 60fps for the info panel
  const [displayTheta, setDisplayTheta] = useState(thetaRef.current)
  const [displayOmega, setDisplayOmega] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const cx = w / 2
    const cy = h * 0.32

    const loop = () => {
      // --- Physics step (skip when user is dragging) ---
      if (!dragging.current) {
        // Equation of motion: α = -(g/L)sin(θ) - b·ω
        const alpha = -(GRAVITY / ROD_LENGTH) * Math.sin(thetaRef.current) - DAMPING * omegaRef.current
        omegaRef.current += alpha * DT
        thetaRef.current += omegaRef.current * DT
      }

      const theta = thetaRef.current
      const omega = omegaRef.current

      // --- Draw ---
      ctx.clearRect(0, 0, w, h)

      // Dashed vertical reference line
      ctx.strokeStyle = colors.primaryLight
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx, cy + VISUAL_LEN * 0.7)
      ctx.stroke()
      ctx.setLineDash([])

      // Angle arc indicator
      if (Math.abs(theta) > 0.02) {
        const arcR = 25
        const startAngle = Math.PI / 2          // straight down in canvas coords
        const endAngle = Math.PI / 2 - theta    // pendulum angle (canvas Y is flipped)
        ctx.strokeStyle = colors.primaryLight
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(cx, cy, arcR, Math.min(startAngle, endAngle), Math.max(startAngle, endAngle))
        ctx.stroke()
        // θ label near arc
        ctx.fillStyle = colors.primaryLight
        ctx.font = '11px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('θ', cx + (arcR + 10) * Math.sin(theta / 2), cy + (arcR + 10) * Math.cos(theta / 2))
      }

      // Rod
      const endX = cx + VISUAL_LEN * Math.sin(theta)
      const endY = cy + VISUAL_LEN * Math.cos(theta)
      ctx.strokeStyle = colors.text
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(endX, endY)
      ctx.stroke()

      // Pivot
      ctx.fillStyle = colors.textMuted
      ctx.beginPath()
      ctx.arc(cx, cy, 5, 0, Math.PI * 2)
      ctx.fill()

      // Bob (with subtle glow based on speed)
      const speedNorm = Math.min(Math.abs(omega) / 6, 1)
      ctx.shadowColor = colors.primary
      ctx.shadowBlur = 4 + speedNorm * 12
      ctx.fillStyle = colors.primary
      ctx.beginPath()
      ctx.arc(endX, endY, 14, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      // Mass label on bob
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 8px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${BOB_MASS}kg`, endX, endY)
      ctx.textBaseline = 'alphabetic'

      // Instruction
      ctx.fillStyle = colors.textMuted
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Drag the bob and release', cx, h - 8)

      // --- Update display state ---
      setDisplayTheta(theta)
      setDisplayOmega(omega)

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [colors])

  // --- Pointer event handlers (support both mouse and touch) ---
  const getAngleFromPointer = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (clientX - rect.left) * scaleX - canvas.width / 2
    const y = (clientY - rect.top) * scaleY - canvas.height * 0.32
    return Math.atan2(x, y)
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    dragging.current = true
    ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
    const a = getAngleFromPointer(e.clientX, e.clientY)
    if (a !== null) {
      thetaRef.current = a
      omegaRef.current = 0
    }
  }, [getAngleFromPointer])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging.current) return
    const a = getAngleFromPointer(e.clientX, e.clientY)
    if (a !== null) {
      thetaRef.current = a
      omegaRef.current = 0
    }
  }, [getAngleFromPointer])

  const handlePointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  // Compute energy for display: E = ½mLω² + mgL(1 - cosθ)
  const kineticE = 0.5 * BOB_MASS * ROD_LENGTH * ROD_LENGTH * displayOmega * displayOmega
  const potentialE = BOB_MASS * GRAVITY * ROD_LENGTH * (1 - Math.cos(displayTheta))
  const totalE = kineticE + potentialE

  return (
    <div className="bg-surface rounded-xl border border-surface-lighter p-5 my-5">
      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Interactive: Continuous State Space — Live Pendulum</h4>

      <div className="flex items-start gap-6 flex-wrap">
        <canvas
          ref={canvasRef}
          width={220}
          height={220}
          className="rounded-lg bg-surface-light cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />

        <div className="flex-1 min-w-[220px]">
          <div className="bg-surface-light rounded-lg p-4 mb-3">
            <p className="text-xs font-bold text-text-muted mb-2">Current State (continuous):</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-surface rounded-lg p-2 text-center">
                <span className="text-xs text-text-muted block">{'\u03B8'} (angle)</span>
                <span className="text-sm font-mono font-bold text-primary-light">{displayTheta.toFixed(4)}</span>
                <span className="text-[10px] text-text-muted block">rad ({(displayTheta * 180 / Math.PI).toFixed(1)}°)</span>
              </div>
              <div className="bg-surface rounded-lg p-2 text-center">
                <span className="text-xs text-text-muted block">{'\u03C9'} (ang. vel)</span>
                <span className="text-sm font-mono font-bold text-accent-yellow">{displayOmega.toFixed(4)}</span>
                <span className="text-[10px] text-text-muted block">rad/s</span>
              </div>
            </div>

            {/* Energy bars */}
            <p className="text-xs font-bold text-text-muted mb-1.5">Energy (Joules):</p>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-text-muted w-8">KE</span>
                <div className="flex-1 h-2 bg-surface rounded overflow-hidden">
                  <div className="h-full bg-accent-blue transition-all duration-75 rounded" style={{ width: `${totalE > 0 ? (kineticE / totalE) * 100 : 0}%` }} />
                </div>
                <span className="text-[10px] font-mono text-accent-blue w-12 text-right">{kineticE.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-text-muted w-8">PE</span>
                <div className="flex-1 h-2 bg-surface rounded overflow-hidden">
                  <div className="h-full bg-accent-green transition-all duration-75 rounded" style={{ width: `${totalE > 0 ? (potentialE / totalE) * 100 : 0}%` }} />
                </div>
                <span className="text-[10px] font-mono text-accent-green w-12 text-right">{potentialE.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-text-muted leading-relaxed">
            This pendulum obeys real physics: <strong>α = -(g/L)sin(θ) - bω</strong>.
            Notice how the state values are <strong>real numbers</strong> that change continuously.
            Even tiny differences in where you release create different trajectories.
            There are <strong>infinitely many</strong> possible states — no table can hold them all.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   Interactive Widget: Transition Function Demo
   Shows deterministic vs stochastic transitions on a mini grid
   ══════════════════════════════════════════ */

const TGRID = 5
const AGENT_POS = { row: 2, col: 2 }  // centre of 5×5

function TransitionFunctionWidget() {
  const [mode, setMode] = useState<'deterministic' | 'stochastic'>('deterministic')
  const [trials, setTrials] = useState<{ row: number; col: number }[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // The intended action is always "Right"
  const intended = { row: 2, col: 3 }

  // Stochastic probabilities: 80% right, 10% up, 10% down
  const stochasticOutcomes = [
    { row: 2, col: 3, prob: 0.8, label: 'Right (intended)' },
    { row: 1, col: 2, prob: 0.1, label: 'Up (slipped)' },
    { row: 3, col: 2, prob: 0.1, label: 'Down (slipped)' },
  ]

  const sampleOutcome = useCallback(() => {
    if (mode === 'deterministic') return intended
    const r = Math.random()
    if (r < 0.8) return { row: 2, col: 3 }
    if (r < 0.9) return { row: 1, col: 2 }
    return { row: 3, col: 2 }
  }, [mode])

  const runTrials = useCallback(() => {
    setTrials([])
    setIsRunning(true)
    let count = 0
    const maxTrials = 30

    const addOne = () => {
      if (count >= maxTrials) { setIsRunning(false); return }
      setTrials(prev => [...prev, sampleOutcome()])
      count++
      timerRef.current = setTimeout(addOne, 120)
    }
    addOne()
  }, [sampleOutcome])

  const clearTrials = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setTrials([])
    setIsRunning(false)
  }, [])

  // Count outcomes for stats
  const outcomeCount = trials.reduce((acc, t) => {
    const key = `${t.row},${t.col}`
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="bg-surface rounded-xl border border-surface-lighter p-5 my-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Interactive: Transition Function</h4>
        <div className="flex gap-1">
          <button
            onClick={() => { clearTrials(); setMode('deterministic') }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border-0 cursor-pointer transition-colors ${
              mode === 'deterministic'
                ? 'bg-accent-blue text-white'
                : 'bg-surface-light text-text-muted hover:text-text hover:bg-surface-lighter'
            }`}
          >
            Deterministic
          </button>
          <button
            onClick={() => { clearTrials(); setMode('stochastic') }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border-0 cursor-pointer transition-colors ${
              mode === 'stochastic'
                ? 'bg-accent-yellow text-surface'
                : 'bg-surface-light text-text-muted hover:text-text hover:bg-surface-lighter'
            }`}
          >
            Stochastic
          </button>
        </div>
      </div>

      <p className="text-xs text-text-muted mb-4">
        The agent is at <strong>(2,2)</strong> and chooses action <strong>"Right"</strong>. Where does it end up?
        {mode === 'stochastic' && ' The floor is slippery — 80% chance of going right, 10% up, 10% down.'}
      </p>

      <div className="flex items-start gap-6 flex-wrap">
        {/* Mini grid */}
        <div className="flex flex-col gap-1">
          {Array.from({ length: TGRID }, (_, r) => (
            <div key={r} className="flex gap-1">
              {Array.from({ length: TGRID }, (_, c) => {
                const isAgent = r === AGENT_POS.row && c === AGENT_POS.col
                const isIntended = r === intended.row && c === intended.col
                const isSlipUp = mode === 'stochastic' && r === 1 && c === 2
                const isSlipDown = mode === 'stochastic' && r === 3 && c === 2
                const landCount = outcomeCount[`${r},${c}`] || 0

                let bg = 'bg-surface-light text-text-muted'
                let extra = ''
                if (isAgent) { bg = 'bg-primary text-white'; extra = 'ring-2 ring-primary/50' }
                else if (isIntended) bg = 'bg-accent-green/20 text-accent-green border border-accent-green/40'
                else if (isSlipUp || isSlipDown) bg = 'bg-accent-yellow/15 text-accent-yellow border border-accent-yellow/30'

                return (
                  <div
                    key={c}
                    className={`w-11 h-11 rounded flex flex-col items-center justify-center text-[10px] font-mono relative ${bg} ${extra}`}
                  >
                    <span>{r},{c}</span>
                    {isAgent && <span className="text-[8px]">agent</span>}
                    {isIntended && mode === 'deterministic' && <span className="text-[8px]">→100%</span>}
                    {isIntended && mode === 'stochastic' && <span className="text-[8px]">→80%</span>}
                    {isSlipUp && <span className="text-[8px]">↑10%</span>}
                    {isSlipDown && <span className="text-[8px]">↓10%</span>}
                    {landCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-accent-red text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {landCount}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Right panel */}
        <div className="flex-1 min-w-[200px]">
          {/* Probability table */}
          <div className="bg-surface-light rounded-lg p-3 mb-3">
            <p className="text-xs font-bold text-text-muted mb-2">
              P(s' | s=(2,2), a=Right):
            </p>
            {mode === 'deterministic' ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-accent-green">s'=(2,3)</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-surface rounded overflow-hidden">
                      <div className="h-full bg-accent-green rounded" style={{ width: '100%' }} />
                    </div>
                    <span className="text-xs font-mono font-bold text-accent-green">1.0</span>
                  </div>
                </div>
                <p className="text-[10px] text-text-muted mt-1 mb-0">Every other state has probability 0. One outcome, guaranteed.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {stochasticOutcomes.map(({ row, col, prob, label }) => (
                  <div key={`${row},${col}`} className="flex items-center justify-between">
                    <span className="text-xs font-mono text-text-muted">
                      s'=({row},{col}) <span className="text-text-muted/60">{label}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-surface rounded overflow-hidden">
                        <div
                          className={`h-full rounded ${prob >= 0.5 ? 'bg-accent-green' : 'bg-accent-yellow'}`}
                          style={{ width: `${prob * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-text">{prob}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Simulate button */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={runTrials}
              disabled={isRunning}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border-0 cursor-pointer transition-colors ${
                mode === 'deterministic'
                  ? 'bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30'
                  : 'bg-accent-yellow/20 text-accent-yellow hover:bg-accent-yellow/30'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {isRunning ? 'Simulating...' : `Simulate 30 Trials`}
            </button>
            <button
              onClick={clearTrials}
              className="px-3 py-2 rounded-lg text-xs font-medium border-0 cursor-pointer bg-surface-light text-text-muted hover:bg-surface-lighter transition-colors"
            >
              Clear
            </button>
          </div>

          {/* Trial results */}
          {trials.length > 0 && (
            <div className="bg-surface rounded-lg p-3">
              <p className="text-xs font-bold text-text-muted mb-1">Results ({trials.length} trials):</p>
              <div className="flex flex-col gap-1">
                {Object.entries(outcomeCount).sort((a, b) => b[1] - a[1]).map(([key, count]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="font-mono text-text">Landed at ({key})</span>
                    <span className="font-mono font-bold text-primary-light">
                      {count}× ({((count / trials.length) * 100).toFixed(0)}%)
                    </span>
                  </div>
                ))}
              </div>
              {mode === 'deterministic' && trials.length > 0 && (
                <p className="text-[10px] text-accent-blue mt-2 mb-0">
                  Every single trial landed at (2,3). That's deterministic — no variance at all.
                </p>
              )}
              {mode === 'stochastic' && trials.length >= 20 && (
                <p className="text-[10px] text-accent-yellow mt-2 mb-0">
                  Notice the results roughly match the probabilities (80/10/10), but not exactly.
                  With more trials, they'd converge. This randomness is why stochastic environments are harder to learn in.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   Interactive Widget: Trajectory Viewer
   Shows a step-by-step trajectory with states, actions, rewards
   ══════════════════════════════════════════ */

function TrajectoryWidget() {
  const trajectory = [
    { t: 0, state: 'Start (2,2)', action: 'Right', reward: '-1', next: '(2,3)' },
    { t: 1, state: '(2,3)', action: 'Right', reward: '-1', next: '(2,4)' },
    { t: 2, state: '(2,4)', action: 'Down', reward: '-1', next: '(3,4)' },
    { t: 3, state: '(3,4)', action: 'Down', reward: '-1', next: '(4,4)' },
    { t: 4, state: '(4,4)', action: 'Right', reward: '+10', next: 'Goal!' },
  ]
  const [visibleSteps, setVisibleSteps] = useState(1)

  return (
    <div className="bg-surface rounded-xl border border-surface-lighter p-5 my-5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Interactive: A Trajectory</h4>
        <div className="flex gap-2">
          <button
            onClick={() => setVisibleSteps((s) => Math.max(1, s - 1))}
            disabled={visibleSteps <= 1}
            className="px-2 py-1 rounded bg-surface-light text-text-muted text-xs border-0 cursor-pointer hover:bg-surface-lighter disabled:opacity-40 disabled:cursor-not-allowed"
          >
            &larr; Back
          </button>
          <button
            onClick={() => setVisibleSteps((s) => Math.min(trajectory.length, s + 1))}
            disabled={visibleSteps >= trajectory.length}
            className="px-2 py-1 rounded bg-primary/20 text-primary-light text-xs border-0 cursor-pointer hover:bg-primary/30 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next Step &rarr;
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-text-muted">
              <th className="text-left py-1.5 px-2 font-bold">t</th>
              <th className="text-left py-1.5 px-2 font-bold">State <Eq tex="S_t" inline /></th>
              <th className="text-left py-1.5 px-2 font-bold">Action <Eq tex="A_t" inline /></th>
              <th className="text-left py-1.5 px-2 font-bold">Reward <Eq tex="R_{t+1}" inline /></th>
              <th className="text-left py-1.5 px-2 font-bold">Next State <Eq tex="S_{t+1}" inline /></th>
            </tr>
          </thead>
          <tbody>
            {trajectory.slice(0, visibleSteps).map((step, i) => (
              <tr key={step.t} className={`${i === visibleSteps - 1 ? 'bg-primary/10' : ''} transition-colors`}>
                <td className="py-1.5 px-2 font-mono text-text-muted">{step.t}</td>
                <td className="py-1.5 px-2 font-mono text-accent-blue">{step.state}</td>
                <td className="py-1.5 px-2 font-mono text-accent-green">{step.action}</td>
                <td className={`py-1.5 px-2 font-mono ${step.reward.startsWith('+') && step.reward !== '+10' ? 'text-text-muted' : step.reward === '+10' ? 'text-accent-green font-bold' : 'text-accent-red'}`}>
                  {step.reward}
                </td>
                <td className="py-1.5 px-2 font-mono text-primary-light">{step.next}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {visibleSteps === trajectory.length && (
        <div className="mt-3 bg-accent-green/10 rounded-lg p-3">
          <p className="text-xs text-accent-green m-0">
            <strong>Episode complete!</strong> The full trajectory: S{'\u2080'}, A{'\u2080'}, R{'\u2081'}, S{'\u2081'}, A{'\u2081'}, R{'\u2082'}, ... , S{'\u2084'}, A{'\u2084'}, R{'\u2085'}, Goal.
            Total reward = -1 + -1 + -1 + -1 + 10 = <strong>6</strong>.
          </p>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   MAIN PAGE: Chapter 2
   ══════════════════════════════════════════ */

export function StatesAndActionsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="mb-10 text-center">
        <div className="flex justify-center gap-3 mb-4">
          <a href="#/learn" className="text-sm text-primary-light hover:underline no-underline">
            &larr; All Chapters
          </a>
        </div>
        <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Chapter 2</p>
        <h1 className="text-4xl font-bold text-text mb-3">
          States and Actions
        </h1>
        <p className="text-lg text-text-muted max-w-2xl mx-auto">
          How agents perceive the world and what choices they can make.
          The building blocks of every RL problem.
        </p>
        <div className="flex justify-center gap-3 mt-4 text-xs text-text-muted">
          <span className="bg-surface-light px-3 py-1 rounded-full">7 sections</span>
          <span className="bg-surface-light px-3 py-1 rounded-full">Interactive widgets</span>
          <span className="bg-surface-light px-3 py-1 rounded-full">Builds on Ch 1</span>
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-4">

        {/* ── SECTION 1 ── */}
        <Accordion number={1} title="What is a State?" defaultOpen>
          <p className="text-sm text-text leading-relaxed mb-4">
            A <strong>state</strong> is a complete description of the current situation. It contains
            all the information the agent needs to make a decision — nothing more, nothing less.
          </p>

          <p className="text-sm text-text leading-relaxed mb-4">
            Think of it as a snapshot: at any point in time, the state tells you everything relevant
            about where you are. In chess, the state is the position of every piece. In a video game,
            it's the positions of all characters, score, and timer. In a thermostat system, it's the
            current temperature.
          </p>

          <div className="bg-surface rounded-lg p-4 my-4">
            <p className="text-sm text-text leading-relaxed mb-0">
              Formally, the state at time <Eq tex="t" inline /> is denoted <Eq tex="S_t" inline />.
              The set of all possible states is the <strong>state space</strong>, written <Eq tex="\mathcal{S}" inline />.
            </p>
          </div>

          <Callout type="insight">
            A good state representation satisfies the <strong>Markov property</strong>: the future
            depends only on the current state, not on the history of how you got there. If knowing
            the current state is enough to predict what happens next, the state is "Markov."
            We'll formalize this in Chapter 5 (MDPs).
          </Callout>
        </Accordion>

        {/* ── SECTION 2 ── */}
        <Accordion number={2} title="Discrete vs Continuous States">
          <p className="text-sm text-text leading-relaxed mb-4">
            State spaces come in two fundamental flavors, and this distinction affects everything —
            which algorithms work, how we store information, and how hard the problem is.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-blue mb-2">Discrete State Space</h4>
              <p className="text-xs text-text-muted mb-2">Finite (or countably infinite) number of states</p>
              <p className="text-xs text-text leading-relaxed mb-2">
                Each state is clearly distinct from every other. You can list them all (at least in theory).
              </p>
              <p className="text-xs text-text-muted m-0">
                <strong>Examples:</strong> Grid cells, board positions, card hands, traffic light states
              </p>
            </div>
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-green mb-2">Continuous State Space</h4>
              <p className="text-xs text-text-muted mb-2">Infinitely many states along real-valued dimensions</p>
              <p className="text-xs text-text leading-relaxed mb-2">
                States are points in a continuous space. Even tiny differences create different states.
              </p>
              <p className="text-xs text-text-muted m-0">
                <strong>Examples:</strong> Robot joint angles, cart position, stock prices, temperature
              </p>
            </div>
          </div>

          <GridStateWidget />
          <ContinuousStateWidget />

          <Callout type="think">
            Why does this distinction matter so much? With discrete states, we can build a <strong>table</strong> —
            one row per state — and store exact values. With continuous states, there are infinitely
            many states, so we need <strong>function approximation</strong> (like neural networks or
            feature vectors) to generalize across similar states. Most real-world problems are continuous.
          </Callout>
        </Accordion>

        {/* ── SECTION 3 ── */}
        <Accordion number={3} title="What is an Action?">
          <p className="text-sm text-text leading-relaxed mb-4">
            An <strong>action</strong> is a choice the agent makes at each timestep. It's the agent's
            only way to influence the environment. Everything the agent can "do" is an action.
          </p>

          <div className="bg-surface rounded-lg p-4 my-4">
            <p className="text-sm text-text leading-relaxed mb-0">
              At time <Eq tex="t" inline />, the agent selects action <Eq tex="A_t" inline /> from
              the <strong>action space</strong> <Eq tex="\mathcal{A}" inline /> (or sometimes <Eq tex="\mathcal{A}(s)" inline /> if
              available actions depend on the state).
            </p>
          </div>

          <p className="text-sm text-text leading-relaxed mb-4">
            Actions, like states, can be discrete or continuous:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-surface-light rounded-xl p-4 border border-surface-lighter">
              <h4 className="text-sm font-bold text-accent-blue mb-2">Discrete Actions</h4>
              <ul className="text-xs text-text-muted space-y-1 m-0">
                <li className="flex items-start gap-2"><span className="text-accent-blue">-</span>Left / Right / Up / Down</li>
                <li className="flex items-start gap-2"><span className="text-accent-blue">-</span>Buy / Sell / Hold</li>
                <li className="flex items-start gap-2"><span className="text-accent-blue">-</span>Pull arm 1, 2, 3, ...</li>
                <li className="flex items-start gap-2"><span className="text-accent-blue">-</span>Place piece at position (r,c)</li>
              </ul>
            </div>
            <div className="bg-surface-light rounded-xl p-4 border border-surface-lighter">
              <h4 className="text-sm font-bold text-accent-green mb-2">Continuous Actions</h4>
              <ul className="text-xs text-text-muted space-y-1 m-0">
                <li className="flex items-start gap-2"><span className="text-accent-green">-</span>Apply force = 3.72N</li>
                <li className="flex items-start gap-2"><span className="text-accent-green">-</span>Rotate joint by 0.15 rad</li>
                <li className="flex items-start gap-2"><span className="text-accent-green">-</span>Set throttle to 67.3%</li>
                <li className="flex items-start gap-2"><span className="text-accent-green">-</span>Allocate $142.50 to asset</li>
              </ul>
            </div>
          </div>

          <Callout type="insight">
            Most of the problems in our lab use <strong>discrete actions</strong> — left/right push,
            grid movements, slot machine pulls. This keeps things simple while still capturing the
            core ideas. Continuous actions (like real robot motors) require more advanced methods
            like Actor-Critic or DDPG.
          </Callout>
        </Accordion>

        {/* ── SECTION 4 ── */}
        <Accordion number={4} title="State Spaces in Our Labs">
          <p className="text-sm text-text leading-relaxed mb-4">
            Let's look at the concrete state and action spaces used in each of our lab environments.
            Notice how complexity increases as you move through the labs:
          </p>

          <div className="flex flex-col gap-3 mb-4">
            {[
              {
                env: 'Multi-Armed Bandit',
                icon: '\uD83C\uDFB0',
                stateDesc: 'No state! (or rather, a single constant state)',
                stateSize: '|S| = 1',
                actionDesc: 'Pull arm 0, 1, 2, ..., k-1',
                actionSize: '|A| = k (e.g., 5)',
                note: 'The simplest RL problem — no state transitions, just immediate rewards.',
                color: 'accent-yellow',
              },
              {
                env: 'GridWorld',
                icon: '\uD83D\uDC18',
                stateDesc: 'Grid position (row, col)',
                stateSize: '|S| = rows \u00D7 cols (e.g., 36)',
                actionDesc: 'Up, Down, Left, Right',
                actionSize: '|A| = 4',
                note: 'Classic discrete problem. Small enough for exact tabular methods.',
                color: 'accent-blue',
              },
              {
                env: 'CartPole (Classic)',
                icon: '\uD83C\uDFCB\uFE0F',
                stateDesc: '(x, velocity, \u03B8, angular velocity)',
                stateSize: '|S| = \u221E (4 real-valued dimensions)',
                actionDesc: 'Push left, Push right',
                actionSize: '|A| = 2',
                note: 'First continuous problem. Must discretize or use function approximation.',
                color: 'accent-green',
              },
              {
                env: 'Rocket Landing',
                icon: '\uD83D\uDE80',
                stateDesc: '(x, xDot, y, yDot, \u03B8, \u03B8Dot)',
                stateSize: '|S| = \u221E (6 real-valued dimensions)',
                actionDesc: 'Left thrust, Right thrust, Bottom thrust',
                actionSize: '|A| = 3',
                note: 'Harder continuous problem. More dimensions = curse of dimensionality.',
                color: 'primary-light',
              },
            ].map(({ env, icon, stateDesc, stateSize, actionDesc, actionSize, note, color }) => (
              <div key={env} className="bg-surface-light rounded-xl p-4 border border-surface-lighter">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{icon}</span>
                  <span className={`text-sm font-bold text-${color}`}>{env}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-2">
                  <div>
                    <span className="font-bold text-text">State: </span>
                    <span className="text-text-muted">{stateDesc}</span>
                    <span className="block font-mono text-primary-light mt-0.5">{stateSize}</span>
                  </div>
                  <div>
                    <span className="font-bold text-text">Actions: </span>
                    <span className="text-text-muted">{actionDesc}</span>
                    <span className="block font-mono text-primary-light mt-0.5">{actionSize}</span>
                  </div>
                </div>
                <p className="text-xs text-text-muted italic m-0">{note}</p>
              </div>
            ))}
          </div>

          <Callout type="try" title="See It In Action">
            Try the <a href="#/bandit" className="text-primary-light hover:underline">Bandit</a> lab (simplest)
            and then the <a href="#/gridworld" className="text-primary-light hover:underline">GridWorld</a> lab
            to see how the state space affects the agent's learning. Notice how much faster the bandit agent
            converges compared to the GridWorld agent — fewer states means less to learn.
          </Callout>
        </Accordion>

        {/* ── SECTION 5 ── */}
        <Accordion number={5} title="Trajectories: Sequences of Experience">
          <p className="text-sm text-text leading-relaxed mb-4">
            As the agent interacts with the environment step by step, it generates a sequence of
            states, actions, and rewards called a <strong>trajectory</strong> (or <strong>rollout</strong>).
          </p>

          <Eq tex="\tau = S_0, A_0, R_1, S_1, A_1, R_2, S_2, A_2, R_3, \ldots" />

          <p className="text-sm text-text leading-relaxed mb-4">
            A trajectory is the complete record of one episode of interaction. It captures:
          </p>
          <ul className="text-sm text-text-muted space-y-1 mb-4">
            <li className="flex items-start gap-2"><span className="text-primary-light">-</span>What the agent saw (states)</li>
            <li className="flex items-start gap-2"><span className="text-primary-light">-</span>What the agent did (actions)</li>
            <li className="flex items-start gap-2"><span className="text-primary-light">-</span>What happened as a result (rewards + next states)</li>
          </ul>

          <TrajectoryWidget />

          <p className="text-sm text-text leading-relaxed">
            Every RL algorithm learns from trajectories. Some algorithms (like Q-Learning) learn from
            individual <strong>transitions</strong> <Eq tex="(S_t, A_t, R_{t+1}, S_{t+1})" inline /> —
            single steps. Others (like REINFORCE) need complete trajectories to compute returns.
          </p>
        </Accordion>

        {/* ── SECTION 6 ── */}
        <Accordion number={6} title="Episodic vs Continuing Tasks">
          <p className="text-sm text-text leading-relaxed mb-4">
            RL problems fall into two categories based on whether they have a natural endpoint:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-blue mb-2">Episodic Tasks</h4>
              <p className="text-xs text-text leading-relaxed mb-2">
                The interaction naturally breaks into <strong>episodes</strong> — separate runs with a clear start and end.
              </p>
              <p className="text-xs text-text-muted mb-1"><strong>Examples:</strong></p>
              <ul className="text-xs text-text-muted m-0 pl-4 space-y-0.5">
                <li>A game of chess (ends at checkmate/draw)</li>
                <li>CartPole (ends when pole falls)</li>
                <li>A robot picking up an object</li>
              </ul>
            </div>
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-green mb-2">Continuing Tasks</h4>
              <p className="text-xs text-text leading-relaxed mb-2">
                The interaction goes on <strong>forever</strong> (or indefinitely) with no natural endpoint.
              </p>
              <p className="text-xs text-text-muted mb-1"><strong>Examples:</strong></p>
              <ul className="text-xs text-text-muted m-0 pl-4 space-y-0.5">
                <li>Stock trading (market never "ends")</li>
                <li>Traffic light control</li>
                <li>Server resource allocation</li>
              </ul>
            </div>
          </div>

          <Callout type="think">
            All of our lab environments are <strong>episodic</strong>. The bandit runs for a fixed number
            of pulls, GridWorld ends when the goal is reached, CartPole ends when the pole falls. But
            many real problems are continuing — and this has important implications for how we define
            returns (next chapter!).
          </Callout>
        </Accordion>

        {/* ── SECTION 7 ── */}
        <Accordion number={7} title="The Transition Function">
          <p className="text-sm text-text leading-relaxed mb-4">
            When the agent takes an action, the environment decides what happens next. This is
            governed by the <strong>transition function</strong> (or <strong>dynamics</strong>):
          </p>

          <Eq tex="P(s' \mid s, a) = \Pr\{S_{t+1} = s' \mid S_t = s, A_t = a\}" />

          <p className="text-sm text-text leading-relaxed mb-4">
            This function tells us: given that the agent is in state <Eq tex="s" inline /> and takes
            action <Eq tex="a" inline />, what is the probability of ending up in each possible
            next state <Eq tex="s'" inline />? The probabilities over all possible next states must sum to 1.
          </p>

          {/* ── Deterministic vs Stochastic: Detailed comparison ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-blue mb-2">Deterministic Transitions</h4>
              <p className="text-xs text-text leading-relaxed mb-3">
                Taking action <Eq tex="a" inline /> in state <Eq tex="s" inline /> <strong>always</strong> leads
                to the same next state. No randomness, no surprises.
              </p>
              <div className="bg-surface rounded-lg p-3 mb-3">
                <p className="text-xs font-mono text-text mb-1">Agent at (2,2), action = Right:</p>
                <p className="text-xs font-mono text-accent-blue mb-0 font-bold">P( (2,3) | (2,2), Right ) = 1.0</p>
                <p className="text-xs font-mono text-text-muted mb-0">All other states: probability 0</p>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed mb-2">
                Same action in the same state → same outcome, every single time. Like chess — moving a knight
                always follows the same L-shaped rule.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-accent-blue/20 text-accent-blue px-2 py-0.5 rounded-full">Predictable</span>
                <span className="text-[10px] bg-accent-blue/20 text-accent-blue px-2 py-0.5 rounded-full">Easier to learn</span>
                <span className="text-[10px] bg-accent-blue/20 text-accent-blue px-2 py-0.5 rounded-full">No noise</span>
              </div>
            </div>

            <div className="bg-accent-yellow/10 border border-accent-yellow/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-yellow mb-2">Stochastic Transitions</h4>
              <p className="text-xs text-text leading-relaxed mb-3">
                Taking action <Eq tex="a" inline /> in state <Eq tex="s" inline /> can lead
                to <strong>multiple possible</strong> next states, each with some probability.
              </p>
              <div className="bg-surface rounded-lg p-3 mb-3">
                <p className="text-xs font-mono text-text mb-1">Agent at (2,2), action = Right (slippery floor!):</p>
                <p className="text-xs font-mono text-accent-green mb-0">P( (2,3) | (2,2), Right ) = 0.8</p>
                <p className="text-xs font-mono text-accent-yellow mb-0">P( (1,2) | (2,2), Right ) = 0.1 &nbsp;← slipped up</p>
                <p className="text-xs font-mono text-accent-red mb-0">P( (3,2) | (2,2), Right ) = 0.1 &nbsp;← slipped down</p>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed mb-2">
                Same action, same state — but the outcome varies! Like driving on ice: you steer right,
                but sometimes the car drifts. The agent must handle uncertainty.
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-accent-yellow/20 text-accent-yellow px-2 py-0.5 rounded-full">Realistic</span>
                <span className="text-[10px] bg-accent-yellow/20 text-accent-yellow px-2 py-0.5 rounded-full">Harder to learn</span>
                <span className="text-[10px] bg-accent-yellow/20 text-accent-yellow px-2 py-0.5 rounded-full">Noisy</span>
              </div>
            </div>
          </div>

          {/* ── Interactive transition demo ── */}
          <TransitionFunctionWidget />

          {/* ── Why it matters for value computation ── */}
          <div className="bg-surface rounded-xl border border-surface-lighter p-5 mb-4">
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Why This Matters: Computing Value</h4>
            <p className="text-xs text-text leading-relaxed mb-3">
              When the agent evaluates how good a state is, it computes the <strong>expected value</strong> over
              possible next states. The transition function determines how this sum works:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-accent-blue/5 border border-accent-blue/20 rounded-lg p-3">
                <p className="text-xs font-bold text-accent-blue mb-2">Deterministic (simple):</p>
                <p className="text-xs text-text leading-relaxed mb-0">
                  Only <strong>one</strong> next state has probability 1, so the sum collapses to a single term.
                  The value is just the reward plus the discounted value of that one next state.
                </p>
              </div>
              <div className="bg-accent-yellow/5 border border-accent-yellow/20 rounded-lg p-3">
                <p className="text-xs font-bold text-accent-yellow mb-2">Stochastic (must average):</p>
                <p className="text-xs text-text leading-relaxed mb-0">
                  Multiple next states have non-zero probability, so you must compute
                  a <strong>weighted average</strong> over all of them. Each possible outcome contributes
                  proportionally to its likelihood.
                </p>
              </div>
            </div>

            <Eq tex="V(s) = \sum_{s'} P(s' \mid s, a) \big[ R(s,a,s') + \gamma \, V(s') \big]" />

            <p className="text-xs text-text-muted leading-relaxed mb-0">
              In the deterministic case, this sum has one non-zero term. In the stochastic case,
              it has many — the agent must consider <em>all possible futures</em>, weighted by probability.
              This is a preview of the <strong>Bellman equation</strong> (Chapter 6).
            </p>
          </div>

          {/* ── In our labs ── */}
          <div className="bg-surface-light rounded-xl border border-surface-lighter p-4 mb-4">
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">In Our Labs</h4>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="text-accent-blue font-bold">GridWorld:</span>
                <span className="text-text-muted">Deterministic by default (Right always goes right), but you can enable wind
                  which makes it stochastic (agent might get blown off course).</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent-green font-bold">CartPole:</span>
                <span className="text-text-muted">Deterministic — same force on the cart always produces the same physics result.
                  The challenge comes from the continuous state space, not randomness.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent-yellow font-bold">Bandit:</span>
                <span className="text-text-muted">Stochastic rewards! Each arm pull gives a random reward drawn from a distribution.
                  The transition is trivial (same state), but the reward itself is noisy.</span>
              </div>
            </div>
          </div>

          <Callout type="insight">
            The agent usually doesn't know the transition function! It doesn't know the rules of
            the environment — it can only observe what happens when it acts. This is called <strong>model-free</strong> RL,
            and it's what most of our lab algorithms do. The agent learns from experience, not from knowing
            the rules. (Algorithms that try to <em>learn</em> the transition function are called <strong>model-based</strong>.)
          </Callout>

          <Callout type="think">
            Imagine you're learning to ride a bike. You don't know the exact physics equations (transition function).
            You just try things — lean left, pedal harder — and observe what happens. Over many trials,
            you build an intuitive understanding. That's model-free RL. A robot that first builds a physics
            model of the bike and then plans optimal moves? That's model-based RL.
          </Callout>
        </Accordion>
      </div>

      {/* Chapter navigation */}
      <ChapterNav
        prev={{ path: '/learn/what-is-rl', label: 'Ch 1: What is RL?' }}
        next={{ path: '/learn/rewards-and-returns', label: 'Ch 3: Rewards and Returns' }}
      />
    </div>
  )
}
