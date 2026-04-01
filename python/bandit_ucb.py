import numpy as np

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
print(f"  Agent's best arm:  #{np.argmax(agent.estimates)}")