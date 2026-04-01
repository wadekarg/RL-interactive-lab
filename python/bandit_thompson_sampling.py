import numpy as np

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
print(f"  Agent's best:  #{np.argmax(agent.alphas / (agent.alphas + agent.betas))}")