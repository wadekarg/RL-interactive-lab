export const banditIntro = {
  title: 'The Multi-Armed Bandit Problem',
  story: `Imagine you walk into a casino with a row of slot machines (called "one-armed bandits"). Each machine pays out at a different rate, but you don't know which ones are good and which are bad. You have a limited number of coins. How do you maximize your total winnings?`,
  objective: `This is the core challenge of the Multi-Armed Bandit problem — and it's one of the simplest yet most fundamental problems in Reinforcement Learning. The agent must decide at each step: should I try a new arm to learn more about it (EXPLORE), or should I stick with the best arm I've found so far (EXPLOIT)?`,
  whatYouWillLearn: [
    'How an RL agent balances exploration (trying new things) vs exploitation (using what it knows)',
    'How different strategies lead to different trade-offs',
    'Why the best strategy depends on how many tries you have and how many arms there are',
    'How uncertainty about the world drives intelligent decision-making',
  ],
  howItWorks: `Each "arm" has a hidden true average reward. When the agent pulls an arm, it gets a random reward centered around that arm's true mean. The agent doesn't know the true means — it must estimate them from experience. The goal is to accumulate as much total reward as possible over all steps.`,
  keyTerms: [
    { term: 'Arm', definition: 'One of the available choices (slot machines). Each has an unknown average reward.' },
    { term: 'Pull / Step', definition: 'One round of choosing an arm and observing the reward.' },
    { term: 'Estimated Value Q(a)', definition: 'The agent\'s current estimate of arm a\'s average reward, based on past observations.' },
    { term: 'Regret', definition: 'The total reward lost by not always picking the best arm. Lower regret = better strategy.' },
    { term: 'Exploration', definition: 'Trying arms that might not be the best, to gather more information.' },
    { term: 'Exploitation', definition: 'Choosing the arm that currently looks best, to maximize immediate reward.' },
  ],
}

export const banditAlgorithms = {
  'epsilon-greedy': {
    name: 'ε-Greedy',
    description:
      'The simplest exploration strategy. With probability ε, pick a random arm (explore). Otherwise, pick the arm with the highest estimated value (exploit).',
    sections: [
      {
        title: 'How it works',
        content:
          'At each step, flip a biased coin. With probability ε, choose a completely random arm (explore). With probability 1-ε, choose the arm with the highest estimated value (exploit). After pulling, update the running average for that arm.',
        equation: 'Q_{n+1}(a) = Q_n(a) + \\frac{1}{N(a)}\\Big[R_n - Q_n(a)\\Big]',
      },
      {
        title: 'What is ε (epsilon)?',
        content:
          'ε controls the exploration rate — the fraction of time the agent tries random arms instead of exploiting the best known arm. ε=0 means pure greedy (never explore — risky because you might miss the best arm). ε=1 means pure random (never exploit — wastes all your knowledge). Typical good values: 0.01 to 0.2.',
      },
      {
        title: 'Strengths & Weaknesses',
        content:
          'Simple and effective. But ε is fixed — the agent explores at the same rate at step 1 and step 10,000, even after it already knows which arm is best. A decaying ε would be smarter but adds complexity.',
      },
    ],
  },
  ucb: {
    name: 'Upper Confidence Bound (UCB1)',
    description:
      'Instead of exploring randomly, UCB explores smartly — it gives a bonus to arms it hasn\'t tried much, following the principle of "optimism in the face of uncertainty."',
    sections: [
      {
        title: 'How it works',
        content:
          'For each arm, compute: estimated value + exploration bonus. The bonus is large for arms tried few times (uncertain) and shrinks as the arm is tried more. Always pick the arm with the highest total score.',
        equation: 'A_t = \\arg\\max_a \\left[ Q(a) + c \\sqrt{\\frac{\\ln t}{N(a)}} \\right]',
      },
      {
        title: 'What is c (confidence)?',
        content:
          'c controls how much weight the exploration bonus gets. Higher c = more exploration (the agent tries uncertain arms more aggressively). Lower c = more exploitation. The theoretical optimal for pure bandit problems is c = √2 ≈ 1.41. Try adjusting it and watch how the agent\'s behavior changes!',
      },
      {
        title: 'Why is this better than ε-greedy?',
        content:
          'UCB explores intelligently — it focuses on arms it knows LEAST about, rather than exploring randomly. As it learns more about each arm, the bonus naturally shrinks. This gives logarithmic regret — mathematically near-optimal for this problem.',
      },
    ],
  },
  'thompson-sampling': {
    name: 'Thompson Sampling',
    description:
      'A Bayesian approach: maintain a probability distribution for each arm\'s value, sample from each, and pick the arm with the highest sample. No hyperparameters needed!',
    sections: [
      {
        title: 'How it works',
        content:
          'For each arm, keep a Beta(α, β) distribution representing your belief about how good the arm is. At each step: sample a random number from each arm\'s distribution, then pull the arm with the highest sample. After seeing the reward, update the distribution.',
        equation: '\\theta_a \\sim \\text{Beta}(\\alpha_a, \\beta_a), \\quad A_t = \\arg\\max_a \\, \\theta_a',
      },
      {
        title: 'The Beta distribution curves below',
        content:
          'Watch the curves below as the agent learns! Each curve represents the agent\'s belief about one arm. Wide curves = high uncertainty = more likely to be sampled high = more exploration. Narrow curves = confident estimates = stable exploitation. The distributions naturally guide the exploration-exploitation trade-off.',
        equation: '\\alpha_a \\leftarrow \\alpha_a + \\mathbf{1}[\\text{success}], \\quad \\beta_a \\leftarrow \\beta_a + \\mathbf{1}[\\text{failure}]',
      },
      {
        title: 'Why no hyperparameters?',
        content:
          'Thompson Sampling automatically balances exploration and exploitation through Bayesian inference. Arms with wide distributions (high uncertainty) occasionally produce high samples, so they get explored. As evidence accumulates, the distributions narrow and the agent naturally shifts to exploitation. Many researchers consider this the best overall bandit algorithm.',
      },
    ],
  },
}

export const banditParamExplanations: Record<string, string> = {
  numArms: 'How many slot machines (arms) are available. More arms = harder problem because there are more options to explore.',
  epsilon: 'The probability of choosing a random arm at each step. ε=0 means always pick the best known arm (greedy). ε=1 means always pick randomly. Try 0.1 as a starting point.',
  confidence: 'How much to weight the exploration bonus. Higher c = explore more uncertain arms. Lower c = exploit more. Theoretical optimal is √2 ≈ 1.41.',
  speed: 'How fast the simulation runs. Slower lets you observe each step. Faster gets to convergence quicker.',
}
