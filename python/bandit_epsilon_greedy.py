import numpy as np

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
print(f"  Agent's best arm:  #{np.argmax(agent.estimates)}")