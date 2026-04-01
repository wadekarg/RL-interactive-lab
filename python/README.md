# Python Implementations

Standalone Python implementations of the RL algorithms used in the interactive lab. Each file is self-contained and runnable.

## Multi-Armed Bandit

| File | Algorithm | Description |
|------|-----------|-------------|
| `bandit_epsilon_greedy.py` | ε-Greedy | Explore randomly with probability ε, exploit otherwise |
| `bandit_ucb.py` | UCB (Upper Confidence Bound) | Mathematically principled exploration via confidence bonuses |
| `bandit_thompson_sampling.py` | Thompson Sampling | Bayesian approach using Beta distributions |

## Run

```bash
pip install numpy
python bandit_epsilon_greedy.py
```

These are the same algorithms available in the [interactive lab](https://wadekarg.github.io/RL-interactive-lab/#/bandit) — the 🐍 Python tab lets you edit and run them directly in the browser.
