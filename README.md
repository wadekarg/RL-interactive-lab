<div align="center">

# RL Interactive Lab

**An interactive playground to learn reinforcement learning — from first principles to policy gradients.**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.3-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](#license)

[Live Demo](https://wadekarg.github.io/RL-interactive-lab/) · [Report Bug](https://github.com/wadekarg/RL-interactive-lab/issues) · [Request Feature](https://github.com/wadekarg/RL-interactive-lab/issues)

</div>

---

Watch RL algorithms learn in real time. Adjust hyperparameters, step through episodes, and build intuition for how agents explore, exploit, and improve. No backend. No accounts. Just open and learn.

<br>

## What's Inside

<table>
<tr>
<td width="50%">

### 🎰 Multi-Armed Bandit
The exploration vs exploitation dilemma. Choose between slot machines with unknown payoffs.

**Algorithms:** ε-Greedy · UCB · Thompson Sampling

</td>
<td width="50%">

### 🐘 Boru's GridWorld
Help Boru the elephant navigate to water while avoiding lions and cliffs. Design your own worlds.

**Algorithms:** Value Iteration · Policy Iteration · Q-Learning · SARSA

</td>
</tr>
<tr>
<td width="50%">

### 🏋️ Classic CartPole
The classic RL benchmark. Push a cart left or right to keep a pole balanced for 500 steps.

**Algorithms:** Random Baseline · Discretized Q-Learning · REINFORCE

</td>
<td width="50%">

### 🚀 Rocket Landing
Land a rocket softly under gravity with 3 thrusters. 6D continuous state space — the bridge to deep RL.

**Algorithms:** Random Baseline · Discretized Q-Learning · REINFORCE

</td>
</tr>
</table>

**4 environments · 13 algorithms · 10-chapter course · 3 themes · Zero dependencies on external RL libraries**

<br>

## Learn RL — Interactive Course

A complete 10-chapter course built right into the app. Learn the theory, then see it in action in the labs.

| # | Chapter | Key Concepts |
|:--|:--------|:-------------|
| 1 | What is Reinforcement Learning? | Agent-environment loop, reward signal, RL vs supervised learning |
| 2 | States and Actions | State/action spaces, discrete vs continuous, trajectories |
| 3 | Rewards and Returns | Reward hypothesis, cumulative return G_t, discount factor γ |
| 4 | Policies | π(a\|s), deterministic vs stochastic, optimal policy π* |
| 5 | Markov Decision Processes | MDP framework, transition dynamics, Markov property |
| 6 | Value Functions | V(s), Q(s,a), value estimation, action-value intuition |
| 7 | Bellman Equations | Expectation equations, optimality equations, recursive structure |
| 8 | Exploration vs Exploitation | ε-greedy, UCB, Thompson Sampling, regret → *Bandit lab* |
| 9 | Temporal Difference Learning | TD(0), Q-Learning, SARSA, bootstrapping → *GridWorld lab* |
| 10 | Policy Gradients | REINFORCE, baselines, softmax policy → *CartPole & Rocket labs* |

Every chapter includes interactive widgets, KaTeX-rendered equations, and direct links to the hands-on labs.

<br>

## Quick Start

```bash
# Clone the repository
git clone https://github.com/wadekarg/RL-interactive-lab.git
cd RL-interactive-lab

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and start experimenting.

<br>

## Tech Stack

| Layer | Technology | Why |
|:------|:-----------|:----|
| **UI** | React 18 + TypeScript | Type-safe components, fast iteration |
| **Styling** | Tailwind CSS | Utility-first, 3 built-in themes (dark/light/warm) |
| **State** | Zustand | Lightweight store for simulation + theme state |
| **Charts** | Recharts | Episode duration & reward visualizations |
| **Math** | KaTeX | Beautiful equation rendering throughout the course |
| **Routing** | React Router v6 | Client-side navigation (HashRouter for GitHub Pages) |
| **Build** | Vite | Sub-second HMR, fast production builds |
| **Deploy** | GitHub Pages | Automatic via GitHub Actions on push to `main` |

All RL algorithms are implemented from scratch in TypeScript — no external RL libraries. Every environment runs entirely in the browser.

<br>

## Project Structure

```
src/
├── algorithms/          # 13 RL algorithm implementations
│   ├── bandit/          #   ε-Greedy, UCB, Thompson Sampling
│   ├── gridworld/       #   Value Iteration, Policy Iteration, Q-Learning, SARSA
│   ├── classicCartpole/ #   Random, Discretized Q-Learning, REINFORCE
│   └── rocketLanding/   #   Random, Discretized Q-Learning, REINFORCE
├── environments/        # 4 environment simulators (pure TypeScript, no UI)
├── components/          # React components per environment + shared UI
├── pages/               # Route pages + 10-chapter Learn course
│   └── learn/           #   Interactive educational content
├── content/             # Algorithm explanations & environment stories
├── hooks/               # useSimulation, useAnimationFrame, useThemeColors
├── store/               # Zustand stores (simulation state, theme)
└── utils/               # Math helpers, step breakdowns, color utilities
```

<br>

## How It Works

Each environment follows the same architecture:

```
Environment.reset() → initial state
     ↓
Agent.act(state) → action
     ↓
Environment.step(state, action) → { nextState, reward, done }
     ↓
Agent.learn(state, action, reward, nextState, done)
     ↓
repeat until done → new episode
```

The UI records every step as a `SimulationStep` and renders:
- **Live visualization** — canvas-based environment rendering
- **Step breakdown** — what the algorithm computed and why
- **Episode charts** — duration and reward trends over time
- **Algorithm explainer** — educational context for the selected algorithm

<br>

## Features

- **Real-time simulation** — Play, pause, step-by-step, speed control
- **Hyperparameter tuning** — Adjust α, γ, ε, bins, learning rate with instant feedback
- **Step-by-step breakdowns** — See Q-value updates, TD errors, policy gradients as they happen
- **Episode tracking** — Duration charts with soft landing / success markers
- **3 themes** — Dark (default), Light, and Warm — persisted in localStorage
- **KaTeX equations** — Bellman equations, policy gradient theorem, and more rendered beautifully
- **Fully client-side** — No backend, no accounts, no data collection
- **Mobile responsive** — Works on desktop and tablet

<br>

## Algorithms at a Glance

### Bandit Algorithms
| Algorithm | Type | Update Rule |
|:----------|:-----|:------------|
| ε-Greedy | Exploration | Random with prob ε, best arm otherwise |
| UCB | Optimistic | Q(a) + c√(ln(t)/N(a)) |
| Thompson Sampling | Bayesian | Sample from Beta(α, β) posteriors |

### GridWorld Algorithms
| Algorithm | Type | Update Rule |
|:----------|:-----|:------------|
| Value Iteration | DP (Planning) | Full Bellman sweeps over all states |
| Policy Iteration | DP (Planning) | Alternating evaluation + improvement |
| Q-Learning | TD (Off-policy) | Q(s,a) += α[r + γ·max Q(s',a') - Q(s,a)] |
| SARSA | TD (On-policy) | Q(s,a) += α[r + γ·Q(s',a') - Q(s,a)] |

### CartPole & Rocket Algorithms
| Algorithm | Type | Approach |
|:----------|:-----|:---------|
| Random Baseline | None | Uniform random actions (baseline to beat) |
| Discretized Q-Learning | Value-based | Bin continuous state → Q-table |
| REINFORCE | Policy gradient | Linear softmax policy, Monte Carlo updates |

<br>

## Deployment

The project deploys automatically to GitHub Pages via GitHub Actions.

```bash
# Build for production
npm run build

# Preview the production build locally
npm run preview
```

The Vite config handles the base path automatically:
- **Dev:** `/` (localhost)
- **Production:** `/RL-interactive-lab/` (GitHub Pages)

<br>

## Acknowledgments

This project was built for learning and draws inspiration from:

- **[Reinforcement Learning: An Introduction](http://incompleteideas.net/book/the-book-2nd.html)** by Richard S. Sutton and Andrew G. Barto — the foundational textbook that shaped the curriculum
- **Coursework at UT Arlington** — lectures and notes from Dr. Manfred Huber's reinforcement learning course
- **The RL community on YouTube** — countless explanations, visualizations, and intuition-building videos
- **[OpenAI Gym](https://github.com/openai/gym)** — CartPole-v1 physics equations used as reference for the CartPole and Rocket environments

<br>

## Contributing

Found a bug, inaccuracy, or have a suggestion? Contributions are welcome!

1. [Open an issue](https://github.com/wadekarg/RL-interactive-lab/issues) describing the problem or idea
2. Fork the repo and create a feature branch
3. Submit a pull request

<br>

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**Vibe coded by [Gajanan Wadekar](https://www.linkedin.com/in/gajananwadekar/)**

[LinkedIn](https://www.linkedin.com/in/gajananwadekar/) · [GitHub](https://github.com/wadekarg)

Built for education. Runs entirely in your browser.

</div>
