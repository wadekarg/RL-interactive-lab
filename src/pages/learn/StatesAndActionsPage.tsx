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

function ContinuousStateWidget() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [angle, setAngle] = useState(0.3)
  const [angVel, setAngVel] = useState(0)
  const colors = useThemeColors()
  const dragging = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const cx = w / 2
    const cy = h * 0.4
    const len = 80

    ctx.clearRect(0, 0, w, h)

    // Pivot
    ctx.fillStyle = colors.textMuted
    ctx.beginPath()
    ctx.arc(cx, cy, 5, 0, Math.PI * 2)
    ctx.fill()

    // Pendulum rod
    const endX = cx + len * Math.sin(angle)
    const endY = cy + len * Math.cos(angle)
    ctx.strokeStyle = colors.text
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(endX, endY)
    ctx.stroke()

    // Bob
    ctx.fillStyle = colors.primary
    ctx.beginPath()
    ctx.arc(endX, endY, 12, 0, Math.PI * 2)
    ctx.fill()

    // Angle arc
    ctx.strokeStyle = colors.primaryLight
    ctx.lineWidth = 1.5
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx, cy + len * 0.6)
    ctx.stroke()
    ctx.setLineDash([])

    // Label
    ctx.fillStyle = colors.textMuted
    ctx.font = '11px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('Drag the pendulum', cx, h - 10)
  }, [angle, angVel, colors])

  const handleMouseDown = useCallback(() => { dragging.current = true }, [])
  const handleMouseUp = useCallback(() => { dragging.current = false }, [])
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging.current || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - canvasRef.current.width / 2
    const y = e.clientY - rect.top - canvasRef.current.height * 0.4
    const newAngle = Math.atan2(x, y)
    setAngVel(newAngle - angle)
    setAngle(newAngle)
  }, [angle])

  return (
    <div className="bg-surface rounded-xl border border-surface-lighter p-5 my-5">
      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Interactive: Continuous State Space</h4>

      <div className="flex items-start gap-6 flex-wrap">
        <canvas
          ref={canvasRef}
          width={200}
          height={200}
          className="rounded-lg bg-surface-light cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onMouseMove={handleMouseMove}
        />

        <div className="flex-1 min-w-[200px]">
          <div className="bg-surface-light rounded-lg p-4 mb-3">
            <p className="text-xs font-bold text-text-muted mb-2">Current State (continuous):</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-surface rounded-lg p-2 text-center">
                <span className="text-xs text-text-muted block">{'\u03B8'} (angle)</span>
                <span className="text-sm font-mono font-bold text-primary-light">{angle.toFixed(4)}</span>
              </div>
              <div className="bg-surface rounded-lg p-2 text-center">
                <span className="text-xs text-text-muted block">{'\u03C9'} (ang. vel)</span>
                <span className="text-sm font-mono font-bold text-accent-yellow">{angVel.toFixed(4)}</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Notice how the state values are <strong>real numbers</strong> with many decimal places.
            Even tiny movements change the state. There are <strong>infinitely many</strong> possible
            states — no table can hold them all. This is the core challenge of continuous state spaces.
          </p>
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
                icon: '\uD83D\uDE80',
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

          <Eq tex="p(s', r \mid s, a) = \Pr\{S_{t+1} = s', R_{t+1} = r \mid S_t = s, A_t = a\}" />

          <p className="text-sm text-text leading-relaxed mb-4">
            This function tells us: given that the agent is in state <Eq tex="s" inline /> and takes
            action <Eq tex="a" inline />, what is the probability of ending up in state <Eq tex="s'" inline /> with
            reward <Eq tex="r" inline />?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-surface-light rounded-xl p-4 border border-surface-lighter">
              <h4 className="text-sm font-bold text-accent-blue mb-2">Deterministic</h4>
              <p className="text-xs text-text-muted leading-relaxed m-0">
                Given state <Eq tex="s" inline /> and action <Eq tex="a" inline />, the next state
                is always the same. No randomness. Example: moving on a grid with no wind.
              </p>
            </div>
            <div className="bg-surface-light rounded-xl p-4 border border-surface-lighter">
              <h4 className="text-sm font-bold text-accent-yellow mb-2">Stochastic</h4>
              <p className="text-xs text-text-muted leading-relaxed m-0">
                The same action in the same state can lead to different outcomes. Example: Boru's
                GridWorld where the wind can blow the agent off course.
              </p>
            </div>
          </div>

          <Callout type="insight">
            The agent usually doesn't know the transition function! It doesn't know the rules of
            the environment — it can only observe what happens. This is called <strong>model-free</strong> RL,
            and it's what most of our lab algorithms do. (Algorithms that try to learn the transition
            function are called <strong>model-based</strong>.)
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
