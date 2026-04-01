import numpy as np

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
    print(row_str)