export const cartpoleIntro = {
  title: "Bhrigu's Rocket Landing",
  story: `In the skies above a dusty launchpad, a small rocket named Bhrigu is learning to land. Each attempt, Bhrigu fires from a slightly different angle and must figure out when to fire left or right thrusters to stay upright and touch down safely.

Every moment Bhrigu stays balanced earns a point of fuel savings. But if the rocket tilts too far or drifts off the pad, the mission fails and Bhrigu must try again.

This is Bhrigu's challenge — and YOUR job is to help it learn using Reinforcement Learning algorithms. Unlike Boru's grid, Bhrigu's world is continuous — position, velocity, angle, and spin are all real numbers, not grid cells.`,

  objective: `Keep the rocket balanced for as long as possible (up to 500 timesteps). The agent must learn to apply left or right thrust at each moment to prevent the rocket from tipping over or drifting off the landing pad.`,

  whatYouWillLearn: [
    'How continuous state spaces differ from discrete grids',
    'Why Q-tables fail in continuous domains and how discretization helps',
    'How policy gradient methods (REINFORCE) learn directly without Q-values',
    'The bridge from tabular RL to modern deep RL',
    'How episode duration charts reveal learning progress',
  ],

  howItWorks: `Bhrigu's state is described by 4 continuous numbers: horizontal position (x), velocity (v), tilt angle (θ), and angular velocity (ω). At each timestep, Bhrigu can fire a left or right thruster. If the tilt exceeds ±12° or the rocket drifts beyond ±2.4 units, the episode ends. Surviving 500 steps means a perfect landing.`,
}

export const cartpoleAlgorithms = {
  random: {
    name: 'Random Baseline',
    description:
      'No learning at all — Bhrigu fires thrusters randomly. This establishes a baseline: pure luck typically survives ~20-30 steps.',
    sections: [
      {
        title: 'How It Works',
        content:
          'At each timestep, the agent picks left or right thrust with 50/50 probability. No state information is used. This is the simplest possible policy — anything smarter should beat it.',
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
      'The same Q-Learning from GridWorld, but adapted for continuous states by binning the 4 state variables into discrete buckets. Bhrigu learns a Q-table over these bins.',
    sections: [
      {
        title: 'The Discretization Trick',
        content:
          'Cart-Pole has infinite states (continuous values). To use a Q-table, we "chop" each variable into bins. With 6 position bins, 6 velocity bins, 12 angle bins, and 12 angular velocity bins, we get 6×6×12×12 = 5,184 discrete states — manageable for a table.',
        equation: 'Q(\\text{bin}(s), a) \\leftarrow Q(\\text{bin}(s),a) + \\alpha \\Big[ r + \\gamma \\max_{a\'} Q(\\text{bin}(s\'),a\') - Q(\\text{bin}(s),a) \\Big]',
      },
      {
        title: 'The Trade-Off',
        content:
          'More bins = finer resolution but slower learning (more states to visit). Fewer bins = faster learning but coarser approximation. The sweet spot depends on the problem. Too few bins and the agent can\'t distinguish critical states; too many and it never visits them all.',
      },
      {
        title: 'Watch for this',
        content:
          'Compare this to Random. With good bin settings, Discretized Q-Learning should reach 100+ steps within a few hundred episodes. But it may plateau — the discretization loses information that could help it reach 500.',
      },
    ],
  },
  reinforce: {
    name: 'REINFORCE',
    description:
      'A fundamentally different approach — instead of learning Q-values, REINFORCE learns a policy directly. It adjusts the probability of each action based on whether episodes went well or poorly.',
    sections: [
      {
        title: 'Policy Gradient Intuition',
        content:
          'Imagine Bhrigu has a "preference" for left vs. right thrust in each state. After each episode, if the episode lasted long (good!), increase the probability of the actions taken. If it was short (bad!), decrease them. Over time, good action patterns become more likely.',
        equation: '\\theta \\leftarrow \\theta + \\alpha \\sum_t (G_t - b) \\nabla_\\theta \\log \\pi_\\theta(a_t | s_t)',
      },
      {
        title: 'Linear Softmax Policy',
        content:
          'The policy is π(a|s) = softmax(W · φ(s)), where φ(s) are 7 features extracted from the state (bias, 4 normalized values, 2 quadratic terms). The weights W are updated using the policy gradient theorem. No neural network needed — this is fully interpretable.',
        equation: '\\pi(a|s) = \\frac{\\exp(\\mathbf{w}_a^\\top \\phi(s))}{\\sum_{a\'} \\exp(\\mathbf{w}_{a\'}^\\top \\phi(s))}',
      },
      {
        title: 'Baseline Subtraction',
        content:
          'Raw REINFORCE has high variance — some episodes are longer by luck. Subtracting the mean return (baseline) from each episode\'s return reduces noise: actions in above-average episodes get reinforced, below-average ones get discouraged.',
      },
      {
        title: 'Watch for this',
        content:
          'REINFORCE updates only at episode end, so early learning is slow. But once it locks onto a good policy, it can reach 500 steps consistently. Compare its learning curve to Discretized Q-Learning — typically slower start but higher ceiling.',
      },
    ],
  },
}

export const cartpoleParamExplanations: Record<string, string> = {
  alpha: 'Learning rate — how much Q-values shift after each step. Try 0.1 to start.',
  gamma: 'Discount factor — how much Bhrigu values future survival vs. the current moment. High γ (0.99) = plan ahead. Low γ = short-sighted.',
  epsilon: 'Exploration rate — how often Bhrigu fires a random thruster instead of using its best estimate. Needed for discovery but hurts performance.',
  bins: 'Number of bins per state dimension. More bins = finer control but slower learning. Fewer bins = faster but coarser.',
  lr: 'Policy learning rate — how quickly the policy weights update. Too high = unstable. Too low = slow. Try 0.01.',
}
