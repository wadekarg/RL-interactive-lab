import { useState, useCallback } from 'react'
import { Accordion, Callout, Eq, ChapterNav, SimButton } from '../../components/shared/GuidePrimitives'

/* ══════════════════════════════════════════
   Interactive Widget 1: Softmax Policy Explorer
   See how weights → probabilities via softmax
   ══════════════════════════════════════════ */

function SoftmaxWidget() {
  const [logits, setLogits] = useState([1.0, 0.5, -0.5])
  const labels = ['Left Thrust', 'Right Thrust', 'Bottom Thrust']

  const maxL = Math.max(...logits)
  const exps = logits.map(l => Math.exp(l - maxL))
  const sumExp = exps.reduce((a, b) => a + b, 0)
  const probs = exps.map(e => e / sumExp)

  return (
    <div className="bg-surface rounded-xl border border-surface-lighter p-5 my-5">
      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Interactive: Softmax Policy</h4>
      <p className="text-xs text-text-muted mb-3">
        Adjust the logits (raw scores) for each action. Softmax converts them into a valid probability distribution.
      </p>

      <div className="space-y-3 mb-4">
        {labels.map((label, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-text w-24 flex-shrink-0">{label}</span>
            <input
              type="range"
              min={-3}
              max={3}
              step={0.1}
              value={logits[i]}
              onChange={e => {
                const next = [...logits]
                next[i] = parseFloat(e.target.value)
                setLogits(next)
              }}
              className="flex-1 accent-primary"
            />
            <span className="text-xs font-mono text-text-muted w-10 text-right">{logits[i].toFixed(1)}</span>
            <div className="w-28 h-5 bg-surface-lighter rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${i === 0 ? 'bg-accent-blue' : i === 1 ? 'bg-accent-green' : 'bg-accent-yellow'}`}
                style={{ width: `${probs[i] * 100}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-text w-14 text-right">{(probs[i] * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>

      <div className="bg-surface-light rounded-lg p-3">
        <p className="text-[10px] text-text-muted m-0">
          Notice: doubling all logits makes the distribution <em>sharper</em> (more confident).
          Subtracting a constant from all logits changes nothing — only <em>differences</em> matter.
        </p>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   Interactive Widget 2: REINFORCE Episode Walkthrough
   Step through one episode showing returns + gradient updates
   ══════════════════════════════════════════ */

function ReinforceWidget() {
  const gamma = 0.99

  // Pre-generated episode for CartPole-like scenario
  const [episode, setEpisode] = useState(() => generateEpisode())
  const [selectedStep, setSelectedStep] = useState(0)

  function generateEpisode() {
    const steps: { s: string; a: number; r: number; prob: number }[] = []
    const nSteps = 8 + Math.floor(Math.random() * 8) // 8-15 steps
    for (let t = 0; t < nSteps; t++) {
      const theta = (Math.random() - 0.5) * 0.3
      const omega = (Math.random() - 0.5) * 0.5
      const prob = 0.4 + Math.random() * 0.3 // action prob between 0.4-0.7
      steps.push({
        s: `θ=${theta.toFixed(2)}, ω=${omega.toFixed(2)}`,
        a: Math.random() > 0.5 ? 1 : 0,
        r: 1.0, // +1 per step in CartPole
        prob,
      })
    }
    return steps
  }

  // Compute returns for each step
  const returns = episode.map((_, t) => {
    let G = 0
    for (let k = episode.length - 1; k >= t; k--) {
      G = episode[k].r + gamma * G
    }
    return G
  })

  const baseline = returns.reduce((a, b) => a + b, 0) / returns.length
  const advantages = returns.map(G => G - baseline)

  const step = episode[selectedStep]
  const G = returns[selectedStep]
  const adv = advantages[selectedStep]

  return (
    <div className="bg-surface rounded-xl border border-surface-lighter p-5 my-5">
      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Interactive: REINFORCE Episode Walkthrough</h4>
      <p className="text-xs text-text-muted mb-3">
        Click a timestep to see its return G, baseline, advantage, and how it contributes to the gradient.
      </p>

      {/* Timeline */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {episode.map((_, t) => (
          <button
            key={t}
            onClick={() => setSelectedStep(t)}
            className={`flex-shrink-0 w-8 h-8 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
              t === selectedStep
                ? 'bg-primary text-white'
                : advantages[t] >= 0
                  ? 'bg-accent-green/10 text-accent-green border border-accent-green/30 hover:bg-accent-green/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
            }`}
          >
            t={t}
          </button>
        ))}
      </div>

      {/* Step detail */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-surface-light rounded-lg p-3">
          <p className="text-xs font-bold text-text mb-2">Timestep {selectedStep}</p>
          <div className="space-y-1 text-xs">
            <p className="text-text-muted m-0">State: <span className="font-mono">{step.s}</span></p>
            <p className="text-text-muted m-0">Action: <span className="font-bold text-text">{step.a === 0 ? 'Push Left' : 'Push Right'}</span></p>
            <p className="text-text-muted m-0">Reward: <span className="font-mono">+1.0</span></p>
            <p className="text-text-muted m-0">{"π(a|s)"}: <span className="font-mono">{step.prob.toFixed(3)}</span></p>
          </div>
        </div>
        <div className="bg-surface-light rounded-lg p-3">
          <p className="text-xs font-bold text-text mb-2">Gradient Computation</p>
          <div className="space-y-1 text-xs">
            <p className="text-text-muted m-0">
              Return G<sub>{selectedStep}</sub>: <span className="font-mono font-bold text-primary-light">{G.toFixed(3)}</span>
            </p>
            <p className="text-text-muted m-0">
              Baseline b: <span className="font-mono">{baseline.toFixed(3)}</span>
            </p>
            <p className={`m-0 ${adv >= 0 ? 'text-accent-green' : 'text-red-400'}`}>
              Advantage: <span className="font-mono font-bold">{adv >= 0 ? '+' : ''}{adv.toFixed(3)}</span>
            </p>
            <p className="text-text-muted m-0 mt-1">
              {adv >= 0
                ? '↑ Positive advantage → increase this action\'s probability'
                : '↓ Negative advantage → decrease this action\'s probability'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => { setEpisode(generateEpisode()); setSelectedStep(0) }}
          className="px-3 py-1.5 rounded-lg bg-surface-lighter text-text text-xs font-medium cursor-pointer hover:bg-surface-light transition-colors"
        >
          New Episode
        </button>
      </div>
      <p className="text-[10px] text-text-muted mt-2">
        Green steps have positive advantage (reinforce), red have negative (discourage). γ = {gamma}
      </p>
    </div>
  )
}

/* ══════════════════════════════════════════
   Interactive Widget 3: Value-Based vs Policy Gradient
   Side-by-side comparison on a simple problem
   ══════════════════════════════════════════ */

function ValueVsPolicyWidget() {
  const [results, setResults] = useState<{
    qRewards: number[]
    pgRewards: number[]
  } | null>(null)
  const [running, setRunning] = useState(false)

  // Simple 2-state, 2-action environment
  // State 0: action 0 gives +1 (80%), +0 (20%); action 1 gives +2 (30%), -1 (70%)
  // State 1: action 0 gives +0.5 always; action 1 gives +1.5 (50%), -0.5 (50%)
  const run = useCallback(() => {
    setRunning(true)
    setTimeout(() => {
      const episodes = 200
      const alpha = 0.1
      const gamma = 0.95

      // Q-Learning
      const Q = [[0, 0], [0, 0]] // Q[state][action]
      const qRewards: number[] = []
      for (let ep = 0; ep < episodes; ep++) {
        const s = Math.random() > 0.5 ? 1 : 0
        const eps = Math.max(0.05, 1 - ep / 100)
        const a = Math.random() < eps ? Math.floor(Math.random() * 2) : (Q[s][0] > Q[s][1] ? 0 : 1)
        let r: number
        if (s === 0) {
          r = a === 0 ? (Math.random() < 0.8 ? 1 : 0) : (Math.random() < 0.3 ? 2 : -1)
        } else {
          r = a === 0 ? 0.5 : (Math.random() < 0.5 ? 1.5 : -0.5)
        }
        const sNext = 1 - s // alternate states
        Q[s][a] += alpha * (r + gamma * Math.max(Q[sNext][0], Q[sNext][1]) - Q[s][a])
        qRewards.push(r)
      }

      // Policy Gradient (REINFORCE-like, single step episodes)
      const theta = [[0, 0], [0, 0]] // theta[state][action]
      const pgRewards: number[] = []
      let baselineR = 0

      for (let ep = 0; ep < episodes; ep++) {
        const s = Math.random() > 0.5 ? 1 : 0
        // softmax
        const maxT = Math.max(theta[s][0], theta[s][1])
        const e0 = Math.exp(theta[s][0] - maxT)
        const e1 = Math.exp(theta[s][1] - maxT)
        const p0 = e0 / (e0 + e1)
        const a = Math.random() < p0 ? 0 : 1
        const prob = a === 0 ? p0 : 1 - p0

        let r: number
        if (s === 0) {
          r = a === 0 ? (Math.random() < 0.8 ? 1 : 0) : (Math.random() < 0.3 ? 2 : -1)
        } else {
          r = a === 0 ? 0.5 : (Math.random() < 0.5 ? 1.5 : -0.5)
        }

        const advantage = r - baselineR
        baselineR += 0.05 * (r - baselineR)

        // Update: increase chosen action, decrease other
        const pgAlpha = 0.05
        theta[s][a] += pgAlpha * advantage * (1 - prob)
        theta[s][1 - a] -= pgAlpha * advantage * prob
        pgRewards.push(r)
      }

      setResults({ qRewards, pgRewards })
      setRunning(false)
    }, 50)
  }, [])

  const rollingAvg = (arr: number[], window: number) => {
    const result: number[] = []
    for (let i = 0; i < arr.length; i++) {
      const start = Math.max(0, i - window + 1)
      const slice = arr.slice(start, i + 1)
      result.push(slice.reduce((a, b) => a + b, 0) / slice.length)
    }
    return result
  }

  return (
    <div className="bg-surface rounded-xl border border-surface-lighter p-5 my-5">
      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Interactive: Q-Learning vs REINFORCE</h4>
      <p className="text-xs text-text-muted mb-3">
        Both learn on a simple stochastic environment. Compare how quickly each finds good actions.
      </p>

      <button
        onClick={run}
        disabled={running}
        className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-medium cursor-pointer hover:bg-primary-dark transition-colors disabled:opacity-50 mb-4"
      >
        {running ? 'Training...' : results ? 'Re-run (200 episodes)' : 'Train Both (200 episodes)'}
      </button>

      {results && (() => {
        const qRolling = rollingAvg(results.qRewards, 20)
        const pgRolling = rollingAvg(results.pgRewards, 20)
        const checkpoints = [0, 49, 99, 149, 199]
        const maxR = 2

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Q-Learning (Value-Based)', data: qRolling, color: 'accent-blue' },
              { label: 'REINFORCE (Policy Gradient)', data: pgRolling, color: 'accent-green' },
            ].map(({ label, data, color }) => (
              <div key={label}>
                <p className={`text-xs font-bold text-${color} mb-2`}>{label}</p>
                <div className="space-y-1">
                  {checkpoints.map(i => {
                    const v = data[i] ?? 0
                    const w = Math.max(2, ((v + 1) / (maxR + 1)) * 100) // shift since rewards can be negative
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-[9px] text-text-muted w-10 text-right">ep {i + 1}</span>
                        <div className="flex-1 h-3 bg-surface-lighter rounded-full overflow-hidden">
                          <div className={`h-full bg-${color} rounded-full transition-all`} style={{ width: `${w}%` }} />
                        </div>
                        <span className="text-[9px] font-mono text-text-muted w-12">{v.toFixed(2)}</span>
                      </div>
                    )
                  })}
                </div>
                <p className="text-[10px] text-text-muted mt-1">
                  Final avg (last 20): <span className="font-mono font-bold">{data[data.length - 1].toFixed(2)}</span>
                </p>
              </div>
            ))}
          </div>
        )
      })()}

      {results && (
        <div className="mt-3 bg-surface-light rounded-lg p-3">
          <p className="text-xs text-text leading-relaxed m-0">
            Both approaches converge, but notice the difference in variance. Q-Learning updates a value table
            and acts greedily. REINFORCE directly adjusts action probabilities — smoother but noisier gradients.
          </p>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   Main Chapter Page
   ══════════════════════════════════════════ */

export function PolicyGradientsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="mb-8">
        <a href="#/learn" className="text-sm text-primary-light hover:underline no-underline mb-3 inline-block">
          ← All Chapters
        </a>
        <div className="flex items-center gap-3 mb-2">
          <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent-green/20 flex items-center justify-center text-xl">🌟</span>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-0.5">Chapter 10</p>
            <h1 className="text-3xl font-bold text-text m-0">Policy Gradients</h1>
          </div>
        </div>
        <p className="text-text-muted mt-2">
          Instead of learning values and deriving a policy, what if we optimize the policy <em>directly</em>?
          Policy gradient methods do exactly this — and they're the bridge to modern deep RL.
        </p>
        <div className="flex gap-2 mt-3 flex-wrap">
          {['REINFORCE', 'Baselines', 'Policy ∇', 'Softmax'].map(tag => (
            <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-surface-light text-text-muted">{tag}</span>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-4">

        <Accordion number={1} title="Why Learn a Policy Directly?" defaultOpen>
          <p className="text-sm text-text leading-relaxed">
            So far we've learned <strong>value functions</strong> (V or Q) and extracted policies from them (act greedily on Q).
            This works great for discrete actions — but what about continuous actions like steering angles or thrust levels?
            And what if the optimal policy is <em>stochastic</em>?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
            <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-lg p-3">
              <p className="text-xs font-bold text-accent-blue mb-1">Value-Based (Ch. 9)</p>
              <p className="text-xs text-text-muted m-0">
                Learn Q(s,a), act greedily. Needs discretization for continuous actions. Policy is implicit (argmax).
              </p>
            </div>
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-lg p-3">
              <p className="text-xs font-bold text-accent-green mb-1">Policy-Based (This Chapter)</p>
              <p className="text-xs text-text-muted m-0">
                Learn π(a|s) directly with parameters θ. Naturally handles continuous actions and stochastic policies.
              </p>
            </div>
          </div>
          <Callout type="insight">
            Policy gradients shift the question from "what is the value of this state?" to
            "how should I adjust my behavior to get more reward?" It's a fundamentally different lens.
          </Callout>
        </Accordion>

        <Accordion number={2} title="Parameterized Policies">
          <p className="text-sm text-text leading-relaxed">
            A parameterized policy <Eq tex="\pi_\theta(a|s)" inline /> maps states to action probabilities
            using learnable parameters θ. For discrete actions, the most common choice is the <strong>softmax policy</strong>:
          </p>
          <Eq tex="\pi_\theta(a|s) = \frac{e^{\theta_a^\top \phi(s)}}{\sum_{a'} e^{\theta_{a'}^\top \phi(s)}}" />
          <p className="text-sm text-text leading-relaxed">
            Here <Eq tex="\phi(s)" inline /> is a <strong>feature vector</strong> — a hand-crafted representation of the state.
            For CartPole, the features include normalized position, velocity, angle, and angular velocity, plus
            quadratic terms for the most important dimensions:
          </p>
          <div className="bg-surface-light rounded-lg p-3 my-3 font-mono text-xs text-text">
            <p className="m-0 mb-1 font-sans font-bold text-text-muted">CartPole features (7D):</p>
            <p className="m-0">φ(s) = [1, x/2.4, v/3.0, θ/0.21, ω/3.5, (θ/0.21)², (ω/3.5)²]</p>
            <p className="m-0 mt-2 mb-1 font-sans font-bold text-text-muted">Rocket Landing features (11D):</p>
            <p className="m-0">φ(s) = [1, x/2.4, v/3.0, y/1.0, vy/5.0, θ/0.21, ω/3.5,</p>
            <p className="m-0 pl-12">(θ/0.21)², (ω/3.5)², (y/1.0)², (vy/5.0)²]</p>
          </div>
          <p className="text-sm text-text leading-relaxed">
            The weight matrix W has one row per action: <strong>2×7</strong> for CartPole (2 actions),
            <strong> 3×11</strong> for Rocket Landing (3 actions). Each entry tells the policy how much to
            favor an action based on a particular feature.
          </p>
          <SoftmaxWidget />
        </Accordion>

        <Accordion number={3} title="The Policy Gradient Theorem">
          <p className="text-sm text-text leading-relaxed">
            The key question: how do we update θ to get more reward? The <strong>policy gradient theorem</strong>
            gives us the answer. Define the objective as expected total return:
          </p>
          <Eq tex="J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta}\left[\sum_t \gamma^t r_t\right]" />
          <p className="text-sm text-text leading-relaxed">
            The gradient of this objective is:
          </p>
          <Eq tex="\nabla_\theta J(\theta) = \mathbb{E}_{\pi_\theta}\left[\sum_t \nabla_\theta \log \pi_\theta(a_t|s_t) \cdot G_t\right]" />
          <p className="text-sm text-text leading-relaxed">
            In plain English: <strong>increase the probability of actions that led to high returns,
            decrease the probability of actions that led to low returns.</strong>
          </p>
          <div className="bg-surface-light rounded-lg p-3 my-3">
            <p className="text-xs font-bold text-text mb-2">Breaking it down:</p>
            <div className="space-y-1.5 text-xs text-text">
              <p className="m-0"><strong>∇ log π(a|s):</strong> The direction that most increases this action's probability</p>
              <p className="m-0"><strong>G<sub>t</sub>:</strong> The return from timestep t onward — "how good was this action?"</p>
              <p className="m-0"><strong>The product:</strong> Scale the probability adjustment by how much reward followed</p>
            </div>
          </div>
          <Callout type="think">
            This is remarkably intuitive: if an action led to a high return, push the policy to make it
            more likely. If it led to a low return, make it less likely. The gradient does this automatically.
          </Callout>
        </Accordion>

        <Accordion number={4} title="REINFORCE: Monte Carlo Policy Gradient">
          <p className="text-sm text-text leading-relaxed">
            <strong>REINFORCE</strong> is the simplest policy gradient algorithm. It collects a full episode,
            computes returns, and updates the policy:
          </p>
          <div className="bg-surface-light rounded-lg p-3 my-3">
            <p className="text-xs font-bold text-text mb-2">REINFORCE algorithm:</p>
            <ol className="text-xs text-text space-y-1.5 m-0 pl-4">
              <li>Run a full episode using current policy π<sub>θ</sub></li>
              <li>For each timestep t, compute return G<sub>t</sub> = r<sub>t</sub> + γr<sub>t+1</sub> + γ²r<sub>t+2</sub> + ...</li>
              <li>Compute advantage: A<sub>t</sub> = G<sub>t</sub> − b (baseline)</li>
              <li>Update: θ ← θ + α · ∇ log π<sub>θ</sub>(a<sub>t</sub>|s<sub>t</sub>) · A<sub>t</sub></li>
            </ol>
          </div>
          <p className="text-sm text-text leading-relaxed">
            For our softmax policy, the gradient has a clean form. For the chosen action a<sub>t</sub>:
          </p>
          <Eq tex="\nabla_\theta \log \pi_\theta(a_t|s_t) = \phi(s_t) \cdot \big(\mathbb{1}[a = a_t] - \pi_\theta(a|s_t)\big)" />
          <p className="text-sm text-text leading-relaxed">
            This pushes up the chosen action's weight and pushes down the others — scaled by how surprising
            the action was (if π was already high, the gradient is small).
          </p>
          <ReinforceWidget />
        </Accordion>

        <Accordion number={5} title="Baselines: Reducing Variance">
          <p className="text-sm text-text leading-relaxed">
            REINFORCE works in theory, but in practice it suffers from <strong>high variance</strong>. If all
            returns are positive (like CartPole's +1/step), every action gets reinforced — just some more than others.
            This makes learning very noisy.
          </p>
          <div className="bg-surface-light rounded-lg p-4 my-3 text-xs font-mono text-text-muted leading-relaxed">
            <p className="mb-1 font-sans font-bold text-text">Without baseline (CartPole, 200-step episode):</p>
            <p className="mb-0 ml-2">G{'\u2080'} = 200, G{'\u2081\u2080\u2080'} = 100, G{'\u2081\u2089\u2089'} = 1</p>
            <p className="mb-3 ml-2">All positive {'\u2192'} all actions reinforced (some more, some less)</p>
            <p className="mb-1 font-sans font-bold text-text">With baseline (b = 150, running mean):</p>
            <p className="mb-0 ml-2">G{'\u2080'} - b = +50  {'\u2192'} early actions reinforced (above average)</p>
            <p className="mb-0 ml-2">G{'\u2081\u2080\u2080'} - b = -50 {'\u2192'} mid actions discouraged (below average)</p>
            <p className="mb-3 ml-2">G{'\u2081\u2089\u2089'} - b = -149 {'\u2192'} late actions strongly discouraged</p>
            <p className="mb-0 ml-2 font-sans text-text">Now the signal is clear: early actions were good, late actions were bad.</p>
          </div>
          <p className="text-sm text-text leading-relaxed">
            The fix: subtract a <strong>baseline</strong> b from the return:
          </p>
          <Eq tex="\nabla_\theta J \approx \sum_t \nabla_\theta \log \pi_\theta(a_t|s_t) \cdot (G_t - b)" />
          <p className="text-sm text-text leading-relaxed">
            The key insight: subtracting any baseline that doesn't depend on the action <strong>doesn't change the
            expected gradient</strong> (it's unbiased) but can dramatically reduce variance.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
            <div className="bg-surface-light rounded-lg p-3">
              <p className="text-xs font-bold text-text mb-1">No Baseline</p>
              <p className="text-[10px] text-text-muted m-0">All positive returns → all actions reinforced. Slow, noisy learning.</p>
            </div>
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-lg p-3">
              <p className="text-xs font-bold text-accent-green mb-1">Running Mean Baseline</p>
              <p className="text-[10px] text-text-muted m-0">b = average episode return. Simple, effective. Used in our labs.</p>
            </div>
            <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-lg p-3">
              <p className="text-xs font-bold text-text mb-1">Value Function Baseline</p>
              <p className="text-[10px] text-text-muted m-0">b = V(s). Best variance reduction. This becomes Actor-Critic.</p>
            </div>
          </div>
          <Callout type="insight">
            With a good baseline, the advantage A<sub>t</sub> = G<sub>t</sub> − b tells us: "was this action
            <em> better or worse than average</em>?" Positive advantages reinforce, negative ones discourage.
            This is a much cleaner signal than raw returns.
          </Callout>
        </Accordion>

        <Accordion number={6} title="From Theory to Our Labs">
          <p className="text-sm text-text leading-relaxed">
            The REINFORCE algorithm is running in both the <strong>CartPole</strong> and <strong>Rocket Landing</strong> labs.
            Here's how the theory maps to practice:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
            <div className="bg-accent-yellow/10 border border-accent-yellow/30 rounded-lg p-3">
              <p className="text-xs font-bold text-accent-yellow mb-1"><img src={`${import.meta.env.BASE_URL}cartpole.png`} alt="" className="inline-block w-5 h-5 mr-1 align-middle" /> Classic CartPole</p>
              <div className="text-[10px] text-text-muted space-y-1">
                <p className="m-0"><strong>State:</strong> 4D (x, v, θ, ω)</p>
                <p className="m-0"><strong>Features:</strong> 7D with quadratics</p>
                <p className="m-0"><strong>Actions:</strong> 2 (left/right push)</p>
                <p className="m-0"><strong>Weights:</strong> 2×7 = 14 parameters</p>
                <p className="m-0"><strong>Goal:</strong> Balance 500 steps</p>
                <p className="m-0"><strong>Baseline:</strong> Running mean return</p>
              </div>
            </div>
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
              <p className="text-xs font-bold text-primary-light mb-1">{"🚀"} Rocket Landing</p>
              <div className="text-[10px] text-text-muted space-y-1">
                <p className="m-0"><strong>State:</strong> 6D (+ altitude, vertical vel)</p>
                <p className="m-0"><strong>Features:</strong> 11D with quadratics</p>
                <p className="m-0"><strong>Actions:</strong> 3 (left/right/bottom thrust)</p>
                <p className="m-0"><strong>Weights:</strong> 3×11 = 33 parameters</p>
                <p className="m-0"><strong>Goal:</strong> Soft landing from altitude</p>
                <p className="m-0"><strong>Baseline:</strong> Running mean return</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-text leading-relaxed">
            Notice how REINFORCE scales: going from CartPole to Rocket Landing just means more features and one more action.
            The same algorithm handles both — we just need richer state representations for harder problems.
          </p>

          <div className="flex flex-wrap gap-3 my-3">
            <SimButton label="Try CartPole Lab" to="/cartpole" />
            <SimButton label="Try Rocket Landing Lab" to="/rocket-landing" />
          </div>

          <Callout type="try">
            In CartPole, compare REINFORCE with Q-Learning. REINFORCE typically learns to balance more consistently,
            while Q-Learning (with discretization) can be more sample-efficient early on. In Rocket Landing,
            REINFORCE must learn to use the bottom thruster for controlled descent — watch how it discovers this!
          </Callout>
        </Accordion>

        <Accordion number={7} title="The Big Picture: Where Policy Gradients Lead">
          <p className="text-sm text-text leading-relaxed">
            REINFORCE is just the beginning. The ideas in this chapter are the foundation of <strong>all modern deep RL</strong>:
          </p>

          <div className="space-y-2 my-3">
            <div className="bg-surface-light rounded-lg p-3">
              <p className="text-xs font-bold text-text mb-0.5">Actor-Critic</p>
              <p className="text-[10px] text-text-muted m-0">
                Replace the Monte Carlo return with a learned value function V(s) as the baseline.
                The "actor" is the policy, the "critic" is the value function. Best of both worlds.
              </p>
            </div>
            <div className="bg-surface-light rounded-lg p-3">
              <p className="text-xs font-bold text-text mb-0.5">PPO (Proximal Policy Optimization)</p>
              <p className="text-[10px] text-text-muted m-0">
                Clip the policy gradient to prevent too-large updates. Simple, stable, and the workhorse
                behind ChatGPT's RLHF training.
              </p>
            </div>
            <div className="bg-surface-light rounded-lg p-3">
              <p className="text-xs font-bold text-text mb-0.5">Deep Policy Gradients</p>
              <p className="text-[10px] text-text-muted m-0">
                Replace our hand-crafted features φ(s) with a neural network. The network learns its own
                features — this is how RL scales to images, language, and robotics.
              </p>
            </div>
          </div>

          <Callout type="insight">
            You now have the complete foundation: MDPs define the problem (Ch. 5), value functions measure
            quality (Ch. 6), Bellman equations give recursive structure (Ch. 7), TD learning enables
            step-by-step updates (Ch. 9), and policy gradients optimize behavior directly (this chapter).
            Every modern RL algorithm is built from these building blocks.
          </Callout>

          <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-4 mt-4">
            <p className="text-sm font-bold text-accent-green mb-1">{"🎓"} Congratulations!</p>
            <p className="text-xs text-text leading-relaxed m-0">
              You've completed the full RL learning path — from "What is RL?" through policy gradients.
              You now understand the core ideas behind every major RL algorithm. Head to the labs to see
              these algorithms in action, or revisit any chapter to deepen your understanding.
            </p>
          </div>

          <ValueVsPolicyWidget />
        </Accordion>

      </div>

      <ChapterNav
        prev={{ path: '/learn/td-learning', label: 'Ch 9: TD Learning' }}
      />
    </div>
  )
}
