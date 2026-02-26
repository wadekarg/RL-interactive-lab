import { Routes, Route } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar'
import { HomePage } from './pages/HomePage'
import { BanditPage } from './components/bandit/BanditPage'
import { GridWorldPage } from './components/gridworld/GridWorldPage'
import { ClassicCartPolePage } from './components/classicCartpole/ClassicCartPolePage'
import { RocketLandingPage } from './components/rocketLanding/RocketLandingPage'
import { BanditGuidePage } from './pages/BanditGuidePage'
import { GridWorldGuidePage } from './pages/GridWorldGuidePage'
import { ClassicCartPoleGuidePage } from './pages/ClassicCartPoleGuidePage'
import { RocketLandingGuidePage } from './pages/RocketLandingGuidePage'

function App() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="pt-14">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/bandit" element={<BanditPage />} />
          <Route path="/bandit-guide" element={<BanditGuidePage />} />
          <Route path="/gridworld" element={<GridWorldPage />} />
          <Route path="/gridworld-guide" element={<GridWorldGuidePage />} />
          <Route path="/cartpole" element={<ClassicCartPolePage />} />
          <Route path="/cartpole-guide" element={<ClassicCartPoleGuidePage />} />
          <Route path="/rocket-landing" element={<RocketLandingPage />} />
          <Route path="/rocket-landing-guide" element={<RocketLandingGuidePage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
