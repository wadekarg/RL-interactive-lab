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
      to="/gridworld"
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium no-underline hover:bg-primary-dark transition-colors ${className ?? ''}`}
    >
      <span>{'\uD83D\uDC18'}</span> {label ?? 'Try it in the Simulator'}
    </Link>
  )
}

/* ══════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════ */

export function GridWorldGuidePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="mb-10 text-center">
        <Link to="/gridworld" className="text-sm text-primary-light hover:underline no-underline mb-4 inline-block">
          &larr; Back to Simulator
        </Link>
        <h1 className="text-4xl font-bold text-text mb-3">
          GridWorld &amp; Reinforcement Learning
        </h1>
        <p className="text-lg text-text-muted max-w-2xl mx-auto">
          A complete guide to how agents learn to navigate. Follow Boru the elephant
          as he discovers the safest path to water — no prerequisites, just curiosity.
        </p>
        <div className="flex justify-center gap-3 mt-4 text-xs text-text-muted">
          <span className="bg-surface-light px-3 py-1 rounded-full">12 sections</span>
          <span className="bg-surface-light px-3 py-1 rounded-full">4 algorithms</span>
          <span className="bg-surface-light px-3 py-1 rounded-full">Worked examples</span>
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-4">

        {/* ── SECTION 1 ── */}
        <Accordion number={1} title="You're Already a Reinforcement Learner" defaultOpen>
          <p className="text-sm text-text leading-relaxed mb-4">
            Think about learning to drive. The first time you sat behind the wheel, you had no idea how much
            pressure to apply to the brake. Too hard — everyone jerks forward. Too soft — you roll into the car
            ahead. But after a few tries, you got it. Nobody gave you a formula. You learned from <em>consequences</em>.
          </p>
          <p className="text-sm text-text leading-relaxed mb-4">
            You do this constantly:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {[
              { icon: '🔥', text: 'Touch a hot stove → learn to avoid it. One trial was enough.' },
              { icon: '🗺️', text: 'Navigate a new city → try streets, hit dead ends, eventually find shortcuts.' },
              { icon: '🐕', text: 'Train a pet → reward good behavior, it happens more often.' },
              { icon: '🎮', text: 'Play a video game → die, respawn, try a different route.' },
            ].map((ex, i) => (
              <div key={i} className="bg-surface rounded-lg p-3 flex items-start gap-2">
                <span className="text-lg">{ex.icon}</span>
                <span className="text-sm text-text-muted">{ex.text}</span>
              </div>
            ))}
          </div>
          <Callout type="insight">
            Every time you learn from consequences — adjusting your behavior based on what happened
            last time — you're doing reinforcement learning. The difference between you and an RL algorithm
            is that the algorithm does this <strong>systematically</strong>, with math to guarantee improvement.
          </Callout>
          <p className="text-sm text-text leading-relaxed">
            In this guide, we'll follow <strong>Boru the elephant</strong> as he learns to navigate a grid
            world — avoiding lions, sidestepping cliffs, and finding the safest path to a water hole. Along the
            way, you'll learn the same ideas that power self-driving cars, game-playing AIs, and warehouse robots.
          </p>
        </Accordion>

        {/* ── SECTION 2 ── */}
        <Accordion number={2} title="Boru's World: States, Actions, and Rewards">
          <p className="text-sm text-text leading-relaxed mb-4">
            Boru lives on a grid. Each cell is a place he can stand. Some cells are safe grassland,
            some hide lions, some are impassable cliffs, and one contains a water hole — his destination.
            Let's define the key terms through Boru's story:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 my-5">
            {[
              { term: 'State (s)', def: 'Where Boru is right now — a specific cell on the grid. If the grid is 6×6, there are 36 possible states.', color: 'text-primary-light' },
              { term: 'Action (a)', def: 'What Boru can do: move Up, Down, Left, or Right. Four choices at every state (walls just bounce him back).', color: 'text-accent-blue' },
              { term: 'Reward (r)', def: 'The consequence of an action. Step on grass: small penalty (−0.1). Find water: big reward (+10). Meet a lion: big penalty (−10).', color: 'text-accent-green' },
              { term: 'Episode', def: 'One complete journey — from Boru\'s starting cell to the water hole (success) or a lion (failure). Then he starts over.', color: 'text-accent-yellow' },
              { term: 'Policy (π)', def: 'Boru\'s strategy — a rule that says "when I\'m in this cell, go this direction." The goal is to find the best one.', color: 'text-accent-red' },
              { term: 'Environment', def: 'Everything outside Boru: the grid layout, where the lions are, the rewards. Boru doesn\'t know these in advance — he has to discover them.', color: 'text-text-muted' },
            ].map((t) => (
              <div key={t.term} className="bg-surface rounded-lg p-4">
                <span className={`text-sm font-bold ${t.color}`}>{t.term}</span>
                <p className="text-xs text-text-muted mt-1 mb-0">{t.def}</p>
              </div>
            ))}
          </div>

          <Callout type="think">
            Notice the difference from the bandit problem: there, you just picked an arm and got a reward.
            Here, Boru makes a <em>sequence</em> of decisions, and each decision changes where he is. The
            reward from one action depends on the <strong>state</strong> he's in. This is what makes GridWorld richer — and
            closer to real-world problems.
          </Callout>

          <SimButton label="See Boru's world in the simulator" className="mt-2" />
        </Accordion>

        {/* ── SECTION 3 ── */}
        <Accordion number={3} title="Where Grid Worlds Hide in the Real World">
          <p className="text-sm text-text leading-relaxed mb-4">
            Grid worlds may look like a toy problem, but the same mathematical framework powers real systems.
            Any time an agent moves through states, takes actions, and receives rewards, it's a grid world in disguise:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { icon: '🤖', title: 'Robot Navigation', desc: 'A warehouse robot planning routes between shelves.', frame: 'States = locations, actions = move/turn, rewards = delivery speed minus collisions' },
              { icon: '🎮', title: 'Game AI', desc: 'Characters navigating game maps, avoiding enemies, reaching objectives.', frame: 'States = positions, actions = movement + abilities, rewards = score and survival' },
              { icon: '🚗', title: 'Autonomous Driving', desc: 'Self-driving cars choosing lanes, speeds, and turns.', frame: 'States = road context, actions = steering/acceleration, rewards = safety + progress' },
              { icon: '📦', title: 'Warehouse Logistics', desc: 'Optimizing which items to pick and in what order.', frame: 'States = inventory status, actions = pick/route choices, rewards = throughput' },
              { icon: '📅', title: 'Resource Scheduling', desc: 'Allocating compute jobs, hospital beds, or delivery trucks.', frame: 'States = resource availability, actions = assignment, rewards = utilization' },
              { icon: '🌐', title: 'Network Routing', desc: 'Directing data packets through a network to minimize latency.', frame: 'States = network topology, actions = forwarding decisions, rewards = low latency' },
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

          {/* Real-World Success Stories */}
          <h3 className="text-sm font-bold text-primary-light uppercase tracking-wider mt-6 mb-3">Real-World Success Stories</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { org: 'DeepMind', year: '2013-15', problem: 'Playing Atari games from raw pixels with no game-specific knowledge.', algo: 'DQN (Deep Q-Network)', result: 'Superhuman performance in 29+ of 49 Atari games' },
              { org: 'DeepMind', year: '2015-17', problem: 'Mastering the ancient board game Go, considered intractable for AI.', algo: 'Policy Gradient RL + Value Networks + MCTS', result: 'Beat world champion Lee Sedol 4-1' },
              { org: 'DeepMind + Google', year: '2016-18', problem: 'Optimizing data center cooling systems to reduce energy consumption.', algo: 'Deep Reinforcement Learning', result: '40% reduction in cooling energy usage' },
              { org: 'OpenAI', year: '2019', problem: 'Solving a Rubik\'s Cube with a dexterous robot hand.', algo: 'PPO (Proximal Policy Optimization)', result: 'Solves one-handed ~60% of the time' },
              { org: 'Waymo', year: '2022-25', problem: 'Planning safe driving behavior for autonomous vehicles.', algo: 'Imitation Learning + RL / Conservative Q-Learning', result: '38% fewer failures, 7.4\u00D7 fewer collisions vs. baselines' },
            ].map((cs) => (
              <div key={cs.org + cs.year} className="bg-surface rounded-xl p-4 border border-surface-lighter">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-primary-light">{cs.org}</span>
                  <span className="text-xs text-text-muted">{cs.year}</span>
                </div>
                <p className="text-xs text-text-muted mb-2">{cs.problem}</p>
                <p className="text-xs text-primary-light italic mb-2">{cs.algo}</p>
                <p className="text-xs font-bold text-accent-green m-0">{cs.result}</p>
              </div>
            ))}
          </div>

          <Callout type="insight">
            In every case, the core structure is identical: an agent in a <strong>state</strong> takes an <strong>action</strong>,
            transitions to a new state, and receives a <strong>reward</strong>. Learn to solve a grid world, and
            you've learned the foundation for all of these applications.
          </Callout>
        </Accordion>

        {/* ── SECTION 4 ── */}
        <Accordion number={4} title="The Goal: Learn a Policy Without a Map">
          <p className="text-sm text-text leading-relaxed mb-4">
            A <strong>policy</strong> is simply a rule that tells Boru what to do in every cell. "In cell (2,3), go Right.
            In cell (4,1), go Up." The <strong>optimal policy</strong> is the one that maximizes total reward over the
            entire journey — not just the next step, but every step until he reaches water.
          </p>
          <p className="text-sm text-text leading-relaxed mb-4">
            The challenge? Boru doesn't have a map. He doesn't know where the lions are, what the rewards are, or
            what happens when he walks off the edge. He has to <strong>learn</strong> all of this by trying — and
            every wrong step costs him.
          </p>
          <p className="text-sm text-text leading-relaxed mb-4">
            There are two fundamentally different ways to learn a good policy:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-blue mb-2">TD Learning (Model-Free)</h4>
              <p className="text-xs text-text-muted mb-2">"Learn by walking around"</p>
              <p className="text-xs text-text leading-relaxed m-0">
                Boru has no map. He explores the grid, bumps into things, and gradually figures out which
                cells are good and which are dangerous. <strong>Q-Learning</strong> and <strong>SARSA</strong> work this way.
              </p>
            </div>
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-green mb-2">Dynamic Programming (Model-Based)</h4>
              <p className="text-xs text-text-muted mb-2">"Plan with a perfect map"</p>
              <p className="text-xs text-text leading-relaxed m-0">
                Someone gives Boru a complete map of the grid — every reward, every transition. He can
                sit down and <em>compute</em> the best route without taking a single step. <strong>Value Iteration</strong> and <strong>Policy Iteration</strong> work this way.
              </p>
            </div>
          </div>

          <Callout type="think">
            Which family is more practical? It depends. If you can simulate the environment perfectly
            (like a chess engine), use DP — it's faster and guaranteed. If the environment is unknown or
            too complex to model (like a real robot), you need TD learning. In the simulator, you can try both
            and see the difference.
          </Callout>

          <SimButton label="See both families in action" className="mt-2" />
        </Accordion>

        {/* ── SECTION 5 ── */}
        <Accordion number={5} title="The Math, Made Simple">
          <p className="text-sm text-text leading-relaxed mb-4">
            Before diving into the four algorithms, you need three building blocks. Each one gets plain English
            first, then the formula, then a real example.
          </p>

          {/* Value Function */}
          <h3 className="text-sm font-bold text-primary-light uppercase tracking-wider mb-2">
            Building Block 1: The Value Function V(s)
          </h3>
          <p className="text-sm text-text leading-relaxed mb-2">
            <strong>In plain English:</strong> "How good is it to be in this state?" If Boru is standing one
            cell away from the water hole with no lions in the way, that's a high-value state. If he's
            surrounded by lions, that's a low-value state.
          </p>
          <Eq tex="V(s) = \mathbb{E}\left[\sum_{k=0}^{\infty} \gamma^k R_{t+k+1} \;\middle|\; S_t = s\right]" />
          <div className="bg-surface rounded-lg p-4 my-3 text-sm text-text-muted">
            <p className="mb-1"><Eq tex="V(s)" inline /> = the value of state <Eq tex="s" inline /> — expected total future reward from here</p>
            <p className="mb-1"><Eq tex="\gamma" inline /> = discount factor (0 to 1) — how much future rewards are worth compared to immediate ones</p>
            <p className="mb-0"><Eq tex="R_{t+k+1}" inline /> = the reward received <Eq tex="k" inline /> steps into the future</p>
          </div>

          {/* Q-Value */}
          <h3 className="text-sm font-bold text-primary-light uppercase tracking-wider mb-2 mt-6">
            Building Block 2: The Q-Value Q(s, a)
          </h3>
          <p className="text-sm text-text leading-relaxed mb-2">
            <strong>In plain English:</strong> "How good is it to take <em>this specific action</em> in this state?"
            V(s) tells you how good a cell is overall. Q(s, a) is more specific — it tells you how good it is
            to go <em>Up</em> from this cell versus going <em>Right</em>.
          </p>
          <Eq tex="Q(s, a) = \mathbb{E}\left[\sum_{k=0}^{\infty} \gamma^k R_{t+k+1} \;\middle|\; S_t = s, A_t = a\right]" />
          <div className="bg-surface rounded-lg p-4 my-3 text-sm text-text-muted">
            <p className="mb-1"><Eq tex="Q(s, a)" inline /> = the value of taking action <Eq tex="a" inline /> in state <Eq tex="s" inline /></p>
            <p className="mb-0">If you know all Q-values, the optimal policy is trivial: in each state, pick the action with the highest Q.</p>
          </div>

          {/* Bellman Equation */}
          <h3 className="text-sm font-bold text-primary-light uppercase tracking-wider mb-2 mt-6">
            Building Block 3: The Bellman Equation
          </h3>
          <p className="text-sm text-text leading-relaxed mb-2">
            <strong>In plain English:</strong> "The value of where I am = what I get now + the (discounted) value
            of where I end up." This recursive relationship is the foundation of <em>every</em> algorithm
            in this guide.
          </p>
          <Eq tex="V(s) = R(s) + \gamma \max_a V(s')" />
          <div className="bg-surface rounded-lg p-4 my-3 text-sm text-text-muted">
            <p className="mb-1"><Eq tex="R(s)" inline /> = the immediate reward in state <Eq tex="s" inline /></p>
            <p className="mb-1"><Eq tex="\gamma" inline /> = discount factor — "a dollar today vs. a dollar tomorrow"</p>
            <p className="mb-0"><Eq tex="\max_a V(s')" inline /> = the value of the best reachable next state</p>
          </div>

          {/* Discount factor example */}
          <h3 className="text-sm font-bold text-primary-light uppercase tracking-wider mb-2 mt-6">
            The Discount Factor {'\u03B3'}: A Dollar Today vs. Tomorrow
          </h3>
          <p className="text-sm text-text leading-relaxed mb-2">
            Would you rather have $100 today or $100 in a year? Most people choose today. The discount factor captures
            this preference — it says future rewards are worth a fraction of immediate ones.
          </p>
          <div className="bg-surface rounded-lg p-4 my-3 text-xs font-mono text-text-muted leading-relaxed">
            <p className="mb-1">With {'\u03B3'} = 0.9 and a reward of +10 at the water hole:</p>
            <p className="mb-1">1 step away: value = 0.9{'\u00B9'} × 10 = <strong className="text-text">9.0</strong></p>
            <p className="mb-1">2 steps away: value = 0.9{'\u00B2'} × 10 = <strong className="text-text">8.1</strong></p>
            <p className="mb-1">3 steps away: value = 0.9{'\u00B3'} × 10 = <strong className="text-text">7.29</strong></p>
            <p className="mb-0">5 steps away: value = 0.9{'\u2075'} × 10 = <strong className="text-text">5.90</strong></p>
          </div>

          <Callout type="insight">
            <p className="mb-1"><strong>{'\u03B3'} close to 1</strong> (e.g., 0.99): Boru is patient — he'll take a longer path if it avoids danger.</p>
            <p className="mb-0"><strong>{'\u03B3'} close to 0</strong> (e.g., 0.5): Boru is impatient — he wants rewards <em>now</em>, even if a shortcut is risky.</p>
          </Callout>
        </Accordion>

        {/* ── SECTION 6 ── */}
        <Accordion number={6} title="Two Families: Learning vs. Planning">
          <p className="text-sm text-text leading-relaxed mb-5">
            The four algorithms in this guide split neatly into two families. Understanding the difference
            is the key to knowing which tool to reach for.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-blue mb-2">Model-Free (TD Learning)</h4>
              <p className="text-xs text-text-muted mb-2">"Learn by doing"</p>
              <p className="text-xs text-text leading-relaxed mb-2">
                No map of the world. Boru walks around, bumps into things, and updates his beliefs one
                step at a time. Like learning a city by exploring on foot.
              </p>
              <p className="text-xs font-medium text-accent-blue m-0">Q-Learning &amp; SARSA</p>
            </div>
            <div className="bg-surface rounded-xl p-4 border border-surface-lighter flex flex-col items-center justify-center text-center">
              <span className="text-2xl mb-2">vs.</span>
              <p className="text-xs text-text-muted m-0">
                TD agents <em>experience</em> the world.<br />
                DP agents <em>compute</em> over the world.
              </p>
            </div>
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-green mb-2">Model-Based (Dynamic Prog.)</h4>
              <p className="text-xs text-text-muted mb-2">"Plan with a map"</p>
              <p className="text-xs text-text leading-relaxed mb-2">
                Full knowledge of the environment — every reward, every transition. Boru can compute
                the optimal path without moving. Like planning a road trip with Google Maps.
              </p>
              <p className="text-xs font-medium text-accent-green m-0">Value Iteration &amp; Policy Iteration</p>
            </div>
          </div>

          {/* Comparison table */}
          <div className="overflow-x-auto mb-5">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-surface-lighter">
                  <th className="text-left py-2 px-3 text-xs font-bold text-text-muted uppercase tracking-wider"></th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-accent-blue uppercase tracking-wider">TD Learning</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-accent-green uppercase tracking-wider">Dynamic Programming</th>
                </tr>
              </thead>
              <tbody className="text-text-muted">
                {[
                  ['Needs a model?', 'No — learns from experience', 'Yes — needs full transition + reward model'],
                  ['How it learns', 'Updates after each step (or episode)', 'Sweeps over all states repeatedly'],
                  ['Exploration', 'Must explore (ε-greedy, etc.)', 'No exploration — it already knows everything'],
                  ['When to use', 'Unknown or complex environments', 'Fully known, small-to-medium environments'],
                  ['Speed', 'Can be slow (needs many episodes)', 'Fast if state space is small'],
                  ['Real-world analogy', 'Learning a city by walking around', 'Planning a trip on Google Maps'],
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-surface/50' : ''}>
                    <td className="py-2 px-3 font-medium text-text text-xs">{row[0]}</td>
                    <td className="py-2 px-3 text-xs">{row[1]}</td>
                    <td className="py-2 px-3 text-xs">{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Callout type="insight">
            Neither family is universally better. TD learning works when the environment is unknown or huge (millions of states).
            Dynamic programming is faster and more accurate when you <em>can</em> model the environment perfectly. Most real-world
            systems use a mix — they learn a model from data, then plan within it.
          </Callout>

          <SimButton label="Try both families on the same grid" className="mt-2" />
        </Accordion>

        {/* ── SECTION 7 ── */}
        <Accordion number={7} title="Strategy 1: Q-Learning — The Optimistic Learner">
          <p className="text-sm text-text leading-relaxed mb-4">
            Q-Learning is the most famous reinforcement learning algorithm. Its core idea is beautifully simple:
          </p>
          <div className="bg-surface rounded-lg p-4 mb-4">
            <p className="text-sm text-text leading-relaxed">
              <strong>The intuition:</strong> "Always assume your future self will make the <em>best possible</em> choice."
              When updating your estimate of an action's value, pretend you'll play perfectly from here on —
              even if you actually explore randomly sometimes. This optimism drives Q-Learning to find the optimal
              policy faster.
            </p>
          </div>

          <Eq tex="Q(s, a) \leftarrow Q(s, a) + \alpha \left[ R + \gamma \max_{a'} Q(s', a') - Q(s, a) \right]" />

          <div className="bg-surface rounded-lg p-4 my-3 text-sm text-text-muted">
            <p className="mb-1"><Eq tex="Q(s, a)" inline /> = current estimate: "how good is action <Eq tex="a" inline /> in state <Eq tex="s" inline />?"</p>
            <p className="mb-1"><Eq tex="\alpha" inline /> = learning rate (how big each update is)</p>
            <p className="mb-1"><Eq tex="R" inline /> = the reward Boru just received</p>
            <p className="mb-1"><Eq tex="\gamma \max_{a'} Q(s', a')" inline /> = discounted value of the <strong>best action</strong> from the next state</p>
            <p className="mb-0"><Eq tex="R + \gamma \max_{a'} Q(s', a') - Q(s, a)" inline /> = the <strong>TD error</strong> — the "surprise" that drives learning</p>
          </div>

          <p className="text-sm text-text leading-relaxed mb-2">
            <strong>Worked example</strong> on a tiny 3×3 grid (<Eq tex="\alpha = 0.1, \gamma = 0.9" inline />):
          </p>
          <div className="bg-surface rounded-lg p-3 mb-3 text-xs text-text-muted font-mono">
            Grid: Boru starts at (2,0). Water hole at (0,2) with reward +10. Lion at (1,1) with reward −10. Step penalty: −0.1.
          </div>

          <StepBox steps={[
            {
              label: 'Boru at (2,0), goes Right → (2,1). Reward = −0.1',
              detail: 'Q((2,0), Right) = 0 + 0.1 × [−0.1 + 0.9 × max Q((2,1), ·) − 0] = 0 + 0.1 × [−0.1 + 0] = −0.01. First step — all Q-values start at 0, so the update is tiny.',
              type: 'explore',
            },
            {
              label: 'Boru at (2,1), goes Right → (2,2). Reward = −0.1',
              detail: 'Q((2,1), Right) = 0 + 0.1 × [−0.1 + 0.9 × 0 − 0] = −0.01. Still exploring — no information about the goal yet.',
              type: 'explore',
            },
            {
              label: 'Boru at (2,2), goes Up → (1,2). Reward = −0.1',
              detail: 'Q((2,2), Up) = 0 + 0.1 × [−0.1 + 0.9 × 0 − 0] = −0.01. Getting closer to the water hole, but Boru doesn\'t know that yet.',
              type: 'explore',
            },
            {
              label: 'Boru at (1,2), goes Up → (0,2). Reward = +10! Episode ends.',
              detail: 'Q((1,2), Up) = 0 + 0.1 × [10 + 0.9 × 0 − 0] = 1.0. Boru found the water hole! This big reward signal will propagate backward over future episodes.',
              type: 'exploit',
            },
            {
              label: 'New episode. Boru at (2,0), goes Right → (2,1). Reward = −0.1',
              detail: 'Q((2,0), Right) = −0.01 + 0.1 × [−0.1 + 0.9 × max(−0.01, …) − (−0.01)] = −0.019. Values are slowly propagating — in a few more episodes, the path to water will light up.',
              type: 'explore',
            },
          ]} />

          <p className="text-sm text-text leading-relaxed mb-2">
            <strong>Off-policy explained:</strong> Q-Learning is called "off-policy" because it uses{' '}
            <Eq tex="\max_{a'}" inline /> in the update — it assumes the best future action will be taken, even though
            Boru might actually explore randomly. This means Boru can learn the optimal policy <em>while</em> behaving
            sub-optimally (exploring). It's like studying the optimal chess moves while playing casual games.
          </p>

          <h4 className="text-sm font-bold text-text mt-5 mb-2">Hyperparameters</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-surface rounded-lg p-3">
              <span className="text-sm font-bold text-primary-light">{'\u03B1'} (Learning Rate)</span>
              <p className="text-xs text-text-muted mt-1 mb-0">How much each new experience shifts the estimate. High = fast but noisy. Low = stable but slow.</p>
            </div>
            <div className="bg-surface rounded-lg p-3">
              <span className="text-sm font-bold text-primary-light">{'\u03B3'} (Discount Factor)</span>
              <p className="text-xs text-text-muted mt-1 mb-0">How much Boru cares about distant rewards. High = patient planning. Low = short-sighted.</p>
            </div>
            <div className="bg-surface rounded-lg p-3">
              <span className="text-sm font-bold text-primary-light">{'\u03B5'} (Exploration Rate)</span>
              <p className="text-xs text-text-muted mt-1 mb-0">Probability of taking a random action. High = more discovery. Low = more exploitation.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-lg p-3">
              <h4 className="text-xs font-bold text-accent-green mb-1">Pros</h4>
              <ul className="text-xs text-text-muted m-0 pl-4">
                <li>Learns the optimal policy regardless of how it explores</li>
                <li>Simple to implement and widely understood</li>
                <li>Converges to optimal Q-values given enough exploration</li>
              </ul>
            </div>
            <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-3">
              <h4 className="text-xs font-bold text-accent-red mb-1">Cons</h4>
              <ul className="text-xs text-text-muted m-0 pl-4">
                <li>Can overestimate Q-values (the "optimism" cuts both ways)</li>
                <li>May learn risky policies it wouldn't actually follow</li>
                <li>Needs many episodes to converge in large grids</li>
              </ul>
            </div>
          </div>

          <SimButton label="Watch Q-Learning navigate the grid" className="mt-2" />
        </Accordion>

        {/* ── SECTION 8 ── */}
        <Accordion number={8} title="Strategy 2: SARSA — The Cautious Realist">
          <p className="text-sm text-text leading-relaxed mb-4">
            SARSA stands for <strong>S</strong>tate-<strong>A</strong>ction-<strong>R</strong>eward-<strong>S</strong>tate-<strong>A</strong>ction —
            the five elements it uses in every update. The key difference from Q-Learning? It doesn't assume you'll
            play optimally in the future.
          </p>

          <div className="bg-surface rounded-lg p-4 mb-4">
            <p className="text-sm text-text leading-relaxed">
              <strong>The intuition:</strong> "Plan for what you'll <em>actually do</em>, not what you <em>hope</em> to do."
              If Boru has a 15% chance of wandering randomly (exploration), SARSA factors that in.
              Q-Learning pretends future Boru is perfect; SARSA knows he'll keep exploring.
            </p>
          </div>

          <Eq tex="Q(s, a) \leftarrow Q(s, a) + \alpha \left[ R + \gamma Q(s', a') - Q(s, a) \right]" />

          <div className="bg-surface rounded-lg p-4 my-3 text-sm text-text-muted">
            <p className="mb-1">The only difference from Q-Learning is here: <Eq tex="Q(s', a')" inline /> instead of <Eq tex="\max_{a'} Q(s', a')" inline /></p>
            <p className="mb-0"><Eq tex="a'" inline /> = the action Boru <strong>actually takes</strong> in the next state (which might be random exploration!)</p>
          </div>

          <Callout type="insight" title="The critical difference, in one sentence">
            Q-Learning asks: "What's the best I <em>could</em> do from here?" SARSA asks: "What will I <em>actually</em> do from here?"
            This makes SARSA more conservative — it learns a safer policy because it accounts for its own tendency to explore.
          </Callout>

          <p className="text-sm text-text leading-relaxed mb-2">
            <strong>Same 3×3 grid worked example</strong> (<Eq tex="\alpha = 0.1, \gamma = 0.9, \varepsilon = 0.15" inline />):
          </p>

          <StepBox steps={[
            {
              label: 'Boru at (2,0), goes Right → (2,1). Next action chosen: Up. Reward = −0.1',
              detail: 'Q((2,0), Right) = 0 + 0.1 × [−0.1 + 0.9 × Q((2,1), Up) − 0] = −0.01. Same as Q-Learning here since all Q-values are 0.',
              type: 'explore',
            },
            {
              label: 'Boru at (2,1), takes Up → (1,1) — lion! Reward = −10. Episode ends.',
              detail: 'Q((2,1), Up) = 0 + 0.1 × [−10 + 0 − 0] = −1.0. SARSA learned the hard way: going Up from (2,1) leads to the lion!',
              type: 'explore',
            },
            {
              label: 'New episode. At (2,0), goes Right → (2,1). Next action chosen: Right. Reward = −0.1',
              detail: 'Q((2,0), Right) = −0.01 + 0.1 × [−0.1 + 0.9 × Q((2,1), Right) − (−0.01)] = −0.019. SARSA uses the ACTUAL next action (Right), not the max.',
              type: 'explore',
            },
            {
              label: 'At (2,1), takes Right → (2,2). Next action: Up. Reward = −0.1',
              detail: 'Q((2,1), Right) = 0 + 0.1 × [−0.1 + 0.9 × Q((2,2), Up) − 0] = −0.01. SARSA is cautiously learning — it remembers that Up from (2,1) was −1.0 and avoids it.',
              type: 'exploit',
            },
            {
              label: 'At (2,2), takes Up → (1,2). Next action: Up. Reward = −0.1',
              detail: 'Q((2,2), Up) = 0 + 0.1 × [−0.1 + 0.9 × Q((1,2), Up) − 0] = −0.01. Building a safer path that avoids the lion cell entirely.',
              type: 'exploit',
            },
          ]} />

          <h4 className="text-sm font-bold text-text mt-5 mb-3">The Cliff-Walking Example</h4>
          <p className="text-sm text-text leading-relaxed mb-2">
            The classic illustration of SARSA vs. Q-Learning: imagine a grid with a cliff along one edge. The
            shortest path runs right along the cliff edge.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-lg p-3">
              <span className="text-xs font-bold text-accent-blue">Q-Learning walks the edge</span>
              <p className="text-xs text-text-muted mt-1 mb-0">It learns the optimal path (shortest), but since it explores randomly,
              Boru occasionally slips off the cliff. The <em>policy</em> is optimal, but the actual behavior is risky.</p>
            </div>
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-lg p-3">
              <span className="text-xs font-bold text-accent-green">SARSA takes the safe route</span>
              <p className="text-xs text-text-muted mt-1 mb-0">It learns a longer but safer path away from the cliff. Since SARSA
              accounts for its own exploration, it avoids the edge where a random step would be fatal.</p>
            </div>
          </div>

          <Callout type="think">
            Which is "better"? If you'll eventually stop exploring ({'\u03B5'} → 0), Q-Learning gives you the optimal
            policy. But if you'll <em>always</em> explore a little (common in practice), SARSA gives you a policy
            that's actually safer to <em>follow</em>. The right choice depends on your deployment scenario.
          </Callout>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-lg p-3">
              <h4 className="text-xs font-bold text-accent-green mb-1">Pros</h4>
              <ul className="text-xs text-text-muted m-0 pl-4">
                <li>Learns safer policies that account for exploration</li>
                <li>Better for risk-sensitive applications (robotics, medicine)</li>
                <li>Same simplicity as Q-Learning</li>
              </ul>
            </div>
            <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-3">
              <h4 className="text-xs font-bold text-accent-red mb-1">Cons</h4>
              <ul className="text-xs text-text-muted m-0 pl-4">
                <li>Converges to a sub-optimal policy if exploration never stops</li>
                <li>Slower to find the truly optimal path</li>
                <li>On-policy: can't learn from another agent's experience</li>
              </ul>
            </div>
          </div>

          <SimButton label="Compare SARSA and Q-Learning side by side" className="mt-2" />
        </Accordion>

        {/* ── SECTION 9 ── */}
        <Accordion number={9} title="Strategy 3: Value Iteration — The All-Knowing Planner">
          <p className="text-sm text-text leading-relaxed mb-4">
            Now we switch families. Value Iteration doesn't learn by trial and error — it <strong>computes</strong> the
            optimal values directly, because it has complete knowledge of the environment.
          </p>

          <div className="bg-surface rounded-lg p-4 mb-4">
            <p className="text-sm text-text leading-relaxed">
              <strong>The intuition:</strong> "If you had a perfect map of every cell, every lion, and every reward,
              you could sit down with a calculator and figure out the value of every cell — and therefore
              the best move from every cell — without walking a single step."
            </p>
          </div>

          <p className="text-sm text-text leading-relaxed mb-2">
            Value Iteration works by repeatedly <strong>sweeping</strong> over every state and updating its value
            using the Bellman equation:
          </p>

          <Eq tex="V(s) \leftarrow \max_a \left[ R(s, a) + \gamma \sum_{s'} P(s' | s, a) \, V(s') \right]" />

          <div className="bg-surface rounded-lg p-4 my-3 text-sm text-text-muted">
            <p className="mb-1"><Eq tex="R(s, a)" inline /> = reward for taking action <Eq tex="a" inline /> in state <Eq tex="s" inline /> (known!)</p>
            <p className="mb-1"><Eq tex="P(s' | s, a)" inline /> = probability of landing in <Eq tex="s'" inline /> after doing <Eq tex="a" inline /> in <Eq tex="s" inline /> (known!)</p>
            <p className="mb-0">Each sweep updates <em>every</em> state. Repeat until values stop changing (convergence).</p>
          </div>

          <p className="text-sm text-text leading-relaxed mb-2">
            <strong>Worked example</strong> — 3×3 grid, {'\u03B3'} = 0.9. Water at (0,2) = +10, lion at (1,1) = −10, step = −0.1. Deterministic moves.
          </p>

          <h4 className="text-sm font-bold text-text mb-2">Sweep 1 (all V start at 0):</h4>
          <div className="bg-surface rounded-lg p-4 my-3 text-xs font-mono text-text-muted leading-relaxed">
            <p className="mb-1">V(0,2) = +10 (terminal — water hole, value is just the reward)</p>
            <p className="mb-1">V(0,1): best action Right → (0,2). V = −0.1 + 0.9 × 10 = <strong className="text-text">8.9</strong></p>
            <p className="mb-1">V(1,2): best action Up → (0,2). V = −0.1 + 0.9 × 10 = <strong className="text-text">8.9</strong></p>
            <p className="mb-1">V(1,1) = −10 (terminal — lion, episode ends)</p>
            <p className="mb-0">All other cells: best neighbor has V=0, so V = −0.1 + 0.9 × 0 = <strong className="text-text">−0.1</strong></p>
          </div>

          <h4 className="text-sm font-bold text-text mb-2">Sweep 2 (using updated values):</h4>
          <div className="bg-surface rounded-lg p-4 my-3 text-xs font-mono text-text-muted leading-relaxed">
            <p className="mb-1">V(0,0): best action Right → (0,1). V = −0.1 + 0.9 × 8.9 = <strong className="text-text">7.91</strong></p>
            <p className="mb-1">V(2,2): best action Up → (1,2). V = −0.1 + 0.9 × 8.9 = <strong className="text-text">7.91</strong></p>
            <p className="mb-1">V(1,0): best = Up→(0,0) or Right→(1,1). Up → −0.1 + 0.9 × (−0.1) = −0.19. Right → lion. <strong className="text-text">Best: −0.19 (go Up!)</strong></p>
            <p className="mb-0">After ~5-8 sweeps, all values converge. The optimal policy falls out: in each cell, go toward the highest-value neighbor.</p>
          </div>

          <Callout type="insight">
            Notice: no randomness, no exploration, no episodes. Value Iteration just does math — it sweeps
            and sweeps until the numbers stabilize. The "learning" is purely computational. This is incredibly
            efficient for small grids but becomes impossible for large state spaces (millions of cells).
          </Callout>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-lg p-3">
              <h4 className="text-xs font-bold text-accent-green mb-1">Pros</h4>
              <ul className="text-xs text-text-muted m-0 pl-4">
                <li>Guaranteed to find the optimal policy</li>
                <li>No exploration needed — deterministic convergence</li>
                <li>Fast for small-to-medium state spaces</li>
              </ul>
            </div>
            <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-3">
              <h4 className="text-xs font-bold text-accent-red mb-1">Cons</h4>
              <ul className="text-xs text-text-muted m-0 pl-4">
                <li>Requires complete environment model (transitions + rewards)</li>
                <li>Doesn't scale to large or continuous state spaces</li>
                <li>Useless if the environment is unknown</li>
              </ul>
            </div>
          </div>

          <SimButton label="Watch Value Iteration solve the grid" className="mt-2" />
        </Accordion>

        {/* ── SECTION 10 ── */}
        <Accordion number={10} title="Strategy 4: Policy Iteration — Evaluate, Then Improve">
          <p className="text-sm text-text leading-relaxed mb-4">
            Policy Iteration is Value Iteration's more methodical sibling. Instead of jumping straight to the
            optimal values, it alternates between two phases:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-blue mb-2">Phase 1: Policy Evaluation</h4>
              <p className="text-xs text-text leading-relaxed m-0">
                "Given my current policy (strategy), what's the value of every cell?"
                Sweep repeatedly until the values converge — but only for the actions the current policy says to take.
              </p>
              <Eq tex="V(s) \leftarrow R(s, \pi(s)) + \gamma \sum_{s'} P(s' | s, \pi(s)) \, V(s')" />
            </div>
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-green mb-2">Phase 2: Policy Improvement</h4>
              <p className="text-xs text-text leading-relaxed m-0">
                "Now that I know each cell's value, can I find a better action for any cell?"
                For each state, check if a different action would lead to a higher-value next state.
              </p>
              <Eq tex="\pi(s) \leftarrow \arg\max_a \left[ R(s,a) + \gamma \sum_{s'} P(s'|s,a) V(s') \right]" />
            </div>
          </div>

          <p className="text-sm text-text leading-relaxed mb-2">
            <strong>Worked example</strong> — same 3×3 grid:
          </p>

          <h4 className="text-sm font-bold text-text mb-2">Cycle 1:</h4>
          <div className="bg-surface rounded-lg p-4 my-3 text-xs font-mono text-text-muted leading-relaxed">
            <p className="mb-1"><strong>Initial policy:</strong> Every cell says "go Right" (arbitrary starting point).</p>
            <p className="mb-1"><strong>Evaluate:</strong> Following "always Right" → most cells bounce off walls or lead to mediocre paths. V(0,1) = −0.1 + 0.9 × 10 = 8.9 (it reaches the water). V(2,0) follows Right→Right→Up (eventually): low value after many steps.</p>
            <p className="mb-0"><strong>Improve:</strong> Cell (1,2) was going Right (→ wall), but Up → (0,2) has value 10. Update: {'\u03C0'}(1,2) = Up. Cell (0,0) was going Right → (0,1), already good. No change.</p>
          </div>

          <h4 className="text-sm font-bold text-text mb-2">Cycle 2:</h4>
          <div className="bg-surface rounded-lg p-4 my-3 text-xs font-mono text-text-muted leading-relaxed">
            <p className="mb-1"><strong>Evaluate:</strong> With the improved policy, values are higher — paths now route toward water more efficiently.</p>
            <p className="mb-0"><strong>Improve:</strong> A few more cells get updated. After 2-4 cycles, no more improvements are possible → optimal policy found!</p>
          </div>

          <Callout type="think" title="Why separate evaluation from improvement?">
            <p className="mb-1">Value Iteration tries to do both at once (greedily updating values with max). Policy Iteration
            separates them: fully evaluate the current strategy, <em>then</em> improve it.</p>
            <p className="mb-0">This often converges in fewer iterations because each evaluation phase runs to completion,
            giving the improvement phase accurate values to work with. For small grids, the difference is minor.
            For large state spaces, Policy Iteration can be significantly faster.</p>
          </Callout>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-lg p-3">
              <h4 className="text-xs font-bold text-accent-green mb-1">Pros</h4>
              <ul className="text-xs text-text-muted m-0 pl-4">
                <li>Often converges in fewer iterations than Value Iteration</li>
                <li>Guaranteed optimal — same result, different path</li>
                <li>Clean conceptual separation of evaluation and improvement</li>
              </ul>
            </div>
            <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-3">
              <h4 className="text-xs font-bold text-accent-red mb-1">Cons</h4>
              <ul className="text-xs text-text-muted m-0 pl-4">
                <li>Each evaluation phase can be expensive (many inner sweeps)</li>
                <li>Same model requirement as Value Iteration</li>
                <li>More complex to implement than Value Iteration</li>
              </ul>
            </div>
          </div>

          <SimButton label="See Policy Iteration evaluate and improve" className="mt-2" />
        </Accordion>

        {/* ── SECTION 11 ── */}
        <Accordion number={11} title="Head-to-Head: Comparing All Four">
          <p className="text-sm text-text leading-relaxed mb-4">
            Now that you understand all four algorithms, let's put them side by side:
          </p>

          <div className="overflow-x-auto mb-5">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-surface-lighter">
                  <th className="text-left py-2 px-3 text-xs font-bold text-text-muted uppercase tracking-wider"></th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-accent-blue uppercase tracking-wider">Q-Learning</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-primary-light uppercase tracking-wider">SARSA</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-accent-green uppercase tracking-wider">Value Iter.</th>
                  <th className="text-left py-2 px-3 text-xs font-bold text-accent-yellow uppercase tracking-wider">Policy Iter.</th>
                </tr>
              </thead>
              <tbody className="text-text-muted">
                {[
                  ['Family', 'TD (Model-Free)', 'TD (Model-Free)', 'DP (Model-Based)', 'DP (Model-Based)'],
                  ['Needs model?', 'No', 'No', 'Yes', 'Yes'],
                  ['Explores?', 'Yes (ε-greedy)', 'Yes (ε-greedy)', 'No', 'No'],
                  ['Policy type', 'Off-policy', 'On-policy', 'N/A (planning)', 'N/A (planning)'],
                  ['Hyperparams', 'α, γ, ε', 'α, γ, ε', 'γ only', 'γ only'],
                  ['Convergence', 'Many episodes', 'Many episodes', 'Few sweeps', 'Few cycles'],
                  ['Best for', 'Unknown envs, optimal policy', 'Safety-critical, risk-averse', 'Small known envs', 'Larger known envs'],
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-surface/50' : ''}>
                    <td className="py-2 px-3 font-medium text-text text-xs">{row[0]}</td>
                    <td className="py-2 px-3 text-xs">{row[1]}</td>
                    <td className="py-2 px-3 text-xs">{row[2]}</td>
                    <td className="py-2 px-3 text-xs">{row[3]}</td>
                    <td className="py-2 px-3 text-xs">{row[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 className="text-sm font-bold text-text mb-3">When to use which?</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="bg-surface rounded-lg p-3 border border-surface-lighter">
              <span className="text-xs font-bold text-accent-blue">Q-Learning</span>
              <p className="text-xs text-text-muted mt-1 mb-0">When the environment is unknown and you want the optimal policy.
              The workhorse of model-free RL — from game AI to robotics.</p>
            </div>
            <div className="bg-surface rounded-lg p-3 border border-surface-lighter">
              <span className="text-xs font-bold text-primary-light">SARSA</span>
              <p className="text-xs text-text-muted mt-1 mb-0">When safety matters more than optimality. If a wrong step during
              learning could be costly (real robots, medical systems), SARSA's caution pays off.</p>
            </div>
            <div className="bg-surface rounded-lg p-3 border border-surface-lighter">
              <span className="text-xs font-bold text-accent-green">Value Iteration</span>
              <p className="text-xs text-text-muted mt-1 mb-0">When you have a perfect model and a small state space.
              Great for board games, simple planning, and understanding RL fundamentals.</p>
            </div>
            <div className="bg-surface rounded-lg p-3 border border-surface-lighter">
              <span className="text-xs font-bold text-accent-yellow">Policy Iteration</span>
              <p className="text-xs text-text-muted mt-1 mb-0">Same scenario as Value Iteration but with a larger state space.
              The two-phase approach can converge faster when there are many states to evaluate.</p>
            </div>
          </div>

          <Callout type="insight">
            In practice, <strong>Q-Learning</strong> is the most widely used because most interesting environments
            are too complex to model perfectly. But when you <em>can</em> model the environment (simulations,
            games with known rules), DP methods are faster and more reliable. The best practitioners know all four
            and pick the right tool for the job.
          </Callout>

          <SimButton label="Compare algorithms on the same grid" className="mt-2" />
        </Accordion>

        {/* ── SECTION 12 ── */}
        <Accordion number={12} title="Going Deeper (Advanced Topics)">
          <p className="text-sm text-text leading-relaxed mb-5">
            The grid world is just the beginning. Here are five directions that take these ideas much further —
            each one relaxes a simplifying assumption we made.
          </p>

          <div className="flex flex-col gap-4">
            {/* DQN */}
            <div className="bg-surface rounded-xl p-4 border border-surface-lighter">
              <h4 className="text-sm font-bold text-text mb-1">Deep Q-Networks (DQN)</h4>
              <p className="text-xs text-text-muted italic mb-2">"What if the grid is too big for a table?"</p>
              <p className="text-sm text-text-muted leading-relaxed mb-2">
                Q-Learning stores Q-values in a table — one entry per state-action pair. For a 6×6 grid with 4 actions,
                that's only 144 entries. But what about a video game with millions of pixels as the state? You can't
                build a table that big. DQN replaces the table with a <strong>neural network</strong> that takes the state
                as input and outputs Q-values for each action. This is what DeepMind used to play Atari games at superhuman level.
              </p>
              <p className="text-xs text-primary-light">This matters because: it's the bridge from tabular RL (what we learned) to deep RL (what powers modern AI breakthroughs).</p>
            </div>

            {/* POMDPs */}
            <div className="bg-surface rounded-xl p-4 border border-surface-lighter">
              <h4 className="text-sm font-bold text-text mb-1">Partial Observability (POMDPs)</h4>
              <p className="text-xs text-text-muted italic mb-2">"What if Boru can't see the whole grid?"</p>
              <p className="text-sm text-text-muted leading-relaxed mb-2">
                We assumed Boru knows exactly which cell he's in. But what if he can only see the cells immediately
                around him? Or what if there's fog? This is a <strong>Partially Observable MDP</strong>. The agent must
                maintain a <em>belief</em> about its state — a probability distribution over where it might be — and
                make decisions under this uncertainty.
              </p>
              <p className="text-xs text-primary-light">This matters because: almost every real-world problem is partially observable. A self-driving car can't see around corners. A doctor can't observe a patient's full internal state.</p>
            </div>

            {/* Multi-agent */}
            <div className="bg-surface rounded-xl p-4 border border-surface-lighter">
              <h4 className="text-sm font-bold text-text mb-1">Multi-Agent RL</h4>
              <p className="text-xs text-text-muted italic mb-2">"What if there are two elephants?"</p>
              <p className="text-sm text-text-muted leading-relaxed mb-2">
                What if multiple agents share the same grid? They might cooperate (two elephants helping each other
                find water), compete (two elephants racing to the same water hole), or both. Each agent's optimal
                strategy now depends on what the <em>other</em> agents do — this is where RL meets game theory.
              </p>
              <p className="text-xs text-primary-light">This matters because: autonomous vehicles share roads with other drivers. Trading algorithms compete with other trading algorithms. Cooperation and competition are everywhere.</p>
            </div>

            {/* Continuous */}
            <div className="bg-surface rounded-xl p-4 border border-surface-lighter">
              <h4 className="text-sm font-bold text-text mb-1">Continuous State &amp; Action Spaces</h4>
              <p className="text-xs text-text-muted italic mb-2">"What if Boru isn't on a grid?"</p>
              <p className="text-sm text-text-muted leading-relaxed mb-2">
                Grids have a finite number of cells and discrete actions (Up/Down/Left/Right). Real robots have
                continuous positions (x=3.7, y=12.1) and continuous actions (turn 23.5 degrees, accelerate at 2.1 m/s²).
                Algorithms like <strong>DDPG</strong>, <strong>SAC</strong>, and <strong>PPO</strong> handle these
                infinite spaces using neural networks and continuous optimization.
              </p>
              <p className="text-xs text-primary-light">This matters because: the real world is continuous. Robotics, control systems, and physics simulations all need RL that works beyond grids.</p>
            </div>

            {/* Reward shaping */}
            <div className="bg-surface rounded-xl p-4 border border-surface-lighter">
              <h4 className="text-sm font-bold text-text mb-1">Reward Shaping</h4>
              <p className="text-xs text-text-muted italic mb-2">"Designing rewards is an art"</p>
              <p className="text-sm text-text-muted leading-relaxed mb-2">
                We gave Boru simple rewards: +10 for water, −10 for lions, −0.1 per step. But what if the
                rewards are wrong? An agent optimizes whatever you measure — if the rewards are misaligned
                with your true goal, the agent will find creative (and unintended) ways to maximize them.
                <strong> Reward shaping</strong> is the art of designing rewards that actually produce the behavior you want.
              </p>
              <p className="text-xs text-primary-light">This matters because: reward misalignment is one of the biggest challenges in AI safety. A cleaning robot rewarded for "not seeing messes" might learn to close its eyes instead of cleaning.</p>
            </div>
          </div>

          <Callout type="try" title="Ready to experiment?">
            You've learned the theory — four algorithms, two families, and the math behind them all.
            Now it's time to build intuition. Head to the simulator, try each algorithm, tweak the
            hyperparameters, and see how they behave differently on the same grid.
          </Callout>

          <div className="mt-4 text-center">
            <SimButton label="Go to the Simulator" />
          </div>
        </Accordion>

      </div>

      {/* Footer */}
      <div className="mt-10 text-center">
        <p className="text-sm text-text-muted mb-3">
          Now that you understand the theory, see it in action.
        </p>
        <SimButton label="Open the GridWorld Simulator" />
      </div>
    </div>
  )
}
