import { useState, useMemo } from 'react'
import { Accordion, Callout, Eq, ChapterNav } from '../../components/shared/GuidePrimitives'

/* ══════════════════════════════════════════
   Shared grid constants
   ══════════════════════════════════════════ */

const ROWS = 4
const COLS = 4
const GOAL = ROWS * COLS - 1
const CLIFF = 12
const DELTAS = [[-1, 0], [1, 0], [0, -1], [0, 1]]
const ACTION_NAMES = ['Up', 'Down', 'Left', 'Right']
const ARROWS = ['\u2191', '\u2193', '\u2190', '\u2192']

function cellIdx(r: number, c: number) { return r * COLS + c }

function step(r: number, c: number, a: number): [number, number] {
  const [dr, dc] = DELTAS[a]
  return [Math.max(0, Math.min(ROWS - 1, r + dr)), Math.max(0, Math.min(COLS - 1, c + dc))]
}

function reward(ni: number): number {
  if (ni === GOAL) return 10
  if (ni === CLIFF) return -10
  return -1
}

/* ══════════════════════════════════════════
   Interactive Widget: Bellman Expectation Step-Through
   Show how V(s) is computed from its neighbors
   ══════════════════════════════════════════ */

function BellmanExpectationWidget() {
  const gamma = 0.9

  // Compute V under random policy
  const V = useMemo(() => {
    const v = new Float64Array(ROWS * COLS)
    for (let iter = 0; iter < 200; iter++) {
      const nv = new Float64Array(ROWS * COLS)
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const i = cellIdx(r, c)
          if (i === GOAL || i === CLIFF) { nv[i] = 0; continue }
          let sum = 0
          for (let a = 0; a < 4; a++) {
            const [nr, nc] = step(r, c, a)
            const ni = cellIdx(nr, nc)
            sum += 0.25 * (reward(ni) + gamma * v[ni])
          }
          nv[i] = sum
        }
      }
      for (let i = 0; i < v.length; i++) v[i] = nv[i]
    }
    return Array.from(v)
  }, [])

  const [selected, setSelected] = useState(5) // (1,1)
  const selR = Math.floor(selected / COLS)
  const selC = selected % COLS
  const isTerminal = selected === GOAL || selected === CLIFF

  // Compute the Bellman breakdown for the selected cell
  const breakdown = useMemo(() => {
    if (isTerminal) return null
    return DELTAS.map((_, a) => {
      const [nr, nc] = step(selR, selC, a)
      const ni = cellIdx(nr, nc)
      const r = reward(ni)
      const nextV = V[ni]
      const contribution = 0.25 * (r + gamma * nextV)
      return { action: ACTION_NAMES[a], arrow: ARROWS[a], nr, nc, r, nextV, contribution }
    })
  }, [selected, V, isTerminal, selR, selC])

  return (
    <div className="bg-surface rounded-xl border border-surface-lighter p-5 my-5">
      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
        Interactive: Bellman Expectation Equation Step-by-Step
      </h4>
      <p className="text-xs text-text-muted mb-3">
        Click a cell to see how its value V(s) is computed from its neighbors.
      </p>

      <div className="flex items-start gap-6 flex-wrap">
        {/* Grid */}
        <div className="flex flex-col gap-1">
          {Array.from({ length: ROWS }, (_, r) => (
            <div key={r} className="flex gap-1">
              {Array.from({ length: COLS }, (_, c) => {
                const i = cellIdx(r, c)
                const isSel = i === selected
                return (
                  <button
                    key={c}
                    onClick={() => setSelected(i)}
                    className={`w-14 h-14 rounded-lg border-2 cursor-pointer text-xs font-mono flex flex-col items-center justify-center transition-all ${
                      isSel ? 'border-primary scale-110 bg-primary/15' :
                      i === GOAL ? 'border-accent-green/50 bg-accent-green/15' :
                      i === CLIFF ? 'border-accent-red/50 bg-accent-red/15' :
                      'border-surface-lighter bg-surface-light hover:bg-surface-lighter'
                    }`}
                  >
                    {i === GOAL ? <span className="text-accent-green font-bold">Goal</span> :
                     i === CLIFF ? <span className="text-accent-red font-bold">Cliff</span> :
                     <>
                       <span className="font-bold text-text">{V[i].toFixed(1)}</span>
                       <span className="text-[9px] text-text-muted">({r},{c})</span>
                     </>}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Breakdown */}
        <div className="flex-1 min-w-[260px]">
          {isTerminal ? (
            <div className="bg-surface-light rounded-lg p-4">
              <p className="text-xs text-text-muted m-0">Terminal state — V(s) = 0 by definition.</p>
            </div>
          ) : breakdown && (
            <>
              <div className="bg-surface-light rounded-lg p-4 mb-3">
                <p className="text-xs font-bold text-text mb-2">
                  V({selR},{selC}) = {'\u03A3'}{'\u2090'} {'\u03C0'}(a|s) [R + {'\u03B3'} V(s')]
                </p>
                <div className="flex flex-col gap-2">
                  {breakdown.map((b) => (
                    <div key={b.action} className="flex items-center gap-2 text-xs">
                      <span className="w-5 text-center text-sm">{b.arrow}</span>
                      <span className="text-text-muted w-10">{b.action}:</span>
                      <span className="font-mono text-text-muted">
                        0.25 {'\u00D7'} ({b.r} + {gamma} {'\u00D7'} {b.nextV.toFixed(2)})
                      </span>
                      <span className="font-mono text-text-muted">=</span>
                      <span className={`font-mono font-bold ${b.contribution >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                        {b.contribution >= 0 ? '+' : ''}{b.contribution.toFixed(3)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-2 border-t border-surface-lighter">
                  <span className="text-xs font-bold text-text">Total: V({selR},{selC}) = </span>
                  <span className="text-sm font-mono font-bold text-primary-light">
                    {breakdown.reduce((s, b) => s + b.contribution, 0).toFixed(3)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-text-muted">
                Each action contributes probability {'\u00D7'} (immediate reward + discounted next value).
                Under a random policy, each action has probability 0.25.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   Interactive Widget: Value Iteration Stepper
   Step through value iteration one sweep at a time
   ══════════════════════════════════════════ */

function ValueIterationWidget() {
  const gamma = 0.9
  const [sweeps, setSweeps] = useState(0)

  // Compute V* after exactly `sweeps` iterations
  const V = useMemo(() => {
    const v = new Float64Array(ROWS * COLS)
    for (let iter = 0; iter < sweeps; iter++) {
      const nv = new Float64Array(ROWS * COLS)
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const i = cellIdx(r, c)
          if (i === GOAL || i === CLIFF) { nv[i] = 0; continue }
          let best = -Infinity
          for (let a = 0; a < 4; a++) {
            const [nr, nc] = step(r, c, a)
            const ni = cellIdx(nr, nc)
            const q = reward(ni) + gamma * v[ni]
            if (q > best) best = q
          }
          nv[i] = best
        }
      }
      for (let i = 0; i < v.length; i++) v[i] = nv[i]
    }
    return Array.from(v)
  }, [sweeps])

  // Derive greedy policy
  const policy = useMemo(() => {
    return Array.from({ length: ROWS * COLS }, (_, i) => {
      if (i === GOAL || i === CLIFF) return -1
      const r = Math.floor(i / COLS)
      const c = i % COLS
      let best = -Infinity
      let bestA = 0
      for (let a = 0; a < 4; a++) {
        const [nr, nc] = step(r, c, a)
        const ni = cellIdx(nr, nc)
        const q = reward(ni) + gamma * V[ni]
        if (q > best) { best = q; bestA = a }
      }
      return bestA
    })
  }, [V])

  const maxAbs = Math.max(...V.map(Math.abs), 0.01)

  return (
    <div className="bg-surface rounded-xl border border-surface-lighter p-5 my-5">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">
          Interactive: Value Iteration — Watch V* Converge
        </h4>
      </div>
      <p className="text-xs text-text-muted mb-3">
        Each sweep applies the Bellman optimality equation to every state. Watch values propagate from the goal outward.
      </p>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setSweeps(0)}
          className="px-3 py-1.5 rounded-lg bg-accent-red/20 text-accent-red text-xs font-medium border-0 cursor-pointer hover:bg-accent-red/30 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={() => setSweeps((s) => s + 1)}
          className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary-light text-xs font-medium border-0 cursor-pointer hover:bg-primary/30 transition-colors"
        >
          +1 Sweep
        </button>
        <button
          onClick={() => setSweeps((s) => s + 5)}
          className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary-light text-xs font-medium border-0 cursor-pointer hover:bg-primary/30 transition-colors"
        >
          +5 Sweeps
        </button>
        <button
          onClick={() => setSweeps(50)}
          className="px-3 py-1.5 rounded-lg bg-accent-green/20 text-accent-green text-xs font-medium border-0 cursor-pointer hover:bg-accent-green/30 transition-colors"
        >
          Converge (50)
        </button>
        <span className="text-xs font-mono text-text-muted ml-auto">Sweep: {sweeps}</span>
      </div>

      {/* Grid with values and arrows */}
      <div className="flex flex-col gap-1 mb-3">
        {Array.from({ length: ROWS }, (_, r) => (
          <div key={r} className="flex gap-1">
            {Array.from({ length: COLS }, (_, c) => {
              const i = cellIdx(r, c)
              const v = V[i]
              const isGoal = i === GOAL
              const isCliffCell = i === CLIFF
              const norm = maxAbs > 0 ? v / maxAbs : 0
              return (
                <div
                  key={c}
                  className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center transition-all border ${
                    isGoal ? 'border-accent-green bg-accent-green/20' :
                    isCliffCell ? 'border-accent-red bg-accent-red/20' :
                    'border-surface-lighter'
                  }`}
                  style={{
                    backgroundColor: isGoal || isCliffCell ? undefined :
                      v >= 0
                        ? `rgba(34, 197, 94, ${Math.min(norm * 0.4, 0.4)})`
                        : `rgba(239, 68, 68, ${Math.min(Math.abs(norm) * 0.4, 0.4)})`
                  }}
                >
                  {isGoal ? <span className="text-xs font-bold text-accent-green">Goal</span> :
                   isCliffCell ? <span className="text-xs font-bold text-accent-red">Cliff</span> :
                   <>
                     {sweeps > 0 && policy[i] >= 0 && (
                       <span className="text-sm text-primary-light">{ARROWS[policy[i]]}</span>
                     )}
                     <span className="text-[10px] font-mono text-text">{v.toFixed(1)}</span>
                   </>}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 text-xs text-text-muted">
        <span>{'\u03B3'} = {gamma}</span>
        <span>Arrows = greedy policy from current V</span>
        {sweeps === 0 && <span className="text-accent-yellow">All values start at 0. Click "+1 Sweep" to begin.</span>}
        {sweeps >= 50 && <span className="text-accent-green font-bold">Converged!</span>}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   MAIN PAGE: Chapter 7
   ══════════════════════════════════════════ */

export function BellmanEquationsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="mb-10 text-center">
        <div className="flex justify-center gap-3 mb-4">
          <a href="#/learn" className="text-sm text-primary-light hover:underline no-underline">
            &larr; All Chapters
          </a>
        </div>
        <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Chapter 7</p>
        <h1 className="text-4xl font-bold text-text mb-3">
          Bellman Equations
        </h1>
        <p className="text-lg text-text-muted max-w-2xl mx-auto">
          The recursive relationships that connect the value of a state to the values of its successors.
          The mathematical engine behind every RL algorithm.
        </p>
        <div className="flex justify-center gap-3 mt-4 text-xs text-text-muted">
          <span className="bg-surface-light px-3 py-1 rounded-full">7 sections</span>
          <span className="bg-surface-light px-3 py-1 rounded-full">Step-by-step breakdown</span>
          <span className="bg-surface-light px-3 py-1 rounded-full">Value iteration demo</span>
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-4">

        {/* ── SECTION 1 ── */}
        <Accordion number={1} title="The Key Insight: Recursion" defaultOpen>
          <p className="text-sm text-text leading-relaxed mb-4">
            In Chapter 3, we discovered that returns are recursive:
          </p>
          <Eq tex="G_t = R_{t+1} + \gamma G_{t+1}" />

          <p className="text-sm text-text leading-relaxed mb-4">
            Since value functions are defined as <em>expected</em> returns, they inherit this recursive
            structure. The value of a state can be expressed in terms of the values of its successor states.
            This is the <strong>Bellman equation</strong> — the most important equation in RL.
          </p>

          <div className="bg-surface rounded-lg p-4 my-4 border-l-4 border-primary">
            <p className="text-sm text-text leading-relaxed mb-0">
              <strong>The Bellman insight:</strong> "The value of where I am equals the immediate reward I expect
              plus the discounted value of where I'll end up." This lets us compute values without
              simulating entire trajectories — we just need to look one step ahead.
            </p>
          </div>

          <Callout type="insight">
            This is what makes RL computationally tractable. Instead of estimating the value of a
            state by averaging over infinitely long trajectories, we express it as a simple
            relationship with neighboring states. Solve these relationships, and you have
            the value function.
          </Callout>
        </Accordion>

        {/* ── SECTION 2 ── */}
        <Accordion number={2} title={"Bellman Expectation Equation for V\u03C0"}>
          <p className="text-sm text-text leading-relaxed mb-4">
            For a given policy <Eq tex="\pi" inline />, the <strong>Bellman expectation equation</strong> for
            the state value function is:
          </p>

          <Eq tex="v_\pi(s) = \sum_{a} \pi(a|s) \sum_{s', r} p(s', r | s, a) \left[ r + \gamma \, v_\pi(s') \right]" />

          <p className="text-sm text-text leading-relaxed mb-2">
            <strong>Reading the equation left to right:</strong>
          </p>

          <div className="bg-surface rounded-lg p-4 my-3 text-sm text-text-muted leading-relaxed">
            <p className="mb-2">
              <strong className="text-text">v{'\u03C0'}(s)</strong> = the value of state s under policy {'\u03C0'}
            </p>
            <p className="mb-2">
              <strong className="text-accent-blue">{'\u03A3'}{'\u2090'} {'\u03C0'}(a|s)</strong> = for each action, weighted by how likely the policy is to choose it
            </p>
            <p className="mb-2">
              <strong className="text-accent-yellow">{'\u03A3'}s',r p(s',r|s,a)</strong> = for each possible outcome, weighted by the transition probability
            </p>
            <p className="mb-0">
              <strong className="text-accent-green">[r + {'\u03B3'} v{'\u03C0'}(s')]</strong> = immediate reward + discounted value of the next state
            </p>
          </div>

          <p className="text-sm text-text leading-relaxed mb-4">
            In words: "My value equals the average of (reward + discounted next value), averaged over
            my policy's action choices and the environment's transition randomness."
          </p>

          <BellmanExpectationWidget />

          <Callout type="think">
            Notice the circularity: V(s) is defined in terms of V(s'). How can we compute something
            that depends on itself? There are two approaches: (1) solve the system of linear equations
            directly (works for small state spaces), or (2) iterate: start with V=0 everywhere and
            repeatedly apply the equation until values converge. Approach (2) is called
            <strong> iterative policy evaluation</strong>.
          </Callout>
        </Accordion>

        {/* ── SECTION 3 ── */}
        <Accordion number={3} title={"Bellman Expectation Equation for Q\u03C0"}>
          <p className="text-sm text-text leading-relaxed mb-4">
            There's an analogous equation for the action value function:
          </p>

          <Eq tex="q_\pi(s, a) = \sum_{s', r} p(s', r | s, a) \left[ r + \gamma \sum_{a'} \pi(a'|s') \, q_\pi(s', a') \right]" />

          <p className="text-sm text-text leading-relaxed mb-4">
            "The Q-value of (s, a) equals the expected reward + discounted expected Q-value at the
            next state, where the next action is chosen by the policy."
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-blue mb-2">V{'\u03C0'} Bellman</h4>
              <p className="text-xs text-text-muted mb-1">Average over actions first, then transitions:</p>
              <Eq tex="v_\pi(s) = \sum_a \pi(a|s) \, q_\pi(s,a)" />
              <p className="text-xs text-text-muted m-0">V is the policy-weighted average of Q.</p>
            </div>
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-green mb-2">Q{'\u03C0'} Bellman</h4>
              <p className="text-xs text-text-muted mb-1">Transition first, then average over next actions:</p>
              <Eq tex="q_\pi(s,a) = \sum_{s'} p(s'|s,a)[r + \gamma \, v_\pi(s')]" />
              <p className="text-xs text-text-muted m-0">Q looks one step ahead through the environment.</p>
            </div>
          </div>

          <Callout type="insight">
            These two forms are interchangeable — you can go back and forth between V and Q.
            V averages Q over actions; Q expands V through transitions. Together they form a
            complete picture of value under a given policy.
          </Callout>
        </Accordion>

        {/* ── SECTION 4 ── */}
        <Accordion number={4} title="Bellman Optimality Equations">
          <p className="text-sm text-text leading-relaxed mb-4">
            The Bellman <em>expectation</em> equations evaluate a fixed policy. The Bellman
            <em> optimality</em> equations find the <strong>best</strong> policy. The key difference:
            instead of averaging over the policy's action distribution, we take the <strong>max</strong>.
          </p>

          <div className="bg-surface-light rounded-xl p-4 mb-4 border border-surface-lighter">
            <h4 className="text-sm font-bold text-primary-light mb-2">Bellman Optimality for V*</h4>
            <Eq tex="v_*(s) = \max_a \sum_{s', r} p(s', r | s, a) \left[ r + \gamma \, v_*(s') \right]" />
            <p className="text-xs text-text-muted m-0">
              "The optimal value of s is the maximum over all actions of (reward + discounted optimal next value)."
            </p>
          </div>

          <div className="bg-surface-light rounded-xl p-4 mb-4 border border-surface-lighter">
            <h4 className="text-sm font-bold text-primary-light mb-2">Bellman Optimality for Q*</h4>
            <Eq tex="q_*(s, a) = \sum_{s', r} p(s', r | s, a) \left[ r + \gamma \max_{a'} q_*(s', a') \right]" />
            <p className="text-xs text-text-muted m-0">
              "The optimal Q-value of (s, a) is the expected reward + discounted max Q-value at the next state."
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-accent-yellow/10 border border-accent-yellow/30 rounded-xl p-4">
              <h4 className="text-xs font-bold text-accent-yellow mb-1">Expectation Equations</h4>
              <p className="text-xs text-text-muted mb-1">Use: <strong>{'\u03A3'}{'\u2090'} {'\u03C0'}(a|s)</strong></p>
              <p className="text-xs text-text-muted m-0">
                Average over the policy. Evaluates a <em>given</em> policy.
              </p>
            </div>
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-4">
              <h4 className="text-xs font-bold text-accent-green mb-1">Optimality Equations</h4>
              <p className="text-xs text-text-muted mb-1">Use: <strong>max{'\u2090'}</strong></p>
              <p className="text-xs text-text-muted m-0">
                Take the best action. Finds the <em>optimal</em> policy.
              </p>
            </div>
          </div>

          <Callout type="insight">
            The only difference between the expectation and optimality equations is
            <strong> {'\u03A3'} {'\u03C0'}(a|s)</strong> vs <strong>max{'\u2090'}</strong>. Replace the
            policy-weighted average with a maximum, and you go from evaluating a policy to finding
            the optimal one. This simple change is the foundation of algorithms like Value Iteration
            and Q-Learning.
          </Callout>
        </Accordion>

        {/* ── SECTION 5 ── */}
        <Accordion number={5} title="Value Iteration: Solving the Bellman Optimality Equation">
          <p className="text-sm text-text leading-relaxed mb-4">
            <strong>Value Iteration</strong> is the simplest algorithm that uses the Bellman optimality
            equation. The idea: start with all values at 0, then repeatedly apply the equation until
            values converge.
          </p>

          <div className="bg-surface rounded-lg p-4 my-3 text-sm text-text leading-relaxed">
            <p className="mb-1"><strong>Algorithm: Value Iteration</strong></p>
            <p className="mb-1">1. Initialize V(s) = 0 for all states</p>
            <p className="mb-1">2. For each sweep:</p>
            <p className="mb-1 ml-4">For each state s:</p>
            <Eq tex="V(s) \leftarrow \max_a \sum_{s'} p(s'|s,a) [r(s,a,s') + \gamma V(s')]" />
            <p className="mb-0">3. Repeat until values stop changing (convergence)</p>
          </div>

          <ValueIterationWidget />

          <Callout type="try" title="Observe the Pattern">
            Click "+1 Sweep" slowly and watch the values propagate. In sweep 1, only cells adjacent
            to the goal get positive values (they can reach the goal in one step). In sweep 2, cells
            two steps away update. The values radiate outward from the goal like ripples in a pond.
            This is the Bellman equation at work — each sweep propagates value information one step further.
          </Callout>
        </Accordion>

        {/* ── SECTION 6 ── */}
        <Accordion number={6} title="From Bellman to Algorithms">
          <p className="text-sm text-text leading-relaxed mb-4">
            The Bellman equations are the theoretical foundation. Each RL algorithm is a different
            strategy for solving (or approximating) them:
          </p>

          <div className="flex flex-col gap-3 mb-4">
            {[
              {
                name: 'Value Iteration',
                bellman: 'Optimality (V*)',
                approach: 'Sweep through all states, apply max. Requires known transitions (model-based).',
                lab: 'GridWorld',
                color: 'accent-blue',
              },
              {
                name: 'Policy Iteration',
                bellman: 'Expectation (V\u03C0) + Improvement',
                approach: 'Alternate: evaluate current policy (solve V\u03C0), then improve by acting greedily. Also model-based.',
                lab: 'GridWorld',
                color: 'accent-green',
              },
              {
                name: 'Q-Learning',
                bellman: 'Optimality (Q*), sampled',
                approach: 'Don\'t need the model! Approximate the max using sampled transitions. One (s,a,r,s\') at a time.',
                lab: 'GridWorld, CartPole, Rocket',
                color: 'accent-yellow',
              },
              {
                name: 'SARSA',
                bellman: 'Expectation (Q\u03C0), sampled',
                approach: 'Like Q-Learning but follows the current policy\'s action (not the max). On-policy learning.',
                lab: 'GridWorld',
                color: 'primary-light',
              },
              {
                name: 'REINFORCE',
                bellman: 'Implicit (via returns)',
                approach: 'Doesn\'t use Bellman equations directly. Instead, estimates returns from complete episodes and adjusts the policy.',
                lab: 'CartPole, Rocket',
                color: 'accent-red',
              },
            ].map(({ name, bellman, approach, lab, color }) => (
              <div key={name} className="bg-surface-light rounded-xl p-4 border border-surface-lighter">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-bold text-${color}`}>{name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-lighter text-text-muted ml-auto">{bellman}</span>
                </div>
                <p className="text-xs text-text-muted mb-1">{approach}</p>
                <p className="text-xs text-primary-light m-0">Lab: {lab}</p>
              </div>
            ))}
          </div>

          <Callout type="insight">
            <strong>Q-Learning is the Bellman optimality equation for Q*, but sampled.</strong> Instead
            of summing over all possible next states (which requires knowing p), it uses the actual
            transition it observed. The update <Eq tex="Q(s,a) \leftarrow Q(s,a) + \alpha[r + \gamma \max_{a'} Q(s',a') - Q(s,a)]" inline /> is
            just a stochastic approximation of the Bellman optimality equation for Q*.
          </Callout>
        </Accordion>

        {/* ── SECTION 7 ── */}
        <Accordion number={7} title="Summary: The Bellman Foundation">
          <p className="text-sm text-text leading-relaxed mb-4">
            The Bellman equations are the mathematical backbone of RL. Here's what we covered:
          </p>

          <div className="bg-surface rounded-lg p-4 my-3 text-sm text-text leading-relaxed">
            <p className="mb-2">1. <strong>Bellman Expectation (V{'\u03C0'}):</strong> v{'\u03C0'}(s) = {'\u03A3'}{'\u2090'} {'\u03C0'}(a|s) {'\u03A3'}s' p(s'|s,a)[r + {'\u03B3'}v{'\u03C0'}(s')]</p>
            <p className="mb-2">2. <strong>Bellman Expectation (Q{'\u03C0'}):</strong> q{'\u03C0'}(s,a) = {'\u03A3'}s' p(s'|s,a)[r + {'\u03B3'} {'\u03A3'}a' {'\u03C0'}(a'|s') q{'\u03C0'}(s',a')]</p>
            <p className="mb-2">3. <strong>Bellman Optimality (V*):</strong> v*(s) = max{'\u2090'} {'\u03A3'}s' p(s'|s,a)[r + {'\u03B3'}v*(s')]</p>
            <p className="mb-0">4. <strong>Bellman Optimality (Q*):</strong> q*(s,a) = {'\u03A3'}s' p(s'|s,a)[r + {'\u03B3'} max{'\u2090'}\u2032 q*(s',a')]</p>
          </div>

          <p className="text-sm text-text leading-relaxed mb-4">
            With the Bellman equations, the foundation chapters (1-7) are complete. You now have the full
            mathematical framework. The remaining chapters cover the <strong>algorithms</strong> that put
            this theory into practice.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 mb-4">
            {[
              { label: 'Ch 8', topic: 'Explore/Exploit', dest: '/learn/exploration-exploitation' },
              { label: 'Ch 9', topic: 'TD Learning', dest: '/learn/td-learning' },
              { label: 'Ch 10', topic: 'Policy Gradients', dest: '/learn/policy-gradients' },
            ].map(({ label, topic }) => (
              <div key={label} className="bg-primary/10 rounded-lg p-2 text-center border border-primary/20">
                <span className="text-[10px] text-text-muted block">{label}</span>
                <span className="text-xs font-bold text-primary-light">{topic}</span>
                <span className="text-[10px] text-text-muted block">Coming next</span>
              </div>
            ))}
          </div>

          <Callout type="try" title="See Bellman in Action">
            In the <a href="#/gridworld" className="text-primary-light hover:underline">GridWorld lab</a>, run
            <strong> Value Iteration</strong> or <strong>Policy Iteration</strong> and watch the Bellman
            equations update the value map in real time. Then switch to <strong>Q-Learning</strong> and
            see the sampled version learning the same values through experience.
          </Callout>
        </Accordion>
      </div>

      {/* Chapter navigation */}
      <ChapterNav
        prev={{ path: '/learn/value-functions', label: 'Ch 6: Value Functions' }}
        next={{ path: '/learn/exploration-exploitation', label: 'Ch 8: Exploration vs Exploitation' }}
      />
    </div>
  )
}
