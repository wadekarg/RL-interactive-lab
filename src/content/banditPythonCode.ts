/**
 * Python reference implementations for all three multi-armed bandit algorithms.
 * Each entry contains the algorithm name and fully commented Python source code.
 */

export interface PythonCodeEntry {
  id: string
  name: string
  code: string
}

export const banditPythonCode: Record<string, PythonCodeEntry> = {
  'epsilon-greedy': {
    id: 'epsilon-greedy',
    name: 'ε-Greedy',
    code: `import numpy as np

# =============================================================================
# ε-Greedy Algorithm for the Multi-Armed Bandit Problem
# =============================================================================
#
# The simplest exploration strategy: most of the time, pick the best arm
# (exploit), but with a small probability ε, pick a random arm (explore).
#
# Pros: Simple, easy to tune, works well in practice
# Cons: Explores uniformly at random — doesn't prioritize uncertain arms
# =============================================================================

class EpsilonGreedy:
    """
    Epsilon-Greedy agent.

    Parameters:
        n_arms  — number of slot machines (arms) to choose from
        epsilon — probability of exploring (picking a random arm)
                  e.g. epsilon=0.1 means 10% explore, 90% exploit
    """

    def __init__(self, n_arms, epsilon=0.1):
        self.epsilon = epsilon
        self.counts = np.zeros(n_arms)      # N(a): how many times each arm was pulled
        self.estimates = np.zeros(n_arms)    # Q(a): estimated reward for each arm

    def select_arm(self):
        """Choose which arm to pull next."""
        # With probability epsilon, explore: pick a random arm
        if np.random.random() < self.epsilon:
            return np.random.randint(len(self.estimates))
        # Otherwise, exploit: pick the arm with highest estimated reward
        return np.argmax(self.estimates)

    def update(self, arm, reward):
        """Update our estimate after observing a reward."""
        self.counts[arm] += 1
        # Incremental mean formula: Q(a) = Q(a) + (reward - Q(a)) / N(a)
        # This avoids storing all past rewards — just updates the running average
        # As N(a) grows, each new reward has less impact (the estimate stabilizes)
        self.estimates[arm] += (reward - self.estimates[arm]) / self.counts[arm]


# =============================================================================
# Environment: simulates a row of slot machines with different payout rates
# =============================================================================

class BanditEnvironment:
    """Each arm has a hidden true mean reward (unknown to the agent)."""

    def __init__(self, n_arms=5):
        # True means are random — the agent doesn't know these!
        self.true_means = np.random.randn(n_arms)
        print(f"True arm means (hidden): {np.round(self.true_means, 2)}")
        print(f"Best arm is #{np.argmax(self.true_means)} with mean {self.true_means.max():.2f}")
        print()

    def pull(self, arm):
        """Pull an arm and get a noisy reward (true mean + gaussian noise)."""
        return self.true_means[arm] + np.random.randn()


# =============================================================================
# Run the experiment
# =============================================================================

env = BanditEnvironment(n_arms=5)
agent = EpsilonGreedy(n_arms=5, epsilon=0.1)  # try changing epsilon!

total_reward = 0
for step in range(1000):
    arm = agent.select_arm()        # agent picks an arm
    reward = env.pull(arm)          # environment gives a reward
    agent.update(arm, reward)       # agent learns from the reward
    total_reward += reward

# Results
print(f"After 1000 steps:")
print(f"  Total reward: {total_reward:.1f}")
print(f"  Agent's estimates: {np.round(agent.estimates, 2)}")
print(f"  Arm pull counts:   {agent.counts.astype(int)}")
print(f"  Agent's best arm:  #{np.argmax(agent.estimates)}")`,
  },

  'ucb': {
    id: 'ucb',
    name: 'UCB (Upper Confidence Bound)',
    code: `import numpy as np

# =============================================================================
# UCB (Upper Confidence Bound) for the Multi-Armed Bandit Problem
# =============================================================================
#
# Instead of exploring randomly like ε-Greedy, UCB explores *smartly*:
# it adds a "confidence bonus" to each arm's estimate. Arms that haven't
# been tried much get a bigger bonus, so they get explored more.
#
# Formula: UCB(a) = Q(a) + c * sqrt(ln(t) / N(a))
#   Q(a) = estimated reward (exploitation term)
#   c * sqrt(ln(t) / N(a)) = confidence bonus (exploration term)
#   t = total steps so far, N(a) = times arm a was pulled
#
# Pros: No random exploration — mathematically principled
# Cons: Assumes stationary rewards, needs tuning of c parameter
# =============================================================================

class UCB:
    """
    Upper Confidence Bound agent.

    Parameters:
        n_arms — number of arms
        c      — exploration parameter (higher = more exploration)
                 c=2 is a common default from the UCB1 algorithm
    """

    def __init__(self, n_arms, c=2.0):
        self.c = c                           # controls exploration vs exploitation
        self.counts = np.zeros(n_arms)       # N(a): pull count per arm
        self.estimates = np.zeros(n_arms)    # Q(a): estimated reward per arm
        self.total_steps = 0                 # t: total number of steps

    def select_arm(self):
        """Choose arm with highest upper confidence bound."""
        self.total_steps += 1

        # Phase 1: play each arm once (we need at least 1 sample per arm)
        # This avoids division by zero in the UCB formula
        for i in range(len(self.counts)):
            if self.counts[i] == 0:
                return i

        # Phase 2: pick the arm with the highest UCB value
        # The bonus term sqrt(ln(t) / N(a)) is large for under-explored arms
        # and shrinks as an arm gets pulled more — natural exploration decay
        ucb_values = self.estimates + self.c * np.sqrt(
            np.log(self.total_steps) / self.counts
        )
        return np.argmax(ucb_values)

    def update(self, arm, reward):
        """Update estimate with incremental mean (same as ε-Greedy)."""
        self.counts[arm] += 1
        self.estimates[arm] += (reward - self.estimates[arm]) / self.counts[arm]


# =============================================================================
# Environment
# =============================================================================

class BanditEnvironment:
    """Each arm has a hidden true mean reward (unknown to the agent)."""

    def __init__(self, n_arms=5):
        self.true_means = np.random.randn(n_arms)
        print(f"True arm means (hidden): {np.round(self.true_means, 2)}")
        print(f"Best arm is #{np.argmax(self.true_means)} with mean {self.true_means.max():.2f}")
        print()

    def pull(self, arm):
        return self.true_means[arm] + np.random.randn()


# =============================================================================
# Run the experiment
# =============================================================================

env = BanditEnvironment(n_arms=5)
agent = UCB(n_arms=5, c=2.0)  # try changing c! (higher = more exploration)

total_reward = 0
for step in range(1000):
    arm = agent.select_arm()
    reward = env.pull(arm)
    agent.update(arm, reward)
    total_reward += reward

print(f"After 1000 steps:")
print(f"  Total reward: {total_reward:.1f}")
print(f"  Agent's estimates: {np.round(agent.estimates, 2)}")
print(f"  Arm pull counts:   {agent.counts.astype(int)}")
print(f"  Agent's best arm:  #{np.argmax(agent.estimates)}")`,
  },

  'thompson-sampling': {
    id: 'thompson-sampling',
    name: 'Thompson Sampling',
    code: `import numpy as np

# =============================================================================
# Thompson Sampling for the Multi-Armed Bandit Problem
# =============================================================================
#
# The Bayesian approach: instead of keeping a single estimate per arm,
# we maintain a full probability distribution (Beta distribution) that
# represents our uncertainty about each arm's success rate.
#
# Each step:
#   1. Sample a random value from each arm's distribution
#   2. Pick the arm whose sample is highest
#   3. Update that arm's distribution with the observed reward
#
# Arms we're uncertain about → wide distribution → occasionally sample high
# → get explored naturally. No epsilon, no confidence parameter needed!
#
# Pros: No hyperparameters, naturally balances explore/exploit, often optimal
# Cons: Assumes Bernoulli rewards (success/failure), more complex theory
# =============================================================================

class ThompsonSampling:
    """
    Thompson Sampling agent using Beta distributions.

    Each arm has a Beta(alpha, beta) distribution where:
        alpha = number of successes + 1  (starts at 1 for uniform prior)
        beta  = number of failures + 1   (starts at 1 for uniform prior)

    Beta(1,1) = uniform distribution = "I know nothing about this arm"
    As we observe rewards, the distribution narrows around the true value.
    """

    def __init__(self, n_arms):
        self.alphas = np.ones(n_arms)   # alpha for each arm (successes + 1)
        self.betas = np.ones(n_arms)    # beta for each arm (failures + 1)

    def select_arm(self):
        """Sample from each arm's Beta distribution, pick the highest."""
        # np.random.beta(a, b) draws a random value between 0 and 1
        # Arms with more successes → distribution shifted right (higher samples)
        # Arms with few pulls → wide distribution → sometimes sample high (explore!)
        samples = np.array([
            np.random.beta(a, b)
            for a, b in zip(self.alphas, self.betas)
        ])
        return np.argmax(samples)

    def update(self, arm, reward):
        """Update the Beta distribution for the pulled arm."""
        # Positive reward → count as success (alpha goes up)
        # Negative/zero reward → count as failure (beta goes up)
        # As alpha and beta grow, the distribution narrows = more confidence
        if reward > 0:
            self.alphas[arm] += 1
        else:
            self.betas[arm] += 1


# =============================================================================
# Environment
# =============================================================================

class BanditEnvironment:
    """Each arm has a hidden true mean reward (unknown to the agent)."""

    def __init__(self, n_arms=5):
        self.true_means = np.random.randn(n_arms)
        print(f"True arm means (hidden): {np.round(self.true_means, 2)}")
        print(f"Best arm is #{np.argmax(self.true_means)} with mean {self.true_means.max():.2f}")
        print()

    def pull(self, arm):
        return self.true_means[arm] + np.random.randn()


# =============================================================================
# Run the experiment
# =============================================================================

env = BanditEnvironment(n_arms=5)
agent = ThompsonSampling(n_arms=5)

total_reward = 0
for step in range(1000):
    arm = agent.select_arm()
    reward = env.pull(arm)
    agent.update(arm, reward)
    total_reward += reward

print(f"After 1000 steps:")
print(f"  Total reward: {total_reward:.1f}")
print(f"  Alpha (wins):  {agent.alphas.astype(int)}")
print(f"  Beta (losses): {agent.betas.astype(int)}")
print(f"  Win rates:     {np.round(agent.alphas / (agent.alphas + agent.betas), 2)}")
print(f"  Agent's best:  #{np.argmax(agent.alphas / (agent.alphas + agent.betas))}")`,
  },
}
