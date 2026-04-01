# Python Implementations

Standalone Python implementations of the RL algorithms used in the interactive lab. Each file is self-contained and runnable.

## Multi-Armed Bandit

| File | Algorithm | Description |
|------|-----------|-------------|
| `bandit_epsilon_greedy.py` | ε-Greedy | Explore randomly with probability ε, exploit otherwise |
| `bandit_ucb.py` | UCB (Upper Confidence Bound) | Mathematically principled exploration via confidence bonuses |
| `bandit_thompson_sampling.py` | Thompson Sampling | Bayesian approach using Beta distributions |

## GridWorld

| File | Algorithm | Description |
|------|-----------|-------------|
| `gridworld_q_learning.py` | Q-Learning | Off-policy TD — learns optimal policy via max Q-values |
| `gridworld_sarsa.py` | SARSA | On-policy TD — learns from actual actions taken |
| `gridworld_value_iteration.py` | Value Iteration | Dynamic programming — sweeps all states to find optimal V |
| `gridworld_policy_iteration.py` | Policy Iteration | DP — alternates policy evaluation and improvement |

## Run

```bash
pip install numpy
python bandit_epsilon_greedy.py
python gridworld_q_learning.py
```

These are the same algorithms available in the [interactive lab](https://wadekarg.github.io/RL-interactive-lab/) — the 🐍 Python tab lets you edit and run them directly in the browser.
