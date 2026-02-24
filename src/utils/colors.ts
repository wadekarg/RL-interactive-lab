/** Interpolate between two hex colors, returns "rgb(r,g,b)" */
function lerpColor(c1: string, c2: string, t: number): string {
  const [r, g, b] = lerpColorRGB(c1, c2, t)
  return `rgb(${r}, ${g}, ${b})`
}

/** Interpolate, returns [r, g, b] */
function lerpColorRGB(a: string, b: string, t: number): [number, number, number] {
  const ar = parseInt(a.slice(1, 3), 16)
  const ag = parseInt(a.slice(3, 5), 16)
  const ab = parseInt(a.slice(5, 7), 16)
  const br = parseInt(b.slice(1, 3), 16)
  const bg = parseInt(b.slice(3, 5), 16)
  const bb = parseInt(b.slice(5, 7), 16)

  return [
    Math.round(ar + (br - ar) * t),
    Math.round(ag + (bg - ag) * t),
    Math.round(ab + (bb - ab) * t),
  ]
}

/**
 * State-value heatmap on desert palette.
 * Low value → cool slate-blue, High value → warm amber.
 */
export function heatmapColor(value: number): string {
  const clamped = Math.max(0, Math.min(1, value))
  // Slate-blue → Sand-neutral → Warm amber
  const stops = ['#475569', '#78716c', '#a8a29e', '#d97706', '#f59e0b']
  const segment = clamped * (stops.length - 1)
  const idx = Math.floor(segment)
  const t = segment - idx
  if (idx >= stops.length - 1) return stops[stops.length - 1]
  return lerpColor(stops[idx], stops[idx + 1], t)
}

/**
 * Q-value triangle color on desert background.
 * Bad Q → cool indigo-blue, Neutral → sand, Good Q → bright amber/gold.
 * Designed to pop against warm sandy backgrounds.
 */
export function qValueTriangleColor(q: number, minQ: number, maxQ: number): string {
  const range = maxQ - minQ
  if (range === 0) return 'rgba(168, 162, 158, 0.12)' // faded sand

  const norm = (q - minQ) / range // 0..1

  // Indigo-blue (bad) → sand (neutral) → amber-gold (good)
  let r: number, g: number, b: number
  if (norm < 0.5) {
    [r, g, b] = lerpColorRGB('#3730a3', '#a8a29e', norm * 2)
  } else {
    [r, g, b] = lerpColorRGB('#a8a29e', '#f59e0b', (norm - 0.5) * 2)
  }

  // Opacity: stronger for extreme values, faded for neutral
  const distFromCenter = Math.abs(norm - 0.5) * 2 // 0..1
  const alpha = 0.12 + distFromCenter * 0.58 // 0.12..0.70

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Visit count heatmap. Higher visits → warmer/brighter.
 * Returns rgba string.
 */
export function visitHeatColor(count: number, maxCount: number): string {
  if (maxCount === 0) return 'rgba(0,0,0,0)'
  const norm = Math.min(1, count / maxCount)
  const [r, g, b] = lerpColorRGB('#2d2418', '#e87b35', norm)
  const alpha = 0.1 + norm * 0.55
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Arm colors for bandit visualization */
export const ARM_COLORS = [
  '#6366f1', '#f43f5e', '#22c55e', '#eab308', '#3b82f6',
  '#a855f7', '#f97316', '#14b8a6', '#ec4899', '#84cc16',
]
