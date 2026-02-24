import { useMemo } from 'react'
import { useThemeStore } from '../store/themeStore'

/** Returns resolved CSS-variable colors for use in canvas/Recharts (which need actual color strings) */
export function useThemeColors() {
  const theme = useThemeStore((s) => s.theme)

  return useMemo(() => {
    const style = getComputedStyle(document.documentElement)
    const rgb = (name: string) => {
      const raw = style.getPropertyValue(name).trim()
      return `rgb(${raw})`
    }
    const rawRgb = (name: string) => style.getPropertyValue(name).trim()

    return {
      primary: rgb('--color-primary'),
      primaryLight: rgb('--color-primary-light'),
      text: rgb('--color-text'),
      textMuted: rgb('--color-text-muted'),
      surface: rgb('--color-surface'),
      surfaceLight: rgb('--color-surface-light'),
      surfaceLighter: rgb('--color-surface-lighter'),
      chartGrid: rgb('--color-chart-grid'),
      chartAxis: rgb('--color-chart-axis'),
      tooltipBg: rgb('--color-tooltip-bg'),
      tooltipBorder: rgb('--color-tooltip-border'),
      // Raw RGB values for alpha compositing
      rawPrimary: rawRgb('--color-primary'),
      rawText: rawRgb('--color-text'),
    }
  }, [theme])
}
