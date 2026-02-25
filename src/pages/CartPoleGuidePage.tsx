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

function SimButton({ label, className }: { label?: string; className?: string }) {
  return (
    <Link
      to="/cartpole"
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium no-underline hover:bg-primary-dark transition-colors ${className ?? ''}`}
    >
      <span>{'\uD83D\uDE80'}</span> {label ?? 'Try it in the Simulator'}
    </Link>
  )
}

/* ══════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════ */

export function CartPoleGuidePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="mb-10 text-center">
        <Link to="/cartpole" className="text-sm text-primary-light hover:underline no-underline mb-4 inline-block">
          &larr; Back to Simulator
        </Link>
        <h1 className="text-4xl font-bold text-text mb-3">
          Cart-Pole &amp; Continuous Control
        </h1>
        <p className="text-lg text-text-muted max-w-2xl mx-auto">
          From grids to real numbers. Follow Dabak as it learns to land
          in a world where states are continuous — the bridge to modern deep RL.
        </p>
        <div className="flex justify-center gap-3 mt-4 text-xs text-text-muted">
          <span className="bg-surface-light px-3 py-1 rounded-full">10 sections</span>
          <span className="bg-surface-light px-3 py-1 rounded-full">3 algorithms</span>
          <span className="bg-surface-light px-3 py-1 rounded-full">Dabak narrative</span>
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-4">

        {/* ── SECTION 1 ── */}
        <Accordion number={1} title="From Grids to Continuous Worlds" defaultOpen>
          <p className="text-sm text-text leading-relaxed mb-4">
            In GridWorld, Boru's world was made of discrete cells — a finite number of states. State (2,3) was
            clearly different from (2,4). We could list every state and build a Q-table with one row per state.
          </p>
          <p className="text-sm text-text leading-relaxed mb-4">
            But real-world problems are almost never this clean. A car doesn't jump from "speed = 50 km/h" to
            "speed = 51 km/h" — it passes through every value in between. A robot arm doesn't have 4 joint
            angles — it has infinite possible positions.
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
              <h4 className="text-sm font-bold text-accent-green mb-2">Cart-Pole (Continuous)</h4>
              <p className="text-xs text-text-muted mb-2">4 real-valued state variables</p>
              <p className="text-xs text-text leading-relaxed m-0">
                Position = 1.37, velocity = -0.42, angle = 0.038 rad, angular velocity = 0.91. There are <em>infinite</em> possible states. No table can hold them all.
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
        <Accordion number={2} title="Meet Dabak: A Rocket Learning to Land">
          <p className="text-sm text-text leading-relaxed mb-4">
            Dabak is a small rocket learning to land on a launchpad. It dreams of one day reaching Mars, but first it must
            master the basics right here on Earth. The physics are simple: a pole (the rocket) is balanced on a cart (the landing pad). At each moment, Dabak can fire a left or right thruster.
          </p>

          <div className="bg-surface rounded-lg p-4 mb-4">
            <p className="text-sm text-text leading-relaxed">
              <strong>The mapping:</strong> Cart-pole is one of the most famous RL benchmark problems (OpenAI Gym
              CartPole-v1). We're dressing it up as rocket landing because the physics are identical:
              keep something upright by applying sideways force.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
            {[
              { cart: 'Cart position', rocket: 'Rocket horizontal position', symbol: 'x' },
              { cart: 'Cart velocity', rocket: 'Rocket drift speed', symbol: 'v' },
              { cart: 'Pole angle', rocket: 'Rocket tilt', symbol: '\u03B8' },
              { cart: 'Pole angular velocity', rocket: 'Rocket spin rate', symbol: '\u03C9' },
            ].map((m) => (
              <div key={m.symbol} className="bg-surface rounded-lg p-3 text-center">
                <span className="text-lg font-bold text-primary-light">{m.symbol}</span>
                <p className="text-xs font-semibold text-text mt-1 mb-0">{m.rocket}</p>
                <p className="text-xs text-text-muted mt-1 mb-0">{m.cart}</p>
              </div>
            ))}
          </div>

          <p className="text-sm text-text leading-relaxed mb-2">
            <strong>Rules:</strong>
          </p>
          <ul className="text-sm text-text-muted space-y-1 mb-4">
            <li className="flex items-start gap-2"><span className="text-primary-light">-</span>Dabak gets +1 reward for every timestep it stays balanced</li>
            <li className="flex items-start gap-2"><span className="text-primary-light">-</span>Episode ends if tilt exceeds {'\u00B1'}12{'\u00B0'} or position exceeds {'\u00B1'}2.4 units</li>
            <li className="flex items-start gap-2"><span className="text-primary-light">-</span>Surviving 500 steps = perfect landing (maximum score)</li>
            <li className="flex items-start gap-2"><span className="text-primary-light">-</span>Only 2 actions: left thrust or right thrust</li>
          </ul>

          <Callout type="think">
            Notice: the reward is just +1 per step. There's no "goal state" like GridWorld's water hole.
            The challenge is purely about <em>survival</em>. Episode duration IS the metric — longer is better.
          </Callout>

          <SimButton label="See Dabak in the simulator" className="mt-2" />
        </Accordion>

        {/* ── SECTION 3 ── */}
        <Accordion number={3} title="The State Space: Four Numbers That Describe Everything">
          <p className="text-sm text-text leading-relaxed mb-4">
            Dabak's entire situation at any moment is captured by just 4 numbers. Together, they tell you
            everything you need to know to decide what action to take.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            {[
              { symbol: 'x', name: 'Position', range: '[-2.4, 2.4]', desc: 'How far left or right of center. Outside this range = crash.', color: 'text-accent-blue' },
              { symbol: 'v', name: 'Velocity', range: '(-\u221E, +\u221E)', desc: 'How fast Dabak is drifting. Positive = moving right.', color: 'text-accent-green' },
              { symbol: '\u03B8', name: 'Tilt Angle', range: '[-12\u00B0, 12\u00B0]', desc: 'How tilted the rocket is. Outside \u00B112\u00B0 = crash.', color: 'text-accent-yellow' },
              { symbol: '\u03C9', name: 'Angular Velocity', range: '(-\u221E, +\u221E)', desc: 'How fast the tilt is changing. The key to anticipating crashes.', color: 'text-accent-red' },
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
            This is why Cart-Pole is still an MDP, just like GridWorld — but with continuous states.
          </Callout>

          <p className="text-sm text-text leading-relaxed">
            <strong>How many states are there?</strong> Infinite. Each variable is a real number with infinite
            precision. Even if you only consider values to 3 decimal places, there are trillions of combinations.
            No table can hold Q-values for all of them. This is the challenge we need to solve.
          </p>
        </Accordion>

        {/* ── SECTION 4 ── */}
        <Accordion number={4} title="Why Boru's Q-Table Won't Work Here">
          <p className="text-sm text-text leading-relaxed mb-4">
            In GridWorld, Q-Learning stored one row per state in its table. With 36 states and 4 actions,
            that's 144 numbers — trivial. But Cart-Pole has infinite states.
          </p>

          <div className="bg-surface rounded-lg p-4 mb-4">
            <p className="text-sm text-text leading-relaxed">
              <strong>The Curse of Dimensionality:</strong> Even if you tried to discretize each of the 4
              variables into just 100 bins, you'd get 100{'\u2074'} = 100,000,000 states. With 2 actions,
              that's 200 million Q-values. Most would never be visited, so they'd never be learned.
            </p>
          </div>

          <div className="bg-surface rounded-lg p-4 my-3 text-xs font-mono text-text-muted leading-relaxed">
            <p className="mb-1">GridWorld: 36 states × 4 actions = <strong className="text-text">144 Q-values</strong></p>
            <p className="mb-1">Cart-Pole (10 bins each): 10{'\u2074'} × 2 = <strong className="text-text">20,000 Q-values</strong></p>
            <p className="mb-1">Cart-Pole (100 bins each): 100{'\u2074'} × 2 = <strong className="text-text">200,000,000 Q-values</strong></p>
            <p className="mb-0">Cart-Pole (exact): {'\u221E'} × 2 = <strong className="text-accent-red">impossible</strong></p>
          </div>

          <Callout type="think">
            This is the fundamental motivation for <em>every</em> approach beyond tabular RL:
            function approximation (neural nets), discretization (binning), and policy gradient methods.
            Each one is a different answer to the question: "How do I generalize from states I've seen
            to states I haven't?"
          </Callout>
        </Accordion>

        {/* ── SECTION 5 ── */}
        <Accordion number={5} title="Hack: Discretization — Chopping Continuous into Bins">
          <p className="text-sm text-text leading-relaxed mb-4">
            The simplest solution: don't try to handle infinite states. Instead, "chop" each continuous
            variable into a small number of bins and pretend it's discrete.
          </p>

          <div className="bg-surface rounded-lg p-4 mb-4">
            <p className="text-sm text-text leading-relaxed">
              <strong>Example:</strong> Position x ranges from -2.4 to +2.4. With 6 bins, we divide this into:
              [-2.4, -1.6), [-1.6, -0.8), [-0.8, 0), [0, 0.8), [0.8, 1.6), [1.6, 2.4]. A position of
              x = 0.37 falls in bin 3. Now we have a discrete state we can use in a Q-table!
            </p>
          </div>

          <Eq tex="\text{bin}(x) = \left\lfloor \frac{x - x_{\min}}{x_{\max} - x_{\min}} \times N_{\text{bins}} \right\rfloor" />

          <p className="text-sm text-text leading-relaxed mb-4">
            With 6 bins for x, 6 for velocity, 12 for angle, and 12 for angular velocity, we get:
          </p>
          <Eq tex="6 \times 6 \times 12 \times 12 = 5{,}184 \text{ discrete states}" />

          <p className="text-sm text-text leading-relaxed mb-4">
            That's manageable! With 2 actions, that's about 10,000 Q-values — comparable to a medium GridWorld.
            Now we can use plain Q-Learning on this discretized state.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-lg p-3">
              <h4 className="text-xs font-bold text-accent-green mb-1">Pros</h4>
              <ul className="text-xs text-text-muted m-0 pl-4">
                <li>Simple — just add one line of code (the binning function)</li>
                <li>Can reuse everything from tabular Q-Learning</li>
                <li>Works well for low-dimensional problems (4-6 variables)</li>
              </ul>
            </div>
            <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-3">
              <h4 className="text-xs font-bold text-accent-red mb-1">Cons</h4>
              <ul className="text-xs text-text-muted m-0 pl-4">
                <li>Loses information — states within a bin are treated identically</li>
                <li>Doesn't scale to high dimensions (the curse persists)</li>
                <li>Bin boundaries are arbitrary — a state near a boundary might behave differently</li>
              </ul>
            </div>
          </div>

          <Callout type="insight">
            Discretization is a <em>hack</em>, not a solution. It works for Cart-Pole (4 dimensions) but fails
            for Atari games (millions of pixels). The real solution is function approximation — neural networks
            that can generalize across continuous states. But discretization is a great bridge to understand
            before making that jump.
          </Callout>
        </Accordion>

        {/* ── SECTION 6 ── */}
        <Accordion number={6} title="Strategy 1: Discretized Q-Learning">
          <p className="text-sm text-text leading-relaxed mb-4">
            This is exactly Boru's Q-Learning from GridWorld, but with one extra step: before looking up
            Q-values, convert the continuous state to a bin key.
          </p>

          <Eq tex="Q(\text{bin}(s), a) \leftarrow Q(\text{bin}(s),a) + \alpha \Big[ r + \gamma \max_{a'} Q(\text{bin}(s'),a') - Q(\text{bin}(s),a) \Big]" />

          <StepBox steps={[
            {
              label: 'Observe continuous state: x=0.37, v=-0.12, \u03B8=0.021, \u03C9=0.85',
              detail: 'Dabak reads its sensors. Four real numbers describe its complete situation.',
              type: 'neutral',
            },
            {
              label: 'Discretize: bin(s) = [3, 2, 7, 8]',
              detail: 'Each variable is mapped to its bin. Now we have a discrete key we can look up in the Q-table.',
              type: 'neutral',
            },
            {
              label: '\u03B5-greedy: with probability \u03B5, pick random; else pick argmax Q',
              detail: 'Same exploration strategy as GridWorld. Random action for discovery, best known action for exploitation.',
              type: 'explore',
            },
            {
              label: 'Execute action, observe reward (+1) and next state',
              detail: 'Dabak fires the thruster, physics advances one timestep, and we get the new state + reward.',
              type: 'exploit',
            },
            {
              label: 'Update Q-table at bin(s) using standard Q-Learning',
              detail: 'The exact same update rule as GridWorld. The only difference is the state key came from binning.',
              type: 'neutral',
            },
          ]} />

          <Callout type="try">
            In the simulator, try changing the bin count. With very few bins (3-4), the agent learns fast
            but plateaus early — it can't distinguish critical angle differences. With many bins (12+), it
            learns slowly because there are too many states to visit. The sweet spot is usually 6-10 bins.
          </Callout>

          <SimButton label="Try Discretized Q-Learning on the rocket" className="mt-2" />
        </Accordion>

        {/* ── SECTION 7 ── */}
        <Accordion number={7} title="A New Family: Policy Gradient Methods">
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

        {/* ── SECTION 8 ── */}
        <Accordion number={8} title="Strategy 2: REINFORCE — Learning a Policy Directly">
          <p className="text-sm text-text leading-relaxed mb-4">
            REINFORCE is the simplest policy gradient algorithm. Its idea is beautifully intuitive:
          </p>

          <div className="bg-surface rounded-lg p-4 mb-4">
            <p className="text-sm text-text leading-relaxed">
              <strong>The intuition:</strong> "Play a full episode. If the episode went well (long survival),
              make the actions you took more likely. If it went poorly (quick crash), make them less likely.
              Over many episodes, good action patterns will dominate."
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
            Instead of a neural network, we use a simple linear model. The state is converted to 7 features:
          </p>

          <div className="bg-surface rounded-lg p-4 my-3 text-xs font-mono text-text-muted leading-relaxed">
            <p className="mb-1">{'\u03C6'}(s) = [1, x/2.4, v/3.0, {'\u03B8'}/0.21, {'\u03C9'}/3.5, ({'\u03B8'}/0.21){'\u00B2'}, ({'\u03C9'}/3.5){'\u00B2'}]</p>
            <p className="mb-1">        bias  position  velocity  angle  ang.vel  quadratic features</p>
            <p className="mb-0">Then: {'\u03C0'}(a|s) = softmax(W {'\u00B7'} {'\u03C6'}(s)), where W is a 2×7 weight matrix</p>
          </div>

          <Callout type="think">
            The quadratic features ({'\u03B8'}{'\u00B2'} and {'\u03C9'}{'\u00B2'}) are important. They let the policy
            distinguish "tilted left" from "tilted right" even though the magnitude is the same. Without them,
            the linear policy would struggle to learn that "tilt left → thrust right" and "tilt right → thrust left."
          </Callout>

          <StepBox steps={[
            {
              label: 'Play a full episode (Dabak flies until crash or 500 steps)',
              detail: 'Record every (state, action, reward) triple in a trajectory buffer.',
              type: 'explore',
            },
            {
              label: 'Compute discounted returns G_t for each timestep',
              detail: 'Starting from the end: G_T = r_T, G_{T-1} = r_{T-1} + \u03B3 × G_T, and so on. This tells us how much total reward followed each action.',
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

          <SimButton label="Watch REINFORCE learn to land" className="mt-2" />
        </Accordion>

        {/* ── SECTION 9 ── */}
        <Accordion number={9} title="Head-to-Head: Comparing Approaches">
          <p className="text-sm text-text leading-relaxed mb-4">
            Three algorithms, three philosophies. Here's how they compare on Cart-Pole:
          </p>

          <div className="overflow-x-auto mb-5">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-surface-lighter">
                  <th className="text-left py-2 px-3 text-xs font-bold text-text-muted uppercase tracking-wider"></th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-text-muted uppercase tracking-wider">Random</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-accent-blue uppercase tracking-wider">Discretized Q</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-accent-green uppercase tracking-wider">REINFORCE</th>
                </tr>
              </thead>
              <tbody className="text-text-muted">
                {[
                  ['Family', 'None (baseline)', 'Value-based', 'Policy gradient'],
                  ['State handling', 'Ignores state', 'Discretization (bins)', 'Feature extraction'],
                  ['Learns?', 'No', 'Yes (Q-table)', 'Yes (policy weights)'],
                  ['Updates when?', 'Never', 'Every step', 'Every episode end'],
                  ['Typical performance', '~20-30 steps', '~100-300 steps', '~200-500 steps'],
                  ['Hyperparameters', 'None', '\u03B1, \u03B3, \u03B5, bins', 'lr, \u03B3'],
                  ['Ceiling', '~50 (luck)', 'Limited by bin resolution', 'Can reach 500'],
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-surface/50' : ''}>
                    <td className="py-2 px-3 font-medium text-text text-xs">{row[0]}</td>
                    <td className="py-2 px-3 text-xs">{row[1]}</td>
                    <td className="py-2 px-3 text-xs">{row[2]}</td>
                    <td className="py-2 px-3 text-xs">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 className="text-sm font-bold text-text mb-3">What to watch for</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-surface rounded-lg p-3 border border-surface-lighter">
              <span className="text-xs font-bold text-text-muted">Random</span>
              <p className="text-xs text-text-muted mt-1 mb-0">
                Flat line around 20-30 steps. Establishes the floor — anything worse means a bug.
              </p>
            </div>
            <div className="bg-surface rounded-lg p-3 border border-surface-lighter">
              <span className="text-xs font-bold text-accent-blue">Discretized Q-Learning</span>
              <p className="text-xs text-text-muted mt-1 mb-0">
                Fast initial learning, then plateau. The plateau height depends on bin resolution.
              </p>
            </div>
            <div className="bg-surface rounded-lg p-3 border border-surface-lighter">
              <span className="text-xs font-bold text-accent-green">REINFORCE</span>
              <p className="text-xs text-text-muted mt-1 mb-0">
                Slower start (needs full episodes), but can eventually reach 500. More variable.
              </p>
            </div>
          </div>

          <Callout type="try">
            Run each algorithm for 200+ episodes in the simulator. Compare the episode duration charts.
            Notice how REINFORCE starts slow but has the highest ceiling, while Discretized Q-Learning
            learns faster but hits a wall.
          </Callout>

          <SimButton label="Compare all three in the simulator" className="mt-2" />
        </Accordion>

        {/* ── SECTION 10 ── */}
        <Accordion number={10} title="Going Deeper: From Earth to Mars and Beyond">
          <p className="text-sm text-text leading-relaxed mb-5">
            Dabak's landing challenge is the "Hello World" of continuous control RL. The same ideas — in more
            sophisticated forms — power real rocket landings (including on Mars), robotic manipulation, and game-playing AI.
          </p>

          <div className="flex flex-col gap-4">
            <div className="bg-surface rounded-xl p-4 border border-surface-lighter">
              <h4 className="text-sm font-bold text-text mb-1">DQN: Neural Network Q-Learning</h4>
              <p className="text-xs text-text-muted italic mb-2">"Replace the Q-table with a neural network"</p>
              <p className="text-sm text-text-muted leading-relaxed mb-2">
                Discretized Q-Learning works for 4 dimensions but fails for images (millions of pixels).
                Deep Q-Networks (DQN) replace the table with a neural network that takes raw state as
                input and outputs Q-values. This is what beat Atari games in 2015.
              </p>
              <p className="text-xs text-primary-light">Our discretization → DQN is the exact same transition: from bins to neural approximation.</p>
            </div>

            <div className="bg-surface rounded-xl p-4 border border-surface-lighter">
              <h4 className="text-sm font-bold text-text mb-1">PPO: REINFORCE's Powerful Descendant</h4>
              <p className="text-xs text-text-muted italic mb-2">"REINFORCE, but stable and efficient"</p>
              <p className="text-sm text-text-muted leading-relaxed mb-2">
                Our REINFORCE updates are noisy and slow. PPO (Proximal Policy Optimization) fixes this
                with clipped objectives and mini-batch updates. It's the workhorse behind ChatGPT's RLHF,
                OpenAI Five (Dota 2), and most modern RL applications.
              </p>
              <p className="text-xs text-primary-light">Our linear softmax policy → PPO's neural network policy is the natural next step.</p>
            </div>

            <div className="bg-surface rounded-xl p-4 border border-surface-lighter">
              <h4 className="text-sm font-bold text-text mb-1">Real Rocket Landing — Dabak's Dream</h4>
              <p className="text-xs text-text-muted italic mb-2">"From launchpad landings to Mars and beyond"</p>
              <p className="text-sm text-text-muted leading-relaxed mb-2">
                SpaceX's Falcon 9, NASA's Mars landers — they all use similar state spaces: position, velocity,
                orientation, angular rates — just in 3D instead of 2D. Once Dabak masters landing here on Earth,
                the same algorithms can scale to interplanetary missions. Research groups have already trained RL
                agents to land rockets in simulation using algorithms descended from what you've seen here.
              </p>
              <p className="text-xs text-primary-light">Dabak's 4-dimensional state space × 2 actions → a real lander's 12-dimensional state × continuous thrust is a difference of degree, not kind.</p>
            </div>

            <div className="bg-surface rounded-xl p-4 border border-surface-lighter">
              <h4 className="text-sm font-bold text-text mb-1">Actor-Critic: Best of Both Worlds</h4>
              <p className="text-xs text-text-muted italic mb-2">"Combine value-based and policy-based"</p>
              <p className="text-sm text-text-muted leading-relaxed mb-2">
                Why choose between learning values and learning a policy? Actor-Critic methods do both:
                a "critic" learns value estimates (like Q-Learning), and an "actor" learns the policy
                (like REINFORCE). The critic reduces variance; the actor enables continuous action spaces.
                A2C, A3C, SAC, and TD3 are all actor-critic variants.
              </p>
              <p className="text-xs text-primary-light">Our REINFORCE baseline subtraction is a primitive form of a critic — the running mean return estimates "how good is average."</p>
            </div>
          </div>

          <Callout type="insight">
            Cart-Pole is not just a toy. It contains every concept you need to understand modern deep RL:
            continuous states, function approximation, policy gradients, variance reduction, and the
            value-vs-policy tradeoff. Master it, and you have the vocabulary for everything that follows.
          </Callout>

          <div className="mt-4 text-center">
            <SimButton label="Go to the Simulator" />
          </div>
        </Accordion>
      </div>

      {/* Footer */}
      <div className="mt-10 text-center">
        <p className="text-sm text-text-muted mb-3">
          Now that you understand the theory, help Dabak master landing in real time.
        </p>
        <SimButton label="Open the Cart-Pole Simulator" />
      </div>
    </div>
  )
}
