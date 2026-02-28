<div align="center">

# RL Interactive Lab

**An interactive playground to learn reinforcement learning — from first principles to policy gradients.**

<br>

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

<br>

## [🚀 Launch the Lab](https://wadekarg.github.io/RL-interactive-lab/)

`wadekarg.github.io/RL-interactive-lab`

<br>

![Environments](https://img.shields.io/badge/Environments-4-blue?style=flat-square)
![Algorithms](https://img.shields.io/badge/Algorithms-13-brightgreen?style=flat-square)
![Chapters](https://img.shields.io/badge/Course_Chapters-10-orange?style=flat-square)
![Themes](https://img.shields.io/badge/Themes-3-purple?style=flat-square)
![Backend](https://img.shields.io/badge/Backend-None-red?style=flat-square)

[Report Bug](https://github.com/wadekarg/RL-interactive-lab/issues) · [Request Feature](https://github.com/wadekarg/RL-interactive-lab/issues)

</div>

---

Watch RL algorithms learn in real time. Adjust hyperparameters, step through episodes, and build intuition for how agents explore, exploit, and improve. No backend. No accounts. Just open the link above and start learning.

<br>

## What's Inside

<table>
<tr>
<td width="50%">

### 🎰 Multi-Armed Bandit
The exploration vs exploitation dilemma. Choose between slot machines with unknown payoffs.

![epsilon-greedy](https://img.shields.io/badge/ε--Greedy-4361ee?style=flat-square)
![UCB](https://img.shields.io/badge/UCB-7209b7?style=flat-square)
![Thompson](https://img.shields.io/badge/Thompson_Sampling-f72585?style=flat-square)

</td>
<td width="50%">

### 🐘 Boru's GridWorld
Help Boru the elephant navigate to water while avoiding lions and cliffs. Design your own worlds.

![VI](https://img.shields.io/badge/Value_Iteration-06d6a0?style=flat-square)
![PI](https://img.shields.io/badge/Policy_Iteration-118ab2?style=flat-square)
![QL](https://img.shields.io/badge/Q--Learning-ef476f?style=flat-square)
![SARSA](https://img.shields.io/badge/SARSA-ffd166?style=flat-square)

</td>
</tr>
<tr>
<td width="50%">

### 🏋️ Classic CartPole
The classic RL benchmark. Push a cart left or right to keep a pole balanced for 500 steps.

![Random](https://img.shields.io/badge/Random_Baseline-adb5bd?style=flat-square)
![DQL](https://img.shields.io/badge/Discretized_Q--Learning-e85d04?style=flat-square)
![REINFORCE](https://img.shields.io/badge/REINFORCE-9d4edd?style=flat-square)

</td>
<td width="50%">

### 🚀 Rocket Landing
Land a rocket softly under gravity with 3 thrusters. 6D continuous state space — the bridge to deep RL.

![Random](https://img.shields.io/badge/Random_Baseline-adb5bd?style=flat-square)
![DQL](https://img.shields.io/badge/Discretized_Q--Learning-e85d04?style=flat-square)
![REINFORCE](https://img.shields.io/badge/REINFORCE-9d4edd?style=flat-square)

</td>
</tr>
</table>

<br>

## Learn RL — Interactive Course

> [!TIP]
> New to RL? The app includes a complete **10-chapter interactive course** built right in. Learn the theory, then see it in action in the labs. Start from Chapter 1 — no prerequisites needed.

| # | Chapter | Key Concepts | Lab |
|:--|:--------|:-------------|:----|
| 1 | What is Reinforcement Learning? | Agent-environment loop, reward signal, RL vs supervised learning | — |
| 2 | States and Actions | State/action spaces, discrete vs continuous, trajectories | — |
| 3 | Rewards and Returns | Reward hypothesis, cumulative return G_t, discount factor γ | — |
| 4 | Policies | π(a\|s), deterministic vs stochastic, optimal policy π* | — |
| 5 | Markov Decision Processes | MDP framework, transition dynamics, Markov property | — |
| 6 | Value Functions | V(s), Q(s,a), value estimation, action-value intuition | — |
| 7 | Bellman Equations | Expectation equations, optimality equations, recursive structure | — |
| 8 | Exploration vs Exploitation | ε-greedy, UCB, Thompson Sampling, regret | 🎰 Bandit |
| 9 | Temporal Difference Learning | TD(0), Q-Learning, SARSA, bootstrapping | 🐘 GridWorld |
| 10 | Policy Gradients | REINFORCE, baselines, softmax policy | 🚀 CartPole & Rocket |

Every chapter includes interactive widgets, KaTeX-rendered equations, and direct links to the hands-on labs.

<br>

## Features

> [!NOTE]
> Everything runs client-side. No backend, no accounts, no data collection. Open the link and start learning.

- 🎮 **Real-time simulation** — Play, pause, step-by-step, adjustable speed
- 🎛️ **Hyperparameter tuning** — Adjust α, γ, ε, bins, learning rate and see instant effects
- 🔍 **Step-by-step breakdowns** — See Q-value updates, TD errors, policy gradients as they happen
- 📊 **Episode tracking** — Duration and reward charts with success markers
- 🎨 **3 themes** — Dark (default), Light, and Warm — persisted in localStorage
- 📐 **KaTeX equations** — Bellman equations, policy gradient theorem, and more rendered beautifully
- 📱 **Responsive** — Works on desktop and tablet

<br>

## Tech Stack

| Layer | Technology | Why |
|:------|:-----------|:----|
| **UI** | ![React](https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black) | Type-safe components, fast iteration |
| **Language** | ![TypeScript](https://img.shields.io/badge/TypeScript_5.5-3178C6?style=flat-square&logo=typescript&logoColor=white) | Full type safety across algorithms and environments |
| **Styling** | ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white) | Utility-first, 3 built-in themes (dark/light/warm) |
| **State** | ![Zustand](https://img.shields.io/badge/Zustand-433e38?style=flat-square) | Lightweight store for simulation + theme state |
| **Charts** | ![Recharts](https://img.shields.io/badge/Recharts-22b5bf?style=flat-square) | Episode duration & reward visualizations |
| **Math** | ![KaTeX](https://img.shields.io/badge/KaTeX-239120?style=flat-square) | Beautiful equation rendering throughout the course |
| **Routing** | ![React Router](https://img.shields.io/badge/React_Router_v6-CA4245?style=flat-square&logo=reactrouter&logoColor=white) | Client-side navigation (HashRouter for GitHub Pages) |
| **Build** | ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) | Sub-second HMR, fast production builds |
| **Deploy** | ![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-222222?style=flat-square&logo=githubpages&logoColor=white) | Automatic via GitHub Actions on push to `main` |

> [!IMPORTANT]
> All 13 RL algorithms are implemented **from scratch** in TypeScript — no external RL libraries. Every environment runs entirely in the browser.

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

## Algorithms at a Glance

### Bandit Algorithms
| Algorithm | Type | Update Rule |
|:----------|:-----|:------------|
| ε-Greedy | ![Exploration](https://img.shields.io/badge/Exploration-4361ee?style=flat-square) | Random with prob ε, best arm otherwise |
| UCB | ![Optimistic](https://img.shields.io/badge/Optimistic-7209b7?style=flat-square) | Q(a) + c√(ln(t)/N(a)) |
| Thompson Sampling | ![Bayesian](https://img.shields.io/badge/Bayesian-f72585?style=flat-square) | Sample from Beta(α, β) posteriors |

### GridWorld Algorithms
| Algorithm | Type | Update Rule |
|:----------|:-----|:------------|
| Value Iteration | ![DP](https://img.shields.io/badge/DP_(Planning)-06d6a0?style=flat-square) | Full Bellman sweeps over all states |
| Policy Iteration | ![DP](https://img.shields.io/badge/DP_(Planning)-06d6a0?style=flat-square) | Alternating evaluation + improvement |
| Q-Learning | ![TD](https://img.shields.io/badge/TD_(Off--policy)-ef476f?style=flat-square) | Q(s,a) += α[r + γ·max Q(s',a') - Q(s,a)] |
| SARSA | ![TD](https://img.shields.io/badge/TD_(On--policy)-ffd166?style=flat-square) | Q(s,a) += α[r + γ·Q(s',a') - Q(s,a)] |

### CartPole & Rocket Algorithms
| Algorithm | Type | Approach |
|:----------|:-----|:---------|
| Random Baseline | ![None](https://img.shields.io/badge/Baseline-adb5bd?style=flat-square) | Uniform random actions (baseline to beat) |
| Discretized Q-Learning | ![Value](https://img.shields.io/badge/Value--based-e85d04?style=flat-square) | Bin continuous state → Q-table |
| REINFORCE | ![Policy](https://img.shields.io/badge/Policy_Gradient-9d4edd?style=flat-square) | Linear softmax policy, Monte Carlo updates |

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

- 📖 **[Reinforcement Learning: An Introduction](http://incompleteideas.net/book/the-book-2nd.html)** by Richard S. Sutton and Andrew G. Barto — the foundational textbook that shaped the curriculum
- 🎓 **Coursework at UT Arlington** — lectures and notes from Dr. Manfred Huber's reinforcement learning course
- 🎥 **The RL community on YouTube** — countless explanations, visualizations, and intuition-building videos
- 🏋️ **[OpenAI Gym](https://github.com/openai/gym)** — CartPole-v1 physics equations used as reference for the CartPole and Rocket environments

<br>

## Contributing

> [!CAUTION]
> Found an error in the educational content or algorithms? Please [open an issue](https://github.com/wadekarg/RL-interactive-lab/issues) — accuracy matters for a learning tool.

The easiest way to help is to [open an issue](https://github.com/wadekarg/RL-interactive-lab/issues) — no code required.

If you'd like to contribute code:

```bash
git clone https://github.com/wadekarg/RL-interactive-lab.git
cd RL-interactive-lab
npm install
npm run dev          # → http://localhost:5173
```

Then create a feature branch and submit a pull request.

<br>

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

Vibe coded by **Gajanan Wadekar** &nbsp; [![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/gajananwadekar/)

Built for education. Runs entirely in your browser.

</div>
