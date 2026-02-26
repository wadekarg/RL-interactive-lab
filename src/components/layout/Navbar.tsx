import { Link, useLocation } from 'react-router-dom'
import { useThemeStore } from '../../store/themeStore'
import type { Theme } from '../../store/themeStore'

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/learn', label: 'Learn RL' },
  { path: '/bandit', label: 'Multi-Armed Bandit' },
  { path: '/gridworld', label: 'GridWorld' },
  { path: '/cartpole', label: 'Cart-Pole' },
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface-light/80 backdrop-blur-md border-b border-surface-lighter">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-primary-light no-underline">
            <span className="text-xl">{'\uD83E\uDDE0'}</span>
            <span>RL Interactive Lab</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex gap-1">
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

            {/* Theme Toggle */}
            <button
              onClick={cycleTheme}
              className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                         bg-surface-lighter/50 text-text-muted hover:text-text hover:bg-surface-lighter
                         border-0 cursor-pointer transition-colors"
              title={`Theme: ${meta.label}. Click to switch.`}
            >
              <span className="text-base">{meta.icon}</span>
              <span className="hidden sm:inline text-xs">{meta.label}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
