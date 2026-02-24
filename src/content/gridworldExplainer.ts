export const gridworldIntro = {
  title: "Boru's Journey to the Water Hole",
  story: `Deep in the savanna, a young elephant named Boru is thirsty. He knows there's a water hole somewhere in the land, but the terrain is dangerous — steep cliffs block certain paths, and lions lurk in some areas. Boru must learn the safest and shortest route to the water hole through trial and error.

Every step he takes costs him energy (small penalty). If he finds the water hole, he's rewarded greatly. If he stumbles into a lion's territory, the consequences are severe. He cannot cross cliffs.

This is Boru's world — and YOUR job is to help him learn using Reinforcement Learning algorithms.`,

  objective: `The goal is to teach Boru (our RL agent) the best policy — a strategy that tells him which direction to move from every position to reach the water hole safely and efficiently. Watch him start with random wandering and gradually learn the optimal path!`,

  whatYouWillLearn: [
    'How an agent learns to navigate through rewards and punishments',
    'The difference between model-free learning (Q-Learning, SARSA) and planning (Value Iteration, Policy Iteration)',
    'How Q-values represent "how good is it to take action A from state S"',
    'How a policy (the arrows) emerges from learned values',
    'Why exploration is necessary — Boru must try risky paths to discover that they\'re bad',
    'How discount factor (γ) controls whether Boru is short-sighted or far-sighted',
  ],

  howItWorks: `The grid is Boru's world. Each cell is a position. Boru can move Up, Down, Left, or Right. He starts at his home position and must reach the water hole. Each move costs a tiny amount of energy (step penalty). Reaching the water hole gives a big reward. Encountering a lion gives a big penalty. Cliffs are impassable walls. The algorithm learns Q-values for each (position, direction) pair — these tell Boru how good each move is. The arrows show the best move from each cell.`,

  gridEditorHelp: 'Click cells to paint them. Select a brush below, then click on the grid to design your own world for Boru!',
}

export const gridworldAlgorithms = {
  'q-learning': {
    name: 'Q-Learning',
    description:
      'Off-policy TD learning. Boru learns the BEST possible route, even while exploring randomly. He\'s an optimist — he assumes he\'ll act perfectly in the future.',
    sections: [
      {
        title: 'Update Rule',
        content:
          'After Boru takes a step, he updates his Q-value for that (state, action) pair. The update targets the MAXIMUM Q-value of the next state — assuming he\'ll be greedy from there on, even if he isn\'t actually being greedy right now.',
        equation: 'Q(s,a) \\leftarrow Q(s,a) + \\alpha \\Big[ r + \\gamma \\max_{a\'} Q(s\',a\') - Q(s,a) \\Big]',
      },
      {
        title: 'Why "Off-Policy"?',
        content:
          'Boru follows an ε-greedy policy (sometimes exploring randomly), but learns about the optimal policy (pure greedy). He\'s learning what the BEST path is, even while taking detours to explore. This is powerful but can overestimate Q-values near dangerous areas (lions!) because it assumes perfect future behavior.',
      },
      {
        title: 'Watch for this',
        content:
          'Compare Q-Learning to SARSA near lions. Q-Learning often finds the shortest path even if it runs close to danger, because it assumes it will never accidentally step into a lion. SARSA is more cautious.',
      },
    ],
  },
  sarsa: {
    name: 'SARSA',
    description:
      'On-policy TD learning. Boru learns about the policy he\'s actually following — including his occasional random explorations. He\'s a realist — he accounts for his own mistakes.',
    sections: [
      {
        title: 'Update Rule',
        content:
          'The name SARSA comes from (State, Action, Reward, State\', Action\'). Unlike Q-Learning, the update uses the ACTUAL next action Boru will take — not the best possible one.',
        equation: 'Q(s,a) \\leftarrow Q(s,a) + \\alpha \\Big[ r + \\gamma Q(s\',a\') - Q(s,a) \\Big]',
      },
      {
        title: 'Why "On-Policy"?',
        content:
          'Because SARSA uses the actual next action (which might be a random exploration step), it learns values that account for the fact that Boru sometimes acts randomly. Near lions, this means Boru learns to stay away — because he knows he might accidentally wander into one during exploration.',
      },
      {
        title: 'Watch for this',
        content:
          'SARSA typically finds a SAFER path than Q-Learning. It takes a wider berth around lions because it "knows" it sometimes acts randomly. Q-Learning finds the OPTIMAL path (assuming perfect execution), while SARSA finds the best path given its actual exploration behavior.',
      },
    ],
  },
  'value-iteration': {
    name: 'Value Iteration',
    description:
      'Dynamic programming — Boru doesn\'t learn from experience. Instead, he uses a complete MAP of the world to compute the optimal route by planning.',
    sections: [
      {
        title: 'Bellman Optimality Equation',
        content:
          'Each step sweeps over ALL cells in the grid and computes the best possible value. No exploration needed — the algorithm has full knowledge of the environment. Each "step" here is a full planning sweep.',
        equation: 'V(s) \\leftarrow \\max_a \\Big[ R(s,a) + \\gamma V(s\') \\Big]',
      },
      {
        title: 'Planning vs Learning',
        content:
          'Unlike Q-Learning and SARSA, Value Iteration doesn\'t need Boru to walk around at all. It uses the known layout (where lions are, where cliffs are) to compute the optimal strategy. This is fast but requires a perfect model of the world — real-world agents often don\'t have that luxury.',
      },
      {
        title: 'Watch for this',
        content:
          'Value Iteration converges to the optimal policy in very few sweeps. Watch the heatmap and arrows stabilize quickly. Compare this speed to Q-Learning/SARSA which need many episodes of actual experience.',
      },
    ],
  },
  'policy-iteration': {
    name: 'Policy Iteration',
    description:
      'Another planning method. Alternates between "evaluate current strategy" and "improve current strategy." Often reaches the optimal policy faster than Value Iteration.',
    sections: [
      {
        title: 'Two Phases',
        content:
          'Phase 1: Policy Evaluation — compute how good the current strategy is for every cell. Phase 2: Policy Improvement — look at the computed values and switch each cell\'s action to the best one.',
        equation: 'V^\\pi(s) = R(s, \\pi(s)) + \\gamma V^\\pi(s\')',
      },
      {
        title: 'Policy Improvement',
        content:
          'After evaluation, improve greedily. For each cell, check all 4 directions and pick the one that leads to the highest value. This is guaranteed to improve the strategy or confirm it\'s already optimal.',
        equation: '\\pi\'(s) = \\arg\\max_a \\Big[ R(s,a) + \\gamma V^\\pi(s\') \\Big]',
      },
      {
        title: 'Watch for this',
        content:
          'Policy Iteration typically reaches the optimal policy in 2-4 iterations. Each iteration is expensive (multiple evaluation sweeps internally), but the total computation is often less than Value Iteration for larger grids.',
      },
    ],
  },
}

export const gridworldParamExplanations: Record<string, string> = {
  alpha: 'Learning rate — how much Boru updates his knowledge after each step. High α = learn fast but unstable. Low α = learn slowly but steadily. Try 0.1 to start.',
  gamma: 'Discount factor — how much Boru cares about future rewards vs immediate ones. γ=0 means Boru only cares about the next step (short-sighted). γ=0.99 means he plans far ahead. Try 0.9 to 0.99.',
  epsilon: 'Exploration rate — how often Boru moves randomly instead of following his best-known path. High ε = more exploration (useful early on). Low ε = more exploitation. Try 0.1.',
  gridSize: 'Width and height of the grid. Larger grids are harder — more states to learn. Start with 5×5 or 6×6.',
  goalReward: 'The reward Boru gets for reaching the water hole. Higher values make the water hole more "attractive" to the algorithm.',
  stepPenalty: 'The small penalty Boru pays for every step. This motivates him to find shorter paths. More negative = more urgency.',
  lionPenalty: 'The penalty for stepping into a lion\'s area. More negative = more dangerous = Boru avoids lions more aggressively.',
}
