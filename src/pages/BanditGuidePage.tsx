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
  type: 'insight' | 'think' | 'try'; title?: ReactNode; children: ReactNode
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
      to="/bandit"
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium no-underline hover:bg-primary-dark transition-colors ${className ?? ''}`}
    >
      <span>&#127920;</span> {label ?? 'Try it in the Simulator'}
    </Link>
  )
}

/* ══════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════ */

export function BanditGuidePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="mb-10 text-center">
        <Link to="/bandit" className="text-sm text-primary-light hover:underline no-underline mb-4 inline-block">
          &larr; Back to Simulator
        </Link>
        <h1 className="text-4xl font-bold text-text mb-3">
          The Multi-Armed Bandit Problem
        </h1>
        <p className="text-lg text-text-muted max-w-2xl mx-auto">
          A complete guide to one of the most elegant problems in decision-making.
          No prerequisites — just curiosity.
        </p>
        <div className="flex justify-center gap-3 mt-4 text-xs text-text-muted">
          <span className="bg-surface-light px-3 py-1 rounded-full">10 sections</span>
          <span className="bg-surface-light px-3 py-1 rounded-full">3 strategies</span>
          <span className="bg-surface-light px-3 py-1 rounded-full">Real-number examples</span>
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-4">

        {/* ── SECTION 1 ── */}
        <Accordion number={1} title="You Already Solve This Every Day" defaultOpen>
          <p className="text-sm text-text leading-relaxed mb-4">
            Imagine it's Friday night. You've got a favorite restaurant — solid 8/10 every time. But there's a new place
            across the street you've never tried. Do you go to the safe bet, or take a chance on something that could be
            a 10/10… or a 4/10?
          </p>
          <p className="text-sm text-text leading-relaxed mb-4">
            You face this exact dilemma constantly:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {[
              { icon: '🍕', text: 'Choosing a restaurant — stick with old favorites or try somewhere new?' },
              { icon: '🎬', text: 'Picking a Netflix show — rewatch a classic or gamble on something unknown?' },
              { icon: '☕', text: 'Your morning coffee — same order every day, or try the seasonal special?' },
              { icon: '🛣️', text: 'Your commute route — the familiar way, or a shortcut someone mentioned?' },
            ].map((ex, i) => (
              <div key={i} className="bg-surface rounded-lg p-3 flex items-start gap-2">
                <span className="text-lg">{ex.icon}</span>
                <span className="text-sm text-text-muted">{ex.text}</span>
              </div>
            ))}
          </div>
          <Callout type="insight">
            Every time you choose between something you know is good and something that <em>might</em> be better,
            you're solving a multi-armed bandit problem. The question is: <strong>how do you decide?</strong>
          </Callout>
        </Accordion>

        {/* ── SECTION 2 ── */}
        <Accordion number={2} title="The Casino That Started It All">
          <p className="text-sm text-text leading-relaxed mb-4">
            The name comes from imagining a row of slot machines — "one-armed bandits" in casino slang (they have one
            lever arm and they steal your money). Now imagine a machine with <em>multiple</em> arms, each with a
            different hidden payout rate. That's your <strong>multi-armed bandit</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
            {[
              { term: 'Arms', def: 'The options you can choose from (slot machines, restaurants, ads to show…)', color: 'text-primary-light' },
              { term: 'Pull', def: 'One attempt — you pick an arm and observe a reward', color: 'text-accent-blue' },
              { term: 'Reward', def: 'What you get back. Can be money, clicks, satisfaction — any measurable outcome', color: 'text-accent-green' },
            ].map((t) => (
              <div key={t.term} className="bg-surface rounded-lg p-4">
                <span className={`text-sm font-bold ${t.color}`}>{t.term}</span>
                <p className="text-xs text-text-muted mt-1 mb-0">{t.def}</p>
              </div>
            ))}
          </div>

          <p className="text-sm text-text leading-relaxed mb-2">
            Here's what makes it tricky: <strong>you don't know the true payout rate of any arm</strong>. Each pull
            gives a noisy sample — sometimes higher, sometimes lower than the arm's true average. You only learn by
            trying, and every pull on a bad arm is money you could have spent on the best one.
          </p>

          <Callout type="think">
            If you had unlimited pulls, the problem would be easy — just try everything a thousand times. But in real
            life, you have limited chances. Every bad meal, failed A/B test variant, or wrong medication given to a
            patient has a real cost. <strong>How quickly can you find the best option?</strong>
          </Callout>
        </Accordion>

        {/* ── SECTION 3 ── */}
        <Accordion number={3} title="Where This Problem Hides in the Real World">
          <p className="text-sm text-text leading-relaxed mb-4">
            The bandit problem isn't just academic. It quietly shapes technology and decisions you interact with daily:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { icon: '🧪', title: 'A/B Testing', desc: 'Should we keep showing the old homepage or switch to the new one?', frame: 'Explore new designs vs. exploit the proven winner' },
              { icon: '💊', title: 'Clinical Trials', desc: 'Which treatment should the next patient receive?', frame: 'Explore new drugs vs. exploit the currently best one' },
              { icon: '📢', title: 'Ad Placement', desc: 'Which ad generates the most clicks for this slot?', frame: 'Explore new creatives vs. exploit top performers' },
              { icon: '🎵', title: 'Recommendations', desc: 'What song/video should we suggest next?', frame: 'Explore new content vs. exploit known preferences' },
              { icon: '🌐', title: 'Network Routing', desc: 'Which server should handle the next request?', frame: 'Explore alternative routes vs. exploit fastest known path' },
              { icon: '⚡', title: 'Resource Allocation', desc: 'Which project should get the next engineer?', frame: 'Explore new initiatives vs. exploit proven revenue streams' },
            ].map((card) => (
              <div key={card.title} className="bg-surface rounded-xl p-4 border border-surface-lighter">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{card.icon}</span>
                  <span className="text-sm font-bold text-text">{card.title}</span>
                </div>
                <p className="text-xs text-text-muted mb-2">{card.desc}</p>
                <p className="text-xs text-primary-light italic m-0">{card.frame}</p>
              </div>
            ))}
          </div>

          <Callout type="insight">
            In all these cases, the core challenge is identical: you must make decisions <em>now</em> while still
            learning which option is best. Every exploration has a cost, but so does committing too early to a
            sub-optimal choice.
          </Callout>
        </Accordion>

        {/* ── SECTION 4 ── */}
        <Accordion number={4} title="The Core Dilemma: Explore vs Exploit">
          <p className="text-sm text-text leading-relaxed mb-5">
            This is the heart of the bandit problem. Every decision you make falls somewhere on a spectrum between two extremes:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div className="bg-accent-red/10 border border-accent-red/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-red mb-2">Pure Exploitation</h4>
              <p className="text-xs text-text-muted mb-2">"Always go to the same restaurant"</p>
              <p className="text-xs text-text leading-relaxed m-0">
                You pick the arm with the highest estimated reward and <em>never</em> try anything else.
                If your early estimate is wrong, you're stuck with a bad choice forever.
              </p>
            </div>
            <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-blue mb-2">Pure Exploration</h4>
              <p className="text-xs text-text-muted mb-2">"Always try a new place"</p>
              <p className="text-xs text-text leading-relaxed m-0">
                You try arms randomly and never commit. You'll eventually learn every arm's true value, but you waste
                countless pulls on arms you already know are bad.
              </p>
            </div>
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-green mb-2">Smart Balance</h4>
              <p className="text-xs text-text-muted mb-2">"The sweet spot"</p>
              <p className="text-xs text-text leading-relaxed m-0">
                Explore enough to be confident you've found the best option, then gradually shift to exploiting it.
                This is what the strategies in the next sections achieve.
              </p>
            </div>
          </div>
          <Callout type="insight">
            The optimal strategy is never "always explore" or "always exploit." It's a <strong>dynamic balance</strong> that
            shifts over time — explore more at the start when you're uncertain, exploit more later when you're confident.
            The three strategies we'll learn are three different answers to <em>exactly how</em> to manage that shift.
          </Callout>
          <SimButton label="See explore vs exploit in action" className="mt-2" />
        </Accordion>

        {/* ── SECTION 5 ── */}
        <Accordion number={5} title="The Math, Made Simple">
          <p className="text-sm text-text leading-relaxed mb-4">
            Before diving into strategies, you need two building blocks. Don't worry — each one gets a plain English
            explanation first, then the formula, then a real example.
          </p>

          {/* Running Average */}
          <h3 className="text-sm font-bold text-primary-light uppercase tracking-wider mb-2">Building Block 1: The Running Average</h3>
          <p className="text-sm text-text leading-relaxed mb-2">
            <strong>In plain English:</strong> Each time you pull an arm, you nudge your estimate a little bit toward the
            reward you just got. Big surprise? Big nudge. Small surprise? Small nudge.
          </p>
          <Eq tex="Q_{n+1} = Q_n + \frac{1}{n}\bigl(R_n - Q_n\bigr)" />
          <div className="bg-surface rounded-lg p-4 my-3 text-sm text-text-muted">
            <p className="mb-1"><Eq tex="Q_n" inline /> = your current estimate of this arm's value (after <Eq tex="n" inline /> pulls)</p>
            <p className="mb-1"><Eq tex="R_n" inline /> = the reward you just received</p>
            <p className="mb-1"><Eq tex="R_n - Q_n" inline /> = the <strong>surprise</strong> — how far the reality was from your estimate</p>
            <p className="mb-0"><Eq tex="\frac{1}{n}" inline /> = the step size — shrinks as you gather more data (early pulls matter more)</p>
          </div>

          <p className="text-sm text-text leading-relaxed mb-2"><strong>Real-number walkthrough:</strong></p>
          <div className="bg-surface rounded-lg p-4 my-3 text-xs font-mono text-text-muted leading-relaxed">
            <p className="mb-1">Start: Q = 0 (no information)</p>
            <p className="mb-1">Pull 1 → reward 0.8: Q = 0 + 1/1 × (0.8 − 0) = <strong className="text-text">0.800</strong></p>
            <p className="mb-1">Pull 2 → reward 0.4: Q = 0.8 + 1/2 × (0.4 − 0.8) = <strong className="text-text">0.600</strong></p>
            <p className="mb-1">Pull 3 → reward 0.9: Q = 0.6 + 1/3 × (0.9 − 0.6) = <strong className="text-text">0.700</strong></p>
            <p className="mb-0">Pull 4 → reward 0.7: Q = 0.7 + 1/4 × (0.7 − 0.7) = <strong className="text-text">0.700</strong> (no surprise!)</p>
          </div>

          <Callout type="insight">
            Notice pull 4: the reward was exactly equal to the estimate, so nothing changed. The formula only adjusts
            when there's a gap between expectation and reality. This is the same idea behind many machine learning
            algorithms — <em>learn from your mistakes</em>.
          </Callout>

          {/* Regret */}
          <h3 className="text-sm font-bold text-primary-light uppercase tracking-wider mb-2 mt-6">Building Block 2: Regret — The Cost of Learning</h3>
          <p className="text-sm text-text leading-relaxed mb-2">
            <strong>In plain English:</strong> Regret measures how much reward you missed out on by not always picking the
            best arm. It's the gap between what you <em>actually</em> earned and what you <em>could have</em> earned
            with perfect knowledge.
          </p>
          <Eq tex="\text{Regret}_T = T \cdot \mu^* - \sum_{t=1}^{T} R_t" />
          <div className="bg-surface rounded-lg p-4 my-3 text-sm text-text-muted">
            <p className="mb-1"><Eq tex="T" inline /> = total number of pulls</p>
            <p className="mb-1"><Eq tex="\mu^*" inline /> = the true average reward of the <em>best</em> arm</p>
            <p className="mb-0"><Eq tex="\sum R_t" inline /> = the total reward you actually collected</p>
          </div>

          <div className="bg-surface rounded-lg p-4 my-3 text-xs font-mono text-text-muted leading-relaxed">
            <p className="mb-1">Example: Best arm averages <strong className="text-accent-green">0.8</strong> per pull</p>
            <p className="mb-1">Over 100 pulls, you earned total reward = 65</p>
            <p className="mb-0">Regret = 100 × 0.8 − 65 = <strong className="text-accent-red">15</strong> (you "lost" 15 by exploring)</p>
          </div>

          <Callout type="think">
            Zero regret is impossible unless you magically know the best arm from the start. Some regret is the
            <em> price of learning</em>. A good strategy minimizes regret — it learns fast and then commits.
          </Callout>
        </Accordion>

        {/* ── SECTION 6 ── */}
        <Accordion number={6} title="Strategy 1: Epsilon-Greedy — The Coin Flip">
          <p className="text-sm text-text leading-relaxed mb-4">
            This is the simplest strategy, and it works surprisingly well. The idea:
          </p>
          <div className="bg-surface rounded-lg p-4 mb-4">
            <p className="text-sm text-text leading-relaxed mb-2">
              <strong>Most of the time</strong> (probability <Eq tex="1 - \varepsilon" inline />), pick the arm with
              the highest estimated value. <strong>But with a small probability</strong> <Eq tex="\varepsilon" inline />,
              pick a completely random arm instead.
            </p>
          </div>

          <Eq tex="A_t = \begin{cases} \arg\max_a Q_t(a) & \text{with probability } 1 - \varepsilon \\ \text{random arm} & \text{with probability } \varepsilon \end{cases}" />

          <p className="text-sm text-text leading-relaxed mb-2"><strong>Step-by-step worked example</strong> with 3 arms and <Eq tex="\varepsilon = 0.3" inline />:</p>

          <StepBox steps={[
            { label: 'All estimates = 0. Random pick → Arm 2. Reward = 0.6', detail: 'Q₂ = 0 + 1/1 × (0.6 − 0) = 0.600. First pull is always exploration since all arms are tied.', type: 'explore' },
            { label: 'Roll 0.15 < 0.3 → Explore! Random → Arm 0. Reward = 0.3', detail: 'Q₀ = 0 + 1/1 × (0.3 − 0) = 0.300. The coin flip said explore, so we tried an untested arm.', type: 'explore' },
            { label: 'Roll 0.72 > 0.3 → Exploit! Best = Arm 2 (0.600). Reward = 0.8', detail: 'Q₂ = 0.6 + 1/2 × (0.8 − 0.6) = 0.700. Exploiting our best known arm, and it paid off.', type: 'exploit' },
            { label: 'Roll 0.08 < 0.3 → Explore! Random → Arm 1. Reward = 0.9', detail: 'Q₁ = 0 + 1/1 × (0.9 − 0) = 0.900. Surprise! This arm might actually be the best.', type: 'explore' },
            { label: 'Roll 0.55 > 0.3 → Exploit! Best = Arm 1 (0.900). Reward = 0.7', detail: 'Q₁ = 0.9 + 1/2 × (0.7 − 0.9) = 0.800. Our best estimate shifted — we\'re learning.', type: 'exploit' },
          ]} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-lg p-3">
              <h4 className="text-xs font-bold text-accent-green mb-1">Pros</h4>
              <ul className="text-xs text-text-muted m-0 pl-4">
                <li>Dead simple to implement</li>
                <li>Always keeps exploring (never gets permanently stuck)</li>
                <li>Works reasonably well in practice</li>
              </ul>
            </div>
            <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-3">
              <h4 className="text-xs font-bold text-accent-red mb-1">Cons</h4>
              <ul className="text-xs text-text-muted m-0 pl-4">
                <li>Explores just as much on step 1000 as step 1 (wasteful)</li>
                <li>Doesn't explore <em>smartly</em> — random arm, not under-explored arm</li>
                <li>You must choose <Eq tex="\varepsilon" inline /> yourself</li>
              </ul>
            </div>
          </div>

          <Callout type="think" title={<>What if <span className="normal-case">ε</span> is too high or too low?</>}>
            <p className="mb-1"><strong><Eq tex="\varepsilon = 0" inline />:</strong> Pure exploitation. Great if your first few pulls were representative. Terrible if they weren't — you'll never recover from a bad early estimate.</p>
            <p className="mb-0"><strong><Eq tex="\varepsilon = 1" inline />:</strong> Pure exploration. You'll learn every arm perfectly but waste most of your pulls on arms you already know are bad.</p>
          </Callout>

          <SimButton label="Try Epsilon-Greedy in the Simulator" className="mt-2" />
        </Accordion>

        {/* ── SECTION 7 ── */}
        <Accordion number={7} title="Strategy 2: UCB — The Smart Explorer">
          <p className="text-sm text-text leading-relaxed mb-4">
            UCB (Upper Confidence Bound) fixes epsilon-greedy's biggest flaw: <strong>it explores intelligently</strong>.
            Instead of picking a random arm, it gives a bonus to arms it hasn't tried much.
          </p>

          <div className="bg-surface rounded-lg p-4 mb-4">
            <p className="text-sm text-text leading-relaxed">
              <strong>The intuition:</strong> "Pick the arm that <em>could</em> be the best, given how uncertain I am
              about it." Arms you've barely tried have high uncertainty → big bonus → they get picked. As you try them
              more, the bonus shrinks and only genuinely good arms survive.
            </p>
          </div>

          <Eq tex="A_t = \arg\max_a \left[ Q_t(a) + c \sqrt{\frac{\ln t}{N_t(a)}} \right]" />

          <div className="bg-surface rounded-lg p-4 my-3 text-sm text-text-muted">
            <p className="mb-1"><Eq tex="Q_t(a)" inline /> = estimated value of arm <Eq tex="a" inline /> (what you think it's worth)</p>
            <p className="mb-1"><Eq tex="c \sqrt{\frac{\ln t}{N_t(a)}}" inline /> = the <strong>exploration bonus</strong></p>
            <p className="mb-1 pl-4"><Eq tex="t" inline /> = total pulls so far (across all arms)</p>
            <p className="mb-1 pl-4"><Eq tex="N_t(a)" inline /> = how many times you've pulled arm <Eq tex="a" inline /></p>
            <p className="mb-0 pl-4"><Eq tex="c" inline /> = confidence parameter — higher means more exploration</p>
          </div>

          <Callout type="insight">
            The <strong>exploration bonus shrinks</strong> as you pull an arm more — <Eq tex="N_t(a)" inline /> gets larger — but grows slowly as total time passes — <Eq tex="\ln t" inline /> grows. This means an arm you
            haven't tried in a while gradually becomes more appealing again — UCB never <em>completely</em> writes off any arm.
          </Callout>

          <p className="text-sm text-text leading-relaxed mb-2"><strong>Step-by-step worked example</strong> with 3 arms and <Eq tex="c = 2" inline />:</p>

          <StepBox steps={[
            { label: 'All arms untried → pull Arm 0 first. Reward = 0.3', detail: 'Q₀ = 0.300. UCB starts by trying each arm once (bonus is infinite for untried arms).', type: 'explore' },
            { label: 'Arm 1 untried → pull Arm 1. Reward = 0.9', detail: 'Q₁ = 0.900. Still initializing — must try every arm at least once.', type: 'explore' },
            { label: 'Arm 2 untried → pull Arm 2. Reward = 0.5', detail: 'Q₂ = 0.500. Now all arms have been tried once. UCB kicks in next step.', type: 'explore' },
            { label: 'UCB scores: Arm0 = 0.3+2×√(ln4/1) = 2.65, Arm1 = 0.9+2×√(ln4/1) = 3.25, Arm2 = 0.5+2×√(ln4/1) = 2.85 → Arm 1 wins', detail: 'Q₁ updated: 0.9 + 1/2 × (0.7 − 0.9) = 0.800. Arm 1 had the best Q + bonus.', type: 'exploit' },
            { label: 'UCB scores: Arm0 = 0.3+2×√(ln5/1) = 2.84, Arm1 = 0.8+2×√(ln5/2) = 2.60, Arm2 = 0.5+2×√(ln5/1) = 3.04 → Arm 2 wins', detail: 'Q₂ updated: 0.5 + 1/2 × (0.6 − 0.5) = 0.550. Arm 2\'s bonus grew relative to Arm 1 (less tested).', type: 'explore' },
          ]} />

          <p className="text-sm text-text leading-relaxed mb-2">
            <strong>Why is UCB better than epsilon-greedy?</strong>
          </p>
          <ul className="text-sm text-text-muted pl-5 mb-4">
            <li className="mb-1"><strong>Directed exploration:</strong> UCB tries under-explored arms, not random ones</li>
            <li className="mb-1"><strong>Self-tuning:</strong> Exploration naturally decreases as you learn more</li>
            <li className="mb-0"><strong>Theoretical guarantee:</strong> Regret grows at most <Eq tex="O(\ln T)" inline /> — provably near-optimal</li>
          </ul>

          <Callout type="think" title="The Confidence Parameter c">
            <Eq tex="c" inline /> controls how much you value uncertainty. <Eq tex="c = 0" inline /> is pure exploitation
            (ignore uncertainty). Very high <Eq tex="c" inline /> makes exploration dominate. The standard
            choice is <Eq tex="c = 2" inline />, which comes from the statistical theory of confidence intervals.
          </Callout>

          <SimButton label="Try UCB in the Simulator" className="mt-2" />
        </Accordion>

        {/* ── SECTION 8 ── */}
        <Accordion number={8} title="Strategy 3: Thompson Sampling — Let Luck Decide (Wisely)">
          <p className="text-sm text-text leading-relaxed mb-4">
            Thompson Sampling takes a completely different approach. Instead of formulas with bonuses, it maintains a
            <strong> belief</strong> about each arm — a probability distribution that represents "what I think
            this arm's true reward rate might be."
          </p>

          <div className="bg-surface rounded-lg p-4 mb-4">
            <p className="text-sm text-text leading-relaxed">
              <strong>The intuition:</strong> For each arm, imagine a curve showing how likely different reward
              rates are. Early on, the curve is wide and flat (you have no idea). After many pulls, it becomes tall and
              narrow (you're pretty sure). To choose an arm, <strong>randomly sample one number from each curve</strong>,
              then pick the arm whose sample was highest.
            </p>
          </div>

          <p className="text-sm text-text leading-relaxed mb-2">
            For binary rewards (success/fail), each arm's belief is a <strong>Beta distribution</strong>:
          </p>
          <Eq tex="\theta_a \sim \text{Beta}(\alpha_a, \beta_a)" />
          <div className="bg-surface rounded-lg p-4 my-3 text-sm text-text-muted">
            <p className="mb-1"><Eq tex="\alpha_a" inline /> = 1 + number of successes on arm <Eq tex="a" inline /></p>
            <p className="mb-1"><Eq tex="\beta_a" inline /> = 1 + number of failures on arm <Eq tex="a" inline /></p>
            <p className="mb-0">Start with <Eq tex="\alpha = 1, \beta = 1" inline /> (uniform — "any reward rate is equally possible")</p>
          </div>

          <h4 className="text-sm font-bold text-text mt-5 mb-2">How it works, step by step:</h4>
          <div className="flex flex-col gap-2 mb-4">
            {[
              { step: '1', text: 'For each arm, draw a random sample from its Beta(α, β) distribution' },
              { step: '2', text: 'Pick the arm whose sample was the highest' },
              { step: '3', text: 'Observe the reward, then update that arm\'s α (if success) or β (if failure)' },
              { step: '4', text: 'Repeat — the distributions get sharper with each pull' },
            ].map((s) => (
              <div key={s.step} className="flex items-start gap-3 bg-surface rounded-lg p-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary-light text-xs font-bold flex items-center justify-center">{s.step}</span>
                <span className="text-sm text-text-muted">{s.text}</span>
              </div>
            ))}
          </div>

          <Callout type="insight" title="Why does this balance exploration and exploitation?">
            <p className="mb-1"><strong>Wide curve (uncertain arm):</strong> Samples are spread out — sometimes the sample
            is very high, causing the arm to be picked even if its average seems low. This is natural exploration!</p>
            <p className="mb-0"><strong>Narrow curve (well-known arm):</strong> Samples cluster tightly around the true
            value. If the arm is genuinely good, its samples consistently beat others → exploitation.</p>
          </Callout>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-lg p-3">
              <h4 className="text-xs font-bold text-accent-green mb-1">Why many consider it the best</h4>
              <ul className="text-xs text-text-muted m-0 pl-4">
                <li><strong>No hyperparameters</strong> — nothing to tune</li>
                <li>Automatically balances explore/exploit</li>
                <li>Adapts faster than epsilon-greedy or UCB</li>
                <li>Often achieves the lowest regret in practice</li>
              </ul>
            </div>
            <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-lg p-3">
              <h4 className="text-xs font-bold text-accent-blue mb-1">The trade-off</h4>
              <ul className="text-xs text-text-muted m-0 pl-4">
                <li>Requires a probability model (Beta for binary)</li>
                <li>Slightly harder to implement</li>
                <li>Randomness makes it less predictable run-to-run</li>
                <li>Theoretical guarantees are harder to prove</li>
              </ul>
            </div>
          </div>

          <SimButton label="Watch Thompson Sampling learn" className="mt-2" />
        </Accordion>

        {/* ── SECTION 9 ── */}
        <Accordion number={9} title="Head-to-Head: Comparing All Three">
          <p className="text-sm text-text leading-relaxed mb-4">
            Now that you understand each strategy, let's put them side by side:
          </p>

          <div className="overflow-x-auto mb-5">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-surface-lighter">
                  <th className="text-left py-2 px-3 text-xs font-bold text-text-muted uppercase tracking-wider"></th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-primary-light uppercase tracking-wider">Epsilon-Greedy</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-accent-blue uppercase tracking-wider">UCB</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-accent-green uppercase tracking-wider">Thompson</th>
                </tr>
              </thead>
              <tbody className="text-text-muted">
                {[
                  ['Simplicity', '★★★ Trivial', '★★☆ Moderate', '★★☆ Moderate'],
                  ['Exploration style', 'Random', 'Uncertainty-based', 'Probability-based'],
                  ['Hyperparameters', 'ε (exploration rate)', 'c (confidence)', 'None'],
                  ['Adapts over time?', 'No (fixed ε)', 'Yes (bonus shrinks)', 'Yes (curves narrow)'],
                  ['Regret growth', 'Linear O(T)', 'Logarithmic O(ln T)', 'Logarithmic O(ln T)'],
                  ['Best for', 'Quick prototypes', 'When you need guarantees', 'When you want best performance'],
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

          <h4 className="text-sm font-bold text-text mb-3">When to use which?</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-surface rounded-lg p-3 border border-surface-lighter">
              <span className="text-xs font-bold text-primary-light">Epsilon-Greedy</span>
              <p className="text-xs text-text-muted mt-1 mb-0">When you need something working in 5 minutes. Great for
              prototypes, demos, or when the stakes are low.</p>
            </div>
            <div className="bg-surface rounded-lg p-3 border border-surface-lighter">
              <span className="text-xs font-bold text-accent-blue">UCB</span>
              <p className="text-xs text-text-muted mt-1 mb-0">When you need theoretical guarantees or deterministic behavior.
              Popular in research and systems that need reproducibility.</p>
            </div>
            <div className="bg-surface rounded-lg p-3 border border-surface-lighter">
              <span className="text-xs font-bold text-accent-green">Thompson Sampling</span>
              <p className="text-xs text-text-muted mt-1 mb-0">When you want the best practical performance and can model
              your rewards. The go-to choice for production A/B testing and recommendation systems.</p>
            </div>
          </div>

          <Callout type="insight">
            In practice, <strong>Thompson Sampling</strong> tends to outperform the others, especially when you have many
            arms or limited pulls. But <strong>epsilon-greedy</strong> is unbeatable for simplicity, and <strong>UCB</strong> shines
            when you need provable bounds. There is no single "best" — only the best fit for your constraints.
          </Callout>

          <SimButton label="Compare all three strategies side by side" className="mt-2" />
        </Accordion>

        {/* ── SECTION 10 ── */}
        <Accordion number={10} title="Going Deeper (Advanced Topics)">
          <p className="text-sm text-text leading-relaxed mb-5">
            The basic bandit problem is just the beginning. Here are the directions researchers and practitioners have
            taken it — each relaxing one of the simplifying assumptions we made.
          </p>

          <div className="flex flex-col gap-4">
            {/* Non-stationary */}
            <div className="bg-surface rounded-xl p-4 border border-surface-lighter">
              <h4 className="text-sm font-bold text-text mb-1">Non-Stationary Bandits</h4>
              <p className="text-xs text-text-muted italic mb-2">"The restaurant changes chefs"</p>
              <p className="text-sm text-text-muted leading-relaxed mb-2">
                What if the arms' reward rates change over time? Your running average equally weights your first pull and
                your most recent one — but old data might be misleading. The fix: use a <strong>constant step size</strong>
                <Eq tex="\alpha" inline /> instead of <Eq tex="1/n" inline />, so recent rewards weigh more.
              </p>
              <p className="text-xs text-primary-light">This matters because: most real-world problems are non-stationary. User
              preferences shift, website designs change, drug effectiveness varies with patient populations.</p>
            </div>

            {/* Contextual */}
            <div className="bg-surface rounded-xl p-4 border border-surface-lighter">
              <h4 className="text-sm font-bold text-text mb-1">Contextual Bandits</h4>
              <p className="text-xs text-text-muted italic mb-2">"Different time of day, different best choice"</p>
              <p className="text-sm text-text-muted leading-relaxed mb-2">
                What if the best arm depends on context? A lunch restaurant might be different from a dinner restaurant.
                Contextual bandits observe a <strong>feature vector</strong> (time, user demographics, weather) before
                choosing an arm, allowing personalized decisions.
              </p>
              <p className="text-xs text-primary-light">This matters because: it's the backbone of modern recommendation
              systems and personalized advertising — the same algorithm powers Netflix suggestions and Google Ads.</p>
            </div>

            {/* Decaying epsilon */}
            <div className="bg-surface rounded-xl p-4 border border-surface-lighter">
              <h4 className="text-sm font-bold text-text mb-1">Decaying Epsilon</h4>
              <p className="text-xs text-text-muted italic mb-2">"Explore less as you learn more"</p>
              <p className="text-sm text-text-muted leading-relaxed mb-2">
                A simple improvement to epsilon-greedy: start with a high <Eq tex="\varepsilon" inline /> (lots of
                exploration) and gradually decrease it toward zero. Common schedules:
                <Eq tex="\varepsilon_t = \varepsilon_0 / t" inline /> or <Eq tex="\varepsilon_t = \varepsilon_0 \cdot 0.999^t" inline />.
              </p>
              <p className="text-xs text-primary-light">This matters because: it gives epsilon-greedy the adaptive behavior
              that UCB and Thompson have naturally, often closing most of the performance gap.</p>
            </div>

            {/* Bayesian */}
            <div className="bg-surface rounded-xl p-4 border border-surface-lighter">
              <h4 className="text-sm font-bold text-text mb-1">Full Bayesian Bandits</h4>
              <p className="text-xs text-text-muted italic mb-2">"What if we had a crystal ball?"</p>
              <p className="text-sm text-text-muted leading-relaxed mb-2">
                Thompson Sampling uses Bayesian thinking for <em>each arm independently</em>. Full Bayesian approaches
                maintain a joint belief over all arms simultaneously and can compute the <strong>Gittins index</strong> — the
                mathematically optimal solution to the bandit problem.
              </p>
              <p className="text-xs text-primary-light">This matters because: it shows the theoretical optimum exists
              (the problem <em>is</em> solvable), even though computing it exactly is too expensive for most real applications.</p>
            </div>

            {/* Regret bounds */}
            <div className="bg-surface rounded-xl p-4 border border-surface-lighter">
              <h4 className="text-sm font-bold text-text mb-1">Theoretical Regret Bounds</h4>
              <p className="text-xs text-text-muted italic mb-2">"How well can any strategy possibly do?"</p>
              <p className="text-sm text-text-muted leading-relaxed mb-2">
                Lai and Robbins (1985) proved a fundamental lower bound: no strategy can achieve regret growing slower
                than <Eq tex="O(\ln T)" inline />. Both UCB and Thompson Sampling achieve this bound — they're
                <strong> asymptotically optimal</strong>. Epsilon-greedy with fixed <Eq tex="\varepsilon" inline /> has
                linear regret — it never stops wasting pulls.
              </p>
              <p className="text-xs text-primary-light">This matters because: it tells you when you've found a "good
              enough" strategy — if your regret is logarithmic, you're provably near-optimal.</p>
            </div>
          </div>

          <Callout type="try" title="Ready to experiment?">
            You've learned the theory — now it's time to build intuition. Head to the simulator, run each
            strategy for 1000 steps, and see which one finds the best arm fastest.
          </Callout>

          <div className="mt-4 text-center">
            <SimButton label="Go to the Simulator" />
          </div>
        </Accordion>

      </div>

      {/* ══════════════════════════════════════════
         REAL-WORLD APPLICATIONS (standalone section)
         ══════════════════════════════════════════ */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-text border-l-4 border-primary pl-4 mb-6">
          Real-World Applications
        </h2>
        <p className="text-sm text-text-muted mb-6">
          Bandit algorithms aren't just theory — they power decisions at the world's largest companies and most important institutions.
          Here are ten landmark deployments with links to the original research.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              org: 'Netflix', year: '2017-18',
              desc: 'Personalizing movie/show artwork per user using contextual bandits with Thompson Sampling. Each subscriber sees the thumbnail most likely to make them click, selected from dozens of candidate images in real time.',
              algo: 'Thompson Sampling (Contextual Bandits)',
              result: 'Significant engagement lift across 100M+ subscribers',
              links: [
                { label: 'Blog', url: 'https://netflixtechblog.com/artwork-personalization-c589f074ad76' },
                { label: 'Paper', url: 'https://dl.acm.org/doi/10.1145/3240323.3241729' },
              ],
            },
            {
              org: 'Yahoo!', year: '2010',
              desc: 'LinUCB for personalized news recommendation on the Yahoo! front page. The system modeled each user-article pair with a linear contextual bandit, selecting articles to maximize click-through rate.',
              algo: 'LinUCB (Linear Upper Confidence Bound)',
              result: '12.5% CTR lift over context-free bandits across 45M+ events',
              links: [
                { label: 'Paper', url: 'https://arxiv.org/abs/1003.0146' },
              ],
            },
            {
              org: 'Google', year: '2013',
              desc: 'Bayesian bandit-powered website content experiments in Google Analytics. Instead of waiting weeks for A/B test significance, the system automatically shifts traffic toward winning variants.',
              algo: 'Bayesian Bandits (Multi-Armed)',
              result: '~172 days saved per test vs. traditional A/B testing',
              links: [
                { label: 'Blog', url: 'https://analytics.googleblog.com/2013/01/multi-armed-bandit-experiments.html' },
                { label: 'Paper', url: 'https://research.google.com/pubs/archive/42550.pdf' },
              ],
            },
            {
              org: 'I-SPY 2 Trial', year: '2010-present',
              desc: 'Bayesian adaptive randomization for breast cancer clinical trials. The system assigns patients to the most promising experimental treatment based on accumulating evidence, accelerating drug discovery while minimizing patient exposure to ineffective drugs.',
              algo: 'Bayesian Adaptive Randomization',
              result: '7 of 12 experimental drugs graduated to phase 3',
              links: [
                { label: 'Paper (NEJM)', url: 'https://www.nejm.org/doi/full/10.1056/NEJMoa1513749' },
                { label: 'Overview', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7731787/' },
              ],
            },
            {
              org: 'Spotify', year: '2018-20',
              desc: 'BaRT (Bandits for Recommendations as Treatments) for home screen shelf personalization. The system decides which content shelves to show each user and in what order, using bandits with explainable recommendations.',
              algo: 'BaRT — Bandits for Recommendations as Treatments',
              result: 'Powers personalized shelf ranking for 400M+ users',
              links: [
                { label: 'Paper', url: 'https://dl.acm.org/doi/10.1145/3240323.3240354' },
                { label: 'Blog', url: 'https://engineering.atspotify.com/2020/01/for-your-ears-only-personalizing-spotify-home-with-machine-learning' },
              ],
            },
            {
              org: 'Microsoft', year: '2016-18',
              desc: 'Multiworld Testing Decision Service using contextual bandits (Vowpal Wabbit). Deployed for personalized news on MSN.com, later productized as Azure Personalizer for any developer to use.',
              algo: 'Contextual Bandits (Vowpal Wabbit)',
              result: '25% click lift on personalized news',
              links: [
                { label: 'Paper', url: 'https://arxiv.org/abs/1606.03966' },
                { label: 'Blog', url: 'https://www.microsoft.com/en-us/research/blog/contextual-bandit-breakthrough-enables-deeper-personalization/' },
              ],
            },
            {
              org: 'Stitch Fix', year: '2020',
              desc: 'Thompson Sampling bandits for landing page optimization, reducing the opportunity cost of traditional A/B tests by dynamically allocating traffic to higher-performing variants.',
              algo: 'Thompson Sampling',
              result: 'Reduced opportunity cost vs. traditional A/B tests',
              links: [
                { label: 'Blog', url: 'https://multithreaded.stitchfix.com/blog/2020/08/05/bandits/' },
              ],
            },
            {
              org: 'Meta / Facebook', year: '2018-19',
              desc: 'Horizon/ReAgent platform for push notification optimization using deep RL and contextual bandits. The system decides when and what to notify each user to maximize engagement without causing notification fatigue.',
              algo: 'Deep RL + Contextual Bandits (Horizon/ReAgent)',
              result: 'RL model outperformed supervised learning baseline',
              links: [
                { label: 'Paper', url: 'https://arxiv.org/abs/1811.00260' },
                { label: 'GitHub', url: 'https://github.com/facebookresearch/ReAgent' },
              ],
            },
            {
              org: 'DoorDash', year: '2020-22',
              desc: 'Hierarchical Bayesian Thompson Sampling for personalized cuisine filter recommendations. The system solves the cold-start problem by sharing information across similar users and cuisines.',
              algo: 'Hierarchical Bayesian Thompson Sampling',
              result: 'Solved cold-start problem for new user personalization',
              links: [
                { label: 'Blog', url: 'https://doordash.engineering/2020/01/27/personalized-cuisine-filter/' },
              ],
            },
            {
              org: 'Twitter / X', year: '2023',
              desc: 'Open-sourced recommendation algorithm with explore-exploit components for the "For You" timeline. Revealed internal engagement weightings (e.g. Retweets weighted ~20x a Like) and bandit-style content exploration.',
              algo: 'Explore-Exploit Bandits (Timeline Ranking)',
              result: 'Powers "For You" feed for 500M+ users',
              links: [
                { label: 'Blog', url: 'https://blog.x.com/engineering/en_us/topics/open-source/2023/twitter-recommendation-algorithm' },
                { label: 'GitHub', url: 'https://github.com/twitter/the-algorithm' },
              ],
            },
          ].map((cs) => (
            <div key={cs.org} className="bg-surface rounded-xl p-5 border border-surface-lighter">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-primary-light">{cs.org}</span>
                <span className="text-xs text-text-muted bg-surface-light px-2 py-0.5 rounded-full">{cs.year}</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed mb-2">{cs.desc}</p>
              <p className="text-xs text-primary-light italic mb-2">{cs.algo}</p>
              <p className="text-xs font-bold text-accent-green mb-2">{cs.result}</p>
              <div className="flex flex-wrap gap-2">
                {cs.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-medium text-primary-light bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-full no-underline transition-colors"
                  >
                    {link.label} &rarr;
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-10 text-center">
        <p className="text-sm text-text-muted mb-3">
          Now that you understand the theory, see it in action.
        </p>
        <SimButton label="Open the Multi-Armed Bandit Simulator" />
      </div>
    </div>
  )
}
