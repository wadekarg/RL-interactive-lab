import numpy as np

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
    print(row_str)