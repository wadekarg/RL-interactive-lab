export const classicCartpoleIntro = {
  title: 'Classic CartPole',
  story: `A cart sits on a frictionless track with a pole balanced upright on top. The only control: push the cart left or push it right.

The task: keep the pole balanced for 500 steps. Every moment balanced earns a point. Let it tip too far, and it's back to step one.

This is the classic CartPole problem \u2014 the "Hello World" of reinforcement learning. Simple to describe, surprisingly hard to master. But mastering balance is the foundation for everything that follows.`,

  objective: `Keep the pole balanced for 500 steps by pushing the cart left or right. The episode ends if the pole tilts beyond \u00B112\u00B0, the cart drifts beyond \u00B12.4 units, or 500 steps are reached (solved!). Every step balanced earns +1 reward.`,

  whatYouWillLearn: [
    'How continuous state spaces differ from discrete grids',
    'Why Q-tables need discretization for continuous states',
    'How policy gradient methods (REINFORCE) learn directly',
    'The classic CartPole benchmark that launched a thousand papers',
    'How simple balancing connects to harder problems like rocket landing',
  ],

  howItWorks: `The cart's state is described by 4 numbers: horizontal position (x), velocity (v), tilt angle (\u03B8), and angular velocity (\u03C9). At each timestep, the agent can push left or push right \u2014 just two actions. If the tilt exceeds \u00B112\u00B0 or the cart drifts beyond \u00B12.4 units, the pole topples and the episode ends. Survive 500 steps and the episode is solved!`,
}

export const classicCartpoleAlgorithms = {
  random: {
    name: 'Random Baseline',
    description:
      'No learning at all \u2014 the agent pushes randomly left or right. This establishes a baseline: pure luck typically topples in ~20-40 steps.',
    sections: [
      {
        title: 'How It Works',
        content:
          'At each timestep, the agent pushes left or right with equal probability. No state information is used. This is the simplest possible policy \u2014 anything smarter should beat it.',
      },
      {
        title: 'Why Include It?',
        content:
          'A random baseline tells you whether your learning algorithm is actually learning. If Q-Learning averages 80 steps but random gets 30, the improvement is real. If they\'re equal, something is wrong.',
      },
    ],
  },
  'discretized-q': {
    name: 'Discretized Q-Learning',
    description:
      'The same Q-Learning from GridWorld, adapted for continuous states by binning the 4 state variables into discrete buckets. The agent learns a Q-table over these bins.',
    sections: [
      {
        title: 'The Discretization Trick',
        content:
          'The balance problem has infinite states (4 continuous values). To use a Q-table, we "chop" each variable into bins. With 6 bins for x and v, 12 bins for \u03B8 and \u03C9, we get 6\u00D76\u00D712\u00D712 = 5,184 discrete states \u2014 very manageable for a Q-table.',
        equation: 'Q(\\text{bin}(s), a) \\leftarrow Q(\\text{bin}(s),a) + \\alpha \\Big[ r + \\gamma \\max_{a\'} Q(\\text{bin}(s\'),a\') - Q(\\text{bin}(s),a) \\Big]',
      },
      {
        title: 'The Trade-Off',
        content:
          'More bins = finer resolution but slower learning (more states to visit). Fewer bins = faster learning but coarser approximation. With only 4 dimensions, this problem is well-suited for discretization.',
      },
      {
        title: 'Watch for this',
        content:
          'With good hyperparameters, Discretized Q-Learning can solve CartPole (500 steps) within a few hundred episodes. Watch the episode duration chart \u2014 you should see a clear upward trend as the agent learns to balance longer.',
      },
    ],
  },
  reinforce: {
    name: 'REINFORCE',
    description:
      'Instead of learning Q-values, REINFORCE learns a policy directly. It adjusts the probability of pushing left or right based on whether episodes lasted long (good) or short (bad).',
    sections: [
      {
        title: 'Policy Gradient Intuition',
        content:
          'Imagine the agent has a "preference" for left or right in each state. After each episode, if the episode lasted long (good!), increase the probability of the actions taken. If it toppled quickly (bad!), decrease them. Over time, good balancing patterns emerge.',
        equation: '\\theta \\leftarrow \\theta + \\alpha \\sum_t (G_t - b) \\nabla_\\theta \\log \\pi_\\theta(a_t | s_t)',
      },
      {
        title: 'Linear Softmax Policy',
        content:
          'The policy is \u03C0(a|s) = softmax(W \u00B7 \u03C6(s)), where \u03C6(s) are 7 features extracted from the 4D state (bias, 4 normalized values, 2 quadratic terms). The weights W (2\u00D77 for 2 actions) are updated using the policy gradient. Simpler than the rocket\u2019s 3\u00D711 matrix.',
        equation: '\\pi(a|s) = \\frac{\\exp(\\mathbf{w}_a^\\top \\phi(s))}{\\sum_{a\'} \\exp(\\mathbf{w}_{a\'}^\\top \\phi(s))}',
      },
      {
        title: 'Watch for this',
        content:
          'REINFORCE can solve CartPole reliably, though it starts slower than Q-Learning. Once it finds a good balance policy, episodes jump to 500 steps and stay there. The green dots on the chart mark solved episodes.',
      },
    ],
  },
}

export const classicCartpoleParamExplanations: Record<string, string> = {
  alpha: 'Initial learning rate \u2014 decays automatically to 0.001 over training so Q-values stabilise once a good policy is found. 0.5 is the optimal starting value.',
  gamma: 'Discount factor \u2014 how much the agent values future balance vs. the current moment. High \u03B3 (0.99) = plan ahead.',
  epsilon: 'Initial exploration rate \u2014 starts at 1.0 (fully random) and decays each episode. Needed for discovery early in training.',
  bins: 'Number of bins per state dimension (4 dimensions). More bins = finer control but more states. Fewer bins = faster but coarser.',
  lr: 'Policy learning rate \u2014 how quickly the policy weights update. Too high = unstable. Too low = slow. 0.002 is the optimal value.',
  epsilonDecay: 'After each episode, \u03B5 is multiplied by this factor. At 0.9985, \u03B5 reaches its minimum around episode 2600. Set to 1.0 to disable decay.',
  epsilonMin: 'The floor for \u03B5 \u2014 exploration never drops below this. 0.02 balances continued exploration with stable exploitation.',
}
