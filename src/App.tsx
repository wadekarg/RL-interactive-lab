import { Routes, Route } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar'
import { HomePage } from './pages/HomePage'
import { BanditPage } from './components/bandit/BanditPage'
import { GridWorldPage } from './components/gridworld/GridWorldPage'
import { BanditGuidePage } from './pages/BanditGuidePage'
import { GridWorldGuidePage } from './pages/GridWorldGuidePage'
import { LearnPage } from './pages/LearnPage'
import { WhatIsRLPage } from './pages/learn/WhatIsRLPage'
import { StatesAndActionsPage } from './pages/learn/StatesAndActionsPage'
import { RewardsAndReturnsPage } from './pages/learn/RewardsAndReturnsPage'
import { PoliciesPage } from './pages/learn/PoliciesPage'
import { MDPPage } from './pages/learn/MDPPage'
import { ValueFunctionsPage } from './pages/learn/ValueFunctionsPage'
import { BellmanEquationsPage } from './pages/learn/BellmanEquationsPage'
import { ExplorationExploitationPage } from './pages/learn/ExplorationExploitationPage'
import { TDLearningPage } from './pages/learn/TDLearningPage'
import { PolicyGradientsPage } from './pages/learn/PolicyGradientsPage'

function App() {
  return (
    <div className="min-h-screen bg-surface overflow-x-hidden">
      <Navbar />
      <main className="pt-14 overflow-x-hidden">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/learn/what-is-rl" element={<WhatIsRLPage />} />
          <Route path="/learn/states-and-actions" element={<StatesAndActionsPage />} />
          <Route path="/learn/rewards-and-returns" element={<RewardsAndReturnsPage />} />
          <Route path="/learn/policies" element={<PoliciesPage />} />
          <Route path="/learn/markov-decision-process" element={<MDPPage />} />
          <Route path="/learn/value-functions" element={<ValueFunctionsPage />} />
          <Route path="/learn/bellman-equations" element={<BellmanEquationsPage />} />
          <Route path="/learn/exploration-exploitation" element={<ExplorationExploitationPage />} />
          <Route path="/learn/td-learning" element={<TDLearningPage />} />
          <Route path="/learn/policy-gradients" element={<PolicyGradientsPage />} />
          <Route path="/bandit" element={<BanditPage />} />
          <Route path="/bandit-guide" element={<BanditGuidePage />} />
          <Route path="/gridworld" element={<GridWorldPage />} />
          <Route path="/gridworld-guide" element={<GridWorldGuidePage />} />

        </Routes>
      </main>
    </div>
  )
}

export default App
