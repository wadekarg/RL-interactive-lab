import { useState, useCallback } from 'react'
import { Accordion, Callout, Eq, ChapterNav } from '../../components/shared/GuidePrimitives'

/* ══════════════════════════════════════════
   Interactive Widget: Deterministic Policy Editor
   A grid where you assign an arrow (action) to each cell
   ══════════════════════════════════════════ */

const ARROWS: Record<number, string> = { 0: '\u2191', 1: '\u2193', 2: '\u2190', 3: '\u2192' }
const ACTION_LABELS: Record<number, string> = { 0: 'Up', 1: 'Down', 2: 'Left', 3: 'Right' }

function DeterministicPolicyWidget() {
  const rows = 4
  const cols = 4
  const goalCell = rows * cols - 1

  const [policy, setPolicy] = useState<number[]>(() => {
    // Default: all pointing right, except last row pointing down
    return Array.from({ length: rows * cols }, (_, i) => {
      const c = i % cols
      if (i === goalCell) return 3
      if (c === cols - 1) return 1 // rightmost col goes down
      return 3 // everything else goes right
    })
  })

  const cycleAction = useCallback((idx: number) => {
    if (idx === goalCell) return
    setPolicy((prev) => {
      const next = [...prev]
      next[idx] = (next[idx] + 1) % 4
      return next
    })
  }, [goalCell])

  // Simulate following the policy from (0,0)
  const simulatePath = useCallback(() => {
    const path: number[] = [0]
    let pos = 0
    const visited = new Set<number>()
    visited.add(0)
    for (let step = 0; step < 20; step++) {
      const r = Math.floor(pos / cols)
      const c = pos % cols
      const a = policy[pos]
      let nr = r, nc = c
      if (a === 0) nr = Math.max(0, r - 1)
      if (a === 1) nr = Math.min(rows - 1, r + 1)
      if (a === 2) nc = Math.max(0, c - 1)
      if (a === 3) nc = Math.min(cols - 1, c + 1)
      pos = nr * cols + nc
      path.push(pos)
      if (pos === goalCell) break
      if (visited.has(pos)) break // loop detected
      visited.add(pos)
    }
    return path
  }, [policy, goalCell])

  const path = simulatePath()
  const reachesGoal = path[path.length - 1] === goalCell

  return (
    <div className="bg-surface rounded-xl border border-surface-lighter p-5 my-5">
      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Interactive: Deterministic Policy</h4>
      <p className="text-xs text-text-muted mb-3">Click any cell to change its action. The policy maps each state to exactly one action.</p>

      <div className="flex items-start gap-6 flex-wrap">
        {/* Grid */}
        <div className="flex flex-col gap-1">
          {Array.from({ length: rows }, (_, r) => (
            <div key={r} className="flex gap-1">
              {Array.from({ length: cols }, (_, c) => {
                const idx = r * cols + c
                const isGoal = idx === goalCell
                const isOnPath = path.includes(idx)
                const isStart = idx === 0
                return (
                  <button
                    key={c}
                    onClick={() => cycleAction(idx)}
                    className={`w-14 h-14 rounded-lg border-0 cursor-pointer text-lg font-bold transition-all flex flex-col items-center justify-center ${
                      isGoal
                        ? 'bg-accent-green/20 text-accent-green cursor-default'
                        : isStart
                          ? 'bg-primary/20 text-primary-light hover:bg-primary/30'
                          : isOnPath
                            ? 'bg-accent-yellow/15 text-text hover:bg-accent-yellow/25'
                            : 'bg-surface-light text-text-muted hover:bg-surface-lighter'
                    }`}
                  >
                    {isGoal ? (
                      <span className="text-sm">Goal</span>
                    ) : (
                      <>
                        <span>{ARROWS[policy[idx]]}</span>
                        <span className="text-[9px] font-normal text-text-muted">{ACTION_LABELS[policy[idx]]}</span>
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-[200px]">
          <div className="bg-surface-light rounded-lg p-4 mb-3">
            <p className="text-xs font-bold text-text-muted mb-1">Policy notation:</p>
            <p className="text-sm font-mono text-primary-light mb-2">
              {'\u03C0'}(s) = a
            </p>
            <p className="text-xs text-text-muted m-0">
              For every state s, the policy outputs exactly <strong>one</strong> action a.
              No randomness, no probabilities — just a fixed mapping.
            </p>
          </div>

          <div className={`rounded-lg p-3 text-xs ${reachesGoal ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>
            <strong>{reachesGoal ? 'Reaches goal!' : 'Does not reach goal'}</strong>
            <p className="m-0 mt-1">
              Path: {path.map((idx) => `(${Math.floor(idx / cols)},${idx % cols})`).join(' \u2192 ')}
              {!reachesGoal && ' \u2026 (loop or stuck)'}
            </p>
          </div>

          <p className="text-xs text-text-muted mt-3">
            Try creating a policy that reaches the goal from (0,0) in the fewest steps.
            The optimal policy takes exactly {rows - 1 + cols - 1} steps.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   Interactive Widget: Stochastic Policy Visualizer
   Shows probability distributions over actions
   ══════════════════════════════════════════ */

function StochasticPolicyWidget() {
  const [probs, setProbs] = useState([0.1, 0.1, 0.3, 0.5]) // up, down, left, right
  const actions = ['Up', 'Down', 'Left', 'Right']
  const arrows = ['\u2191', '\u2193', '\u2190', '\u2192']
  const colors = ['accent-blue', 'accent-red', 'accent-yellow', 'accent-green']

  const [samples, setSamples] = useState<number[]>([])

  const updateProb = useCallback((idx: number, val: number) => {
    setProbs((prev) => {
      const next = [...prev]
      next[idx] = Math.max(0, val)
      // Normalize
      const sum = next.reduce((a, b) => a + b, 0)
      if (sum > 0) {
        for (let i = 0; i < next.length; i++) next[i] = next[i] / sum
      }
      return next
    })
  }, [])

  const sampleAction = useCallback(() => {
    const r = Math.random()
    let cum = 0
    for (let i = 0; i < probs.length; i++) {
      cum += probs[i]
      if (r < cum) {
        setSamples((prev) => [...prev.slice(-19), i])
        return
      }
    }
    setSamples((prev) => [...prev.slice(-19), probs.length - 1])
  }, [probs])

  const sample10 = useCallback(() => {
    const newSamples: number[] = []
    for (let n = 0; n < 10; n++) {
      const r = Math.random()
      let cum = 0
      for (let i = 0; i < probs.length; i++) {
        cum += probs[i]
        if (r < cum) { newSamples.push(i); break }
        if (i === probs.length - 1) newSamples.push(i)
      }
    }
    setSamples((prev) => [...prev, ...newSamples].slice(-20))
  }, [probs])

  const maxProb = Math.max(...probs)

  return (
    <div className="bg-surface rounded-xl border border-surface-lighter p-5 my-5">
      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Interactive: Stochastic Policy</h4>
      <p className="text-xs text-text-muted mb-3">
        Adjust the sliders to change action probabilities. Then sample to see which actions get chosen.
      </p>

      {/* Probability bars + sliders */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {probs.map((p, i) => (
          <div key={i} className="flex flex-col items-center">
            {/* Bar */}
            <div className="w-full h-20 bg-surface-light rounded-lg flex items-end justify-center mb-1 relative">
              <div
                className={`w-full rounded-lg bg-${colors[i]}/30 transition-all duration-200`}
                style={{ height: `${maxProb > 0 ? (p / maxProb) * 100 : 0}%`, minHeight: p > 0 ? 4 : 0 }}
              />
              <span className="absolute top-1 text-xs font-bold text-text">{arrows[i]}</span>
            </div>
            <span className="text-xs font-mono text-primary-light mb-1">{(p * 100).toFixed(0)}%</span>
            <input
              type="range"
              min={0}
              max={100}
              value={p * 100}
              onChange={(e) => updateProb(i, Number(e.target.value))}
              className="w-full accent-primary"
            />
            <span className="text-[10px] text-text-muted">{actions[i]}</span>
          </div>
        ))}
      </div>

      {/* Sample buttons */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={sampleAction}
          className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary-light text-xs font-medium border-0 cursor-pointer hover:bg-primary/30 transition-colors"
        >
          Sample 1 action
        </button>
        <button
          onClick={sample10}
          className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary-light text-xs font-medium border-0 cursor-pointer hover:bg-primary/30 transition-colors"
        >
          Sample 10 actions
        </button>
        <button
          onClick={() => setSamples([])}
          className="px-3 py-1.5 rounded-lg bg-surface-light text-text-muted text-xs font-medium border-0 cursor-pointer hover:bg-surface-lighter transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Sample history */}
      {samples.length > 0 && (
        <div className="bg-surface-light rounded-lg p-3">
          <span className="text-xs text-text-muted">Sampled actions: </span>
          <div className="flex gap-1 flex-wrap mt-1">
            {samples.map((s, i) => (
              <span key={i} className={`text-sm px-1.5 py-0.5 rounded bg-${colors[s]}/20 text-${colors[s]}`}>
                {arrows[s]}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-text-muted mt-2 mb-0">
            Distribution of samples: {actions.map((a, i) => {
              const count = samples.filter((s) => s === i).length
              return `${a}: ${count}/${samples.length}`
            }).join(', ')}
          </p>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   Interactive Widget: Policy Comparison
   Shows how two policies behave differently in the same situation
   ══════════════════════════════════════════ */

function PolicyComparisonWidget() {
  const [scenario, setScenario] = useState<'safe' | 'risky'>('safe')

  const scenarios = {
    safe: {
      title: 'Scenario: CartPole leaning right',
      state: '\u03B8 = +8\u00B0 (leaning right), \u03C9 = +0.5 (falling faster)',
      policies: [
        {
          name: 'Cautious policy',
          type: 'Deterministic',
          action: 'Always push right (follow the lean)',
          probs: [0, 100],
          outcome: 'Usually stabilizes but slowly. Sometimes over-corrects.',
          quality: 'decent',
        },
        {
          name: 'Balanced policy',
          type: 'Stochastic',
          action: '80% push right, 20% push left',
          probs: [20, 80],
          outcome: 'Stabilizes faster on average. The occasional left push prevents oscillation.',
          quality: 'good',
        },
      ],
    },
    risky: {
      title: 'Scenario: Near the edge of the track',
      state: 'x = +2.2 (near right edge), v = +0.3 (still moving right)',
      policies: [
        {
          name: 'Greedy policy',
          type: 'Deterministic',
          action: 'Push right (because pole is slightly tilted right)',
          probs: [0, 100],
          outcome: 'Cart goes off the track! The policy only looked at the pole angle.',
          quality: 'bad',
        },
        {
          name: 'Smart policy',
          type: 'Deterministic',
          action: 'Push left (save the cart first)',
          probs: [100, 0],
          outcome: 'Cart stays on track. The pole wobbles but recovers.',
          quality: 'good',
        },
      ],
    },
  }

  const s = scenarios[scenario]

  return (
    <div className="bg-surface rounded-xl border border-surface-lighter p-5 my-5">
      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Compare: Different Policies, Same State</h4>

      <div className="flex gap-2 mb-4">
        {(Object.keys(scenarios) as (keyof typeof scenarios)[]).map((key) => (
          <button
            key={key}
            onClick={() => setScenario(key)}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border-0 cursor-pointer transition-colors ${
              scenario === key
                ? 'bg-primary/20 text-primary-light'
                : 'bg-surface-light text-text-muted hover:text-text hover:bg-surface-lighter'
            }`}
          >
            {scenarios[key].title}
          </button>
        ))}
      </div>

      <div className="bg-surface-light rounded-lg p-3 mb-4">
        <span className="text-xs font-bold text-text">State: </span>
        <span className="text-xs font-mono text-primary-light">{s.state}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {s.policies.map((p) => (
          <div key={p.name} className={`rounded-xl p-4 border ${
            p.quality === 'good' ? 'bg-accent-green/5 border-accent-green/30' :
            p.quality === 'bad' ? 'bg-accent-red/5 border-accent-red/30' :
            'bg-surface-light border-surface-lighter'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold text-text">{p.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-lighter text-text-muted">{p.type}</span>
            </div>
            <p className="text-xs text-text-muted mb-2">
              <strong>Action:</strong> {p.action}
            </p>
            {/* Mini probability bar */}
            <div className="flex gap-1 h-4 rounded overflow-hidden mb-2">
              <div className="bg-accent-blue/40 transition-all" style={{ width: `${p.probs[0]}%` }} />
              <div className="bg-accent-green/40 transition-all" style={{ width: `${p.probs[1]}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-text-muted mb-2">
              <span>Left: {p.probs[0]}%</span>
              <span>Right: {p.probs[1]}%</span>
            </div>
            <p className={`text-xs m-0 ${
              p.quality === 'good' ? 'text-accent-green' : p.quality === 'bad' ? 'text-accent-red' : 'text-text-muted'
            }`}>
              {p.outcome}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   MAIN PAGE: Chapter 4
   ══════════════════════════════════════════ */

export function PoliciesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="mb-10 text-center">
        <div className="flex justify-center gap-3 mb-4">
          <a href="#/learn" className="text-sm text-primary-light hover:underline no-underline">
            &larr; All Chapters
          </a>
        </div>
        <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Chapter 4</p>
        <h1 className="text-4xl font-bold text-text mb-3">
          Policies
        </h1>
        <p className="text-lg text-text-muted max-w-2xl mx-auto">
          A policy is the agent's brain — a rule that decides what to do in every situation.
          The entire goal of RL is to find the best one.
        </p>
        <div className="flex justify-center gap-3 mt-4 text-xs text-text-muted">
          <span className="bg-surface-light px-3 py-1 rounded-full">7 sections</span>
          <span className="bg-surface-light px-3 py-1 rounded-full">Policy editor</span>
          <span className="bg-surface-light px-3 py-1 rounded-full">Stochastic sampling</span>
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-4">

        {/* ── SECTION 1 ── */}
        <Accordion number={1} title="What is a Policy?" defaultOpen>
          <p className="text-sm text-text leading-relaxed mb-4">
            A <strong>policy</strong> is a rule that tells the agent what action to take in each state.
            It's the complete strategy — the answer to "if I'm in this situation, what should I do?"
          </p>

          <p className="text-sm text-text leading-relaxed mb-4">
            Formally, a policy <Eq tex="\pi" inline /> maps states to actions (or to probability distributions
            over actions). It's what the agent <em>actually uses</em> to make decisions.
          </p>

          <div className="bg-surface rounded-lg p-4 my-4 border-l-4 border-primary">
            <p className="text-sm text-text leading-relaxed mb-0">
              The policy is the most important concept in RL. Value functions, Bellman equations,
              TD learning — they all exist to help us find or improve the <strong>policy</strong>.
              Everything in RL is ultimately about policy optimization.
            </p>
          </div>

          <p className="text-sm text-text leading-relaxed mb-4">
            Think of everyday policies you follow:
          </p>
          <ul className="text-sm text-text-muted space-y-1 mb-4">
            <li className="flex items-start gap-2"><span className="text-primary-light">-</span>"If the traffic light is red, stop. If green, go." — a deterministic policy</li>
            <li className="flex items-start gap-2"><span className="text-primary-light">-</span>"If hungry, 70% chance I'll cook, 30% chance I'll order food." — a stochastic policy</li>
            <li className="flex items-start gap-2"><span className="text-primary-light">-</span>"If the chess opponent attacks my queen, move it to safety." — a conditional policy</li>
          </ul>

          <Callout type="insight">
            The word "policy" comes from decision theory, not politics. It simply means "a rule for
            making decisions." In RL, the agent starts with a bad policy (random guessing) and
            gradually improves it until it finds one that maximizes long-term reward.
          </Callout>
        </Accordion>

        {/* ── SECTION 2 ── */}
        <Accordion number={2} title="Deterministic Policies">
          <p className="text-sm text-text leading-relaxed mb-4">
            A <strong>deterministic policy</strong> maps each state to exactly one action. No randomness,
            no probabilities — given a state, the action is fixed.
          </p>

          <Eq tex="\pi(s) = a" />

          <p className="text-sm text-text leading-relaxed mb-4">
            "In state <Eq tex="s" inline />, always do action <Eq tex="a" inline />." That's it.
            Simple, predictable, and easy to implement — just a lookup table or function.
          </p>

          <div className="bg-surface rounded-lg p-4 my-3 text-xs font-mono text-text-muted leading-relaxed">
            <p className="mb-1">GridWorld examples:</p>
            <p className="mb-0.5">{'\u03C0'}((0,0)) = Right</p>
            <p className="mb-0.5">{'\u03C0'}((0,1)) = Right</p>
            <p className="mb-0.5">{'\u03C0'}((0,2)) = Down</p>
            <p className="mb-0">... one entry per state</p>
          </div>

          <DeterministicPolicyWidget />

          <Callout type="think">
            If the environment is deterministic and fully observable, the optimal policy is always
            deterministic — there's no benefit to randomness. But even in this case, <em>learning</em>
            the optimal policy usually requires some exploration (randomness during training).
          </Callout>
        </Accordion>

        {/* ── SECTION 3 ── */}
        <Accordion number={3} title="Stochastic Policies">
          <p className="text-sm text-text leading-relaxed mb-4">
            A <strong>stochastic policy</strong> maps each state to a <em>probability distribution</em> over
            actions. Instead of "always do X," it says "do X with 70% probability, Y with 30%."
          </p>

          <Eq tex="\pi(a \mid s) = \Pr\{A_t = a \mid S_t = s\}" />

          <p className="text-sm text-text leading-relaxed mb-4">
            The notation <Eq tex="\pi(a|s)" inline /> reads: "the probability of taking action <Eq tex="a" inline /> given
            that we're in state <Eq tex="s" inline />." For each state, the probabilities must sum to 1:
          </p>

          <Eq tex="\sum_{a \in \mathcal{A}} \pi(a \mid s) = 1 \quad \text{for all } s" />

          <p className="text-sm text-text leading-relaxed mb-2">
            <strong>Why would we want randomness?</strong>
          </p>
          <ul className="text-sm text-text-muted space-y-2 mb-4">
            <li className="flex items-start gap-2">
              <span className="text-primary-light">-</span>
              <span><strong>Exploration:</strong> A stochastic policy naturally tries different actions, helping the agent discover better strategies. This is essential during learning.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-light">-</span>
              <span><strong>Partial observability:</strong> If the agent can't see the full state, randomness can help it hedge against uncertainty.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-light">-</span>
              <span><strong>Game theory:</strong> In competitive games (rock-paper-scissors), a deterministic policy is exploitable. The optimal strategy IS random.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-light">-</span>
              <span><strong>Policy gradient methods:</strong> REINFORCE and similar algorithms parameterize stochastic policies and optimize them directly.</span>
            </li>
          </ul>

          <StochasticPolicyWidget />

          <Callout type="insight">
            Note that a deterministic policy is just a special case of a stochastic policy where
            one action has probability 1 and all others have probability 0. So <Eq tex="\pi(a|s)" inline /> is
            the more general notation — it covers both cases.
          </Callout>
        </Accordion>

        {/* ── SECTION 4 ── */}
        <Accordion number={4} title="Policies in Our Lab Environments">
          <p className="text-sm text-text leading-relaxed mb-4">
            Every algorithm in our labs implements a policy. Some are explicit, some are derived
            from value estimates:
          </p>

          <div className="flex flex-col gap-3 mb-4">
            {[
              {
                algo: '\u03B5-Greedy (Bandit, GridWorld)',
                type: 'Stochastic',
                icon: '\uD83C\uDFB2',
                desc: 'With probability \u03B5, pick a random action (explore). Otherwise, pick the action with highest Q-value (exploit).',
                formula: '\u03C0(a|s) = (1\u2212\u03B5) if a = argmax Q(s,a), else \u03B5/(|A|\u22121)',
                color: 'accent-blue',
              },
              {
                algo: 'UCB (Bandit)',
                type: 'Deterministic',
                icon: '\uD83D\uDCCF',
                desc: 'Always pick the arm with the highest upper confidence bound. No randomness — exploration comes from the bonus term.',
                formula: '\u03C0(s) = argmax [Q(a) + c\u221A(ln(t)/N(a))]',
                color: 'accent-green',
              },
              {
                algo: 'Thompson Sampling (Bandit)',
                type: 'Stochastic',
                icon: '\uD83C\uDFB2',
                desc: 'Sample from each arm\'s posterior distribution, then pick the arm with the highest sample. Randomness comes from sampling.',
                formula: 'Sample \u03B8\u2090 ~ Beta(\u03B1\u2090, \u03B2\u2090), pick argmax \u03B8\u2090',
                color: 'accent-yellow',
              },
              {
                algo: 'Softmax / REINFORCE (CartPole, Rocket)',
                type: 'Stochastic',
                icon: '\uD83C\uDFB2',
                desc: 'Compute a score for each action using a linear function of features, then convert to probabilities via softmax.',
                formula: '\u03C0(a|s) = exp(w\u2090\u1D40\u03C6(s)) / \u03A3 exp(w\u2090\u2032\u1D40\u03C6(s))',
                color: 'primary-light',
              },
            ].map(({ algo, type, icon, desc, formula, color }) => (
              <div key={algo} className="bg-surface-light rounded-xl p-4 border border-surface-lighter">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{icon}</span>
                  <span className={`text-sm font-bold text-${color}`}>{algo}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-lighter text-text-muted ml-auto">{type}</span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed mb-2">{desc}</p>
                <p className="text-xs font-mono text-primary-light m-0">{formula}</p>
              </div>
            ))}
          </div>

          <Callout type="try" title="Observe in the Labs">
            In the <a href="#/bandit" className="text-primary-light hover:underline">Bandit lab</a>, watch how
            {'\u03B5'}-greedy occasionally picks random arms (exploration) while Thompson Sampling explores
            more intelligently through its posterior distributions. Both are stochastic policies,
            but with very different exploration strategies.
          </Callout>
        </Accordion>

        {/* ── SECTION 5 ── */}
        <Accordion number={5} title="Good Policies vs Bad Policies">
          <p className="text-sm text-text leading-relaxed mb-4">
            Not all policies are created equal. A policy that takes random actions everywhere is valid
            but terrible. A policy that always picks the highest-reward action is better but might
            miss long-term opportunities. How do we measure quality?
          </p>

          <p className="text-sm text-text leading-relaxed mb-4">
            A policy is <strong>better</strong> than another if it achieves higher expected return
            from every state:
          </p>

          <Eq tex="\pi \geq \pi' \iff v_\pi(s) \geq v_{\pi'}(s) \quad \text{for all } s \in \mathcal{S}" />

          <p className="text-sm text-text leading-relaxed mb-4">
            where <Eq tex="v_\pi(s)" inline /> is the <strong>value</strong> of state <Eq tex="s" inline /> under
            policy <Eq tex="\pi" inline /> — the expected return when starting in <Eq tex="s" inline /> and
            following <Eq tex="\pi" inline /> thereafter. (We'll define this precisely in Chapter 6.)
          </p>

          <PolicyComparisonWidget />

          <Callout type="think">
            The second scenario illustrates a critical point: a good policy must consider the
            <strong> entire state</strong>, not just part of it. A policy that only looks at the
            pole angle ignores cart position — and pays the price. This is why state representation
            matters so much (Chapter 2).
          </Callout>
        </Accordion>

        {/* ── SECTION 6 ── */}
        <Accordion number={6} title="The Optimal Policy">
          <p className="text-sm text-text leading-relaxed mb-4">
            The <strong>optimal policy</strong> <Eq tex="\pi_*" inline /> is the one that achieves the
            highest expected return from every state. It's the best possible strategy — the goal of
            all RL algorithms.
          </p>

          <Eq tex="\pi_* = \arg\max_\pi v_\pi(s) \quad \text{for all } s" />

          <p className="text-sm text-text leading-relaxed mb-4">
            A remarkable fact from RL theory: for any finite MDP, there always exists at least one
            optimal policy, and it's always at least as good as every other policy in <em>every</em> state.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-blue mb-2">Value-Based Methods</h4>
              <p className="text-xs text-text leading-relaxed m-0">
                Find the optimal policy <em>indirectly</em>: first learn the optimal value function
                (<Eq tex="Q_*" inline />), then derive the policy by picking the action with the highest Q-value.
                <br /><br />
                <strong>Examples:</strong> Q-Learning, SARSA, Value Iteration
              </p>
            </div>
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-green mb-2">Policy-Based Methods</h4>
              <p className="text-xs text-text leading-relaxed m-0">
                Find the optimal policy <em>directly</em>: parameterize the policy and adjust
                parameters to increase expected return.
                <br /><br />
                <strong>Examples:</strong> REINFORCE, PPO, A3C
              </p>
            </div>
          </div>

          <Callout type="insight">
            Most of our lab algorithms are value-based: they learn Q-values and derive a greedy policy
            from them. The exception is REINFORCE (in CartPole and Rocket Landing), which learns the
            policy directly. Both approaches converge to the optimal policy under the right conditions —
            they just take different paths to get there.
          </Callout>
        </Accordion>

        {/* ── SECTION 7 ── */}
        <Accordion number={7} title="Summary: From Policy to Value">
          <p className="text-sm text-text leading-relaxed mb-4">
            Let's recap what we've built so far across the first four chapters:
          </p>

          <div className="flex flex-col gap-3 mb-4">
            {[
              { ch: '1', concept: 'Agent + Environment', summary: 'The agent interacts with the environment in a loop: state \u2192 action \u2192 reward.', color: 'accent-blue' },
              { ch: '2', concept: 'States + Actions', summary: 'States describe the situation; actions are the agent\'s choices. Both can be discrete or continuous.', color: 'accent-green' },
              { ch: '3', concept: 'Rewards + Returns', summary: 'Rewards are immediate feedback; returns are discounted cumulative rewards. \u03B3 controls the horizon.', color: 'accent-yellow' },
              { ch: '4', concept: 'Policies', summary: 'A policy \u03C0 maps states to actions. The goal is to find the optimal policy \u03C0* that maximizes expected returns.', color: 'primary-light' },
            ].map(({ ch, concept, summary, color }) => (
              <div key={ch} className="flex items-start gap-3 bg-surface-light rounded-lg p-3 border border-surface-lighter">
                <span className={`flex-shrink-0 w-7 h-7 rounded-full bg-${color}/20 text-${color} text-xs font-bold flex items-center justify-center`}>
                  {ch}
                </span>
                <div>
                  <span className="text-xs font-bold text-text">{concept}</span>
                  <p className="text-xs text-text-muted m-0 mt-0.5">{summary}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-text leading-relaxed mb-4">
            Next, we formalize the environment as a <strong>Markov Decision Process</strong> (MDP),
            then introduce <strong>value functions</strong> — the tool that lets us evaluate and compare
            policies mathematically.
          </p>

          <Callout type="insight">
            The logical chain: <strong>States</strong> describe the world. <strong>Actions</strong> change it.
            <strong> Rewards</strong> evaluate what happened. <strong>Policies</strong> decide what to do.
            <strong> Value functions</strong> (next chapter) predict how good a policy is. And
            <strong> Bellman equations</strong> connect it all recursively.
          </Callout>
        </Accordion>
      </div>

      {/* Chapter navigation */}
      <ChapterNav
        prev={{ path: '/learn/rewards-and-returns', label: 'Ch 3: Rewards and Returns' }}
        next={{ path: '/learn/markov-decision-process', label: 'Ch 5: Markov Decision Processes' }}
      />
    </div>
  )
}
