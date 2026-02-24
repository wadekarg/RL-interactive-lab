import { create } from 'zustand'

export type Theme = 'dark' | 'light' | 'warm'

const THEME_KEY = 'rl-lab-theme'

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'dark' || stored === 'light' || stored === 'warm') return stored
  } catch { /* SSR / storage unavailable */ }
  return 'dark'
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  try { localStorage.setItem(THEME_KEY, theme) } catch { /* ignore */ }
}

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  cycleTheme: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const initial = getInitialTheme()
  applyTheme(initial)

  return {
    theme: initial,
    setTheme: (theme) => {
      applyTheme(theme)
      set({ theme })
    },
    cycleTheme: () => {
      const order: Theme[] = ['dark', 'light', 'warm']
      const current = get().theme
      const next = order[(order.indexOf(current) + 1) % order.length]
      applyTheme(next)
      set({ theme: next })
    },
  }
})
