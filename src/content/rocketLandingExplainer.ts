export const rocketLandingIntro = {
  title: 'Rocket Landing',
  story: `The rocket starts at altitude y=1.0 and must descend through gravity, firing left, right, or bottom thrusters to stay upright and touch down softly on the pad.

Every moment the rocket stays airborne earns a point. But a soft landing earns a massive bonus \u2014 while crashing earns a harsh penalty. If the rocket tilts too far or drifts off course mid-flight, the mission fails and it must try again.

The rocket needs YOUR help to learn using Reinforcement Learning algorithms. Unlike Boru's grid, this world is continuous \u2014 position, velocity, altitude, angle, and spin are all real numbers, not grid cells.`,

  objective: `Land the rocket softly by controlling horizontal and vertical thrust. The rocket starts at altitude y=1.0 and must descend to y=0 with low speed (|vy| < 0.5), minimal tilt (|\u03B8| < 12\u00B0), and centered position (|x| < 1.0) for a soft landing bonus.`,

  whatYouWillLearn: [
    'How continuous state spaces differ from discrete grids',
    'Why Q-tables fail in continuous domains and how discretization helps',
    'How policy gradient methods (REINFORCE) learn directly without Q-values',
    'The bridge from tabular RL to modern deep RL',
    'How shaped rewards guide learning toward soft landings',
  ],

  howItWorks: `The rocket's state is described by 6 continuous numbers: horizontal position (x), velocity (v), altitude (y), vertical velocity (vy), tilt angle (\u03B8), and angular velocity (\u03C9). At each timestep, it can fire a left thruster, right thruster, or bottom thruster (main engine, fights gravity). Gravity pulls the rocket down constantly. If the tilt exceeds \u00B112\u00B0 or the rocket drifts beyond \u00B12.4 units while airborne, the episode ends in a crash. Landing with low speed and good alignment earns a big bonus.`,
}

export const rocketLandingAlgorithms = {
  random: {
    name: 'Random Baseline',
    description:
      'No learning at all \u2014 the rocket fires thrusters randomly. This establishes a baseline: pure luck typically crashes in ~20 steps.',
    sections: [
      {
        title: 'How It Works',
        content:
          'At each timestep, the agent picks left, right, or bottom thrust with equal probability. No state information is used. This is the simplest possible policy \u2014 anything smarter should beat it.',
      },
      {
        title: 'Why Include It?',
        content:
          'A random baseline tells you whether your learning algorithm is actually learning. If Q-Learning averages 50 steps but random gets 25, the improvement is real but modest. If they\'re equal, something is wrong.',
      },
    ],
  },
  'discretized-q': {
    name: 'Discretized Q-Learning',
    description:
      'The same Q-Learning from GridWorld, but adapted for continuous states by binning the 6 state variables into discrete buckets. The rocket learns a Q-table over these bins.',
    sections: [
      {
        title: 'The Discretization Trick',
        content:
          'The landing problem has infinite states (6 continuous values). To use a Q-table, we "chop" each variable into bins. With 5 bins for x, xDot, y, yDot and 10 bins for \u03B8, \u03C9, we get 5\u00D75\u00D75\u00D75\u00D710\u00D710 = 62,500 discrete states \u2014 manageable for a table, though much larger than the 4D version.',
        equation: 'Q(\\text{bin}(s), a) \\leftarrow Q(\\text{bin}(s),a) + \\alpha \\Big[ r + \\gamma \\max_{a\'} Q(\\text{bin}(s\'),a\') - Q(\\text{bin}(s),a) \\Big]',
      },
      {
        title: 'The Trade-Off',
        content:
          'More bins = finer resolution but slower learning (more states to visit). Fewer bins = faster learning but coarser approximation. With 6 dimensions, the state space grows fast \u2014 this is the curse of dimensionality in action.',
      },
      {
        title: 'Watch for this',
        content:
          'Compare this to Random. With good bin settings, Discretized Q-Learning should show improving episode durations over hundreds of episodes. Occasional soft landings may appear. But the 6D state space makes convergence slower than the 4D balance problem.',
      },
    ],
  },
  reinforce: {
    name: 'REINFORCE',
    description:
      'A fundamentally different approach \u2014 instead of learning Q-values, REINFORCE learns a policy directly. It adjusts the probability of each action based on whether episodes ended in soft landings or crashes.',
    sections: [
      {
        title: 'Policy Gradient Intuition',
        content:
          'Imagine the rocket has a "preference" for left, right, or bottom thrust in each state. After each episode, if the episode ended in a soft landing (good!), increase the probability of the actions taken. If it crashed (bad!), decrease them. Over time, good action patterns become more likely.',
        equation: '\\theta \\leftarrow \\theta + \\alpha \\sum_t (G_t - b) \\nabla_\\theta \\log \\pi_\\theta(a_t | s_t)',
      },
      {
        title: 'Linear Softmax Policy',
        content:
          'The policy is \u03C0(a|s) = softmax(W \u00B7 \u03C6(s)), where \u03C6(s) are 11 features extracted from the 6D state (bias, 6 normalized values, 4 quadratic terms). The weights W (3\u00D711 for 3 actions) are updated using the policy gradient theorem. No neural network needed \u2014 this is fully interpretable.',
        equation: '\\pi(a|s) = \\frac{\\exp(\\mathbf{w}_a^\\top \\phi(s))}{\\sum_{a\'} \\exp(\\mathbf{w}_{a\'}^\\top \\phi(s))}',
      },
      {
        title: 'Baseline Subtraction',
        content:
          'Raw REINFORCE has high variance \u2014 some episodes last longer by luck. Subtracting the mean return (baseline) from each episode\'s return reduces noise: actions in above-average episodes get reinforced, below-average ones get discouraged.',
      },
      {
        title: 'Watch for this',
        content:
          'REINFORCE updates only at episode end, so early learning is slow. But once it locks onto a good descent policy, it can achieve soft landings consistently. Compare its learning curve to Discretized Q-Learning \u2014 typically slower start but higher ceiling.',
      },
    ],
  },
}

export const rocketLandingParamExplanations: Record<string, string> = {
  alpha: 'Learning rate \u2014 how much Q-values shift after each step. Try 0.1 to start.',
  gamma: 'Discount factor \u2014 how much the rocket values future survival vs. the current moment. High \u03B3 (0.99) = plan ahead. Low \u03B3 = short-sighted.',
  epsilon: 'Exploration rate \u2014 how often the rocket fires a random thruster instead of using its best estimate. Needed for discovery but hurts performance.',
  bins: 'Number of bins per state dimension (6 dimensions total). More bins = finer control but exponentially more states. Fewer bins = faster but coarser.',
  lr: 'Policy learning rate \u2014 how quickly the policy weights update. Too high = unstable. Too low = slow. Try 0.01.',
}
