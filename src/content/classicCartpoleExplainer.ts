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
  dqn: {
    name: 'DQN',
    description:
      'Deep Q-Network replaces the Q-table with a neural network. The same Bellman update, but now Q-values are estimated by a 3-layer network (4\u2192128\u219264\u21922) trained via gradient descent.',
    sections: [
      {
        title: 'Experience Replay',
        content:
          'DQN stores past transitions (s, a, r, s\u2032) in a replay buffer and trains on random mini-batches. This breaks the correlation between consecutive steps, making gradient updates more stable than learning online from each step.',
      },
      {
        title: 'Target Network',
        content:
          'A second "target" network provides stable Q-value targets for the Bellman update. It is periodically synced from the online network (every 50 steps here). Without this, the network chases a moving target and often diverges.',
        equation: 'y_t = r_t + \\gamma \\max_{a\'} Q_{\\text{target}}(s\'_t, a\')',
      },
      {
        title: '\u03B5-Greedy Exploration',
        content:
          'DQN uses exponential per-step \u03B5 decay \u2014 epsilon decreases every step (not every episode). This means the agent transitions from exploration to exploitation gradually as it accumulates experience, independent of episode length.',
      },
      {
        title: 'Watch for this',
        content:
          'DQN takes longer to warm up (buffer must fill before learning starts) but becomes very stable once it does. The episode duration chart should show slow early progress followed by rapid improvement as the replay buffer accumulates useful experience.',
      },
    ],
  },
  'neural-reinforce': {
    name: 'Neural REINFORCE',
    description:
      'The same Monte Carlo policy gradient as REINFORCE, but the policy is a neural network (4\u2192128\u21922) instead of a linear function. Learns richer representations directly from raw state.',
    sections: [
      {
        title: 'Neural Network Policy',
        content:
          'The policy \u03C0\u03B8(a|s) is represented by a 2-layer network: hidden layer of 128 ReLU units, then softmax output. This can capture non-linear state patterns that the linear policy cannot, at the cost of more parameters to optimize.',
        equation: '\\pi_\\theta(a|s) = \\text{softmax}(W_2 \\cdot \\text{ReLU}(W_1 s + b_1) + b_2)',
      },
      {
        title: 'Return Normalization',
        content:
          'Instead of a running baseline, Neural REINFORCE normalizes the episode returns: G\u0303_t = (G_t \u2212 \u03bc) / (\u03c3 + \u03b5). This zero-centers and unit-scales the returns within each episode, reducing variance and improving training stability \u2014 especially when returns vary widely across episodes.',
      },
      {
        title: 'Watch for this',
        content:
          'Like linear REINFORCE, neural REINFORCE updates only at episode end. Early episodes may be noisy, but once the network finds a good region of weight space, performance improves quickly. Compare with linear REINFORCE to see how neural capacity changes the learning dynamics.',
      },
    ],
  },
  a2c: {
    name: 'A2C',
    description:
      'Advantage Actor-Critic maintains two separate networks: an Actor that learns the policy and a Critic that estimates state values V(s). The advantage A_t = G_t \u2212 V(s_t) tells each action whether it was better or worse than average.',
    sections: [
      {
        title: 'Actor and Critic',
        content:
          'The Actor (4\u2192128\u21922 softmax) decides which action to take. The Critic (4\u2192128\u21921 linear) estimates how good the current state is. They share the same input but have completely separate weights and separate Adam optimizers.',
      },
      {
        title: 'Advantage Estimate',
        content:
          'Instead of raw returns (which can be large and noisy), the actor is updated using the advantage A_t = G_t \u2212 V(s_t). This subtracts the baseline predicted by the critic, reducing variance while keeping the correct gradient direction.',
        equation: 'A_t = G_t - V(s_t)',
      },
      {
        title: 'Critic Loss',
        content:
          'The critic minimizes 0.0005 \u00D7 A_t\u00B2 \u2014 a small coefficient keeps value estimates from dominating the gradient. As the critic improves, advantage estimates become more accurate, and actor updates become lower-variance.',
      },
      {
        title: 'Watch for this',
        content:
          'A2C often shows smoother learning curves than REINFORCE because the advantage reduces gradient variance. Watch the state value display in the breakdown panel \u2014 as the critic learns, V(s) should increase from ~0 toward the true expected returns.',
      },
    ],
  },
}

export const classicCartpoleParamExplanations: Record<string, string> = {
  alpha: 'Learning rate \u2014 how much Q-values shift after each step. Try 0.1 to start.',
  gamma: 'Discount factor \u2014 how much the agent values future balance vs. the current moment. High \u03B3 (0.99) = plan ahead.',
  epsilon: 'Exploration rate \u2014 how often the agent pushes randomly instead of using its best estimate. Needed for discovery but hurts performance.',
  bins: 'Number of bins per state dimension (4 dimensions). More bins = finer control but more states. Fewer bins = faster but coarser.',
  lr: 'Policy learning rate \u2014 how quickly the policy weights update. Too high = unstable. Too low = slow. Try 0.01.',
  epsilonDecay: 'After each episode, \u03B5 is multiplied by this factor. At 0.995, \u03B5 halves roughly every 140 episodes. Set to 1.0 to disable decay.',
  epsilonMin: 'The floor for \u03B5 \u2014 exploration never drops below this. Prevents the agent from becoming fully greedy.',
  lrDQN: 'DQN learning rate \u2014 how fast the Q-network weights update. Lower than policy methods (0.001) because neural Q-learning is more sensitive to large updates.',
}
