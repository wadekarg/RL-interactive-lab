import { useState, useMemo } from 'react'
import { Accordion, Callout, Eq, ChapterNav } from '../../components/shared/GuidePrimitives'

/* ══════════════════════════════════════════
   Interactive Widget: State Value Heatmap
   A grid where you can set a policy and see V(s) computed
   ══════════════════════════════════════════ */

const GRID_R = 4
const GRID_C = 4
const GOAL = GRID_R * GRID_C - 1
const CLIFF = 12 // bottom-left corner is a cliff

function idx(r: number, c: number) { return r * GRID_C + c }

function StateValueWidget() {
  const gamma = 0.9
  const stepReward = -1
  const goalReward = 10
  const cliffReward = -10

  // Simple random policy: equal probability for all 4 actions
  // Compute V(s) via iterative policy evaluation
  const values = useMemo(() => {
    const V = new Float64Array(GRID_R * GRID_C)
    const actions = [[-1, 0], [1, 0], [0, -1], [0, 1]] // up down left right

    for (let iter = 0; iter < 200; iter++) {
      const newV = new Float64Array(GRID_R * GRID_C)
      for (let r = 0; r < GRID_R; r++) {
        for (let c = 0; c < GRID_C; c++) {
          const i = idx(r, c)
          if (i === GOAL || i === CLIFF) { newV[i] = 0; continue }
          let sum = 0
          for (const [dr, dc] of actions) {
            const nr = Math.max(0, Math.min(GRID_R - 1, r + dr))
            const nc = Math.max(0, Math.min(GRID_C - 1, c + dc))
            const ni = idx(nr, nc)
            const reward = ni === GOAL ? goalReward : ni === CLIFF ? cliffReward : stepReward
            sum += 0.25 * (reward + gamma * V[ni])
          }
          newV[i] = sum
        }
      }
      for (let i = 0; i < V.length; i++) V[i] = newV[i]
    }
    return Array.from(V)
  }, [])

  const maxV = Math.max(...values)
  const minV = Math.min(...values)
  const range = maxV - minV || 1

  return (
    <div className="bg-surface rounded-xl border border-surface-lighter p-5 my-5">
      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
        Interactive: State Values V(s) under Random Policy
      </h4>
      <p className="text-xs text-text-muted mb-3">
        Each cell shows how much total reward the agent expects if it starts there and acts randomly.
        Brighter = higher value. Goal (+10) is bottom-right, cliff (-10) is bottom-left.
      </p>

      <div className="flex flex-col gap-1 mb-3">
        {Array.from({ length: GRID_R }, (_, r) => (
          <div key={r} className="flex gap-1">
            {Array.from({ length: GRID_C }, (_, c) => {
              const i = idx(r, c)
              const v = values[i]
              const isGoal = i === GOAL
              const isCliff = i === CLIFF
              const norm = (v - minV) / range
              return (
                <div
                  key={c}
                  className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center transition-all border ${
                    isGoal ? 'border-accent-green bg-accent-green/25' :
                    isCliff ? 'border-accent-red bg-accent-red/25' :
                    'border-surface-lighter bg-surface-light'
                  }`}
                  style={{
                    backgroundColor: isGoal || isCliff ? undefined :
                      v >= 0
                        ? `rgba(34, 197, 94, ${norm * 0.35})`
                        : `rgba(239, 68, 68, ${(1 - norm) * 0.35})`
                  }}
                >
                  {isGoal ? (
                    <span className="text-xs font-bold text-accent-green">Goal</span>
                  ) : isCliff ? (
                    <span className="text-xs font-bold text-accent-red">Cliff</span>
                  ) : (
                    <>
                      <span className="text-xs font-mono font-bold text-text">{v.toFixed(1)}</span>
                      <span className="text-[9px] text-text-muted">({r},{c})</span>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 text-xs text-text-muted">
        <span>{'\u03B3'} = {gamma}</span>
        <span>Step reward = {stepReward}</span>
        <span>Policy = random (25% each direction)</span>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   Interactive Widget: Q-Value Table Explorer
   Shows Q(s,a) for a small grid and lets you derive the greedy policy
   ══════════════════════════════════════════ */

function QValueWidget() {
  const gamma = 0.9
  const stepReward = -1
  const goalReward = 10
  const cliffReward = -10
  const actionNames = ['Up', 'Down', 'Left', 'Right']
  const arrows = ['\u2191', '\u2193', '\u2190', '\u2192']
  const deltas = [[-1, 0], [1, 0], [0, -1], [0, 1]]

  const [selectedCell, setSelectedCell] = useState(0)

  // First compute V* via value iteration, then derive Q*
  const { V, Q } = useMemo(() => {
    const V = new Float64Array(GRID_R * GRID_C)
    for (let iter = 0; iter < 200; iter++) {
      const newV = new Float64Array(GRID_R * GRID_C)
      for (let r = 0; r < GRID_R; r++) {
        for (let c = 0; c < GRID_C; c++) {
          const i = idx(r, c)
          if (i === GOAL || i === CLIFF) { newV[i] = 0; continue }
          let best = -Infinity
          for (const [dr, dc] of deltas) {
            const nr = Math.max(0, Math.min(GRID_R - 1, r + dr))
            const nc = Math.max(0, Math.min(GRID_C - 1, c + dc))
            const ni = idx(nr, nc)
            const reward = ni === GOAL ? goalReward : ni === CLIFF ? cliffReward : stepReward
            const q = reward + gamma * V[ni]
            if (q > best) best = q
          }
          newV[i] = best
        }
      }
      for (let i = 0; i < V.length; i++) V[i] = newV[i]
    }

    // Compute Q(s,a) for all states and actions
    const Q: number[][] = []
    for (let r = 0; r < GRID_R; r++) {
      for (let c = 0; c < GRID_C; c++) {
        const i = idx(r, c)
        const qvals: number[] = []
        if (i === GOAL || i === CLIFF) {
          qvals.push(0, 0, 0, 0)
        } else {
          for (const [dr, dc] of deltas) {
            const nr = Math.max(0, Math.min(GRID_R - 1, r + dr))
            const nc = Math.max(0, Math.min(GRID_C - 1, c + dc))
            const ni = idx(nr, nc)
            const reward = ni === GOAL ? goalReward : ni === CLIFF ? cliffReward : stepReward
            qvals.push(reward + gamma * V[ni])
          }
        }
        Q.push(qvals)
      }
    }
    return { V: Array.from(V), Q }
  }, [])

  const selR = Math.floor(selectedCell / GRID_C)
  const selC = selectedCell % GRID_C
  const isTerminal = selectedCell === GOAL || selectedCell === CLIFF
  const bestAction = isTerminal ? -1 : Q[selectedCell].indexOf(Math.max(...Q[selectedCell]))

  return (
    <div className="bg-surface rounded-xl border border-surface-lighter p-5 my-5">
      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
        Interactive: Q-Values Q*(s, a) — Optimal Action Values
      </h4>
      <p className="text-xs text-text-muted mb-3">
        Click a cell to see Q*(s, a) for all 4 actions. The best action (highest Q) defines the optimal policy.
      </p>

      <div className="flex items-start gap-6 flex-wrap">
        {/* Grid with greedy arrows */}
        <div className="flex flex-col gap-1">
          {Array.from({ length: GRID_R }, (_, r) => (
            <div key={r} className="flex gap-1">
              {Array.from({ length: GRID_C }, (_, c) => {
                const i = idx(r, c)
                const isGoal = i === GOAL
                const isCliffCell = i === CLIFF
                const isSelected = i === selectedCell
                const best = isGoal || isCliffCell ? -1 : Q[i].indexOf(Math.max(...Q[i]))
                return (
                  <button
                    key={c}
                    onClick={() => setSelectedCell(i)}
                    className={`w-14 h-14 rounded-lg border-2 cursor-pointer text-lg font-bold transition-all flex flex-col items-center justify-center ${
                      isSelected ? 'border-primary scale-110 bg-primary/15' :
                      isGoal ? 'border-accent-green/50 bg-accent-green/15' :
                      isCliffCell ? 'border-accent-red/50 bg-accent-red/15' :
                      'border-surface-lighter bg-surface-light hover:bg-surface-lighter'
                    }`}
                  >
                    {isGoal ? (
                      <span className="text-xs text-accent-green">Goal</span>
                    ) : isCliffCell ? (
                      <span className="text-xs text-accent-red">Cliff</span>
                    ) : (
                      <>
                        <span className="text-primary-light">{arrows[best]}</span>
                        <span className="text-[9px] font-normal text-text-muted">{V[i].toFixed(1)}</span>
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Q-value detail panel */}
        <div className="flex-1 min-w-[220px]">
          <div className="bg-surface-light rounded-lg p-4 mb-3">
            <p className="text-xs font-bold text-text-muted mb-1">
              State ({selR}, {selC}) — V* = <span className="text-primary-light font-mono">{V[selectedCell].toFixed(2)}</span>
            </p>
            {isTerminal ? (
              <p className="text-xs text-text-muted m-0">Terminal state — no actions available.</p>
            ) : (
              <div className="flex flex-col gap-2 mt-2">
                {actionNames.map((name, a) => {
                  const isBest = a === bestAction
                  return (
                    <div
                      key={a}
                      className={`flex items-center gap-2 rounded-lg p-2 transition-colors ${
                        isBest ? 'bg-accent-green/10 border border-accent-green/30' : 'bg-surface'
                      }`}
                    >
                      <span className="text-sm w-5 text-center">{arrows[a]}</span>
                      <span className="text-xs font-bold text-text flex-1">{name}</span>
                      <span className={`text-xs font-mono ${isBest ? 'text-accent-green font-bold' : 'text-text-muted'}`}>
                        {Q[selectedCell][a].toFixed(2)}
                      </span>
                      {isBest && (
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-accent-green/20 text-accent-green">
                          Best
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="bg-surface-light rounded-lg p-3">
            <p className="text-xs text-text-muted m-0">
              <strong>Greedy policy:</strong> {'\u03C0'}*(s) = argmax{'\u2090'} Q*(s, a).
              The arrow in each cell shows the action with the highest Q-value.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   Interactive Widget: V vs Q Comparison
   ══════════════════════════════════════════ */

function VvsQWidget() {
  const [tab, setTab] = useState<'v' | 'q'>('v')

  return (
    <div className="bg-surface rounded-xl border border-surface-lighter p-5 my-5">
      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Compare: V(s) vs Q(s,a)</h4>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab('v')}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border-0 cursor-pointer transition-colors ${
            tab === 'v' ? 'bg-accent-blue/20 text-accent-blue' : 'bg-surface-light text-text-muted hover:text-text'
          }`}
        >
          V(s) — State Value
        </button>
        <button
          onClick={() => setTab('q')}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border-0 cursor-pointer transition-colors ${
            tab === 'q' ? 'bg-accent-green/20 text-accent-green' : 'bg-surface-light text-text-muted hover:text-text'
          }`}
        >
          Q(s,a) — Action Value
        </button>
      </div>

      {tab === 'v' ? (
        <div className="bg-accent-blue/5 border border-accent-blue/20 rounded-xl p-4">
          <h4 className="text-sm font-bold text-accent-blue mb-2">State Value Function V{'\u03C0'}(s)</h4>
          <p className="text-xs text-text leading-relaxed mb-3">
            "How much total reward can I expect if I <strong>start in state s</strong> and follow policy {'\u03C0'}?"
          </p>
          <Eq tex="v_\pi(s) = \mathbb{E}_\pi[G_t \mid S_t = s]" />
          <div className="bg-surface rounded-lg p-3 mt-3">
            <p className="text-xs text-text-muted mb-1"><strong>Input:</strong> One state s</p>
            <p className="text-xs text-text-muted mb-1"><strong>Output:</strong> One number (expected return)</p>
            <p className="text-xs text-text-muted mb-1"><strong>Size:</strong> |S| values — one per state</p>
            <p className="text-xs text-text-muted mb-0"><strong>Use:</strong> Evaluate how good a state is. "Is it better to be at (2,3) or (1,4)?"</p>
          </div>
        </div>
      ) : (
        <div className="bg-accent-green/5 border border-accent-green/20 rounded-xl p-4">
          <h4 className="text-sm font-bold text-accent-green mb-2">Action Value Function Q{'\u03C0'}(s, a)</h4>
          <p className="text-xs text-text leading-relaxed mb-3">
            "How much total reward can I expect if I <strong>start in state s, take action a</strong>, and then follow policy {'\u03C0'}?"
          </p>
          <Eq tex="q_\pi(s, a) = \mathbb{E}_\pi[G_t \mid S_t = s, A_t = a]" />
          <div className="bg-surface rounded-lg p-3 mt-3">
            <p className="text-xs text-text-muted mb-1"><strong>Input:</strong> A state s AND an action a</p>
            <p className="text-xs text-text-muted mb-1"><strong>Output:</strong> One number (expected return)</p>
            <p className="text-xs text-text-muted mb-1"><strong>Size:</strong> |S| {'\u00D7'} |A| values — one per state-action pair</p>
            <p className="text-xs text-text-muted mb-0"><strong>Use:</strong> Compare actions directly. "In state (2,3), is going Up or Right better?"</p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   MAIN PAGE: Chapter 6
   ══════════════════════════════════════════ */

export function ValueFunctionsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="mb-10 text-center">
        <div className="flex justify-center gap-3 mb-4">
          <a href="#/learn" className="text-sm text-primary-light hover:underline no-underline">
            &larr; All Chapters
          </a>
        </div>
        <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Chapter 6</p>
        <h1 className="text-4xl font-bold text-text mb-3">
          Value Functions
        </h1>
        <p className="text-lg text-text-muted max-w-2xl mx-auto">
          How good is a state? How good is an action? Value functions answer these questions —
          they're the tool that makes policy optimization possible.
        </p>
        <div className="flex justify-center gap-3 mt-4 text-xs text-text-muted">
          <span className="bg-surface-light px-3 py-1 rounded-full">7 sections</span>
          <span className="bg-surface-light px-3 py-1 rounded-full">Value heatmap</span>
          <span className="bg-surface-light px-3 py-1 rounded-full">Q-value explorer</span>
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-4">

        {/* ── SECTION 1 ── */}
        <Accordion number={1} title="The Central Question" defaultOpen>
          <p className="text-sm text-text leading-relaxed mb-4">
            We know the agent wants to maximize its return. We know policies map states to actions.
            But how do we know if a policy is <em>good</em>? How do we compare two policies?
          </p>

          <p className="text-sm text-text leading-relaxed mb-4">
            We need a way to assign a <strong>score</strong> to each state (or state-action pair) that
            tells us: "if the agent is here and follows this policy, how much reward should it expect?"
            That score is the <strong>value function</strong>.
          </p>

          <div className="bg-surface rounded-lg p-4 my-4 border-l-4 border-primary">
            <p className="text-sm text-text leading-relaxed mb-0">
              A value function tells us the <strong>expected return</strong> from a state (or state-action pair)
              under a given policy. It converts the uncertain future into a single number we can reason about.
            </p>
          </div>

          <Callout type="insight">
            Value functions are the bridge between policies and optimization. Without them, we'd have
            no way to evaluate whether one strategy is better than another — except by running both
            for thousands of episodes and comparing totals. Value functions give us this information
            <em>at every state</em>, enabling much smarter learning.
          </Callout>
        </Accordion>

        {/* ── SECTION 2 ── */}
        <Accordion number={2} title={"State Value Function V\u03C0(s)"}>
          <p className="text-sm text-text leading-relaxed mb-4">
            The <strong>state value function</strong> answers: "How much total reward do I expect
            if I start in state <Eq tex="s" inline /> and follow policy <Eq tex="\pi" inline /> from now on?"
          </p>

          <Eq tex="v_\pi(s) \doteq \mathbb{E}_\pi[G_t \mid S_t = s] = \mathbb{E}_\pi\left[\sum_{k=0}^{\infty} \gamma^k R_{t+k+1} \;\middle|\; S_t = s\right]" />

          <p className="text-sm text-text leading-relaxed mb-4">
            The <Eq tex="\doteq" inline /> means "is defined as" and the subscript <Eq tex="\pi" inline /> on
            the expectation means "assuming we follow policy <Eq tex="\pi" inline /> to select actions."
          </p>

          <p className="text-sm text-text leading-relaxed mb-2">
            <strong>Key properties:</strong>
          </p>
          <ul className="text-sm text-text-muted space-y-1 mb-4">
            <li className="flex items-start gap-2"><span className="text-primary-light">-</span>V depends on the policy — different policies give different values to the same state</li>
            <li className="flex items-start gap-2"><span className="text-primary-light">-</span>Terminal states always have value 0 (no future rewards)</li>
            <li className="flex items-start gap-2"><span className="text-primary-light">-</span>Higher V means the agent expects more future reward from that state</li>
          </ul>

          <StateValueWidget />

          <Callout type="think">
            Notice how cells close to the goal have higher values (more future reward expected) and
            cells close to the cliff have lower or negative values. Even under a random policy, the
            value function captures the "landscape" of the problem — where it's good to be vs
            where it's dangerous.
          </Callout>
        </Accordion>

        {/* ── SECTION 3 ── */}
        <Accordion number={3} title={"Action Value Function Q\u03C0(s, a)"}>
          <p className="text-sm text-text leading-relaxed mb-4">
            The <strong>action value function</strong> (or <strong>Q-function</strong>) is more specific:
            "How much total reward do I expect if I start in state <Eq tex="s" inline />,
            take action <Eq tex="a" inline />, and <em>then</em> follow policy <Eq tex="\pi" inline />?"
          </p>

          <Eq tex="q_\pi(s, a) \doteq \mathbb{E}_\pi[G_t \mid S_t = s, A_t = a]" />

          <p className="text-sm text-text leading-relaxed mb-4">
            The Q-function gives us one crucial advantage over V: it lets us compare actions directly,
            without needing to know the environment's transition function.
          </p>

          <VvsQWidget />

          <div className="bg-surface rounded-lg p-4 my-4">
            <p className="text-sm text-text leading-relaxed mb-2">
              <strong>The relationship between V and Q:</strong>
            </p>
            <p className="text-sm text-text leading-relaxed mb-2">
              The state value is the expected Q-value over the policy's action distribution:
            </p>
            <Eq tex="v_\pi(s) = \sum_{a} \pi(a \mid s) \, q_\pi(s, a)" />
            <p className="text-xs text-text-muted mb-0">
              If the policy is deterministic (<Eq tex="\pi(s) = a^*" inline />), then <Eq tex="v_\pi(s) = q_\pi(s, a^*)" inline />.
            </p>
          </div>

          <Callout type="insight">
            <strong>Q-values are the workhorse of RL.</strong> If you know <Eq tex="Q_*(s,a)" inline /> for
            every state-action pair, you immediately have the optimal policy: just pick
            <Eq tex="\arg\max_a Q_*(s,a)" inline /> in every state. This is exactly what Q-Learning does.
          </Callout>
        </Accordion>

        {/* ── SECTION 4 ── */}
        <Accordion number={4} title="Optimal Value Functions">
          <p className="text-sm text-text leading-relaxed mb-4">
            Among all possible policies, there exist special value functions — the <strong>optimal</strong> ones.
            These represent the best possible expected return from each state.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-blue mb-2">Optimal State Value</h4>
              <Eq tex="v_*(s) = \max_\pi v_\pi(s)" />
              <p className="text-xs text-text-muted m-0">
                The highest value achievable in state s, over all possible policies.
              </p>
            </div>
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-green mb-2">Optimal Action Value</h4>
              <Eq tex="q_*(s, a) = \max_\pi q_\pi(s, a)" />
              <p className="text-xs text-text-muted m-0">
                The highest value achievable for (s, a), over all possible policies.
              </p>
            </div>
          </div>

          <p className="text-sm text-text leading-relaxed mb-4">
            The optimal policy <Eq tex="\pi_*" inline /> is the one that achieves these optimal values.
            It can be derived directly from <Eq tex="Q_*" inline />:
          </p>

          <Eq tex="\pi_*(s) = \arg\max_a \, q_*(s, a)" />

          <p className="text-sm text-text leading-relaxed mb-4">
            "In every state, just pick the action with the highest optimal Q-value." Simple.
            The hard part is <em>finding</em> <Eq tex="Q_*" inline />.
          </p>

          <QValueWidget />

          <Callout type="try" title="See Q-Values in Action">
            In the <a href="#/gridworld" className="text-primary-light hover:underline">GridWorld lab</a>,
            run Q-Learning and watch the Q-value triangles in each cell fill in. Each triangle represents
            Q(s, a) for one direction. The brightest triangle is the greedy action — the arrow shows
            the agent's current policy derived from its Q-values.
          </Callout>
        </Accordion>

        {/* ── SECTION 5 ── */}
        <Accordion number={5} title="How Algorithms Use Value Functions">
          <p className="text-sm text-text leading-relaxed mb-4">
            Every RL algorithm in our labs uses value functions, but in different ways:
          </p>

          <div className="flex flex-col gap-3 mb-4">
            <div className="bg-surface-light rounded-xl p-4 border border-surface-lighter">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold text-accent-blue">Value Iteration</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-blue/20 text-accent-blue">Model-based</span>
              </div>
              <p className="text-xs text-text-muted mb-1">
                Computes <Eq tex="V_*(s)" inline /> exactly using the known MDP. Sweeps through all states
                repeatedly, updating each value using the Bellman optimality equation (next chapter).
              </p>
              <p className="text-xs text-primary-light m-0">Used in: GridWorld (with known transitions)</p>
            </div>

            <div className="bg-surface-light rounded-xl p-4 border border-surface-lighter">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold text-accent-green">Q-Learning</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-green/20 text-accent-green">Model-free</span>
              </div>
              <p className="text-xs text-text-muted mb-1">
                Learns <Eq tex="Q_*(s, a)" inline /> from experience. After each step, updates one Q-value
                using the TD error: <Eq tex="Q(s,a) \leftarrow Q(s,a) + \alpha[r + \gamma \max_{a'} Q(s',a') - Q(s,a)]" inline />
              </p>
              <p className="text-xs text-primary-light m-0">Used in: GridWorld, CartPole, Rocket Landing</p>
            </div>

            <div className="bg-surface-light rounded-xl p-4 border border-surface-lighter">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold text-accent-yellow">SARSA</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-yellow/20 text-accent-yellow">Model-free</span>
              </div>
              <p className="text-xs text-text-muted mb-1">
                Like Q-Learning, but learns <Eq tex="Q_\pi(s, a)" inline /> for the current policy (not the optimal one).
                Update: <Eq tex="Q(s,a) \leftarrow Q(s,a) + \alpha[r + \gamma Q(s',a') - Q(s,a)]" inline /> where <Eq tex="a'" inline /> is the actual next action.
              </p>
              <p className="text-xs text-primary-light m-0">Used in: GridWorld</p>
            </div>

            <div className="bg-surface-light rounded-xl p-4 border border-surface-lighter">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold text-primary-light">Bandit Algorithms</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary-light">Special case</span>
              </div>
              <p className="text-xs text-text-muted mb-1">
                With only 1 state, <Eq tex="Q(s, a)" inline /> simplifies to just <Eq tex="Q(a)" inline /> —
                the estimated value of each arm. {'\u03B5'}-greedy and UCB maintain these estimates directly.
              </p>
              <p className="text-xs text-primary-light m-0">Used in: Multi-Armed Bandit</p>
            </div>
          </div>
        </Accordion>

        {/* ── SECTION 6 ── */}
        <Accordion number={6} title="Policy Evaluation vs Policy Optimization">
          <p className="text-sm text-text leading-relaxed mb-4">
            Value functions serve two distinct purposes, and it's important to distinguish them:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-blue mb-2">Policy Evaluation</h4>
              <p className="text-xs text-text-muted mb-2">"How good is this policy?"</p>
              <p className="text-xs text-text leading-relaxed mb-2">
                Given a fixed policy <Eq tex="\pi" inline />, compute <Eq tex="v_\pi(s)" inline /> or
                <Eq tex="q_\pi(s,a)" inline /> for all states. This tells us the expected
                return under that specific policy.
              </p>
              <p className="text-xs text-primary-light m-0">
                <strong>Question answered:</strong> "If I follow this strategy, what will happen?"
              </p>
            </div>
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-green mb-2">Policy Optimization</h4>
              <p className="text-xs text-text-muted mb-2">"What's the best policy?"</p>
              <p className="text-xs text-text leading-relaxed mb-2">
                Find <Eq tex="\pi_*" inline /> that achieves <Eq tex="v_*(s)" inline /> or
                <Eq tex="q_*(s,a)" inline />. Use value functions to <strong>improve</strong> the policy:
                act greedily with respect to current values.
              </p>
              <p className="text-xs text-primary-light m-0">
                <strong>Question answered:</strong> "What's the best possible strategy?"
              </p>
            </div>
          </div>

          <Callout type="insight">
            Many algorithms alternate between these two steps. <strong>Policy Iteration</strong> makes this
            explicit: (1) Evaluate the current policy (compute V{'\u03C0'}). (2) Improve by acting greedily
            w.r.t. V{'\u03C0'}. Repeat. This process provably converges to the optimal policy. Q-Learning
            combines both steps into one update.
          </Callout>
        </Accordion>

        {/* ── SECTION 7 ── */}
        <Accordion number={7} title="Summary: The Value Landscape">
          <p className="text-sm text-text leading-relaxed mb-4">
            Value functions give us a quantitative map of the RL problem:
          </p>

          <div className="bg-surface rounded-lg p-4 my-3 text-sm text-text leading-relaxed">
            <p className="mb-2">1. <Eq tex="v_\pi(s)" inline /> = expected return from state s under policy {'\u03C0'}</p>
            <p className="mb-2">2. <Eq tex="q_\pi(s,a)" inline /> = expected return from (s, a) under policy {'\u03C0'}</p>
            <p className="mb-2">3. <Eq tex="v_*(s)" inline /> and <Eq tex="q_*(s,a)" inline /> = the best possible values (over all policies)</p>
            <p className="mb-2">4. The optimal policy picks <Eq tex="\arg\max_a q_*(s,a)" inline /> in every state</p>
            <p className="mb-0">5. <Eq tex="v_\pi(s) = \sum_a \pi(a|s) \, q_\pi(s,a)" inline /> — V is the policy-weighted average of Q</p>
          </div>

          <p className="text-sm text-text leading-relaxed mb-4">
            But how do we actually <em>compute</em> these value functions? The answer is the
            <strong> Bellman equations</strong> — the recursive relationships that connect the value
            of a state to the values of its successors. That's the next chapter.
          </p>

          <Callout type="insight">
            The progression so far: we defined the <strong>problem</strong> (MDP), the <strong>goal</strong> (maximize
            return), the <strong>strategy</strong> (policy), and the <strong>scorecard</strong> (value functions).
            The Bellman equations will give us the <strong>computational tool</strong> to actually find
            the optimal values and policies.
          </Callout>
        </Accordion>
      </div>

      {/* Chapter navigation */}
      <ChapterNav
        prev={{ path: '/learn/markov-decision-process', label: 'Ch 5: MDPs' }}
        next={{ path: '/learn/bellman-equations', label: 'Ch 7: Bellman Equations' }}
      />
    </div>
  )
}
