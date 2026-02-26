import { useState, useCallback } from 'react'
import { Accordion, Callout, Eq, ChapterNav } from '../../components/shared/GuidePrimitives'

/* ══════════════════════════════════════════
   Interactive Widget: MDP Tuple Builder
   Shows the 5 components of an MDP for different environments
   ══════════════════════════════════════════ */

function MDPTupleWidget() {
  const [env, setEnv] = useState<'gridworld' | 'bandit' | 'cartpole'>('gridworld')

  const envs = {
    gridworld: {
      label: 'GridWorld',
      icon: '\uD83D\uDC18',
      S: { desc: 'All grid cells', example: '{(0,0), (0,1), ..., (5,5)}', size: '36 states' },
      A: { desc: 'Movement directions', example: '{Up, Down, Left, Right}', size: '4 actions' },
      P: { desc: 'Move in chosen direction (with possible wind)', example: 'P((1,0), Down | (0,0), Down) = 0.8\nP((0,1), Down | (0,0), Down) = 0.1\nP((0,0), Down | (0,0), Down) = 0.1', deterministic: false },
      R: { desc: 'Step penalty + goal bonus', example: 'R = -0.04 per step\nR = +1.0 at goal\nR = -1.0 at cliff' },
      gamma: { value: '0.99', reason: 'Agent should plan far ahead to find shortest path' },
    },
    bandit: {
      label: 'Bandit',
      icon: '\uD83C\uDFB0',
      S: { desc: 'Single constant state', example: '{s\u2080}', size: '1 state' },
      A: { desc: 'Pull one of k arms', example: '{Arm 0, Arm 1, ..., Arm k-1}', size: 'k actions' },
      P: { desc: 'Always stays in same state', example: 'P(s\u2080 | s\u2080, any action) = 1.0', deterministic: true },
      R: { desc: 'Drawn from arm\'s hidden distribution', example: 'R ~ Normal(\u03BC\u2090, 1) for arm a\nEach arm has different \u03BC\u2090' },
      gamma: { value: '1.0 (or N/A)', reason: 'No sequential dependency \u2014 each pull is independent' },
    },
    cartpole: {
      label: 'CartPole',
      icon: '\uD83D\uDE80',
      S: { desc: '4D continuous state', example: '(x, v, \u03B8, \u03C9) \u2208 \u211D\u2074', size: '\u221E states' },
      A: { desc: 'Push cart left or right', example: '{Left, Right}', size: '2 actions' },
      P: { desc: 'Newtonian physics simulation', example: 'Given (x, v, \u03B8, \u03C9) and force F:\n\u03B8\u2032 = \u03B8 + \u0394t\u00B7\u03C9\n\u03C9\u2032 = \u03C9 + \u0394t\u00B7f(\u03B8, \u03C9, F)\nDeterministic dynamics', deterministic: true },
      R: { desc: '+1 for every step alive', example: 'R = +1 if |\u03B8| < 12\u00B0 and |x| < 2.4\nR = 0 (episode ends) otherwise' },
      gamma: { value: '0.99', reason: 'Must value future survival to learn balance' },
    },
  }

  const e = envs[env]

  return (
    <div className="bg-surface rounded-xl border border-surface-lighter p-5 my-5">
      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Interactive: Build an MDP</h4>

      <div className="flex gap-2 mb-4">
        {(Object.keys(envs) as (keyof typeof envs)[]).map((key) => (
          <button
            key={key}
            onClick={() => setEnv(key)}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border-0 cursor-pointer transition-colors ${
              env === key
                ? 'bg-primary/20 text-primary-light'
                : 'bg-surface-light text-text-muted hover:text-text hover:bg-surface-lighter'
            }`}
          >
            {envs[key].icon} {envs[key].label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {/* S */}
        <div className="bg-accent-blue/5 border border-accent-blue/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-accent-blue">S</span>
            <span className="text-xs font-bold text-text">State Space</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-lighter text-text-muted ml-auto">{e.S.size}</span>
          </div>
          <p className="text-xs text-text-muted mb-1">{e.S.desc}</p>
          <p className="text-xs font-mono text-primary-light m-0">{e.S.example}</p>
        </div>

        {/* A */}
        <div className="bg-accent-green/5 border border-accent-green/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-accent-green">A</span>
            <span className="text-xs font-bold text-text">Action Space</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-lighter text-text-muted ml-auto">{e.A.size}</span>
          </div>
          <p className="text-xs text-text-muted mb-1">{e.A.desc}</p>
          <p className="text-xs font-mono text-primary-light m-0">{e.A.example}</p>
        </div>

        {/* P */}
        <div className="bg-accent-yellow/5 border border-accent-yellow/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-accent-yellow">P</span>
            <span className="text-xs font-bold text-text">Transition Function</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ml-auto ${e.P.deterministic ? 'bg-accent-green/20 text-accent-green' : 'bg-accent-yellow/20 text-accent-yellow'}`}>
              {e.P.deterministic ? 'Deterministic' : 'Stochastic'}
            </span>
          </div>
          <p className="text-xs text-text-muted mb-1">{e.P.desc}</p>
          <pre className="text-xs font-mono text-primary-light m-0 whitespace-pre-wrap">{e.P.example}</pre>
        </div>

        {/* R */}
        <div className="bg-accent-red/5 border border-accent-red/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-accent-red">R</span>
            <span className="text-xs font-bold text-text">Reward Function</span>
          </div>
          <p className="text-xs text-text-muted mb-1">{e.R.desc}</p>
          <pre className="text-xs font-mono text-primary-light m-0 whitespace-pre-wrap">{e.R.example}</pre>
        </div>

        {/* gamma */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-primary-light">{'\u03B3'}</span>
            <span className="text-xs font-bold text-text">Discount Factor</span>
            <span className="text-xs font-mono text-primary-light ml-auto">{e.gamma.value}</span>
          </div>
          <p className="text-xs text-text-muted m-0">{e.gamma.reason}</p>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   Interactive Widget: Markov Property Tester
   Shows that history doesn't matter if state is Markov
   ══════════════════════════════════════════ */

function MarkovPropertyWidget() {
  const [showHistory, setShowHistory] = useState(false)

  const historyA = [
    { t: 0, state: '(0,0)', action: 'Right' },
    { t: 1, state: '(0,1)', action: 'Right' },
    { t: 2, state: '(0,2)', action: 'Down' },
    { t: 3, state: '(1,2)', action: 'Down' },
    { t: 4, state: '(2,2)', action: '???' },
  ]

  const historyB = [
    { t: 0, state: '(2,0)', action: 'Right' },
    { t: 1, state: '(2,1)', action: 'Right' },
    { t: 2, state: '(2,2)', action: '???' },
  ]

  return (
    <div className="bg-surface rounded-xl border border-surface-lighter p-5 my-5">
      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Interactive: The Markov Property</h4>
      <p className="text-xs text-text-muted mb-3">
        Two agents arrive at the same state via different paths. Does the history matter?
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="bg-accent-blue/5 border border-accent-blue/20 rounded-xl p-4">
          <h4 className="text-xs font-bold text-accent-blue mb-2">Agent A (long path)</h4>
          <div className="flex flex-col gap-1">
            {historyA.map((step) => (
              <div key={step.t} className={`flex items-center gap-2 text-xs ${step.action === '???' ? 'text-primary-light font-bold' : 'text-text-muted'}`}>
                <span className="font-mono w-8">t={step.t}</span>
                <span className="font-mono">{step.state}</span>
                <span>{step.action === '???' ? '\u2192 ?' : `\u2192 ${step.action}`}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-accent-green/5 border border-accent-green/20 rounded-xl p-4">
          <h4 className="text-xs font-bold text-accent-green mb-2">Agent B (short path)</h4>
          <div className="flex flex-col gap-1">
            {historyB.map((step) => (
              <div key={step.t} className={`flex items-center gap-2 text-xs ${step.action === '???' ? 'text-primary-light font-bold' : 'text-text-muted'}`}>
                <span className="font-mono w-8">t={step.t}</span>
                <span className="font-mono">{step.state}</span>
                <span>{step.action === '???' ? '\u2192 ?' : `\u2192 ${step.action}`}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center mb-3">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="px-4 py-2 rounded-lg bg-primary/20 text-primary-light text-xs font-medium border-0 cursor-pointer hover:bg-primary/30 transition-colors"
        >
          {showHistory ? 'Hide answer' : 'Does the history matter?'}
        </button>
      </div>

      {showHistory && (
        <div className="bg-accent-green/10 border border-accent-green/30 rounded-lg p-4">
          <p className="text-sm text-text leading-relaxed mb-2">
            <strong>No!</strong> Both agents are in state <strong>(2,2)</strong>. If the state is Markov,
            everything the agent needs to decide its next action is captured in (2,2) alone.
          </p>
          <p className="text-xs text-text-muted mb-0">
            It doesn't matter that Agent A took 4 steps to get here and Agent B took 2. The
            transition probabilities and expected rewards from (2,2) are identical for both.
            The future depends only on <strong>where you are</strong>, not <strong>how you got there</strong>.
          </p>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════
   Interactive Widget: Transition Diagram
   A small MDP with clickable states to see transitions
   ══════════════════════════════════════════ */

function TransitionDiagramWidget() {
  const [currentState, setCurrentState] = useState<'S1' | 'S2' | 'S3' | 'Goal'>('S1')
  const [lastAction, setLastAction] = useState<string | null>(null)
  const [lastReward, setLastReward] = useState<number | null>(null)
  const [stepLog, setStepLog] = useState<string[]>([])

  const transitions: Record<string, Record<string, { next: string; prob: number; reward: number }[]>> = {
    S1: {
      'Go Right': [
        { next: 'S2', prob: 0.8, reward: -1 },
        { next: 'S1', prob: 0.2, reward: -1 },
      ],
      'Go Down': [
        { next: 'S3', prob: 0.9, reward: -1 },
        { next: 'S1', prob: 0.1, reward: -1 },
      ],
    },
    S2: {
      'Go Right': [
        { next: 'Goal', prob: 0.7, reward: 10 },
        { next: 'S2', prob: 0.3, reward: -1 },
      ],
      'Go Down': [
        { next: 'S3', prob: 1.0, reward: -1 },
      ],
    },
    S3: {
      'Go Right': [
        { next: 'Goal', prob: 0.5, reward: 10 },
        { next: 'S3', prob: 0.5, reward: -1 },
      ],
      'Go Up': [
        { next: 'S1', prob: 0.6, reward: -1 },
        { next: 'S3', prob: 0.4, reward: -1 },
      ],
    },
    Goal: {},
  }

  const stateColors: Record<string, string> = {
    S1: 'accent-blue',
    S2: 'accent-yellow',
    S3: 'accent-red',
    Goal: 'accent-green',
  }

  const takeAction = useCallback((action: string) => {
    const outcomes = transitions[currentState]?.[action]
    if (!outcomes) return
    const r = Math.random()
    let cum = 0
    for (const o of outcomes) {
      cum += o.prob
      if (r < cum) {
        const logEntry = `${currentState} \u2014 ${action} \u2192 ${o.next} (r=${o.reward > 0 ? '+' : ''}${o.reward})`
        setStepLog((prev) => [...prev.slice(-7), logEntry])
        setLastAction(action)
        setLastReward(o.reward)
        setCurrentState(o.next as typeof currentState)
        return
      }
    }
  }, [currentState, transitions])

  const reset = useCallback(() => {
    setCurrentState('S1')
    setLastAction(null)
    setLastReward(null)
    setStepLog([])
  }, [])

  const availableActions = Object.keys(transitions[currentState] || {})
  const isTerminal = currentState === 'Goal'

  return (
    <div className="bg-surface rounded-xl border border-surface-lighter p-5 my-5">
      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Interactive: Navigate an MDP</h4>
      <p className="text-xs text-text-muted mb-3">
        Transitions are stochastic — the same action can lead to different states. Try taking actions and see what happens.
      </p>

      <div className="flex items-start gap-6 flex-wrap">
        {/* State diagram */}
        <div className="flex flex-col gap-2">
          {['S1', 'S2', 'S3', 'Goal'].map((s) => (
            <div
              key={s}
              className={`w-24 h-12 rounded-xl border-2 flex items-center justify-center text-sm font-bold transition-all ${
                currentState === s
                  ? `border-${stateColors[s]} bg-${stateColors[s]}/20 text-${stateColors[s]} scale-110`
                  : 'border-surface-lighter bg-surface-light text-text-muted'
              }`}
            >
              {s}
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex-1 min-w-[220px]">
          <div className="bg-surface-light rounded-lg p-4 mb-3">
            <p className="text-xs font-bold text-text-muted mb-1">Current state:</p>
            <p className={`text-lg font-bold text-${stateColors[currentState]} mb-0`}>{currentState}</p>
            {lastAction && (
              <p className="text-xs text-text-muted mt-1 mb-0">
                Last: {lastAction}, reward: <span className={lastReward !== null && lastReward > 0 ? 'text-accent-green font-bold' : 'text-accent-red'}>{lastReward !== null && lastReward > 0 ? '+' : ''}{lastReward}</span>
              </p>
            )}
          </div>

          {isTerminal ? (
            <div className="bg-accent-green/10 rounded-lg p-3 mb-3">
              <p className="text-xs text-accent-green font-bold m-0">Goal reached!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mb-3">
              <p className="text-xs font-bold text-text-muted">Available actions:</p>
              {availableActions.map((a) => {
                const outcomes = transitions[currentState][a]
                return (
                  <button
                    key={a}
                    onClick={() => takeAction(a)}
                    className="text-left px-3 py-2 rounded-lg bg-primary/10 text-primary-light text-xs font-medium border-0 cursor-pointer hover:bg-primary/20 transition-colors"
                  >
                    <span className="font-bold">{a}</span>
                    <span className="text-text-muted ml-2">
                      ({outcomes.map((o) => `${(o.prob * 100).toFixed(0)}% \u2192 ${o.next}`).join(', ')})
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          <button
            onClick={reset}
            className="px-3 py-1.5 rounded-lg bg-surface-lighter text-text-muted text-xs font-medium border-0 cursor-pointer hover:bg-surface-lighter/80 transition-colors"
          >
            Reset to S1
          </button>

          {/* Step log */}
          {stepLog.length > 0 && (
            <div className="mt-3 bg-surface-light rounded-lg p-3">
              <p className="text-[10px] font-bold text-text-muted mb-1">Trajectory:</p>
              {stepLog.map((entry, i) => (
                <p key={i} className="text-[11px] font-mono text-text-muted m-0">{entry}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   MAIN PAGE: Chapter 5
   ══════════════════════════════════════════ */

export function MDPPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="mb-10 text-center">
        <div className="flex justify-center gap-3 mb-4">
          <a href="#/learn" className="text-sm text-primary-light hover:underline no-underline">
            &larr; All Chapters
          </a>
        </div>
        <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Chapter 5</p>
        <h1 className="text-4xl font-bold text-text mb-3">
          Markov Decision Processes
        </h1>
        <p className="text-lg text-text-muted max-w-2xl mx-auto">
          The mathematical framework that formalizes sequential decision-making.
          Every RL problem is an MDP (or close to one).
        </p>
        <div className="flex justify-center gap-3 mt-4 text-xs text-text-muted">
          <span className="bg-surface-light px-3 py-1 rounded-full">7 sections</span>
          <span className="bg-surface-light px-3 py-1 rounded-full">MDP builder</span>
          <span className="bg-surface-light px-3 py-1 rounded-full">Stochastic transitions</span>
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-4">

        {/* ── SECTION 1 ── */}
        <Accordion number={1} title="Why We Need a Framework" defaultOpen>
          <p className="text-sm text-text leading-relaxed mb-4">
            So far we've learned the ingredients: states, actions, rewards, policies. But how do these
            pieces fit together <em>mathematically</em>? We need a precise framework so we can:
          </p>
          <ul className="text-sm text-text-muted space-y-1 mb-4">
            <li className="flex items-start gap-2"><span className="text-primary-light">-</span>Prove that optimal policies exist</li>
            <li className="flex items-start gap-2"><span className="text-primary-light">-</span>Derive algorithms that provably converge</li>
            <li className="flex items-start gap-2"><span className="text-primary-light">-</span>Compare different problems on equal footing</li>
            <li className="flex items-start gap-2"><span className="text-primary-light">-</span>Understand exactly what makes a problem easy or hard</li>
          </ul>

          <p className="text-sm text-text leading-relaxed mb-4">
            That framework is the <strong>Markov Decision Process</strong> (MDP). It packages everything
            into a clean mathematical object with five components. Nearly every RL textbook, paper,
            and algorithm assumes the problem is (or can be approximated as) an MDP.
          </p>

          <Callout type="insight">
            The MDP isn't just an abstraction — it's <em>the</em> language of RL. When someone describes
            an RL problem, they describe an MDP. When someone designs an algorithm, they assume an MDP.
            Understanding this framework is like learning the grammar of a language: everything else
            builds on it.
          </Callout>
        </Accordion>

        {/* ── SECTION 2 ── */}
        <Accordion number={2} title="The Five Components of an MDP">
          <p className="text-sm text-text leading-relaxed mb-4">
            A Markov Decision Process is defined by a <strong>5-tuple</strong>:
          </p>

          <Eq tex="\text{MDP} = (\mathcal{S}, \mathcal{A}, P, R, \gamma)" />

          <div className="flex flex-col gap-3 mb-4">
            <div className="bg-accent-blue/5 border border-accent-blue/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Eq tex="\mathcal{S}" inline />
                <span className="text-sm font-bold text-accent-blue">State Space</span>
              </div>
              <p className="text-xs text-text-muted m-0">
                The set of all possible states the environment can be in. Can be finite (grid cells),
                countably infinite (integers), or continuous (real-valued vectors).
              </p>
            </div>

            <div className="bg-accent-green/5 border border-accent-green/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Eq tex="\mathcal{A}" inline />
                <span className="text-sm font-bold text-accent-green">Action Space</span>
              </div>
              <p className="text-xs text-text-muted m-0">
                The set of all possible actions. May depend on the state: <Eq tex="\mathcal{A}(s)" inline />.
                Discrete (push left/right) or continuous (apply force of 3.7N).
              </p>
            </div>

            <div className="bg-accent-yellow/5 border border-accent-yellow/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Eq tex="P" inline />
                <span className="text-sm font-bold text-accent-yellow">Transition Function (Dynamics)</span>
              </div>
              <p className="text-xs text-text-muted mb-2">
                The probability of reaching state <Eq tex="s'" inline /> with reward <Eq tex="r" inline /> when
                taking action <Eq tex="a" inline /> in state <Eq tex="s" inline />:
              </p>
              <Eq tex="p(s', r \mid s, a) = \Pr\{S_{t+1} = s', R_{t+1} = r \mid S_t = s, A_t = a\}" />
              <p className="text-xs text-text-muted m-0">
                This single function defines the "rules" of the environment.
              </p>
            </div>

            <div className="bg-accent-red/5 border border-accent-red/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Eq tex="R" inline />
                <span className="text-sm font-bold text-accent-red">Reward Function</span>
              </div>
              <p className="text-xs text-text-muted mb-1">
                The expected reward for a transition. Often derived from <Eq tex="p" inline />:
              </p>
              <Eq tex="r(s, a) = \mathbb{E}[R_{t+1} \mid S_t = s, A_t = a] = \sum_{s', r} r \cdot p(s', r \mid s, a)" />
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Eq tex="\gamma" inline />
                <span className="text-sm font-bold text-primary-light">Discount Factor</span>
              </div>
              <p className="text-xs text-text-muted m-0">
                <Eq tex="\gamma \in [0, 1]" inline />. Controls how much the agent cares about future vs immediate
                rewards. Covered in detail in Chapter 3.
              </p>
            </div>
          </div>

          <MDPTupleWidget />
        </Accordion>

        {/* ── SECTION 3 ── */}
        <Accordion number={3} title="The Markov Property">
          <p className="text-sm text-text leading-relaxed mb-4">
            The "Markov" in MDP refers to the <strong>Markov property</strong> — the most important
            assumption in the framework:
          </p>

          <div className="bg-surface rounded-lg p-4 my-4 border-l-4 border-primary">
            <p className="text-sm text-text leading-relaxed mb-0">
              <strong>The Markov Property:</strong> The future is independent of the past, given the present.
            </p>
          </div>

          <p className="text-sm text-text leading-relaxed mb-4">
            Formally: the probability of the next state and reward depends <em>only</em> on the current
            state and action, not on any previous states or actions:
          </p>

          <Eq tex="p(s', r \mid s, a) = \Pr\{S_{t+1} = s', R_{t+1} = r \mid S_t = s, A_t = a\}" />

          <p className="text-sm text-text leading-relaxed mb-4">
            Notice what's <strong>not</strong> on the right side: <Eq tex="S_{t-1}, S_{t-2}, A_{t-1}, \ldots" inline /> —
            the entire history is absent. The current state <Eq tex="S_t" inline /> captures everything relevant.
          </p>

          <MarkovPropertyWidget />

          <Callout type="think">
            Is the Markov property always realistic? Consider poker: the current cards in your hand
            are your "state." But if you've been watching your opponent bluff for 10 rounds, that
            history matters — it's not captured in the current hand alone. The state would need to
            include your <em>beliefs</em> about the opponent to be truly Markov. In practice,
            we often approximate: include enough information in the state to make it "close enough"
            to Markov.
          </Callout>
        </Accordion>

        {/* ── SECTION 4 ── */}
        <Accordion number={4} title="Transition Dynamics in Action">
          <p className="text-sm text-text leading-relaxed mb-4">
            The transition function <Eq tex="p(s', r \mid s, a)" inline /> is the heart of an MDP.
            It defines the "physics" of the environment — what happens when the agent acts.
          </p>

          <p className="text-sm text-text leading-relaxed mb-2">
            <strong>Two key properties:</strong>
          </p>
          <ul className="text-sm text-text-muted space-y-2 mb-4">
            <li className="flex items-start gap-2">
              <span className="text-primary-light">1.</span>
              <span>
                <strong>It's a probability distribution</strong> — for each (s, a), the probabilities over
                all possible (s', r) outcomes sum to 1:
                <Eq tex="\sum_{s' \in \mathcal{S}} \sum_{r} p(s', r \mid s, a) = 1" />
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-light">2.</span>
              <span>
                <strong>It can be stochastic</strong> — the same action in the same state can lead to
                different outcomes. This models real-world uncertainty: wind blows the robot, dice rolls
                in a game, noisy sensors.
              </span>
            </li>
          </ul>

          <TransitionDiagramWidget />

          <p className="text-sm text-text leading-relaxed mb-4">
            From the full transition function, we can derive useful summaries:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="bg-surface-light rounded-lg p-4 border border-surface-lighter">
              <h4 className="text-xs font-bold text-text mb-1">State-transition probabilities</h4>
              <Eq tex="p(s' \mid s, a) = \sum_{r} p(s', r \mid s, a)" />
              <p className="text-xs text-text-muted m-0">Probability of reaching s', regardless of reward.</p>
            </div>
            <div className="bg-surface-light rounded-lg p-4 border border-surface-lighter">
              <h4 className="text-xs font-bold text-text mb-1">Expected reward</h4>
              <Eq tex="r(s, a) = \sum_{r} r \sum_{s'} p(s', r \mid s, a)" />
              <p className="text-xs text-text-muted m-0">Average reward for taking action a in state s.</p>
            </div>
          </div>
        </Accordion>

        {/* ── SECTION 5 ── */}
        <Accordion number={5} title="Model-Free vs Model-Based RL">
          <p className="text-sm text-text leading-relaxed mb-4">
            The transition function defines the environment's rules. But does the agent <em>know</em> these rules?
            This distinction creates two fundamental approaches to RL:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-blue mb-2">Model-Based</h4>
              <p className="text-xs text-text-muted mb-2">"I know (or learn) the rules"</p>
              <p className="text-xs text-text leading-relaxed mb-2">
                The agent has access to <Eq tex="p(s',r|s,a)" inline /> — either given or learned.
                It can <strong>plan ahead</strong> by simulating future outcomes without actually
                taking actions.
              </p>
              <p className="text-xs text-text-muted mb-1"><strong>Pros:</strong> More sample-efficient, can plan</p>
              <p className="text-xs text-text-muted mb-1"><strong>Cons:</strong> Model may be wrong, expensive to learn</p>
              <p className="text-xs text-primary-light m-0"><strong>Lab example:</strong> Value Iteration, Policy Iteration (GridWorld)</p>
            </div>
            <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-4">
              <h4 className="text-sm font-bold text-accent-green mb-2">Model-Free</h4>
              <p className="text-xs text-text-muted mb-2">"I learn from experience only"</p>
              <p className="text-xs text-text leading-relaxed mb-2">
                The agent doesn't know <Eq tex="p(s',r|s,a)" inline />. It learns entirely from
                observed transitions — trial and error. No planning, just reacting and learning.
              </p>
              <p className="text-xs text-text-muted mb-1"><strong>Pros:</strong> No model needed, works anywhere</p>
              <p className="text-xs text-text-muted mb-1"><strong>Cons:</strong> Needs more data, can't plan ahead</p>
              <p className="text-xs text-primary-light m-0"><strong>Lab example:</strong> Q-Learning, SARSA, REINFORCE</p>
            </div>
          </div>

          <Callout type="insight">
            In our labs, <strong>Value Iteration</strong> and <strong>Policy Iteration</strong> in GridWorld are
            model-based — they use the known transition probabilities to compute optimal values. Every other
            algorithm (Q-Learning, SARSA, bandits, REINFORCE) is model-free — they learn purely from
            experience. Most modern deep RL is model-free.
          </Callout>
        </Accordion>

        {/* ── SECTION 6 ── */}
        <Accordion number={6} title="Special Cases of MDPs">
          <p className="text-sm text-text leading-relaxed mb-4">
            Many familiar problems are special cases of the MDP framework:
          </p>

          <div className="flex flex-col gap-3 mb-4">
            <div className="bg-surface-light rounded-xl p-4 border border-surface-lighter">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{'\uD83C\uDFB0'}</span>
                <span className="text-sm font-bold text-accent-yellow">Multi-Armed Bandit</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-lighter text-text-muted ml-auto">|S| = 1</span>
              </div>
              <p className="text-xs text-text-muted m-0">
                An MDP with a <strong>single state</strong>. No state transitions — every action returns
                to the same state. This eliminates the sequential decision problem and isolates the
                explore/exploit dilemma.
              </p>
            </div>

            <div className="bg-surface-light rounded-xl p-4 border border-surface-lighter">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{'\uD83C\uDFB2'}</span>
                <span className="text-sm font-bold text-accent-blue">Markov Reward Process (MRP)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-lighter text-text-muted ml-auto">|A| = 1</span>
              </div>
              <p className="text-xs text-text-muted m-0">
                An MDP with <strong>no actions</strong> (or only one action). The agent passively observes
                state transitions and collects rewards. Useful for studying value functions in isolation.
              </p>
            </div>

            <div className="bg-surface-light rounded-xl p-4 border border-surface-lighter">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{'\uD83D\uDD0D'}</span>
                <span className="text-sm font-bold text-accent-green">Deterministic MDP</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-lighter text-text-muted ml-auto">P is 0/1</span>
              </div>
              <p className="text-xs text-text-muted m-0">
                An MDP where each (s, a) pair leads to exactly one next state with probability 1.
                No randomness in transitions. CartPole (without noise) is an example.
              </p>
            </div>

            <div className="bg-surface-light rounded-xl p-4 border border-surface-lighter">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{'\uD83D\uDCA8'}</span>
                <span className="text-sm font-bold text-primary-light">POMDP</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-lighter text-text-muted ml-auto">Partial observability</span>
              </div>
              <p className="text-xs text-text-muted m-0">
                When the agent can't see the full state — it only gets noisy <strong>observations</strong>.
                Poker (hidden cards), robot with limited sensors. Much harder than MDPs. We won't cover
                POMDPs in this course, but they're an active area of research.
              </p>
            </div>
          </div>
        </Accordion>

        {/* ── SECTION 7 ── */}
        <Accordion number={7} title="Summary: The MDP Framework">
          <p className="text-sm text-text leading-relaxed mb-4">
            The MDP gives us a complete mathematical language for RL problems:
          </p>

          <div className="bg-surface rounded-lg p-4 my-3 text-sm text-text leading-relaxed">
            <p className="mb-2">1. The <strong>environment</strong> is described by <Eq tex="(\mathcal{S}, \mathcal{A}, P, R, \gamma)" inline /></p>
            <p className="mb-2">2. The <strong>Markov property</strong> says: the future depends only on the present state</p>
            <p className="mb-2">3. The <strong>transition function</strong> <Eq tex="p(s',r|s,a)" inline /> defines the environment's rules</p>
            <p className="mb-2">4. The agent may or may not know the model (<strong>model-based</strong> vs <strong>model-free</strong>)</p>
            <p className="mb-0">5. The agent's goal: find a policy <Eq tex="\pi" inline /> that maximizes <Eq tex="\mathbb{E}[G_t]" inline /> within this MDP</p>
          </div>

          <Callout type="insight">
            With the MDP framework in place, we can now ask the central question: <strong>how good is
            a given policy in a given MDP?</strong> Answering this requires <strong>value functions</strong> —
            the subject of the next chapter. Value functions will let us evaluate, compare, and ultimately
            optimize policies.
          </Callout>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
            {[
              { label: 'Ch 1', topic: 'The Loop', color: 'accent-blue' },
              { label: 'Ch 2', topic: 'S & A', color: 'accent-green' },
              { label: 'Ch 3', topic: 'R & G', color: 'accent-yellow' },
              { label: 'Ch 4', topic: '\u03C0', color: 'primary-light' },
              { label: 'Ch 5', topic: 'MDP', color: 'accent-blue' },
            ].map(({ label, topic, color }) => (
              <div key={label} className={`bg-${color}/10 rounded-lg p-2 text-center border border-${color}/20`}>
                <span className="text-[10px] text-text-muted block">{label}</span>
                <span className={`text-xs font-bold text-${color}`}>{topic}</span>
              </div>
            ))}
          </div>
        </Accordion>
      </div>

      {/* Chapter navigation */}
      <ChapterNav
        prev={{ path: '/learn/policies', label: 'Ch 4: Policies' }}
        next={{ path: '/learn/value-functions', label: 'Ch 6: Value Functions' }}
      />
    </div>
  )
}
