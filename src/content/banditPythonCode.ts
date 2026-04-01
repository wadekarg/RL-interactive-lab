/**
 * Python reference implementations for all three multi-armed bandit algorithms.
 * Each entry contains the algorithm name, Python source code, and line-by-line
 * explanations of the key logic.
 */

export interface PythonCodeEntry {
  id: string
  name: string
  code: string
  explanations: { lines: string; text: string }[]
  runInstructions: string
}

export const banditPythonCode: Record<string, PythonCodeEntry> = {
  'epsilon-greedy': {
    id: 'epsilon-greedy',
    name: 'ε-Greedy',
    code: `import numpy as np

class EpsilonGreedy:
    """Epsilon-Greedy agent for the multi-armed bandit problem."""

    def __init__(self, n_arms, epsilon=0.1):
        self.epsilon = epsilon
        self.counts = np.zeros(n_arms)      # how many times each arm was pulled
        self.estimates = np.zeros(n_arms)    # estimated reward for each arm

    def select_arm(self):
        if np.random.random() < self.epsilon:
            return np.random.randint(len(self.estimates))  # explore
        return np.argmax(self.estimates)                    # exploit

    def update(self, arm, reward):
        self.counts[arm] += 1
        # Incremental mean update: Q(a) += (r - Q(a)) / N(a)
        self.estimates[arm] += (reward - self.estimates[arm]) / self.counts[arm]


# --- Run it ---
class BanditEnvironment:
    def __init__(self, n_arms=5):
        self.true_means = np.random.randn(n_arms)

    def pull(self, arm):
        return self.true_means[arm] + np.random.randn()

env = BanditEnvironment(n_arms=5)
agent = EpsilonGreedy(n_arms=5, epsilon=0.1)

for step in range(1000):
    arm = agent.select_arm()
    reward = env.pull(arm)
    agent.update(arm, reward)

print(f"Best arm: {np.argmax(env.true_means)} (mean: {env.true_means.max():.2f})")
print(f"Agent picks: {np.argmax(agent.estimates)} (est: {agent.estimates.max():.2f})")
print(f"Arm counts: {agent.counts.astype(int)}")`,
    explanations: [
      { lines: 'Line 12-14', text: 'With probability ε, pick a random arm (explore). Otherwise, pick the arm with the highest estimated reward (exploit).' },
      { lines: 'Line 18-19', text: 'Incremental mean update — avoids storing all past rewards. Each new reward nudges the estimate closer to the true mean.' },
      { lines: 'Line 31-33', text: 'Main loop: select arm → pull → observe reward → update estimate. This is the core RL loop.' },
    ],
    runInstructions: 'pip install numpy && python bandit_epsilon_greedy.py',
  },

  'ucb': {
    id: 'ucb',
    name: 'UCB (Upper Confidence Bound)',
    code: `import numpy as np

class UCB:
    """Upper Confidence Bound agent for the multi-armed bandit problem."""

    def __init__(self, n_arms, c=2.0):
        self.c = c                           # exploration parameter
        self.counts = np.zeros(n_arms)       # pull counts per arm
        self.estimates = np.zeros(n_arms)    # estimated rewards
        self.total_steps = 0

    def select_arm(self):
        self.total_steps += 1
        # Play each arm once first (avoids division by zero)
        for i in range(len(self.counts)):
            if self.counts[i] == 0:
                return i
        # UCB formula: Q(a) + c * sqrt(ln(t) / N(a))
        ucb_values = self.estimates + self.c * np.sqrt(
            np.log(self.total_steps) / self.counts
        )
        return np.argmax(ucb_values)

    def update(self, arm, reward):
        self.counts[arm] += 1
        self.estimates[arm] += (reward - self.estimates[arm]) / self.counts[arm]


# --- Run it ---
class BanditEnvironment:
    def __init__(self, n_arms=5):
        self.true_means = np.random.randn(n_arms)

    def pull(self, arm):
        return self.true_means[arm] + np.random.randn()

env = BanditEnvironment(n_arms=5)
agent = UCB(n_arms=5, c=2.0)

for step in range(1000):
    arm = agent.select_arm()
    reward = env.pull(arm)
    agent.update(arm, reward)

print(f"Best arm: {np.argmax(env.true_means)} (mean: {env.true_means.max():.2f})")
print(f"Agent picks: {np.argmax(agent.estimates)} (est: {agent.estimates.max():.2f})")
print(f"Arm counts: {agent.counts.astype(int)}")`,
    explanations: [
      { lines: 'Line 14-17', text: 'Play each arm at least once before applying UCB — ensures we have some data for every arm.' },
      { lines: 'Line 19-22', text: 'The UCB formula adds a confidence bonus that grows for arms we haven\'t tried recently. The c parameter controls how much we favor exploration.' },
      { lines: 'Line 19', text: 'sqrt(ln(t) / N(a)) shrinks as an arm is pulled more, so well-explored arms rely on their estimated value while uncertain arms get a bonus.' },
    ],
    runInstructions: 'pip install numpy && python bandit_ucb.py',
  },

  'thompson-sampling': {
    id: 'thompson-sampling',
    name: 'Thompson Sampling',
    code: `import numpy as np

class ThompsonSampling:
    """Thompson Sampling agent using Beta distributions."""

    def __init__(self, n_arms):
        self.alphas = np.ones(n_arms)   # successes + 1 (Beta prior)
        self.betas = np.ones(n_arms)    # failures + 1 (Beta prior)

    def select_arm(self):
        # Sample from each arm's Beta distribution
        samples = np.array([
            np.random.beta(a, b)
            for a, b in zip(self.alphas, self.betas)
        ])
        return np.argmax(samples)

    def update(self, arm, reward):
        # Convert reward to binary: positive → success, else → failure
        if reward > 0:
            self.alphas[arm] += 1
        else:
            self.betas[arm] += 1


# --- Run it ---
class BanditEnvironment:
    def __init__(self, n_arms=5):
        self.true_means = np.random.randn(n_arms)

    def pull(self, arm):
        return self.true_means[arm] + np.random.randn()

env = BanditEnvironment(n_arms=5)
agent = ThompsonSampling(n_arms=5)

for step in range(1000):
    arm = agent.select_arm()
    reward = env.pull(arm)
    agent.update(arm, reward)

print(f"Best arm: {np.argmax(env.true_means)} (mean: {env.true_means.max():.2f})")
print(f"Arm alphas (wins): {agent.alphas.astype(int)}")
print(f"Arm betas (losses): {agent.betas.astype(int)}")`,
    explanations: [
      { lines: 'Line 7-8', text: 'Each arm starts with a Beta(1,1) prior — a uniform distribution meaning "I know nothing about this arm."' },
      { lines: 'Line 11-15', text: 'Sample a random value from each arm\'s Beta distribution. Arms with high uncertainty have wide distributions, so they\'ll occasionally sample high and get explored.' },
      { lines: 'Line 19-22', text: 'Update is simple: positive reward → increment alpha (success count), negative → increment beta (failure count). The Beta distribution naturally narrows as we gather data.' },
    ],
    runInstructions: 'pip install numpy && python bandit_thompson.py',
  },
}
