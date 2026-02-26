import { useState, useMemo, useCallback } from 'react'
import { Accordion, Callout, Eq, ChapterNav } from '../../components/shared/GuidePrimitives'

/* ══════════════════════════════════════════
   Interactive Widget: Discount Factor Slider
   Shows how γ affects the present value of future rewards
   ══════════════════════════════════════════ */

function DiscountWidget() {
  const [gamma, setGamma] = useState(0.9)
  const horizon = 20

  const rewards = useMemo(() => {
    return Array.from({ length: horizon }, (_, t) => {
      const r = 1 // constant reward of +1 each step
      const discounted = r * Math.pow(gamma, t)
      return { t, reward: r, discounted, cumulative: 0 }
    })
  }, [gamma])

  // Compute cumulative
  let runningSum = 0
  rewards.forEach((r) => {
    runningSum += r.discounted
    r.cumulative = runningSum
  })

  const totalReturn = rewards.reduce((sum, r) => sum + r.discounted, 0)
  const theoreticalInfinite = gamma < 1 ? 1 / (1 - gamma) : Infinity

  // Max bar height for visualization
  const maxDiscounted = rewards[0].discounted

  return (
    <div className="bg-surface rounded-xl border border-surface-lighter p-5 my-5">
      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
        Interactive: Discount Factor {'\u03B3'}
      </h4>

      {/* Gamma slider */}
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm font-bold text-text whitespace-nowrap">
          {'\u03B3'} =
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={gamma}
          onChange={(e) => setGamma(Number(e.target.value))}
          className="flex-1 accent-primary"
        />
        <span className="text-lg font-mono font-bold text-primary-light w-12 text-right">
          {gamma.toFixed(2)}
        </span>
      </div>

      {/* Preset buttons */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { val: 0, label: '\u03B3=0 (Myopic)', desc: 'Only care about immediate reward' },
          { val: 0.5, label: '\u03B3=0.5 (Short-sighted)', desc: 'Future fades fast' },
          { val: 0.9, label: '\u03B3=0.9 (Balanced)', desc: 'Common default' },
          { val: 0.99, label: '\u03B3=0.99 (Far-sighted)', desc: 'Almost undiscounted' },
          { val: 1.0, label: '\u03B3=1.0 (No discount)', desc: 'All rewards equal' },
        ].map(({ val, label }) => (
          <button
            key={val}
            onClick={() => setGamma(val)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border-0 cursor-pointer transition-colors ${
              Math.abs(gamma - val) < 0.005
                ? 'bg-primary text-white'
                : 'bg-surface-light text-text-muted hover:text-text hover:bg-surface-lighter'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Bar chart of discounted rewards */}
      <div className="mb-4">
        <p className="text-xs text-text-muted mb-2">
          Each bar shows the <strong>present value</strong> of receiving +1 reward at timestep t:
        </p>
        <div className="flex items-end gap-1 h-24">
          {rewards.map((r) => {
            const heightPct = maxDiscounted > 0 ? (r.discounted / maxDiscounted) * 100 : 0
            return (
              <div key={r.t} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full rounded-t bg-primary transition-all duration-200"
                  style={{ height: `${heightPct}%`, minHeight: heightPct > 0 ? 2 : 0 }}
                />
              </div>
            )
          })}
        </div>
        <div className="flex gap-1 mt-1">
          {rewards.map((r) => (
            <div key={r.t} className="flex-1 text-center text-[9px] text-text-muted">
              {r.t}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface-light rounded-lg p-3 text-center">
          <span className="text-xs text-text-muted block">{'\u03B3'}^5</span>
          <span className="text-sm font-mono font-bold text-primary-light">{Math.pow(gamma, 5).toFixed(4)}</span>
        </div>
        <div className="bg-surface-light rounded-lg p-3 text-center">
          <span className="text-xs text-text-muted block">{'\u03B3'}^10</span>
          <span className="text-sm font-mono font-bold text-primary-light">{Math.pow(gamma, 10).toFixed(4)}</span>
        </div>
        <div className="bg-surface-light rounded-lg p-3 text-center">
          <span className="text-xs text-text-muted block">G (20 steps)</span>
          <span className="text-sm font-mono font-bold text-accent-green">{totalReturn.toFixed(2)}</span>
        </div>
        <div className="bg-surface-light rounded-lg p-3 text-center">
          <span className="text-xs text-text-muted block">G ({'\u221E'} steps)</span>
          <span className="text-sm font-mono font-bold text-accent-yellow">
            {theoreticalInfinite === Infinity ? '\u221E' : theoreticalInfinite.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   Interactive Widget: Return Calculator
   Type in a sequence of rewards and see the return
   ══════════════════════════════════════════ */

function ReturnCalculatorWidget() {
  const [gamma, setGamma] = useState(0.9)
  const [rewards, setRewards] = useState([1, 1, 1, -5, 10])

  const updateReward = useCallback((idx: number, val: number) => {
    setRewards((prev) => {
      const next = [...prev]
      next[idx] = val
      return next
    })
  }, [])

  const addReward = useCallback(() => {
    setRewards((prev) => [...prev, 0])
  }, [])

  const removeReward = useCallback(() => {
    setRewards((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))
  }, [])

  const returns = useMemo(() => {
    // G_t = sum_{k=0}^{T-t-1} gamma^k * r_{t+k+1}
    // Compute G_0 through the whole sequence
    const g: number[] = new Array(rewards.length).fill(0)
    g[rewards.length - 1] = rewards[rewards.length - 1]
    for (let t = rewards.length - 2; t >= 0; t--) {
      g[t] = rewards[t] + gamma * g[t + 1]
    }
    return g
  }, [rewards, gamma])

  return (
    <div className="bg-surface rounded-xl border border-surface-lighter p-5 my-5">
      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
        Interactive: Return Calculator
      </h4>

      {/* Gamma control */}
      <div className="flex items-center gap-3 mb-4">
        <label className="text-xs text-text-muted">{'\u03B3'} =</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={gamma}
          onChange={(e) => setGamma(Number(e.target.value))}
          className="w-32 accent-primary"
        />
        <span className="text-xs font-mono text-primary-light">{gamma.toFixed(2)}</span>
      </div>

      {/* Reward sequence */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-xs font-bold text-text">Rewards:</span>
        {rewards.map((r, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="text-[10px] text-text-muted mb-0.5">t={i}</span>
            <input
              type="number"
              value={r}
              onChange={(e) => updateReward(i, Number(e.target.value))}
              className="w-14 px-1 py-1 rounded text-xs font-mono bg-surface-light text-text border border-surface-lighter text-center focus:border-primary focus:outline-none"
            />
          </div>
        ))}
        <div className="flex gap-1 ml-1">
          <button onClick={addReward} className="w-7 h-7 rounded bg-accent-green/20 text-accent-green text-xs border-0 cursor-pointer hover:bg-accent-green/30">+</button>
          <button onClick={removeReward} className="w-7 h-7 rounded bg-accent-red/20 text-accent-red text-xs border-0 cursor-pointer hover:bg-accent-red/30">{'\u2212'}</button>
        </div>
      </div>

      {/* Formula breakdown */}
      <div className="bg-surface-light rounded-lg p-4 mb-3">
        <p className="text-xs text-text-muted mb-1">
          G{'\u2080'} = {rewards.map((r, i) => {
            const disc = Math.pow(gamma, i)
            return `${disc.toFixed(2)} \u00D7 ${r}`
          }).join(' + ')}
        </p>
        <p className="text-xs text-text-muted mb-0">
          G{'\u2080'} = {rewards.map((r, i) => (r * Math.pow(gamma, i)).toFixed(2)).join(' + ')} = <strong className="text-primary-light">{returns[0].toFixed(3)}</strong>
        </p>
      </div>

      {/* Returns at each timestep */}
      <div className="flex gap-2 flex-wrap">
        {returns.map((g, t) => (
          <div key={t} className="bg-surface-light rounded-lg px-3 py-2 text-center">
            <span className="text-[10px] text-text-muted block">G{'\u2080' && String.fromCharCode(0x2080 + t)}</span>
            <span className={`text-xs font-mono font-bold ${g >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
              {g.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   Interactive Widget: Reward Design Comparison
   ══════════════════════════════════════════ */

function RewardDesignWidget() {
  const [selected, setSelected] = useState<'sparse' | 'dense' | 'shaped'>('sparse')

  const designs = {
    sparse: {
      color: 'accent-blue',
      title: 'Sparse Reward',
      sequence: [0, 0, 0, 0, 0, 0, 0, 0, 0, 10],
      description: 'Only get a reward at the very end. The agent must figure out on its own which earlier actions contributed to success.',
      example: 'Chess: +1 for winning, 0 otherwise. GridWorld: +1 only at the goal.',
      challenge: 'Credit assignment is extremely hard. The agent doesn\'t know if step 3 was helpful until the episode ends.',
    },
    dense: {
      color: 'accent-green',
      title: 'Dense Reward',
      sequence: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      description: 'Get feedback at every step. The agent gets a constant stream of learning signal.',
      example: 'CartPole: +1 per step alive. Running: +1 for each meter forward.',
      challenge: 'Easier to learn from, but might lead to "reward hacking" — the agent optimizes the dense signal instead of the true goal.',
    },
    shaped: {
      color: 'accent-yellow',
      title: 'Shaped Reward',
      sequence: [-1, -1, -1, -1, -1, -1, -1, -1, -1, 20],
      description: 'Combine step penalties with goal bonuses. Each step costs -1 (encouraging efficiency), but reaching the goal gives a big bonus.',
      example: 'Rocket Landing: -1 per step (fuel cost) + 20 for soft landing, -10 for crash.',
      challenge: 'Reward shaping is an art. Bad shaping can cause unintended behavior.',
    },
  }

  const d = designs[selected]

  return (
    <div className="bg-surface rounded-xl border border-surface-lighter p-5 my-5">
      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Compare: Reward Design Strategies</h4>

      <div className="flex gap-2 mb-4">
        {(Object.keys(designs) as (keyof typeof designs)[]).map((key) => (
          <button
            key={key}
            onClick={() => setSelected(key)}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border-0 cursor-pointer transition-colors ${
              selected === key
                ? `bg-${designs[key].color}/20 text-${designs[key].color}`
                : 'bg-surface-light text-text-muted hover:text-text hover:bg-surface-lighter'
            }`}
          >
            {designs[key].title}
          </button>
        ))}
      </div>

      {/* Reward sequence visualization */}
      <div className="flex items-end gap-1 h-16 mb-2">
        {d.sequence.map((r, i) => {
          const maxAbs = Math.max(...d.sequence.map(Math.abs))
          const heightPct = maxAbs > 0 ? (Math.abs(r) / maxAbs) * 100 : 0
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative">
              {r >= 0 ? (
                <div
                  className={`w-full rounded-t bg-${d.color} transition-all duration-300`}
                  style={{ height: `${heightPct}%`, minHeight: r > 0 ? 4 : 0 }}
                />
              ) : (
                <div className="flex-1" />
              )}
              {r < 0 && (
                <div
                  className="w-full rounded-b bg-accent-red transition-all duration-300"
                  style={{ height: `${heightPct * 0.3}%`, minHeight: 4 }}
                />
              )}
            </div>
          )
        })}
      </div>
      <div className="flex gap-1 mb-3">
        {d.sequence.map((r, i) => (
          <div key={i} className="flex-1 text-center text-[9px] font-mono text-text-muted">
            {r > 0 ? `+${r}` : r}
          </div>
        ))}
      </div>

      <div className={`bg-${d.color}/5 border border-${d.color}/20 rounded-xl p-4`}>
        <p className="text-sm text-text leading-relaxed mb-2">{d.description}</p>
        <p className="text-xs text-text-muted mb-1"><strong>Example:</strong> {d.example}</p>
        <p className="text-xs text-accent-yellow mb-0"><strong>Challenge:</strong> {d.challenge}</p>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   MAIN PAGE: Chapter 3
   ══════════════════════════════════════════ */

export function RewardsAndReturnsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="mb-10 text-center">
        <div className="flex justify-center gap-3 mb-4">
          <a href="#/learn" className="text-sm text-primary-light hover:underline no-underline">
            &larr; All Chapters
          </a>
        </div>
        <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Chapter 3</p>
        <h1 className="text-4xl font-bold text-text mb-3">
          Rewards and Returns
        </h1>
        <p className="text-lg text-text-muted max-w-2xl mx-auto">
          The reward signal drives all learning. The return tells us how good a
          trajectory was. The discount factor balances now vs later.
        </p>
        <div className="flex justify-center gap-3 mt-4 text-xs text-text-muted">
          <span className="bg-surface-light px-3 py-1 rounded-full">7 sections</span>
          <span className="bg-surface-light px-3 py-1 rounded-full">Interactive {'\u03B3'} slider</span>
          <span className="bg-surface-light px-3 py-1 rounded-full">Return calculator</span>
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-4">

        {/* ── SECTION 1 ── */}
        <Accordion number={1} title="The Reward Hypothesis" defaultOpen>
          <p className="text-sm text-text leading-relaxed mb-4">
            At the heart of reinforcement learning is a bold claim:
          </p>

          <div className="bg-surface rounded-lg p-4 my-4 border-l-4 border-primary">
            <p className="text-sm text-text leading-relaxed mb-0">
              <strong>The Reward Hypothesis:</strong> That all of what we mean by goals and purposes can be
              well thought of as the maximization of the expected value of the cumulative sum of a
              received scalar signal (called reward).
            </p>
            <p className="text-xs text-text-muted mt-2 mb-0 italic">— Sutton &amp; Barto, Chapter 3</p>
          </div>

          <p className="text-sm text-text leading-relaxed mb-4">
            This is a surprisingly strong claim. It says that <em>every</em> goal — winning a game,
            driving safely, managing a portfolio, treating a patient — can be expressed as
            "maximize a single number over time."
          </p>

          <p className="text-sm text-text leading-relaxed mb-4">
            The reward <Eq tex="R_t" inline /> is a single scalar (just one number) that the environment
            sends to the agent at each timestep. Positive rewards encourage the behavior that led to them.
            Negative rewards discourage it. The agent's entire objective is to maximize the total reward
            it receives over time.
          </p>

          <Callout type="think">
            Is the reward hypothesis always true? Consider: can you express "be creative" or
            "be fair" as a single number to maximize? This is an active debate in AI safety.
            For our purposes, the hypothesis works extremely well for well-defined tasks — but
            designing the right reward function is an art (and sometimes the hardest part of RL).
          </Callout>
        </Accordion>

        {/* ── SECTION 2 ── */}
        <Accordion number={2} title="Immediate Reward vs. Long-Term Gain">
          <p className="text-sm text-text leading-relaxed mb-4">
            A key challenge in RL: the agent doesn't just want the best immediate reward — it wants
            the best <strong>cumulative</strong> reward over the entire episode. Sometimes taking a
            short-term loss leads to a much bigger long-term gain.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-accent-red/10 border border-accent-red/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-red mb-2">Greedy (Short-term)</h4>
              <p className="text-xs text-text leading-relaxed mb-2">
                Always pick the action with the highest <em>immediate</em> reward.
              </p>
              <div className="bg-surface rounded-lg p-3 text-xs font-mono text-text-muted">
                <p className="mb-0.5">Step 1: Take +5 (greedy choice)</p>
                <p className="mb-0.5">Step 2: Take +2</p>
                <p className="mb-0">Total: <strong className="text-text">7</strong></p>
              </div>
            </div>
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-green mb-2">Strategic (Long-term)</h4>
              <p className="text-xs text-text leading-relaxed mb-2">
                Accept a worse immediate reward if it leads to better outcomes later.
              </p>
              <div className="bg-surface rounded-lg p-3 text-xs font-mono text-text-muted">
                <p className="mb-0.5">Step 1: Take +1 (sacrifice now)</p>
                <p className="mb-0.5">Step 2: Take +20 (unlocked by step 1)</p>
                <p className="mb-0">Total: <strong className="text-accent-green">21</strong></p>
              </div>
            </div>
          </div>

          <Callout type="insight">
            This is why RL is hard. The agent must learn that today's actions affect tomorrow's
            possibilities. A chess player sacrifices a pawn to win the game. A student studies
            (low immediate reward) to get a degree (high future reward). RL agents must do the same.
          </Callout>
        </Accordion>

        {/* ── SECTION 3 ── */}
        <Accordion number={3} title="The Return: Cumulative Reward">
          <p className="text-sm text-text leading-relaxed mb-4">
            The <strong>return</strong> <Eq tex="G_t" inline /> is the total reward from timestep <Eq tex="t" inline /> onward.
            It's the number the agent is actually trying to maximize.
          </p>

          <p className="text-sm text-text leading-relaxed mb-2">
            In the simplest case (no discounting), the return is just the sum of all future rewards:
          </p>
          <Eq tex="G_t = R_{t+1} + R_{t+2} + R_{t+3} + \cdots + R_T" />

          <p className="text-sm text-text leading-relaxed mb-4">
            where <Eq tex="T" inline /> is the final timestep (for episodic tasks).
          </p>

          <p className="text-sm text-text leading-relaxed mb-4">
            But there's a problem: what if the episode never ends? Or what if it lasts for millions
            of steps? The sum could blow up to infinity. We need a way to keep the return finite and
            well-defined — that's where <strong>discounting</strong> comes in.
          </p>

          <Callout type="think">
            Consider: if you receive +1 reward at every step forever, the undiscounted return
            is <Eq tex="G = 1 + 1 + 1 + \cdots = \infty" inline />. How can the agent maximize
            something that's already infinite? This is mathematically problematic — we need a fix.
          </Callout>
        </Accordion>

        {/* ── SECTION 4 ── */}
        <Accordion number={4} title={"The Discount Factor \u03B3"}>
          <p className="text-sm text-text leading-relaxed mb-4">
            The <strong>discount factor</strong> <Eq tex="\gamma \in [0, 1]" inline /> (gamma) determines
            how much the agent cares about future rewards relative to immediate ones. The discounted
            return is:
          </p>

          <Eq tex="G_t = R_{t+1} + \gamma R_{t+2} + \gamma^2 R_{t+3} + \cdots = \sum_{k=0}^{\infty} \gamma^k R_{t+k+1}" />

          <p className="text-sm text-text leading-relaxed mb-4">
            Each future reward is multiplied by <Eq tex="\gamma^k" inline />, where <Eq tex="k" inline /> is
            how many steps in the future it occurs. Since <Eq tex="\gamma < 1" inline />,
            rewards further in the future are worth exponentially less today.
          </p>

          <div className="bg-surface rounded-lg p-4 my-3 text-sm text-text-muted">
            <p className="mb-1"><Eq tex="\gamma = 0" inline /> — <strong>Completely myopic.</strong> Only care about the very next reward. <Eq tex="G_t = R_{t+1}" inline /></p>
            <p className="mb-1"><Eq tex="\gamma = 0.9" inline /> — <strong>Balanced.</strong> Care about the future but discount it. A reward 10 steps away is worth <Eq tex="0.9^{10} = 0.349" inline /> of its face value.</p>
            <p className="mb-1"><Eq tex="\gamma = 0.99" inline /> — <strong>Far-sighted.</strong> Value the future almost as much as the present. Common in practice.</p>
            <p className="mb-0"><Eq tex="\gamma = 1" inline /> — <strong>No discounting.</strong> All rewards equally important. Only works for episodic tasks with guaranteed termination.</p>
          </div>

          <DiscountWidget />

          <Callout type="insight">
            <Eq tex="\gamma" inline /> controls the agent's <strong>effective horizon</strong>.
            With <Eq tex="\gamma = 0.9" inline />, rewards more than about 10 steps away are worth less
            than 35% of their face value. With <Eq tex="\gamma = 0.99" inline />, the agent
            effectively "sees" about 100 steps ahead. The choice of <Eq tex="\gamma" inline /> is a
            crucial hyperparameter — too small and the agent is shortsighted, too large and learning
            becomes slow (many future rewards to propagate).
          </Callout>
        </Accordion>

        {/* ── SECTION 5 ── */}
        <Accordion number={5} title="The Recursive Structure of Returns">
          <p className="text-sm text-text leading-relaxed mb-4">
            Returns have a beautiful recursive property that's the foundation of many RL algorithms.
            We can express <Eq tex="G_t" inline /> in terms of <Eq tex="G_{t+1}" inline />:
          </p>

          <Eq tex="G_t = R_{t+1} + \gamma G_{t+1}" />

          <p className="text-sm text-text leading-relaxed mb-4">
            <strong>In words:</strong> "The return from now equals the immediate reward plus
            the discounted return from the next step." This is just algebra:
          </p>

          <div className="bg-surface rounded-lg p-4 my-3 text-sm text-text-muted leading-relaxed">
            <Eq tex="G_t = R_{t+1} + \gamma R_{t+2} + \gamma^2 R_{t+3} + \cdots" />
            <Eq tex="= R_{t+1} + \gamma \underbrace{(R_{t+2} + \gamma R_{t+3} + \cdots)}_{G_{t+1}}" />
            <Eq tex="= R_{t+1} + \gamma G_{t+1}" />
          </div>

          <Callout type="insight">
            This recursive relationship is <strong>incredibly important</strong>. It's the basis of:
            <ul className="text-sm text-text mt-2 mb-0 space-y-1">
              <li className="flex items-start gap-2"><span className="text-accent-green">-</span><strong>Bellman equations</strong> (Chapter 7) — express value functions recursively</li>
              <li className="flex items-start gap-2"><span className="text-accent-green">-</span><strong>TD Learning</strong> (Chapter 9) — update estimates using the next estimate</li>
              <li className="flex items-start gap-2"><span className="text-accent-green">-</span><strong>Q-Learning</strong> — use <Eq tex="r + \gamma \max Q(s')" inline /> as a target</li>
            </ul>
          </Callout>

          <ReturnCalculatorWidget />
        </Accordion>

        {/* ── SECTION 6 ── */}
        <Accordion number={6} title="Reward Design: An Art and a Science">
          <p className="text-sm text-text leading-relaxed mb-4">
            The reward function is the most important part of any RL problem. It defines <em>what</em> the
            agent should learn. Get it wrong, and the agent will learn the wrong thing — brilliantly.
          </p>

          <p className="text-sm text-text leading-relaxed mb-4">
            There are several strategies for designing rewards:
          </p>

          <RewardDesignWidget />

          <p className="text-sm text-text leading-relaxed mb-4">
            <strong>Rewards in our labs:</strong>
          </p>
          <div className="flex flex-col gap-2 mb-4">
            {[
              { env: 'Bandit', reward: 'Drawn from hidden distribution (e.g., Normal(μ, 1))', type: 'Stochastic', icon: '\uD83C\uDFB0' },
              { env: 'GridWorld', reward: '+1 at goal, -1 at cliffs, -0.04 per step', type: 'Shaped', icon: '\uD83D\uDC18' },
              { env: 'CartPole', reward: '+1 per step alive', type: 'Dense', icon: '\uD83D\uDE80' },
              { env: 'Rocket Landing', reward: '+1/step, +20 soft landing, -10 crash', type: 'Shaped', icon: '\uD83D\uDE80' },
            ].map(({ env, reward, type, icon }) => (
              <div key={env} className="flex items-center gap-3 bg-surface-light rounded-lg p-3">
                <span className="text-lg">{icon}</span>
                <div className="flex-1">
                  <span className="text-xs font-bold text-text">{env}: </span>
                  <span className="text-xs text-text-muted">{reward}</span>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary-light">{type}</span>
              </div>
            ))}
          </div>

          <Callout type="try" title="Experiment">
            Try the <a href="#/gridworld" className="text-primary-light hover:underline">GridWorld</a> lab
            and watch how the step penalty (-0.04) encourages the agent to find shorter paths.
            Without it, the agent might wander randomly and still eventually reach the goal. The
            penalty makes efficiency a priority.
          </Callout>
        </Accordion>

        {/* ── SECTION 7 ── */}
        <Accordion number={7} title="Summary: The Optimization Objective">
          <p className="text-sm text-text leading-relaxed mb-4">
            Let's bring it all together. The agent's entire objective in RL is:
          </p>

          <Eq tex="\text{Maximize } \mathbb{E}\left[ G_t \right] = \mathbb{E}\left[ \sum_{k=0}^{\infty} \gamma^k R_{t+k+1} \right]" />

          <p className="text-sm text-text leading-relaxed mb-4">
            Every algorithm we'll study — from simple Q-Learning to advanced policy gradients — is
            a different strategy for finding the behavior that maximizes this expected return.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-surface-light rounded-lg p-3 text-center border border-surface-lighter">
              <span className="text-2xl block mb-1">{'\uD83C\uDFC6'}</span>
              <span className="text-xs font-bold text-text block">Reward</span>
              <span className="text-[10px] text-text-muted">Immediate feedback</span>
            </div>
            <div className="bg-surface-light rounded-lg p-3 text-center border border-surface-lighter">
              <span className="text-2xl block mb-1">{'\uD83D\uDCCA'}</span>
              <span className="text-xs font-bold text-text block">Return</span>
              <span className="text-[10px] text-text-muted">Cumulative discounted reward</span>
            </div>
            <div className="bg-surface-light rounded-lg p-3 text-center border border-surface-lighter">
              <span className="text-2xl block mb-1">{'\uD83C\uDFAF'}</span>
              <span className="text-xs font-bold text-text block">{'\u03B3'} Discount</span>
              <span className="text-[10px] text-text-muted">Balances now vs later</span>
            </div>
          </div>

          <Callout type="insight">
            <strong>Key takeaways from this chapter:</strong>
            <ul className="text-sm text-text mt-2 mb-0 space-y-1">
              <li className="flex items-start gap-2"><span className="text-accent-green">1.</span>The reward is a scalar — one number per timestep</li>
              <li className="flex items-start gap-2"><span className="text-accent-green">2.</span>The return <Eq tex="G_t" inline /> sums up all future rewards (discounted by <Eq tex="\gamma" inline />)</li>
              <li className="flex items-start gap-2"><span className="text-accent-green">3.</span><Eq tex="\gamma" inline /> controls how far into the future the agent looks</li>
              <li className="flex items-start gap-2"><span className="text-accent-green">4.</span>Returns are recursive: <Eq tex="G_t = R_{t+1} + \gamma G_{t+1}" inline /></li>
              <li className="flex items-start gap-2"><span className="text-accent-green">5.</span>Reward design is crucial — it defines what the agent learns</li>
            </ul>
          </Callout>
        </Accordion>
      </div>

      {/* Chapter navigation */}
      <ChapterNav
        prev={{ path: '/learn/states-and-actions', label: 'Ch 2: States and Actions' }}
        next={{ path: '/learn/policies', label: 'Ch 4: Policies' }}
      />
    </div>
  )
}
