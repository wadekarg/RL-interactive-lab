/**
 * Python reference implementations for all four GridWorld RL algorithms.
 */

export interface PythonCodeEntry {
  id: string
  name: string
  code: string
}

export const gridworldPythonCode: Record<string, PythonCodeEntry> = {
  'q-learning': {
    id: 'q-learning',
    name: 'Q-Learning',
    code: `import numpy as np
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
    print(row_str)`,
  },

  'sarsa': {
    id: 'sarsa',
    name: 'SARSA',
    code: `import numpy as np
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
    print(row_str)`,
  },

  'value-iteration': {
    id: 'value-iteration',
    name: 'Value Iteration',
    code: `import numpy as np

# =============================================================================
# Value Iteration for GridWorld (Dynamic Programming)
# =============================================================================
#
# Unlike Q-Learning/SARSA, Value Iteration doesn't learn from experience.
# It requires a COMPLETE MODEL of the environment (all transitions and rewards)
# and computes the optimal policy by sweeping over ALL states repeatedly.
#
# Algorithm:
#   For each state s:
#     For each action a:
#       Compute Q(s,a) = R(s,a) + γ * V(s')
#     V(s) = max_a Q(s,a)
#     π(s) = argmax_a Q(s,a)
#   Repeat until V converges
#
# This is guaranteed to find the OPTIMAL policy (if the model is correct).
#
# Pros: Optimal, converges fast
# Cons: Needs full environment model, doesn't scale to large/continuous spaces
# =============================================================================


# --- GridWorld Environment ---------------------------------------------------

class GridWorld:
    """5x5 grid with walls, goal, and pit."""

    def __init__(self):
        self.grid = np.array([
            [0, 0, 0, 0, 0],
            [0, 1, 0, 3, 0],
            [0, 1, 0, 0, 0],
            [0, 0, 0, 1, 0],
            [4, 0, 0, 1, 2],
        ])
        self.rows, self.cols = self.grid.shape
        self.actions = [0, 1, 2, 3]  # Up, Right, Down, Left
        self.deltas = {0: (-1, 0), 1: (0, 1), 2: (1, 0), 3: (0, -1)}

    def get_all_states(self):
        """Return all non-wall states (needed for planning)."""
        states = []
        for r in range(self.rows):
            for c in range(self.cols):
                if self.grid[r, c] != 1:  # skip walls
                    states.append((r, c))
        return states

    def is_terminal(self, state):
        """Goal and pit are terminal states."""
        return self.grid[state[0], state[1]] in (2, 3)

    def step(self, state, action):
        """Simulate a step (used for planning, not real interaction)."""
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


# --- Value Iteration ---------------------------------------------------------

def value_iteration(env, gamma=0.99, threshold=1e-4):
    """
    Compute optimal V(s) and π(s) by sweeping all states until convergence.

    Parameters:
        gamma     — discount factor
        threshold — stop when max change in V is below this
    """
    states = env.get_all_states()
    # Initialize value function to 0 for all states
    V = {s: 0.0 for s in states}
    policy = {s: 0 for s in states}

    iteration = 0
    while True:
        delta = 0  # track biggest change this sweep
        iteration += 1

        for state in states:
            if env.is_terminal(state):
                continue  # terminal states have V=0

            # Compute Q-value for each action
            q_values = []
            for action in env.actions:
                next_state, reward, done = env.step(state, action)
                # Bellman equation: Q(s,a) = R + γ * V(s')
                next_v = 0 if done else V[next_state]
                q_values.append(reward + gamma * next_v)

            # V(s) = max Q-value across all actions
            best_value = max(q_values)
            best_action = int(np.argmax(q_values))

            delta = max(delta, abs(best_value - V[state]))
            V[state] = best_value
            policy[state] = best_action

        print(f"Iteration {iteration}: max delta = {delta:.6f}")

        # Converged when no state's value changed significantly
        if delta < threshold:
            print(f"Converged after {iteration} iterations!")
            break

    return V, policy


# --- Run it ------------------------------------------------------------------

env = GridWorld()
V, policy = value_iteration(env, gamma=0.99)

# Show optimal policy
print("\\nOptimal Policy:")
arrows = ['↑', '→', '↓', '←']
for r in range(env.rows):
    row_str = ""
    for c in range(env.cols):
        cell = env.grid[r, c]
        if cell == 1:   row_str += "  W  "
        elif cell == 2: row_str += "  G  "
        elif cell == 3: row_str += "  P  "
        else:           row_str += f"  {arrows[policy[(r,c)]]}  "
    print(row_str)

# Show state values
print("\\nState Values:")
for r in range(env.rows):
    row_str = ""
    for c in range(env.cols):
        cell = env.grid[r, c]
        if cell == 1:
            row_str += "  W   "
        else:
            row_str += f"{V.get((r,c), 0):5.1f} "
    print(row_str)`,
  },

  'policy-iteration': {
    id: 'policy-iteration',
    name: 'Policy Iteration',
    code: `import numpy as np

# =============================================================================
# Policy Iteration for GridWorld (Dynamic Programming)
# =============================================================================
#
# Two-phase algorithm that alternates between:
#
#   1. POLICY EVALUATION: Given a fixed policy π, compute V^π(s) for all states
#      by repeatedly applying: V(s) = R(s, π(s)) + γ * V(s')
#      until V converges.
#
#   2. POLICY IMPROVEMENT: For each state, check if a different action gives
#      a higher value than the current policy. If so, update the policy.
#
# Repeat until the policy stops changing (= optimal policy found).
#
# Difference from Value Iteration:
#   - Value Iteration: one backup per state per sweep, updates V and π together
#   - Policy Iteration: fully evaluates current policy, THEN improves
#   - Policy Iteration often converges in fewer iterations but each is more work
# =============================================================================


# --- GridWorld Environment ---------------------------------------------------

class GridWorld:
    """5x5 grid with walls, goal, and pit."""

    def __init__(self):
        self.grid = np.array([
            [0, 0, 0, 0, 0],
            [0, 1, 0, 3, 0],
            [0, 1, 0, 0, 0],
            [0, 0, 0, 1, 0],
            [4, 0, 0, 1, 2],
        ])
        self.rows, self.cols = self.grid.shape
        self.actions = [0, 1, 2, 3]
        self.deltas = {0: (-1, 0), 1: (0, 1), 2: (1, 0), 3: (0, -1)}

    def get_all_states(self):
        states = []
        for r in range(self.rows):
            for c in range(self.cols):
                if self.grid[r, c] != 1:
                    states.append((r, c))
        return states

    def is_terminal(self, state):
        return self.grid[state[0], state[1]] in (2, 3)

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


# --- Policy Iteration --------------------------------------------------------

def policy_iteration(env, gamma=0.99, eval_threshold=1e-4):
    """
    Find optimal policy by alternating evaluation and improvement.

    Parameters:
        gamma          — discount factor
        eval_threshold — convergence threshold for policy evaluation
    """
    states = env.get_all_states()
    # Start with a random policy (action 0 = Up for all states)
    policy = {s: 0 for s in states}
    V = {s: 0.0 for s in states}

    iteration = 0
    while True:
        iteration += 1

        # ── Phase 1: Policy Evaluation ─────────────────────────────
        # Compute V^π(s) for the current policy until convergence
        eval_sweeps = 0
        while True:
            eval_sweeps += 1
            delta = 0
            for state in states:
                if env.is_terminal(state):
                    continue
                # Follow the current policy (not the best action!)
                action = policy[state]
                next_state, reward, done = env.step(state, action)
                next_v = 0 if done else V[next_state]
                new_v = reward + gamma * next_v

                delta = max(delta, abs(new_v - V[state]))
                V[state] = new_v

            if delta < eval_threshold:
                break

        # ── Phase 2: Policy Improvement ────────────────────────────
        # For each state, check if a different action is better
        policy_stable = True
        for state in states:
            if env.is_terminal(state):
                continue
            old_action = policy[state]

            # Compute Q-value for every action
            q_values = []
            for action in env.actions:
                next_state, reward, done = env.step(state, action)
                next_v = 0 if done else V[next_state]
                q_values.append(reward + gamma * next_v)

            best_action = int(np.argmax(q_values))

            # Update policy if we found a better action
            if best_action != old_action:
                policy[state] = best_action
                policy_stable = False

        print(f"Iteration {iteration}: eval sweeps = {eval_sweeps}, policy stable = {policy_stable}")

        # If no state changed its action, we've found the optimal policy
        if policy_stable:
            print(f"Policy converged after {iteration} iterations!")
            break

    return V, policy


# --- Run it ------------------------------------------------------------------

env = GridWorld()
V, policy = policy_iteration(env, gamma=0.99)

# Show optimal policy
print("\\nOptimal Policy:")
arrows = ['↑', '→', '↓', '←']
for r in range(env.rows):
    row_str = ""
    for c in range(env.cols):
        cell = env.grid[r, c]
        if cell == 1:   row_str += "  W  "
        elif cell == 2: row_str += "  G  "
        elif cell == 3: row_str += "  P  "
        else:           row_str += f"  {arrows[policy[(r,c)]]}  "
    print(row_str)

# Show state values
print("\\nState Values:")
for r in range(env.rows):
    row_str = ""
    for c in range(env.cols):
        cell = env.grid[r, c]
        if cell == 1:
            row_str += "  W   "
        else:
            row_str += f"{V.get((r,c), 0):5.1f} "
    print(row_str)`,
  },
}
