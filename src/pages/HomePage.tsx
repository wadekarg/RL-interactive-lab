import { Link } from 'react-router-dom'

const labs = [
  {
    title: 'Multi-Armed Bandit',
    description: 'The exploration vs exploitation dilemma. Choose between slot machines with unknown payoffs using ε-greedy, UCB, and Thompson Sampling strategies.',
    path: '/bandit',
    icon: '\uD83C\uDFB0',
    tag: '3 algorithms',
  },
  {
    title: "Boru's GridWorld",
    description: 'Help Boru the elephant navigate to water while avoiding lions and cliffs. Design your own world and watch 4 RL algorithms learn optimal paths.',
    path: '/gridworld',
    icon: '\uD83D\uDC18',
    tag: '4 algorithms + editor',
  },
]

export function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="text-center mb-10 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-text mb-3">
          <span className="text-primary-light">RL</span> Interactive Lab
        </h1>
        <p className="text-base sm:text-lg text-text-muted max-w-2xl mx-auto mb-4">
          An interactive playground to learn reinforcement learning algorithms step-by-step.
          Adjust hyperparameters, watch agents learn in real time, and build intuition.
        </p>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-xs text-text-muted">
          <span className="bg-surface-light px-3 py-1 rounded-full">7 algorithms</span>
          <span className="bg-surface-light px-3 py-1 rounded-full">Interactive controls</span>
          <span className="bg-surface-light px-3 py-1 rounded-full">No backend needed</span>
          <span className="bg-surface-light px-3 py-1 rounded-full">Educational</span>
        </div>
      </div>

      {/* Learn RL CTA */}
      <Link
        to="/learn"
        className="group block p-6 bg-primary/10 rounded-xl border border-primary/30 no-underline transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 mb-8"
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-3xl sm:text-4xl flex-shrink-0">{'\uD83D\uDCDA'}</span>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-primary-light group-hover:text-primary transition-colors">
              New to RL? Start Here
            </h2>
            <p className="text-sm text-text-muted mt-1">
              A complete interactive course from first principles — states, actions, rewards, policies, Bellman equations, and more.
              Learn the theory, then see it in action in the labs.
            </p>
          </div>
          <span className="text-primary-light text-xl sm:text-2xl flex-shrink-0">&rarr;</span>
        </div>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {labs.map((lab) => (
          <Link
            key={lab.path}
            to={lab.path}
            className="group block p-6 bg-surface-light rounded-xl border border-surface-lighter no-underline transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
          >
            <div className="flex items-start gap-4">
              {lab.icon.endsWith('.png')
                ? <img src={`${import.meta.env.BASE_URL}${lab.icon}`} alt="" className="w-12 h-12 object-contain flex-shrink-0" />
                : <span className="text-4xl flex-shrink-0">{lab.icon}</span>}
              <div>
                <h2 className="text-xl font-bold text-text group-hover:text-primary-light transition-colors">
                  {lab.title}
                </h2>
                <span className="inline-block text-xs bg-primary/20 text-primary-light px-2 py-0.5 rounded-full mt-1 mb-2">
                  {lab.tag}
                </span>
                <p className="text-sm text-text-muted">{lab.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 bg-surface-light rounded-xl border border-surface-lighter p-6">
        <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3">How to use this lab</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-text-muted">
          <div>
            <span className="text-lg block mb-1">1. Choose</span>
            <p>Pick an environment and algorithm. Read the explanation to understand how it works.</p>
          </div>
          <div>
            <span className="text-lg block mb-1">2. Configure</span>
            <p>Adjust hyperparameters and environment settings. Every control is explained.</p>
          </div>
          <div>
            <span className="text-lg block mb-1">3. Observe</span>
            <p>Press Play or Step to watch the agent learn. See Q-values, policies, and rewards evolve.</p>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center space-y-3">
        <p className="text-sm text-text-muted">
          Built for education. Runs entirely in your browser. Open source.
        </p>
        <p className="text-sm text-text-muted">
          Vibe coded by <span className="text-text font-medium">Gajanan Wadekar</span>
          {' · '}
          <a href="https://www.linkedin.com/in/gajananwadekar/" target="_blank" rel="noopener noreferrer" className="text-primary-light hover:text-primary transition-colors">LinkedIn</a>
          {' · '}
          <a href="https://github.com/wadekarg" target="_blank" rel="noopener noreferrer" className="text-primary-light hover:text-primary transition-colors">GitHub</a>
        </p>
        <p className="text-xs text-text-muted max-w-2xl mx-auto">
          Inspired by Sutton &amp; Barto's <em>Reinforcement Learning: An Introduction</em>,
          coursework at UT Arlington (<span className="whitespace-nowrap">Dr. Manfred Huber</span>), and the RL community on YouTube.
        </p>
        <p className="text-xs text-text-muted">
          Found an error or have suggestions?{' '}
          <a href="https://github.com/wadekarg" target="_blank" rel="noopener noreferrer" className="text-primary-light hover:text-primary transition-colors">Open an issue on GitHub</a>.
        </p>
      </div>
    </div>
  )
}
