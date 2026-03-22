import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useThemeStore } from '../../store/themeStore'
import type { Theme } from '../../store/themeStore'

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/learn', label: 'Learn RL' },
  { path: '/bandit', label: 'Multi-Armed Bandit' },
  { path: '/gridworld', label: 'GridWorld' },
  { path: '/cartpole', label: 'CartPole' },
  { path: '/rocket-landing', label: 'Rocket Landing' },
]

const THEME_META: Record<Theme, { icon: string; label: string }> = {
  dark:  { icon: '\uD83C\uDF19', label: 'Dark' },
  light: { icon: '\u2600\uFE0F', label: 'Light' },
  warm:  { icon: '\uD83C\uDF3B', label: 'Warm' },
}

export function Navbar() {
  const location = useLocation()
  const { theme, cycleTheme } = useThemeStore()
  const meta = THEME_META[theme]
  const [menuOpen, setMenuOpen] = useState(false)

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface-light/90 backdrop-blur-md border-b border-surface-lighter">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 text-base font-bold text-primary-light no-underline flex-shrink-0">
            <span className="text-xl">🧠</span>
            <span className="hidden sm:inline">RL Interactive Lab</span>
            <span className="sm:hidden">RL Lab</span>
          </Link>

          {/* Desktop nav links — hidden on mobile/tablet, visible from lg up */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map(({ path, label }) => {
              const isActive = path === '/learn'
                ? location.pathname.startsWith('/learn')
                : location.pathname === path
              return (
                <Link
                  key={path}
                  to={path}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium no-underline transition-colors ${
                    isActive
                      ? 'bg-primary/20 text-primary-light'
                      : 'text-text-muted hover:text-text hover:bg-surface-lighter/50'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={cycleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium
                         bg-surface-lighter/50 text-text-muted hover:text-text hover:bg-surface-lighter
                         border-0 cursor-pointer transition-colors"
              title={`Theme: ${meta.label}. Click to switch.`}
            >
              <span className="text-base">{meta.icon}</span>
              <span className="hidden sm:inline text-xs">{meta.label}</span>
            </button>

            {/* Hamburger — visible on mobile and tablet, hidden from lg up */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden flex flex-col justify-center items-center w-9 h-9 rounded-lg
                         bg-surface-lighter/50 hover:bg-surface-lighter border-0 cursor-pointer transition-colors gap-1.5"
              aria-label="Toggle menu"
            >
              <span className={`block w-5 h-0.5 bg-text-muted transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-5 h-0.5 bg-text-muted transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-0.5 bg-text-muted transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/tablet dropdown menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-surface-lighter bg-surface-light/95 backdrop-blur-md">
          <div className="px-4 py-3 flex flex-col gap-1">
            {navItems.map(({ path, label }) => {
              const isActive = path === '/learn'
                ? location.pathname.startsWith('/learn')
                : location.pathname === path
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium no-underline transition-colors ${
                    isActive
                      ? 'bg-primary/20 text-primary-light'
                      : 'text-text-muted hover:text-text hover:bg-surface-lighter/50'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}
