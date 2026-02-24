import { useRef, useEffect, useCallback } from 'react'
import { CellType } from '../../environments/gridworld'
import type { GridState, GridAction } from '../../environments/gridworld'
import { heatmapColor, qValueTriangleColor, visitHeatColor } from '../../utils/colors'
import { argmax } from '../../utils/math'
import { useThemeStore } from '../../store/themeStore'
import type { Theme } from '../../store/themeStore'

interface GridCanvasProps {
  rows: number
  cols: number
  grid: CellType[][]
  agentPos: GridState | null
  qValues: Record<string, number[]>
  showHeatmap: boolean
  showArrows: boolean
  showQValues: boolean
  showVisits: boolean
  visitCounts: Record<string, number>
  trail: GridState[]
  onCellClick?: (row: number, col: number) => void
  editable?: boolean
}

const MAX_CELL = 90
const MIN_CELL = 50

// Arrow drawing config per direction: [dx, dy] unit vector
const ARROW_DIR: Record<GridAction, [number, number]> = {
  0: [0, -1],  // Up
  1: [1, 0],   // Right
  2: [0, 1],   // Down
  3: [-1, 0],  // Left
}

const EMOJI = {
  elephant: '\uD83D\uDC18',
  water: '\uD83C\uDFDE\uFE0F',
  lion: '\uD83E\uDD81',
  cliff: '\u26F0\uFE0F',
}

// ── Desert palettes per theme ──
type Palette = {
  sand: string; sandLight: string; cliff: string; lionDen: string
  water: string; home: string; gridLine: string; coordText: string
  homeLabel: string; visitBadge: string; visitBadgeBg: string
  qLabelDefault: string
}

const PALETTES: Record<Theme, Palette> = {
  dark: {
    sand:      '#6b5e4f',
    sandLight: '#7a6d5c',
    cliff:     '#4a3d2e',
    lionDen:   '#6b3a3a',
    water:     '#3a5a6e',
    home:      '#4a4e64',
    gridLine:  '#8a7d6c',
    coordText: 'rgba(200, 190, 175, 0.35)',
    homeLabel: '#b0a48e',
    visitBadge: '#e8d5b5',
    visitBadgeBg: 'rgba(0,0,0,0.5)',
    qLabelDefault: '#e0d4c0',
  },
  light: {
    sand:      '#e8dcc8',
    sandLight: '#f0e6d4',
    cliff:     '#9e9080',
    lionDen:   '#f0c8c0',
    water:     '#b8d8e8',
    home:      '#c8cde0',
    gridLine:  '#c4b8a4',
    coordText: 'rgba(80, 70, 55, 0.3)',
    homeLabel: '#6b5d50',
    visitBadge: '#3d2e1f',
    visitBadgeBg: 'rgba(255,255,255,0.75)',
    qLabelDefault: '#4a3f32',
  },
  warm: {
    sand:      '#e4d5be',
    sandLight: '#ecdcc6',
    cliff:     '#a89680',
    lionDen:   '#e8c0b0',
    water:     '#a8ccd8',
    home:      '#c4c8d8',
    gridLine:  '#c0b098',
    coordText: 'rgba(90, 75, 55, 0.3)',
    homeLabel: '#7a6850',
    visitBadge: '#3d2e1f',
    visitBadgeBg: 'rgba(255,255,255,0.7)',
    qLabelDefault: '#4a3f32',
  },
}

function getPalette(theme: Theme): Palette {
  return PALETTES[theme]
}

// ── Q-value triangle renderer ──
function drawQTriangles(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, cellSize: number,
  q: number[], minQ: number, maxQ: number,
  isLightBg: boolean,
) {
  const cx = x + cellSize / 2
  const cy = y + cellSize / 2
  const corners = [
    { x, y },                             // TL
    { x: x + cellSize, y },               // TR
    { x: x + cellSize, y: y + cellSize }, // BR
    { x, y: y + cellSize },               // BL
  ]
  // Triangles: Up(TL,TR,C) Right(TR,BR,C) Down(BR,BL,C) Left(BL,TL,C)
  const tris = [
    [corners[0], corners[1], { x: cx, y: cy }],
    [corners[1], corners[2], { x: cx, y: cy }],
    [corners[2], corners[3], { x: cx, y: cy }],
    [corners[3], corners[0], { x: cx, y: cy }],
  ]

  for (let i = 0; i < 4; i++) {
    const [p1, p2, p3] = tris[i]
    ctx.beginPath()
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.lineTo(p3.x, p3.y)
    ctx.closePath()
    ctx.fillStyle = qValueTriangleColor(q[i], minQ, maxQ)
    ctx.fill()
  }

  // Divider lines from center to edge midpoints
  ctx.strokeStyle = isLightBg ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'
  ctx.lineWidth = 0.5
  for (let i = 0; i < 4; i++) {
    const next = (i + 1) % 4
    const mx = (corners[i].x + corners[next].x) / 2
    const my = (corners[i].y + corners[next].y) / 2
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(mx, my)
    ctx.stroke()
  }
}

// ── Q-value text label with contrast pill ──
function drawQLabel(
  ctx: CanvasRenderingContext2D,
  text: string, tx: number, ty: number, isBest: boolean,
  scale: number, pal: Palette,
) {
  const fontSize = Math.max(8, Math.round(10 * scale))
  ctx.font = `${isBest ? 'bold ' : ''}${fontSize}px monospace`
  const metrics = ctx.measureText(text)
  const pw = metrics.width + 5
  const ph = fontSize + 3

  ctx.fillStyle = isBest ? 'rgba(217, 119, 6, 0.85)' : pal.visitBadgeBg
  ctx.beginPath()
  ctx.roundRect(tx - pw / 2, ty - ph / 2, pw, ph, 3)
  ctx.fill()

  ctx.fillStyle = isBest ? '#ffffff' : pal.qLabelDefault
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, tx, ty)
}

// ── Directional arrow from cell center ──
function drawArrow(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  action: GridAction,
  strength: number, // 0..1 — controls size + opacity
  isBest: boolean,
  scale: number,
  isLightBg: boolean,
) {
  const [dx, dy] = ARROW_DIR[action]
  const len = (8 + strength * 18) * scale
  const tipX = cx + dx * len
  const tipY = cy + dy * len
  const headSize = (3 + strength * 5) * scale

  const alpha = isBest ? 0.95 : 0.15 + strength * 0.45
  ctx.strokeStyle = isBest
    ? `rgba(217, 119, 6, ${alpha})`  // amber for best
    : isLightBg
      ? `rgba(80, 65, 45, ${alpha})`   // dark brown for light bg
      : `rgba(180, 170, 155, ${alpha})` // sand-gray for dark bg
  ctx.lineWidth = isBest ? 2.5 : 1 + strength * 1.2
  ctx.lineCap = 'round'

  // Shaft
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(tipX, tipY)
  ctx.stroke()

  // Arrowhead
  const angle = Math.atan2(dy, dx)
  ctx.fillStyle = ctx.strokeStyle
  ctx.beginPath()
  ctx.moveTo(tipX, tipY)
  ctx.lineTo(
    tipX - headSize * Math.cos(angle - 0.5),
    tipY - headSize * Math.sin(angle - 0.5),
  )
  ctx.lineTo(
    tipX - headSize * Math.cos(angle + 0.5),
    tipY - headSize * Math.sin(angle + 0.5),
  )
  ctx.closePath()
  ctx.fill()
}

// ══════════════════════════════════════
// ── MAIN COMPONENT ──
// ══════════════════════════════════════
export function GridCanvas({
  rows, cols, grid, agentPos, qValues,
  showHeatmap, showArrows, showQValues, showVisits,
  visitCounts, trail,
  onCellClick, editable,
}: GridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const theme = useThemeStore((s) => s.theme)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const PAL = getPalette(theme)

    // Compute cell size to fit container
    const containerWidth = container.clientWidth - 32 // account for padding
    const CELL = Math.max(MIN_CELL, Math.min(MAX_CELL, Math.floor(containerWidth / cols)))
    const scale = CELL / MAX_CELL

    const width = cols * CELL
    const height = rows * CELL
    canvas.width = width
    canvas.height = height
    ctx.clearRect(0, 0, width, height)

    // ── Compute global ranges ──
    let globalMinQ = Infinity, globalMaxQ = -Infinity
    for (const vals of Object.values(qValues)) {
      for (const v of vals) {
        if (v < globalMinQ) globalMinQ = v
        if (v > globalMaxQ) globalMaxQ = v
      }
    }
    if (globalMinQ === globalMaxQ) { globalMinQ = -1; globalMaxQ = 1 }

    let stateMinV = Infinity, stateMaxV = -Infinity
    if (showHeatmap) {
      for (const vals of Object.values(qValues)) {
        const sv = Math.max(...vals)
        if (sv < stateMinV) stateMinV = sv
        if (sv > stateMaxV) stateMaxV = sv
      }
      if (stateMinV === stateMaxV) { stateMinV = 0; stateMaxV = 1 }
    }

    let maxVisit = 0
    if (showVisits) {
      for (const v of Object.values(visitCounts)) {
        if (v > maxVisit) maxVisit = v
      }
    }

    // ══ DRAW CELLS ══
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * CELL
        const y = r * CELL
        const cell = grid[r][c]
        const key = `${r},${c}`
        const hasQ = qValues[key] && qValues[key].some((v) => v !== 0)
        const isSpecial = cell === CellType.Wall || cell === CellType.Goal || cell === CellType.Pit

        // ── Layer 1: Base fill ──
        if (cell === CellType.Wall)       ctx.fillStyle = PAL.cliff
        else if (cell === CellType.Goal)  ctx.fillStyle = PAL.water
        else if (cell === CellType.Pit)   ctx.fillStyle = PAL.lionDen
        else if (cell === CellType.Start) ctx.fillStyle = PAL.home
        else ctx.fillStyle = (r + c) % 2 === 0 ? PAL.sand : PAL.sandLight // checker pattern
        ctx.fillRect(x, y, CELL, CELL)

        // ── Layer 2: Visit heatmap ──
        if (showVisits && !isSpecial && visitCounts[key]) {
          ctx.fillStyle = visitHeatColor(visitCounts[key], maxVisit)
          ctx.fillRect(x, y, CELL, CELL)
        }

        // ── Layer 3: Q-value triangles ──
        if (showQValues && hasQ && !isSpecial) {
          drawQTriangles(ctx, x, y, CELL, qValues[key], globalMinQ, globalMaxQ, theme !== 'dark')
        }
        // ── Layer 3 alt: State-value heatmap (when triangles off) ──
        else if (showHeatmap && hasQ && !isSpecial && !showVisits) {
          const sv = Math.max(...qValues[key])
          const norm = (sv - stateMinV) / (stateMaxV - stateMinV)
          ctx.fillStyle = heatmapColor(norm) + '50'
          ctx.fillRect(x, y, CELL, CELL)
        }

        // ── Layer 4: Grid border ──
        ctx.strokeStyle = PAL.gridLine
        ctx.lineWidth = 1
        ctx.strokeRect(x, y, CELL, CELL)

        // ── Layer 5: Special cell icons ──
        const emojiSize = Math.round(32 * scale)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        if (cell === CellType.Goal) {
          ctx.font = `${emojiSize}px serif`
          ctx.fillText(EMOJI.water, x + CELL / 2, y + CELL / 2)
        } else if (cell === CellType.Pit) {
          ctx.font = `${emojiSize}px serif`
          ctx.fillText(EMOJI.lion, x + CELL / 2, y + CELL / 2)
        } else if (cell === CellType.Wall) {
          ctx.font = `${Math.round(28 * scale)}px serif`
          ctx.fillText(EMOJI.cliff, x + CELL / 2, y + CELL / 2)
        } else if (cell === CellType.Start && !(agentPos && agentPos.row === r && agentPos.col === c)) {
          ctx.fillStyle = PAL.homeLabel
          ctx.font = `bold ${Math.round(9 * scale)}px system-ui`
          ctx.fillText('HOME', x + CELL / 2, y + 12 * scale)
        }

        // ── Layer 6: Q-value labels on triangles ──
        if (showQValues && hasQ && !isSpecial) {
          const q = qValues[key]
          const bestIdx = argmax(q)
          const m = 17 * scale
          drawQLabel(ctx, q[0].toFixed(1), x + CELL / 2, y + m, bestIdx === 0, scale, PAL)
          drawQLabel(ctx, q[1].toFixed(1), x + CELL - m, y + CELL / 2, bestIdx === 1, scale, PAL)
          drawQLabel(ctx, q[2].toFixed(1), x + CELL / 2, y + CELL - m, bestIdx === 2, scale, PAL)
          drawQLabel(ctx, q[3].toFixed(1), x + m, y + CELL / 2, bestIdx === 3, scale, PAL)
        }

        // ── Layer 7: Arrows ──
        if (showArrows && hasQ && !isSpecial) {
          const q = qValues[key]
          const bestIdx = argmax(q)
          const cellCx = x + CELL / 2
          const cellCy = y + CELL / 2

          if (showQValues) {
            // Small best-action indicator at center
            ctx.beginPath()
            ctx.arc(cellCx, cellCy, 9 * scale, 0, Math.PI * 2)
            ctx.fillStyle = 'rgba(217, 119, 6, 0.85)'
            ctx.fill()
            ctx.fillStyle = '#fff'
            ctx.font = `bold ${Math.round(12 * scale)}px system-ui`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            const arrows = ['\u2191', '\u2192', '\u2193', '\u2190']
            ctx.fillText(arrows[bestIdx], cellCx, cellCy)
          } else {
            // All-4-arrows mode
            const cellMin = Math.min(...q)
            const cellMax = Math.max(...q)
            const cellRange = cellMax - cellMin
            for (let a = 0; a < 4; a++) {
              const strength = cellRange > 0 ? (q[a] - cellMin) / cellRange : 0.25
              drawArrow(ctx, cellCx, cellCy, a as GridAction, strength, a === bestIdx, scale, theme !== 'dark')
            }
          }
        }

        // ── Layer 8: Visit count number ──
        if (showVisits && visitCounts[key] && !isSpecial) {
          const count = visitCounts[key]
          const fontSize = Math.round(11 * scale)
          ctx.font = `bold ${fontSize}px monospace`
          const text = count > 999 ? `${(count / 1000).toFixed(1)}k` : String(count)
          const tw = ctx.measureText(text).width
          ctx.fillStyle = PAL.visitBadgeBg
          ctx.beginPath()
          ctx.roundRect(x + CELL - tw - 8 * scale, y + CELL - 17 * scale, tw + 6 * scale, 15 * scale, 3)
          ctx.fill()
          ctx.fillStyle = PAL.visitBadge
          ctx.textAlign = 'right'
          ctx.textBaseline = 'bottom'
          ctx.fillText(text, x + CELL - 5 * scale, y + CELL - 4 * scale)
        }

        // ── Layer 9: Coordinate ──
        ctx.fillStyle = PAL.coordText
        ctx.font = `${Math.round(8 * scale)}px monospace`
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillText(`${r},${c}`, x + 3, y + 2)
      }
    }

    // ══ TRAIL (fading footprints) ══
    if (trail.length > 0) {
      for (let i = 0; i < trail.length; i++) {
        const t = trail[i]
        if (t.row < 0 || t.row >= rows || t.col < 0 || t.col >= cols) continue
        const tx = t.col * CELL + CELL / 2
        const ty = t.row * CELL + CELL / 2
        const age = trail.length - i
        const trailAlpha = Math.max(0.05, 0.5 - (age / trail.length) * 0.45)

        ctx.beginPath()
        ctx.arc(tx, ty, 4 * scale, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(217, 119, 6, ${trailAlpha})`
        ctx.fill()
      }
    }

    // ══ BORU THE ELEPHANT ══
    if (agentPos && agentPos.row >= 0 && agentPos.row < rows && agentPos.col >= 0 && agentPos.col < cols) {
      const ax = agentPos.col * CELL + CELL / 2
      const ay = agentPos.row * CELL + CELL / 2
      const r = CELL * 0.38

      // Solid backing circle so Boru pops against any background
      ctx.beginPath()
      ctx.arc(ax, ay, r, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.6)'
      ctx.lineWidth = 2.5 * scale
      ctx.stroke()

      // Outer amber glow ring
      ctx.beginPath()
      ctx.arc(ax, ay, r + 4 * scale, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)'
      ctx.lineWidth = 3 * scale
      ctx.stroke()

      // Elephant emoji — larger and crisp
      const emojiSize = Math.round(CELL * 0.52)
      ctx.font = `${emojiSize}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(EMOJI.elephant, ax, ay)
    }

    // Edit hint
    if (editable) {
      ctx.fillStyle = theme === 'dark' ? 'rgba(232,213,181,0.2)' : 'rgba(80,65,45,0.3)'
      ctx.font = `${Math.round(10 * scale)}px system-ui`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'bottom'
      ctx.fillText('Click cells to edit', 4, height - 4)
    }
  }, [rows, cols, grid, agentPos, qValues, showHeatmap, showArrows, showQValues,
      showVisits, visitCounts, trail, editable, theme])

  useEffect(() => { draw() }, [draw])

  // Redraw on container resize
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(() => draw())
    observer.observe(container)
    return () => observer.disconnect()
  }, [draw])

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onCellClick) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const CELL = canvas.width / cols
    const col = Math.floor((e.clientX - rect.left) * scaleX / CELL)
    const row = Math.floor((e.clientY - rect.top) * scaleY / CELL)
    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      onCellClick(row, col)
    }
  }, [onCellClick, rows, cols])

  return (
    <div ref={containerRef} className="bg-surface-light rounded-xl border border-surface-lighter p-4">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{ display: 'block', margin: '0 auto', maxWidth: '100%', cursor: onCellClick ? 'pointer' : 'default' }}
      />
    </div>
  )
}
