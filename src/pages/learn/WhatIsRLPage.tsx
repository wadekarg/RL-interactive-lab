import { useState, useCallback } from 'react'
import { Accordion, Callout, Eq, ChapterNav } from '../../components/shared/GuidePrimitives'

/* ══════════════════════════════════════════
   Interactive Widget: The RL Loop
   A simple animated diagram showing agent-environment interaction
   ══════════════════════════════════════════ */

function RLLoopWidget() {
  const [step, setStep] = useState(0)
  const phases = [
    { label: 'Agent observes state', agentHighlight: true, envHighlight: false, arrow: 'state', description: 'The environment sends the current state to the agent. The agent now knows its situation.' },
    { label: 'Agent chooses action', agentHighlight: true, envHighlight: false, arrow: 'action', description: 'Based on the state, the agent picks an action using its policy. This is the decision moment.' },
    { label: 'Environment responds', agentHighlight: false, envHighlight: true, arrow: 'reward', description: 'The environment processes the action, transitions to a new state, and returns a reward signal.' },
    { label: 'Loop repeats', agentHighlight: true, envHighlight: true, arrow: 'loop', description: 'The agent observes the new state and the cycle continues. Over time, the agent learns which actions lead to higher rewards.' },
  ]
  const phase = phases[step]

  const advance = useCallback(() => {
    setStep((s) => (s + 1) % phases.length)
  }, [phases.length])

  return (
    <div className="bg-surface rounded-xl border border-surface-lighter p-5 my-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Interactive: The RL Loop</h4>
        <button
          onClick={advance}
          className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary-light text-xs font-medium border-0 cursor-pointer hover:bg-primary/30 transition-colors"
        >
          Next Step &rarr;
        </button>
      </div>

      {/* Diagram */}
      <div className="flex items-center justify-center gap-8 mb-4">
        {/* Agent box */}
        <div className={`w-32 h-24 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-300 ${
          phase.agentHighlight ? 'border-primary bg-primary/10 scale-105' : 'border-surface-lighter bg-surface-light'
        }`}>
          <span className="text-2xl mb-1">{'\uD83E\uDD16'}</span>
          <span className="text-xs font-bold text-text">Agent</span>
        </div>

        {/* Arrows */}
        <div className="flex flex-col items-center gap-2 min-w-[100px]">
          <div className={`text-xs font-mono px-2 py-1 rounded transition-all duration-300 ${
            phase.arrow === 'state' ? 'bg-accent-blue/20 text-accent-blue scale-110' : 'text-text-muted'
          }`}>
            state &rarr;
          </div>
          <div className={`text-xs font-mono px-2 py-1 rounded transition-all duration-300 ${
            phase.arrow === 'action' ? 'bg-accent-green/20 text-accent-green scale-110' : 'text-text-muted'
          }`}>
            &larr; action
          </div>
          <div className={`text-xs font-mono px-2 py-1 rounded transition-all duration-300 ${
            phase.arrow === 'reward' ? 'bg-accent-yellow/20 text-accent-yellow scale-110' : 'text-text-muted'
          }`}>
            reward &rarr;
          </div>
        </div>

        {/* Environment box */}
        <div className={`w-32 h-24 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-300 ${
          phase.envHighlight ? 'border-accent-green bg-accent-green/10 scale-105' : 'border-surface-lighter bg-surface-light'
        }`}>
          <span className="text-2xl mb-1">{'\uD83C\uDF0D'}</span>
          <span className="text-xs font-bold text-text">Environment</span>
        </div>
      </div>

      {/* Phase description */}
      <div className="bg-surface-light rounded-lg p-3 text-center">
        <p className="text-sm font-semibold text-primary-light mb-1">
          Step {step + 1}: {phase.label}
        </p>
        <p className="text-xs text-text-muted m-0">{phase.description}</p>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   Interactive Widget: ML Paradigms Comparison
   ══════════════════════════════════════════ */

function MLParadigmsWidget() {
  const [selected, setSelected] = useState<'supervised' | 'unsupervised' | 'reinforcement'>('reinforcement')

  const paradigms = {
    supervised: {
      color: 'accent-blue',
      icon: '\uD83C\uDFEB',
      title: 'Supervised Learning',
      input: 'Labeled dataset (input \u2192 correct output)',
      signal: 'Error = prediction \u2212 true label',
      goal: 'Minimize prediction error',
      example: 'Email \u2192 "spam" or "not spam"',
      analogy: 'Learning from a teacher who gives you the answer key',
    },
    unsupervised: {
      color: 'accent-yellow',
      icon: '\uD83D\uDD0D',
      title: 'Unsupervised Learning',
      input: 'Unlabeled data (no correct answers)',
      signal: 'None — discover structure on your own',
      goal: 'Find patterns, clusters, representations',
      example: 'Group customers by buying behavior',
      analogy: 'Sorting a pile of objects with no instructions',
    },
    reinforcement: {
      color: 'accent-green',
      icon: '\uD83C\uDFAE',
      title: 'Reinforcement Learning',
      input: 'States from an environment (sequential)',
      signal: 'Reward signal (good/bad, not "correct answer")',
      goal: 'Maximize cumulative reward over time',
      example: 'Robot learns to walk by trial and error',
      analogy: 'Learning to ride a bike — you fall, adjust, improve',
    },
  }

  const p = paradigms[selected]

  return (
    <div className="bg-surface rounded-xl border border-surface-lighter p-5 my-5">
      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Compare: Three ML Paradigms</h4>

      {/* Tab selector */}
      <div className="flex gap-2 mb-4">
        {(Object.keys(paradigms) as (keyof typeof paradigms)[]).map((key) => (
          <button
            key={key}
            onClick={() => setSelected(key)}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border-0 cursor-pointer transition-colors ${
              selected === key
                ? `bg-${paradigms[key].color}/20 text-${paradigms[key].color}`
                : 'bg-surface-light text-text-muted hover:text-text hover:bg-surface-lighter'
            }`}
          >
            {paradigms[key].icon} {paradigms[key].title.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Details */}
      <div className={`bg-${p.color}/5 border border-${p.color}/20 rounded-xl p-4`}>
        <h4 className={`text-sm font-bold text-${p.color} mb-3`}>{p.icon} {p.title}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="font-bold text-text">Input:</span>
            <p className="text-text-muted m-0 mt-0.5">{p.input}</p>
          </div>
          <div>
            <span className="font-bold text-text">Learning Signal:</span>
            <p className="text-text-muted m-0 mt-0.5">{p.signal}</p>
          </div>
          <div>
            <span className="font-bold text-text">Goal:</span>
            <p className="text-text-muted m-0 mt-0.5">{p.goal}</p>
          </div>
          <div>
            <span className="font-bold text-text">Example:</span>
            <p className="text-text-muted m-0 mt-0.5">{p.example}</p>
          </div>
        </div>
        <div className="mt-3 bg-surface rounded-lg p-3">
          <span className="text-xs font-bold text-text">Analogy: </span>
          <span className="text-xs text-text-muted italic">{p.analogy}</span>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   MAIN PAGE: Chapter 1
   ══════════════════════════════════════════ */

export function WhatIsRLPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="mb-10 text-center">
        <div className="flex justify-center gap-3 mb-4">
          <a href="#/learn" className="text-sm text-primary-light hover:underline no-underline">
            &larr; All Chapters
          </a>
        </div>
        <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Chapter 1</p>
        <h1 className="text-4xl font-bold text-text mb-3">
          What is Reinforcement Learning?
        </h1>
        <p className="text-lg text-text-muted max-w-2xl mx-auto">
          An agent interacts with an environment, learns from rewards, and gets better over time.
          This simple loop is the foundation of everything in RL.
        </p>
        <div className="flex justify-center gap-3 mt-4 text-xs text-text-muted">
          <span className="bg-surface-light px-3 py-1 rounded-full">6 sections</span>
          <span className="bg-surface-light px-3 py-1 rounded-full">Interactive widgets</span>
          <span className="bg-surface-light px-3 py-1 rounded-full">No prerequisites</span>
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-4">

        {/* ── SECTION 1 ── */}
        <Accordion number={1} title="The Big Picture" defaultOpen>
          <p className="text-sm text-text leading-relaxed mb-4">
            Imagine teaching a dog a new trick. You don't show it a dataset of "correct" tricks. You don't
            give it a manual. Instead, the dog <strong>tries things</strong>, and you give it treats (rewards)
            when it does something right. Over time, it figures out what works.
          </p>
          <p className="text-sm text-text leading-relaxed mb-4">
            Reinforcement Learning works exactly the same way. An <strong>agent</strong> (the learner) interacts
            with an <strong>environment</strong> (the world), takes <strong>actions</strong>, and receives
            <strong> rewards</strong>. No one tells the agent the "correct" action — it must discover
            good behavior through trial and error.
          </p>

          <div className="bg-surface rounded-lg p-4 my-4">
            <p className="text-sm text-text leading-relaxed mb-0">
              <strong>Reinforcement Learning</strong> is learning what to do — how to map situations to actions —
              so as to maximize a numerical reward signal. The learner is not told which actions to take,
              but instead must discover which actions yield the most reward by trying them.
            </p>
            <p className="text-xs text-text-muted mt-2 mb-0 italic">— Sutton &amp; Barto, Chapter 1</p>
          </div>

          <Callout type="insight">
            RL is different from supervised learning because there's no "correct answer" given.
            It's different from unsupervised learning because there IS a clear goal (maximize reward).
            RL is its own paradigm — the science of learning from interaction.
          </Callout>
        </Accordion>

        {/* ── SECTION 2 ── */}
        <Accordion number={2} title="The Agent-Environment Loop">
          <p className="text-sm text-text leading-relaxed mb-4">
            Every RL problem follows the same pattern. There are only two participants and three signals:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-blue mb-2">{'\uD83E\uDD16'} Agent</h4>
              <p className="text-xs text-text leading-relaxed m-0">
                The learner and decision-maker. It observes states, chooses actions, and receives rewards.
                Its goal: learn a <em>policy</em> (strategy) that maximizes total reward over time.
              </p>
            </div>
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-green mb-2">{'\uD83C\uDF0D'} Environment</h4>
              <p className="text-xs text-text leading-relaxed m-0">
                Everything outside the agent. It receives the agent's action, updates its internal state,
                and sends back a new state and a reward. The environment's rules are often unknown to the agent.
              </p>
            </div>
          </div>

          <p className="text-sm text-text leading-relaxed mb-2">
            <strong>The three signals flowing between them:</strong>
          </p>
          <ul className="text-sm text-text-muted space-y-2 mb-4">
            <li className="flex items-start gap-2">
              <span className="text-accent-blue font-bold">S</span>
              <span><strong>State</strong> — The environment tells the agent its current situation. "You are here."</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-green font-bold">A</span>
              <span><strong>Action</strong> — The agent responds with a decision. "I'll go left."</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-yellow font-bold">R</span>
              <span><strong>Reward</strong> — The environment evaluates the outcome. "That was worth +1."</span>
            </li>
          </ul>

          <RLLoopWidget />

          <p className="text-sm text-text leading-relaxed mb-0">
            This loop repeats at every <strong>timestep</strong>. At time <Eq tex="t" inline />, the agent
            sees state <Eq tex="S_t" inline />, takes action <Eq tex="A_t" inline />, and receives
            reward <Eq tex="R_{t+1}" inline /> along with the next state <Eq tex="S_{t+1}" inline />.
            This sequence continues until the task ends (if it ends at all).
          </p>
        </Accordion>

        {/* ── SECTION 3 ── */}
        <Accordion number={3} title="How RL Differs from Other Machine Learning">
          <p className="text-sm text-text leading-relaxed mb-4">
            Machine learning has three main paradigms. Understanding how RL differs from the others
            clarifies what makes it unique — and uniquely challenging.
          </p>

          <MLParadigmsWidget />

          <p className="text-sm text-text leading-relaxed mb-4">
            <strong>What makes RL special?</strong>
          </p>
          <ul className="text-sm text-text-muted space-y-2 mb-4">
            <li className="flex items-start gap-2">
              <span className="text-primary-light">-</span>
              <span><strong>No supervisor</strong> — The agent isn't told the correct action, only whether the outcome was good or bad.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-light">-</span>
              <span><strong>Delayed rewards</strong> — An action now might not pay off until many steps later. A chess move in the opening matters at endgame.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-light">-</span>
              <span><strong>Sequential decisions</strong> — Each action changes the world, affecting all future states and rewards.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-light">-</span>
              <span><strong>Explore or exploit</strong> — Should the agent try something new (explore) or stick with what works (exploit)?</span>
            </li>
          </ul>

          <Callout type="think">
            Consider a thermostat learning to heat a house. Supervised learning would need a dataset
            of "correct" temperature settings for every situation. RL just needs a reward: +1 when
            the temperature is comfortable, 0 otherwise. The thermostat learns by <em>trying</em>
            different settings and observing results. Which approach seems more natural?
          </Callout>
        </Accordion>

        {/* ── SECTION 4 ── */}
        <Accordion number={4} title="Key Vocabulary">
          <p className="text-sm text-text leading-relaxed mb-4">
            Before diving deeper, let's establish the vocabulary. These terms appear throughout
            every RL textbook and paper.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {[
              { term: 'Agent', def: 'The learner / decision-maker. It chooses actions based on states.', color: 'accent-blue' },
              { term: 'Environment', def: 'Everything outside the agent. It produces states and rewards in response to actions.', color: 'accent-green' },
              { term: 'State (s)', def: 'A representation of the current situation. Contains all info needed to make a decision.', color: 'primary-light' },
              { term: 'Action (a)', def: 'A choice the agent makes at each timestep. Can be discrete (left/right) or continuous (force=3.7N).', color: 'accent-yellow' },
              { term: 'Reward (r)', def: 'A scalar feedback signal. Positive = good, negative = bad. The agent\'s only goal is to maximize total reward.', color: 'accent-red' },
              { term: 'Policy (\u03C0)', def: 'The agent\'s strategy: a mapping from states to actions. "When I see X, I do Y."', color: 'primary-light' },
              { term: 'Episode', def: 'One complete run from start to finish (e.g., one game of chess, one robot task). Not all problems have episodes.', color: 'accent-blue' },
              { term: 'Timestep (t)', def: 'One tick of the clock. At each timestep, the agent observes, acts, and learns.', color: 'accent-green' },
            ].map(({ term, def, color }) => (
              <div key={term} className="bg-surface-light rounded-lg p-3 border border-surface-lighter">
                <span className={`text-sm font-bold text-${color}`}>{term}</span>
                <p className="text-xs text-text-muted mt-1 mb-0">{def}</p>
              </div>
            ))}
          </div>

          <Callout type="insight">
            Notice that the <strong>reward</strong> is a single number — not a vector, not a matrix, just
            one scalar. This is deliberate. All of the agent's goals must be expressed as maximizing
            a single cumulative number. This is called the <strong>reward hypothesis</strong>, and it's
            one of the most important assumptions in RL.
          </Callout>
        </Accordion>

        {/* ── SECTION 5 ── */}
        <Accordion number={5} title="A Formal Sketch">
          <p className="text-sm text-text leading-relaxed mb-4">
            Let's write down the interaction loop formally. Don't worry if the notation feels new —
            we'll unpack every symbol in later chapters.
          </p>

          <p className="text-sm text-text leading-relaxed mb-2">
            At each timestep <Eq tex="t = 0, 1, 2, \ldots" inline />:
          </p>

          <div className="bg-surface rounded-lg p-4 my-3 text-sm text-text leading-relaxed">
            <p className="mb-2">1. The agent observes state <Eq tex="S_t" inline /></p>
            <p className="mb-2">2. The agent selects action <Eq tex="A_t" inline /> based on its policy <Eq tex="\pi" inline /></p>
            <p className="mb-2">3. The environment returns reward <Eq tex="R_{t+1}" inline /> and next state <Eq tex="S_{t+1}" inline /></p>
            <p className="mb-0">4. Go to step 1 with <Eq tex="t \leftarrow t+1" inline /></p>
          </div>

          <p className="text-sm text-text leading-relaxed mb-4">
            This produces a <strong>trajectory</strong>:
          </p>
          <Eq tex="S_0, A_0, R_1, S_1, A_1, R_2, S_2, A_2, R_3, \ldots" />

          <p className="text-sm text-text leading-relaxed mb-4">
            The agent's goal is to find a policy <Eq tex="\pi" inline /> that maximizes the <strong>expected
            cumulative reward</strong> (called the <strong>return</strong>):
          </p>
          <Eq tex="G_t = R_{t+1} + R_{t+2} + R_{t+3} + \cdots" />

          <Callout type="think">
            Why <Eq tex="R_{t+1}" inline /> and not <Eq tex="R_t" inline />? Because the reward at
            time <Eq tex="t+1" inline /> is the consequence of the action taken at time <Eq tex="t" inline />.
            The subscript refers to <em>when the reward is received</em>, not when the action happened.
            This convention is standard in Sutton &amp; Barto.
          </Callout>
        </Accordion>

        {/* ── SECTION 6 ── */}
        <Accordion number={6} title="Real-World Examples">
          <p className="text-sm text-text leading-relaxed mb-4">
            RL is everywhere once you know what to look for. Any problem where an agent makes sequential
            decisions in an uncertain environment is an RL problem.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {[
              { title: 'Game Playing', icon: '\uD83C\uDFAE', example: 'AlphaGo, Atari games, chess engines', detail: 'State = board position, action = move, reward = win/lose' },
              { title: 'Robotics', icon: '\uD83E\uDD16', example: 'Walking, grasping, navigation', detail: 'State = joint angles + sensors, action = motor torques, reward = task completion' },
              { title: 'Recommendation', icon: '\uD83D\uDCF1', example: 'YouTube, Spotify, Netflix', detail: 'State = user history, action = recommend video, reward = watch time / click' },
              { title: 'Resource Management', icon: '\u26A1', example: 'Data center cooling, traffic lights', detail: 'State = current load/conditions, action = allocation, reward = efficiency' },
              { title: 'Finance', icon: '\uD83D\uDCB0', example: 'Portfolio management, trading', detail: 'State = market data, action = buy/sell/hold, reward = profit' },
              { title: 'Healthcare', icon: '\uD83C\uDFE5', example: 'Treatment planning, drug dosing', detail: 'State = patient condition, action = treatment choice, reward = health outcome' },
            ].map(({ title, icon, example, detail }) => (
              <div key={title} className="bg-surface-light rounded-lg p-4 border border-surface-lighter">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{icon}</span>
                  <span className="text-sm font-bold text-text">{title}</span>
                </div>
                <p className="text-xs text-text-muted mb-1">{example}</p>
                <p className="text-xs text-primary-light italic m-0">{detail}</p>
              </div>
            ))}
          </div>

          <Callout type="insight">
            In every example, notice the pattern: <strong>state &rarr; action &rarr; reward</strong>.
            The details change, but the structure is always the same. This universality is what makes
            RL so powerful — one framework for an enormous range of problems.
          </Callout>
        </Accordion>
      </div>

      {/* Chapter navigation */}
      <ChapterNav
        next={{ path: '/learn/states-and-actions', label: 'Ch 2: States and Actions' }}
      />
    </div>
  )
}
