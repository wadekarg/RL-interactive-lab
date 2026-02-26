import { useState, useEffect, useRef, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import katex from 'katex'

/* ══════════════════════════════════════════
   REUSABLE PRIMITIVES
   ══════════════════════════════════════════ */

function Eq({ tex, inline }: { tex: string; inline?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (ref.current) {
      katex.render(tex, ref.current, { throwOnError: false, displayMode: !inline })
    }
  }, [tex, inline])
  return <span ref={ref} className={inline ? 'inline-block align-middle mx-0.5' : 'block my-3 overflow-x-auto'} />
}

function Accordion({ title, number, defaultOpen, children }: {
  title: string; number: number; defaultOpen?: boolean; children: ReactNode
}) {
  const [open, setOpen] = useState(!!defaultOpen)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | undefined>(defaultOpen ? undefined : 0)

  useEffect(() => {
    if (!bodyRef.current) return
    if (open) {
      setHeight(bodyRef.current.scrollHeight)
      const id = setTimeout(() => setHeight(undefined), 300)
      return () => clearTimeout(id)
    } else {
      setHeight(bodyRef.current.scrollHeight)
      requestAnimationFrame(() => setHeight(0))
    }
  }, [open])

  return (
    <div className="bg-surface-light rounded-xl border border-surface-lighter overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-6 py-4 cursor-pointer bg-transparent border-0 text-left hover:bg-surface-lighter/30 transition-colors"
      >
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary-light text-sm font-bold flex items-center justify-center">
          {number}
        </span>
        <span className="text-lg font-bold text-text flex-1">{title}</span>
        <span className={`text-text-muted transition-transform duration-300 text-xl ${open ? 'rotate-180' : ''}`}>
          &#9662;
        </span>
      </button>
      <div
        ref={bodyRef}
        style={{ height: height !== undefined ? `${height}px` : 'auto', overflow: 'hidden', transition: 'height 0.3s ease' }}
      >
        <div className="px-6 pb-6 pt-2">{children}</div>
      </div>
    </div>
  )
}

function Callout({ type, title, children }: {
  type: 'insight' | 'think' | 'try'; title?: string; children: ReactNode
}) {
  const styles = {
    insight: 'border-l-4 border-accent-green bg-accent-green/5',
    think: 'border-l-4 border-accent-yellow bg-accent-yellow/5',
    try: 'border-l-4 border-primary bg-primary/5',
  }
  const labels = { insight: 'Key Insight', think: 'Think About It', try: 'Try It' }
  const labelColors = { insight: 'text-accent-green', think: 'text-accent-yellow', try: 'text-primary-light' }

  return (
    <div className={`${styles[type]} rounded-r-lg p-4 my-4`}>
      <p className={`text-xs font-bold uppercase tracking-wider ${labelColors[type]} mb-1`}>
        {title ?? labels[type]}
      </p>
      <div className="text-sm text-text leading-relaxed">{children}</div>
    </div>
  )
}

function StepBox({ steps }: { steps: { label: string; detail: string; type: 'explore' | 'exploit' | 'neutral' }[] }) {
  const colors = {
    explore: 'border-accent-blue bg-accent-blue/10',
    exploit: 'border-accent-green bg-accent-green/10',
    neutral: 'border-surface-lighter bg-surface',
  }
  const badges = {
    explore: <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-accent-blue/20 text-accent-blue">Explore</span>,
    exploit: <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-accent-green/20 text-accent-green">Exploit</span>,
    neutral: null,
  }
  return (
    <div className="flex flex-col gap-2 my-4">
      {steps.map((s, i) => (
        <div key={i} className={`border-l-4 ${colors[s.type]} rounded-r-lg p-3`}>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-bold text-text">Step {i + 1}: {s.label}</span>
            {badges[s.type]}
          </div>
          <p className="text-xs text-text-muted leading-relaxed m-0">{s.detail}</p>
        </div>
      ))}
    </div>
  )
}

function SimButton({ label, to, className }: { label?: string; to?: string; className?: string }) {
  return (
    <Link
      to={to ?? '/cartpole'}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium no-underline hover:bg-primary-dark transition-colors ${className ?? ''}`}
    >
      <span>{'\uD83D\uDE80'}</span> {label ?? 'Try it in the Simulator'}
    </Link>
  )
}

/* ══════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════ */

export function ClassicCartPoleGuidePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="mb-10 text-center">
        <Link to="/cartpole" className="text-sm text-primary-light hover:underline no-underline mb-4 inline-block">
          &larr; Back to Simulator
        </Link>
        <h1 className="text-4xl font-bold text-text mb-3">
          Classic CartPole &amp; Balance Control
        </h1>
        <p className="text-lg text-text-muted max-w-2xl mx-auto">
          Dabak's first challenge: stay balanced on the test stand. Learn the fundamentals of
          continuous control before attempting a real landing.
        </p>
        <div className="flex justify-center gap-3 mt-4 text-xs text-text-muted">
          <span className="bg-surface-light px-3 py-1 rounded-full">8 sections</span>
          <span className="bg-surface-light px-3 py-1 rounded-full">3 algorithms</span>
          <span className="bg-surface-light px-3 py-1 rounded-full">Training narrative</span>
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-4">

        {/* ── SECTION 1 ── */}
        <Accordion number={1} title="From Grids to Continuous Worlds" defaultOpen>
          <p className="text-sm text-text leading-relaxed mb-4">
            Before we attempt a real landing, let's learn balance. In GridWorld, Boru's world was made
            of discrete cells — a finite number of states. State (2,3) was clearly different from (2,4).
            We could list every state and build a Q-table with one row per state.
          </p>
          <p className="text-sm text-text leading-relaxed mb-4">
            But real-world problems are almost never this clean. A pole balanced on a cart doesn't have
            a handful of positions — it sweeps through every angle continuously. The cart slides along a
            track through every possible position and velocity. This is where continuous control begins.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-blue mb-2">GridWorld (Discrete)</h4>
              <p className="text-xs text-text-muted mb-2">36 cells on a 6x6 grid</p>
              <p className="text-xs text-text leading-relaxed m-0">
                Every state is a grid cell. We can build a Q-table with one row per state. 36 states × 4 actions = 144 Q-values. Done!
              </p>
            </div>
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-green mb-2">CartPole (Continuous)</h4>
              <p className="text-xs text-text-muted mb-2">4 real-valued state variables</p>
              <p className="text-xs text-text leading-relaxed m-0">
                Position = 0.37, velocity = -0.12, angle = 0.038 rad, angular velocity = 0.91.
                There are <em>infinite</em> possible states across 4 dimensions. No table can hold them all.
              </p>
            </div>
          </div>

          <Callout type="insight">
            This is the fundamental challenge of continuous state spaces: there are too many states to visit,
            let alone store Q-values for. Every algorithm in this module is a different strategy for dealing
            with this problem — and understanding these strategies is the key to modern RL.
          </Callout>
        </Accordion>

        {/* ── SECTION 2 ── */}
        <Accordion number={2} title="Meet Dabak: Training on the Test Stand">
          <p className="text-sm text-text leading-relaxed mb-4">
            Dabak is training on a test stand — a cart-and-pole balancing rig. A pole is hinged on top of a cart
            that slides left and right on a track. Dabak must keep the pole upright by pushing the cart. If the
            pole tips too far or the cart rolls off the edge, Dabak has failed. The goal: survive as long as possible.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
            {[
              { label: 'Cart position', symbol: 'x' },
              { label: 'Cart velocity', symbol: 'v' },
              { label: 'Pole angle', symbol: '\u03B8' },
              { label: 'Angular velocity', symbol: '\u03C9' },
            ].map((m) => (
              <div key={m.symbol} className="bg-surface rounded-lg p-3 text-center">
                <span className="text-lg font-bold text-primary-light">{m.symbol}</span>
                <p className="text-xs font-semibold text-text mt-1 mb-0">{m.label}</p>
              </div>
            ))}
          </div>

          <p className="text-sm text-text leading-relaxed mb-2">
            <strong>Rules:</strong>
          </p>
          <ul className="text-sm text-text-muted space-y-1 mb-4">
            <li className="flex items-start gap-2"><span className="text-primary-light">-</span>Dabak gets +1 reward for every timestep it keeps the pole balanced</li>
            <li className="flex items-start gap-2"><span className="text-primary-light">-</span>500 steps = solved — Dabak has mastered the test stand</li>
            <li className="flex items-start gap-2"><span className="text-primary-light">-</span>|{'\u03B8'}| &gt; 12{'\u00B0'} = pole fell too far — episode over</li>
            <li className="flex items-start gap-2"><span className="text-primary-light">-</span>|x| &gt; 2.4 = cart left the track — episode over</li>
            <li className="flex items-start gap-2"><span className="text-primary-light">-</span>2 actions: push left or push right</li>
          </ul>

          <Callout type="think">
            Notice the simple reward: +1 for every step alive. There is no bonus for "good" balance or
            penalty for wobbling. The only signal is survival. This makes the problem deceptively simple —
            Dabak must figure out that keeping the pole centered <em>now</em> leads to staying alive <em>later</em>.
          </Callout>

          <SimButton label="See Dabak on the test stand" className="mt-2" />
        </Accordion>

        {/* ── SECTION 3 ── */}
        <Accordion number={3} title="The State Space: Four Numbers">
          <p className="text-sm text-text leading-relaxed mb-4">
            Dabak's entire situation at any moment is captured by just 4 numbers. Together, they tell you
            everything you need to know to decide whether to push left or right.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            {[
              { symbol: 'x', name: 'Cart Position', range: '[-2.4, 2.4]', desc: 'How far left or right of center. Outside this range = cart fell off the track.', color: 'text-accent-blue' },
              { symbol: 'v', name: 'Cart Velocity', range: '(-\u221E, +\u221E)', desc: 'How fast the cart is moving. Positive = moving right.', color: 'text-accent-green' },
              { symbol: '\u03B8', name: 'Pole Angle', range: '[-12\u00B0, 12\u00B0]', desc: 'How tilted the pole is from vertical. Outside \u00B112\u00B0 = pole fell.', color: 'text-primary-light' },
              { symbol: '\u03C9', name: 'Angular Velocity', range: '(-\u221E, +\u221E)', desc: 'How fast the pole angle is changing. The key to anticipating falls.', color: 'text-accent-yellow' },
            ].map((v) => (
              <div key={v.symbol} className="bg-surface rounded-xl p-4 border border-surface-lighter">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xl font-bold ${v.color}`}>{v.symbol}</span>
                  <span className="text-sm font-bold text-text">{v.name}</span>
                </div>
                <p className="text-xs text-text-muted mb-1">Range: {v.range}</p>
                <p className="text-xs text-text leading-relaxed m-0">{v.desc}</p>
              </div>
            ))}
          </div>

          <Callout type="insight">
            The Markov property still holds: these 4 numbers are <em>everything</em> you need. You don't need
            to know what happened 5 steps ago — the current state fully determines what's possible next.
            This is why the CartPole problem is still an MDP, just like GridWorld — but with continuous states.
          </Callout>

          <p className="text-sm text-text leading-relaxed">
            <strong>How many states are there?</strong> Infinite. Each variable is a real number with infinite
            precision. Even if you only consider values to 3 decimal places, the combinations are enormous.
            No table can hold Q-values for all of them. This is the challenge we need to solve.
          </p>
        </Accordion>

        {/* ── SECTION 4 ── */}
        <Accordion number={4} title="Why Boru's Q-Table Won't Work Here">
          <p className="text-sm text-text leading-relaxed mb-4">
            In GridWorld, Q-Learning stored one row per state in its table. With 36 states and 4 actions,
            that's 144 numbers — trivial. But the CartPole problem has infinite states across 4 dimensions.
          </p>

          <div className="bg-surface rounded-lg p-4 mb-4">
            <p className="text-sm text-text leading-relaxed">
              <strong>The Curse of Dimensionality:</strong> Even if you tried to discretize each of the 4
              variables into just 10 bins, you'd get 10{'\u2074'} = 10,000 states. With 2 actions,
              that's 20,000 Q-values. That's actually much more manageable than the 6D rocket landing
              problem (10{'\u2076'} = 1,000,000 states) — but it's still a far cry from GridWorld's 144.
            </p>
          </div>

          <div className="bg-surface rounded-lg p-4 my-3 text-xs font-mono text-text-muted leading-relaxed">
            <p className="mb-1">GridWorld: 36 states × 4 actions = <strong className="text-text">144 Q-values</strong></p>
            <p className="mb-1">CartPole (10 bins each): 10{'\u2074'} × 2 = <strong className="text-text">20,000 Q-values</strong></p>
            <p className="mb-1">CartPole (100 bins each): 100{'\u2074'} × 2 = <strong className="text-text">200,000,000 Q-values</strong></p>
            <p className="mb-0">CartPole (exact): {'\u221E'} × 2 = <strong className="text-accent-red">impossible</strong></p>
          </div>

          <Callout type="think">
            With only 4 dimensions, CartPole sits in a sweet spot: the curse of dimensionality is real but not
            devastating. 10,000 states is large but tractable — making this the perfect problem to practice
            discretization before tackling the much harder 6D rocket landing (where 10{'\u2076'} states become
            truly painful). Think of CartPole as training wheels for continuous RL.
          </Callout>
        </Accordion>

        {/* ── SECTION 5 ── */}
        <Accordion number={5} title="Strategy 1: Discretized Q-Learning">
          <p className="text-sm text-text leading-relaxed mb-4">
            This is exactly Boru's Q-Learning from GridWorld, but with one extra step: before looking up
            Q-values, convert the continuous 4D state to a bin key.
          </p>

          <Eq tex="Q(\text{bin}(s), a) \leftarrow Q(\text{bin}(s),a) + \alpha \Big[ r + \gamma \max_{a'} Q(\text{bin}(s'),a') - Q(\text{bin}(s),a) \Big]" />

          <p className="text-sm text-text leading-relaxed mb-4">
            <strong>4D Binning:</strong> We chop each of the 4 state variables into bins. With the default
            configuration of 6 bins for x, 6 for v, 12 for {'\u03B8'}, and 12 for {'\u03C9'}:
          </p>
          <Eq tex="6 \times 6 \times 12 \times 12 = 5{,}184 \text{ discrete states}" />

          <p className="text-sm text-text leading-relaxed mb-4">
            With 2 actions, that's 10,368 Q-values — well within reach. The 4D problem is much more
            forgiving than the 6D rocket landing, where the same approach yields hundreds of thousands of states.
          </p>

          <StepBox steps={[
            {
              label: 'Observe 4D state: x=0.37, v=-0.12, \u03B8=0.038, \u03C9=0.85',
              detail: 'Dabak reads its sensors. Four real numbers describe its complete situation.',
              type: 'neutral',
            },
            {
              label: 'Discretize: bin(s) = [3, 2, 7, 8]',
              detail: 'Each of the 4 variables is mapped to its bin. Now we have a discrete key for the Q-table.',
              type: 'neutral',
            },
            {
              label: '\u03B5-greedy: with probability \u03B5, pick random; else pick argmax Q',
              detail: 'Same exploration strategy as GridWorld. Random action for discovery, best known action for exploitation.',
              type: 'explore',
            },
            {
              label: 'Execute action, observe reward and next state',
              detail: 'Dabak pushes the cart left or right, physics advances one timestep, and we get the new 4D state + reward (+1).',
              type: 'exploit',
            },
            {
              label: 'Update Q-table at bin(s) using standard Q-Learning',
              detail: 'The exact same update rule as GridWorld. The only difference is the state key came from 4D binning.',
              type: 'neutral',
            },
          ]} />

          <Callout type="try">
            In the simulator, try changing the bin count. With very few bins (3-4), the agent learns fast
            but plateaus early — it can't distinguish critical angle differences. With many bins (15+), it
            learns slowly because there are too many states to visit. The sweet spot is usually 6-12 bins
            for the angle dimensions and 4-6 for position and velocity.
          </Callout>

          <SimButton label="Try Discretized Q-Learning on CartPole" className="mt-2" />
        </Accordion>

        {/* ── SECTION 6 ── */}
        <Accordion number={6} title="A New Family: Policy Gradient Methods">
          <p className="text-sm text-text leading-relaxed mb-4">
            So far, every algorithm we've seen learns <em>values</em> (Q-values or state values) and then
            derives a policy from them. There's a completely different approach: learn the <em>policy directly</em>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-blue mb-2">Value-Based (Q-Learning)</h4>
              <p className="text-xs text-text-muted mb-2">"Learn how good each action is"</p>
              <p className="text-xs text-text leading-relaxed m-0">
                Learn Q(s,a) for every state-action pair. The policy is implicit: always pick the action
                with the highest Q-value. <strong>Indirect</strong> — learn values, derive policy.
              </p>
            </div>
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-green mb-2">Policy-Based (REINFORCE)</h4>
              <p className="text-xs text-text-muted mb-2">"Learn the policy itself"</p>
              <p className="text-xs text-text leading-relaxed m-0">
                Learn a function {'\u03C0'}(a|s) that directly outputs the probability of each action.
                No Q-values needed. <strong>Direct</strong> — learn policy, skip values.
              </p>
            </div>
          </div>

          <p className="text-sm text-text leading-relaxed mb-4">
            <strong>Why bother?</strong> Policy gradient methods have several advantages:
          </p>
          <ul className="text-sm text-text-muted space-y-1 mb-4">
            <li className="flex items-start gap-2"><span className="text-primary-light">-</span>They naturally handle continuous states without discretization</li>
            <li className="flex items-start gap-2"><span className="text-primary-light">-</span>They can learn stochastic policies (useful when randomness is optimal)</li>
            <li className="flex items-start gap-2"><span className="text-primary-light">-</span>They scale better to high-dimensional problems</li>
            <li className="flex items-start gap-2"><span className="text-primary-light">-</span>They're the foundation of modern deep RL (PPO, A3C, SAC all build on this)</li>
          </ul>

          <Callout type="insight">
            The shift from value-based to policy-based methods is one of the most important transitions
            in RL. Q-Learning asks "how good is this action?" Policy gradient asks "how likely should
            this action be?" Both answer the same question — which action to take — but from completely
            different angles.
          </Callout>
        </Accordion>

        {/* ── SECTION 7 ── */}
        <Accordion number={7} title="Strategy 2: REINFORCE — Learning a Policy Directly">
          <p className="text-sm text-text leading-relaxed mb-4">
            REINFORCE is the simplest policy gradient algorithm. Its idea is beautifully intuitive:
          </p>

          <div className="bg-surface rounded-lg p-4 mb-4">
            <p className="text-sm text-text leading-relaxed">
              <strong>The intuition:</strong> "Play a full episode. If the episode lasted a long time (great!),
              make the actions you took more likely. If it ended quickly (bad!), make them less likely.
              Over many episodes, good balancing patterns will dominate."
            </p>
          </div>

          <Eq tex="\theta \leftarrow \theta + \alpha \sum_{t=0}^{T-1} (G_t - b) \, \nabla_\theta \log \pi_\theta(a_t | s_t)" />

          <div className="bg-surface rounded-lg p-4 my-3 text-sm text-text-muted">
            <p className="mb-1"><Eq tex="\theta" inline /> = policy parameters (weights)</p>
            <p className="mb-1"><Eq tex="G_t" inline /> = return from time t (discounted sum of future rewards)</p>
            <p className="mb-1"><Eq tex="b" inline /> = baseline (running mean return) for variance reduction</p>
            <p className="mb-0"><Eq tex="\nabla_\theta \log \pi_\theta(a_t | s_t)" inline /> = direction to increase the probability of action <Eq tex="a_t" inline /></p>
          </div>

          <h4 className="text-sm font-bold text-text mt-5 mb-2">Our Policy: Linear Softmax</h4>
          <p className="text-sm text-text leading-relaxed mb-2">
            Instead of a neural network, we use a simple linear model. The 4D state is converted to 7 features:
          </p>

          <div className="bg-surface rounded-lg p-4 my-3 text-xs font-mono text-text-muted leading-relaxed">
            <p className="mb-1">{'\u03C6'}(s) = [1, x/2.4, v/3.0, {'\u03B8'}/0.21, {'\u03C9'}/3.5, ({'\u03B8'}/0.21){'\u00B2'}, ({'\u03C9'}/3.5){'\u00B2'}]</p>
            <p className="mb-1">        bias  position  velocity  angle  ang.vel  quadratic features</p>
            <p className="mb-0">Then: {'\u03C0'}(a|s) = softmax(W {'\u00B7'} {'\u03C6'}(s)), where W is a 2×7 weight matrix</p>
          </div>

          <Callout type="think">
            The quadratic features ({'\u03B8'}{'\u00B2'}, {'\u03C9'}{'\u00B2'}) are important. They let the policy
            distinguish "tilted left" from "tilted right" even though the magnitude is the same, and capture
            nonlinear relationships like "push harder when the pole is falling fast."
          </Callout>

          <StepBox steps={[
            {
              label: 'Play a full episode (Dabak balances until pole falls or 500 steps)',
              detail: 'Record every (state, action, reward) triple in a trajectory buffer.',
              type: 'explore',
            },
            {
              label: 'Compute discounted returns G_t for each timestep',
              detail: 'Starting from the end: G_T = r_T, G_{T-1} = r_{T-1} + \u03B3 \u00D7 G_T, and so on. This tells us how much total reward followed each action.',
              type: 'neutral',
            },
            {
              label: 'Subtract baseline (mean return) for variance reduction',
              detail: 'If this episode\'s return was above average, actions get reinforced. Below average, they get discouraged. This dramatically reduces learning noise.',
              type: 'neutral',
            },
            {
              label: 'Update weights using the policy gradient',
              detail: 'For each timestep: adjust W to make the taken action more/less likely, proportional to (G_t - baseline).',
              type: 'exploit',
            },
          ]} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-lg p-3">
              <h4 className="text-xs font-bold text-accent-green mb-1">Pros</h4>
              <ul className="text-xs text-text-muted m-0 pl-4">
                <li>Works directly with continuous states — no discretization needed</li>
                <li>Foundation of modern deep RL (PPO, A3C, etc.)</li>
                <li>Can learn stochastic policies</li>
              </ul>
            </div>
            <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-3">
              <h4 className="text-xs font-bold text-accent-red mb-1">Cons</h4>
              <ul className="text-xs text-text-muted m-0 pl-4">
                <li>High variance — learning can be noisy and slow</li>
                <li>Updates only at episode end (inefficient per timestep)</li>
                <li>Can converge to local optima</li>
              </ul>
            </div>
          </div>

          <SimButton label="Watch REINFORCE learn to balance" className="mt-2" />
        </Accordion>

        {/* ── SECTION 8 ── */}
        <Accordion number={8} title="Next Step: Rocket Landing">
          <p className="text-sm text-text leading-relaxed mb-5">
            Dabak has learned to balance on the test stand — keeping a pole upright with only 4 state variables
            and 2 actions. But balance is just the beginning. The real challenge awaits: a full rocket landing
            with gravity, altitude, descent rate, and tilt control.
          </p>

          <p className="text-sm text-text leading-relaxed mb-5">
            Once Dabak masters balance, it graduates to real descent under gravity. The rocket landing problem
            expands to 6 dimensions and 3 actions — a significant jump in complexity that tests whether
            the strategies learned here can scale.
          </p>

          <div className="flex flex-col gap-4">
            <div className="bg-surface rounded-xl p-4 border border-surface-lighter">
              <h4 className="text-sm font-bold text-text mb-1">From 4D to 6D</h4>
              <p className="text-xs text-text-muted italic mb-2">"Two new dimensions change everything"</p>
              <p className="text-sm text-text-muted leading-relaxed mb-2">
                CartPole has position, velocity, angle, and angular velocity. The rocket adds altitude (y) and
                descent rate (vy). These two extra dimensions transform the problem from balance to controlled descent —
                Dabak must manage altitude <em>and</em> orientation simultaneously.
              </p>
              <p className="text-xs text-primary-light">
                4D: 10{'\u2074'} = 10,000 discretized states. 6D: 10{'\u2076'} = 1,000,000.
                The curse of dimensionality hits hard.
              </p>
            </div>

            <div className="bg-surface rounded-xl p-4 border border-surface-lighter">
              <h4 className="text-sm font-bold text-text mb-1">From 2 Actions to 3</h4>
              <p className="text-xs text-text-muted italic mb-2">"A third thruster fights gravity"</p>
              <p className="text-sm text-text-muted leading-relaxed mb-2">
                In CartPole, Dabak only pushes left or right. The rocket adds a bottom thruster that fights
                gravity — introducing a whole new dimension of strategy. When to thrust down? How to balance
                horizontal correction against descent rate? The action space gets richer.
              </p>
            </div>

            <div className="bg-surface rounded-xl p-4 border border-surface-lighter">
              <h4 className="text-sm font-bold text-text mb-1">From Survival to Soft Landing</h4>
              <p className="text-xs text-text-muted italic mb-2">"The reward gets shaped"</p>
              <p className="text-sm text-text-muted leading-relaxed mb-2">
                CartPole's reward is dead simple: +1 per step alive. The rocket introduces shaped rewards —
                big bonuses for soft landings, penalties for crashes. Dabak must learn not just to survive,
                but to achieve a specific goal: touch down gently, centered on the pad.
              </p>
            </div>
          </div>

          <Callout type="insight">
            Everything you learned here transfers directly to the rocket problem. Discretized Q-Learning
            still works (just with more bins). REINFORCE still works (just with more features). The
            concepts are the same — only the scale changes. Master balance first, then aim for the stars.
          </Callout>

          <div className="mt-4 text-center">
            <SimButton to="/rocket-landing" label="Try the Rocket Landing Challenge" />
          </div>
        </Accordion>
      </div>

      {/* Footer */}
      <div className="mt-10 text-center">
        <p className="text-sm text-text-muted mb-3">
          Dabak has mastered balance! Ready for the real challenge?
        </p>
        <SimButton to="/rocket-landing" label="Advance to Rocket Landing" />
      </div>
    </div>
  )
}
