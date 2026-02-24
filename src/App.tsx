import { Routes, Route } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar'
import { HomePage } from './pages/HomePage'
import { BanditPage } from './components/bandit/BanditPage'
import { GridWorldPage } from './components/gridworld/GridWorldPage'
import { BanditGuidePage } from './pages/BanditGuidePage'
import { GridWorldGuidePage } from './pages/GridWorldGuidePage'

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
        </Routes>
      </main>
    </div>
  )
}

export default App
