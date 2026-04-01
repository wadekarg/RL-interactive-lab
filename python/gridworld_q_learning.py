import numpy as np
from collections import defaultdict

# =============================================================================
# Q-Learning for GridWorld (Off-Policy TD Control)
# =============================================================================
#
# The agent learns a Q-table mapping (state, action) → expected reward.
# It uses the Bellman optimality equation to update Q-values:
#
#   Q(s,a) ← Q(s,a) + α * [r + γ * max_a' Q(s',a') - Q(s,a)]
#
# "Off-policy" means it always uses the MAX of next state's Q-values
# for the update, even if it didn't take that action (explores with ε-greedy).
#
# This is the most popular model-free RL algorithm for discrete environments.
# =============================================================================


# --- GridWorld Environment ---------------------------------------------------

class GridWorld:
    """
    Simple grid environment.

    Cell types:
        0 = empty (small penalty to encourage short paths)
        1 = wall (can't move here)
        2 = goal (big reward, episode ends)
        3 = pit  (big penalty, episode ends)
        4 = start position

    Actions: 0=Up, 1=Right, 2=Down, 3=Left
    """

    def __init__(self):
        # 5x5 grid: S=start, G=goal, P=pit, W=wall, .=empty
        #   . . . . .
        #   . W . P .
        #   . W . . .
        #   . . . W .
        #   S . . W G
        self.grid = np.array([
            [0, 0, 0, 0, 0],
            [0, 1, 0, 3, 0],
            [0, 1, 0, 0, 0],
            [0, 0, 0, 1, 0],
            [4, 0, 0, 1, 2],
        ])
        self.rows, self.cols = self.grid.shape
        self.start = (4, 0)         # bottom-left
        self.actions = [0, 1, 2, 3]  # Up, Right, Down, Left
        # Movement deltas: (row_change, col_change) for each action
        self.deltas = {0: (-1, 0), 1: (0, 1), 2: (1, 0), 3: (0, -1)}

    def reset(self):
        """Reset agent to start position."""
        return self.start

    def step(self, state, action):
        """Take an action, return (next_state, reward, done)."""
        row, col = state
        dr, dc = self.deltas[action]
        new_row, new_col = row + dr, col + dc

        # Stay in place if hitting wall or going out of bounds
        if (new_row < 0 or new_row >= self.rows or
            new_col < 0 or new_col >= self.cols or
            self.grid[new_row, new_col] == 1):
            return state, -1, False  # wall bump penalty

        next_state = (new_row, new_col)
        cell = self.grid[new_row, new_col]

        if cell == 2:    # Goal!
            return next_state, 10, True
        elif cell == 3:  # Pit!
            return next_state, -10, True
        else:            # Empty cell
            return next_state, -0.1, False  # small step penalty


# --- Q-Learning Agent --------------------------------------------------------

class QLearningAgent:
    """
    Off-policy TD agent.

    Parameters:
        alpha   — learning rate (how fast we update Q-values)
        gamma   — discount factor (how much we value future rewards)
        epsilon — exploration rate (probability of random action)
    """

    def __init__(self, n_actions=4, alpha=0.1, gamma=0.99, epsilon=0.1):
        self.alpha = alpha
        self.gamma = gamma
        self.epsilon = epsilon
        self.n_actions = n_actions
        # Q-table: maps state → array of Q-values for each action
        # defaultdict auto-creates zero arrays for new states
        self.Q = defaultdict(lambda: np.zeros(n_actions))

    def select_action(self, state):
        """ε-greedy: explore with prob ε, exploit otherwise."""
        if np.random.random() < self.epsilon:
            return np.random.randint(self.n_actions)  # random action
        return int(np.argmax(self.Q[state]))           # best action

    def learn(self, state, action, reward, next_state, done):
        """
        Q-Learning update (off-policy):
        Q(s,a) += α * [r + γ * max Q(s',a') - Q(s,a)]

        Key: uses MAX over next actions — learns optimal policy
        even while following an exploratory (ε-greedy) policy.
        """
        current_q = self.Q[state][action]

        # Target: immediate reward + discounted best future value
        if done:
            target = reward  # no future if episode is over
        else:
            target = reward + self.gamma * np.max(self.Q[next_state])

        # TD update: nudge Q-value toward the target
        self.Q[state][action] += self.alpha * (target - current_q)


# --- Run the experiment ------------------------------------------------------

env = GridWorld()
agent = QLearningAgent(alpha=0.1, gamma=0.99, epsilon=0.1)

n_episodes = 500
action_names = ['Up', 'Right', 'Down', 'Left']

for episode in range(n_episodes):
    state = env.reset()
    total_reward = 0

    for step in range(100):  # max 100 steps per episode
        action = agent.select_action(state)
        next_state, reward, done = env.step(state, action)
        agent.learn(state, action, reward, next_state, done)
        state = next_state
        total_reward += reward
        if done:
            break

    if (episode + 1) % 100 == 0:
        print(f"Episode {episode + 1}: reward = {total_reward:.1f}, steps = {step + 1}")

# Show the learned policy
print("\\nLearned Policy:")
for r in range(env.rows):
    row_str = ""
    for c in range(env.cols):
        cell = env.grid[r, c]
        if cell == 1:
            row_str += "  W  "     # wall
        elif cell == 2:
            row_str += "  G  "     # goal
        elif cell == 3:
            row_str += "  P  "     # pit
        else:
            best = int(np.argmax(agent.Q[(r, c)]))
            arrows = ['↑', '→', '↓', '←']
            row_str += f"  {arrows[best]}  "
    print(row_str)