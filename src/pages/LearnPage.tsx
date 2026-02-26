import { Link } from 'react-router-dom'

const chapters = [
  {
    number: 1,
    title: 'What is Reinforcement Learning?',
    path: '/learn/what-is-rl',
    description: 'Agent, environment, the interaction loop, and how RL differs from other ML paradigms.',
    color: 'accent-blue',
    icon: '\uD83E\uDD16',
    tags: ['Agent', 'Environment', 'Reward Signal'],
  },
  {
    number: 2,
    title: 'States and Actions',
    path: '/learn/states-and-actions',
    description: 'State spaces, action spaces, discrete vs continuous, and how agents perceive and act in their world.',
    color: 'accent-green',
    icon: '\uD83C\uDFAF',
    tags: ['State Space', 'Action Space', 'Trajectories'],
  },
  {
    number: 3,
    title: 'Rewards and Returns',
    path: '/learn/rewards-and-returns',
    description: 'The reward hypothesis, cumulative returns, discount factor \u03B3, and why we discount future rewards.',
    color: 'accent-yellow',
    icon: '\uD83C\uDFC6',
    tags: ['Reward Signal', 'Return G\u209C', 'Discount \u03B3'],
  },
  {
    number: 4,
    title: 'Policies',
    path: '/learn/policies',
    description: 'Deterministic vs stochastic policies, \u03C0(a|s), and the goal of finding optimal behavior.',
    color: 'primary-light',
    icon: '\uD83D\uDDFA\uFE0F',
    tags: ['Policy \u03C0', 'Deterministic', 'Stochastic'],
  },
  {
    number: 5,
    title: 'Markov Decision Processes',
    path: '/learn/markov-decision-process',
    description: 'The MDP framework, transition dynamics, the Markov property, and why it matters.',
    color: 'accent-blue',
    icon: '\uD83D\uDD17',
    tags: ['MDP', 'Markov Property', 'Transitions'],
  },
  {
    number: 6,
    title: 'Value Functions',
    path: '/learn/value-functions',
    description: 'State value V(s), action value Q(s,a), and how they guide decision making.',
    color: 'accent-green',
    icon: '\uD83D\uDCCA',
    tags: ['V(s)', 'Q(s,a)', 'Optimal Values'],
  },
  {
    number: 7,
    title: 'Bellman Equations',
    path: '/learn/bellman-equations',
    description: 'The recursive structure of value, Bellman expectation and optimality equations.',
    color: 'accent-yellow',
    icon: '\uD83E\uDDE9',
    tags: ['Bellman Expectation', 'Bellman Optimality', 'Recursion'],
  },
  {
    number: 8,
    title: 'Exploration vs Exploitation',
    path: '/learn/exploration-exploitation',
    description: '\u03B5-greedy, UCB, Thompson Sampling, and the fundamental dilemma of acting under uncertainty.',
    color: 'primary-light',
    icon: '\u2696\uFE0F',
    tags: ['\u03B5-greedy', 'UCB', 'Thompson Sampling'],
    labLink: '/bandit',
  },
  {
    number: 9,
    title: 'Temporal Difference Learning',
    path: '/learn/td-learning',
    description: 'TD(0), Q-Learning, SARSA — learning from every step without waiting for episode end.',
    color: 'accent-blue',
    icon: '\u26A1',
    tags: ['TD Error', 'Q-Learning', 'SARSA'],
    labLink: '/gridworld',
  },
  {
    number: 10,
    title: 'Policy Gradients',
    path: '/learn/policy-gradients',
    description: 'REINFORCE, baselines, and learning policies directly — the bridge to modern deep RL.',
    color: 'accent-green',
    icon: '\uD83C\uDF1F',
    tags: ['REINFORCE', 'Baselines', 'Policy \u2207'],
    labLink: '/cartpole',
  },
]

export function LearnPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="text-center mb-12">
        <Link to="/" className="text-sm text-primary-light hover:underline no-underline mb-4 inline-block">
          &larr; Back to Lab
        </Link>
        <h1 className="text-4xl font-bold text-text mb-3">
          <span className="text-primary-light">Learn</span> Reinforcement Learning
        </h1>
        <p className="text-lg text-text-muted max-w-2xl mx-auto mb-4">
          A complete interactive course from first principles. Every concept is explained with examples,
          interactive widgets, and links to hands-on simulations.
        </p>
        <div className="flex justify-center gap-3 text-xs text-text-muted flex-wrap">
          <span className="bg-surface-light px-3 py-1 rounded-full">10 chapters</span>
          <span className="bg-surface-light px-3 py-1 rounded-full">Interactive examples</span>
          <span className="bg-surface-light px-3 py-1 rounded-full">Based on Sutton &amp; Barto</span>
          <span className="bg-surface-light px-3 py-1 rounded-full">No prerequisites</span>
        </div>
      </div>

      {/* Roadmap intro */}
      <div className="bg-surface-light rounded-xl border border-surface-lighter p-6 mb-8">
        <h3 className="text-sm font-bold text-accent-yellow uppercase tracking-wider mb-2">Your Learning Path</h3>
        <p className="text-sm text-text leading-relaxed mb-0">
          Start from Chapter 1 and work your way through. Each chapter builds on the previous ones.
          Chapters 1-7 cover the <strong>foundations</strong> — the mathematical framework every RL practitioner needs.
          Chapters 8-10 introduce the <strong>algorithms</strong> you'll see in action in our lab simulations.
        </p>
      </div>

      {/* Chapter list */}
      <div className="flex flex-col gap-4">
        {chapters.map((ch) => (
          <Link key={ch.number} to={ch.path} className="group block no-underline">
            <div className="flex items-start gap-4 p-5 bg-surface-light rounded-xl border border-surface-lighter transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
              {/* Chapter number */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-${ch.color}/20 flex items-center justify-center`}>
                <span className="text-2xl">{ch.icon}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                    Chapter {ch.number}
                  </span>
                  {ch.labLink && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary-light">
                      Has Lab
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold mb-1 text-text group-hover:text-primary-light">
                  {ch.title}
                </h2>
                <p className="text-sm text-text-muted mb-2">{ch.description}</p>
                <div className="flex gap-2 flex-wrap">
                  {ch.tags.map((tag) => (
                    <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-surface text-text-muted">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <span className="flex-shrink-0 text-primary-light text-lg mt-2">&rarr;</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Foundation vs Algorithms visual */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-xl p-5">
          <h3 className="text-sm font-bold text-accent-blue mb-2">Foundations (Ch 1-7)</h3>
          <p className="text-xs text-text-muted leading-relaxed m-0">
            The mathematical framework: states, actions, rewards, policies, MDPs, value functions,
            and Bellman equations. These concepts are the language of RL — every algorithm is expressed
            in these terms.
          </p>
        </div>
        <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-5">
          <h3 className="text-sm font-bold text-accent-green mb-2">Algorithms (Ch 8-10)</h3>
          <p className="text-xs text-text-muted leading-relaxed m-0">
            The methods that put theory into practice: exploration strategies (bandits), temporal
            difference learning (GridWorld), and policy gradients (CartPole/Rocket). Each connects
            directly to a lab simulation.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-10 text-center">
        <p className="text-sm text-text-muted mb-3">
          Ready to begin? Start with the fundamentals.
        </p>
        <Link
          to="/learn/what-is-rl"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white text-sm font-medium no-underline hover:bg-primary-dark transition-colors"
        >
          Start Chapter 1 &rarr;
        </Link>
      </div>
    </div>
  )
}
