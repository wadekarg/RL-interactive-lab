import numpy as np
from collections import defaultdict

# =============================================================================
# SARSA for GridWorld (On-Policy TD Control)
# =============================================================================
#
# Similar to Q-Learning, but with one key difference:
#
#   Q-Learning: Q(s,a) ← Q(s,a) + α * [r + γ * MAX Q(s',a') - Q(s,a)]
#   SARSA:      Q(s,a) ← Q(s,a) + α * [r + γ * Q(s',a') - Q(s,a)]
#                                                    ↑ actual next action
#
# SARSA uses the action the agent ACTUALLY takes next (not the max).
# This makes it "on-policy" — it learns about the policy it's following.
#
# Name comes from: S(state) A(action) R(reward) S(next state) A(next action)
#
# SARSA is more conservative than Q-Learning: it accounts for the fact
# that the agent might explore and take a bad action near a pit.
# =============================================================================


# --- GridWorld Environment ---------------------------------------------------

class GridWorld:
    """Same 5x5 grid as Q-Learning example."""

    def __init__(self):
        self.grid = np.array([
            [0, 0, 0, 0, 0],
            [0, 1, 0, 3, 0],
            [0, 1, 0, 0, 0],
            [0, 0, 0, 1, 0],
            [4, 0, 0, 1, 2],
        ])
        self.rows, self.cols = self.grid.shape
        self.start = (4, 0)
        self.deltas = {0: (-1, 0), 1: (0, 1), 2: (1, 0), 3: (0, -1)}

    def reset(self):
        return self.start

    def step(self, state, action):
        row, col = state
        dr, dc = self.deltas[action]
        new_row, new_col = row + dr, col + dc

        if (new_row < 0 or new_row >= self.rows or
            new_col < 0 or new_col >= self.cols or
            self.grid[new_row, new_col] == 1):
            return state, -1, False

        next_state = (new_row, new_col)
        cell = self.grid[new_row, new_col]
        if cell == 2:
            return next_state, 10, True
        elif cell == 3:
            return next_state, -10, True
        return next_state, -0.1, False


# --- SARSA Agent -------------------------------------------------------------

class SarsaAgent:
    """
    On-policy TD agent.

    The key difference from Q-Learning: when computing the TD target,
    we use the Q-value of the action we'll ACTUALLY take next,
    not the maximum Q-value.
    """

    def __init__(self, n_actions=4, alpha=0.1, gamma=0.99, epsilon=0.1):
        self.alpha = alpha
        self.gamma = gamma
        self.epsilon = epsilon
        self.n_actions = n_actions
        self.Q = defaultdict(lambda: np.zeros(n_actions))

    def select_action(self, state):
        """ε-greedy action selection (same as Q-Learning)."""
        if np.random.random() < self.epsilon:
            return np.random.randint(self.n_actions)
        return int(np.argmax(self.Q[state]))

    def learn(self, state, action, reward, next_state, next_action, done):
        """
        SARSA update (on-policy):
        Q(s,a) += α * [r + γ * Q(s',a') - Q(s,a)]
                                    ↑ actual next action, NOT max

        This means SARSA learns the value of the policy it's actually
        following (including exploration mistakes), making it safer
        near dangerous states like pits.
        """
        current_q = self.Q[state][action]

        if done:
            target = reward
        else:
            # Use Q-value of the ACTUAL next action (not max)
            target = reward + self.gamma * self.Q[next_state][next_action]

        self.Q[state][action] += self.alpha * (target - current_q)


# --- Run the experiment ------------------------------------------------------

env = GridWorld()
agent = SarsaAgent(alpha=0.1, gamma=0.99, epsilon=0.1)

n_episodes = 500

for episode in range(n_episodes):
    state = env.reset()
    # SARSA needs the first action chosen BEFORE the loop
    action = agent.select_action(state)
    total_reward = 0

    for step in range(100):
        next_state, reward, done = env.step(state, action)
        # Choose next action BEFORE learning (on-policy)
        next_action = agent.select_action(next_state)
        # Learn using (S, A, R, S', A') — that's where the name comes from!
        agent.learn(state, action, reward, next_state, next_action, done)
        state = next_state
        action = next_action  # carry forward for next step
        total_reward += reward
        if done:
            break

    if (episode + 1) % 100 == 0:
        print(f"Episode {episode + 1}: reward = {total_reward:.1f}, steps = {step + 1}")

# Show learned policy
print("\\nLearned Policy:")
arrows = ['↑', '→', '↓', '←']
for r in range(env.rows):
    row_str = ""
    for c in range(env.cols):
        cell = env.grid[r, c]
        if cell == 1:   row_str += "  W  "
        elif cell == 2: row_str += "  G  "
        elif cell == 3: row_str += "  P  "
        else:           row_str += f"  {arrows[int(np.argmax(agent.Q[(r,c)]))]}  "
    print(row_str)