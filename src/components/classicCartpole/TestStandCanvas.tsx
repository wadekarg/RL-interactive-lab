import { useRef, useEffect, useCallback } from 'react'
import type { ClassicCartPoleState, ClassicCartPoleAction, BalanceResult } from '../../environments/classicCartpole'
import { useThemeStore } from '../../store/themeStore'
import { PALETTES, drawRocket, ROCKET_H, ROCKET_W, NOSE_H, NOZZLE_H } from '../shared/rocketDrawing'

interface TestStandCanvasProps {
  state: ClassicCartPoleState
  action: ClassicCartPoleAction | null
  done: boolean
  balanceResult: BalanceResult
  episode: number
  stepInEpisode: number
}

// ─── Canvas & layout dimensions ─────────────────────────────────────────────

const CANVAS_W = 640
const CANVAS_H = 420
const GROUND_Y = CANVAS_H * 0.82

// Test stand dimensions
const STAND_W = 200
const STAND_H = 8
const BEAM_W = 6
const BEAM_H = 50
const CRADLE_Y = GROUND_Y - BEAM_H - STAND_H / 2
const RAIL_Y = CRADLE_Y

function mapX(x: number): number {
  return CANVAS_W / 2 + (x / 2.4) * (CANVAS_W * 0.38)
}

// ─── Star field (stable across redraws) ─────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return s / 2147483647
  }
}

const STAR_COUNT = 80
const STAR_DATA: { x: number; y: number; size: number; brightness: number }[] = (() => {
  const rng = seededRandom(42)
  return Array.from({ length: STAR_COUNT }, () => ({
    x: rng(),
    y: rng() * 0.62,
    size: 0.4 + rng() * 1.8,
    brightness: 0.2 + rng() * 0.8,
  }))
})()

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export function TestStandCanvas({ state, action, done, balanceResult, episode, stepInEpisode }: TestStandCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const theme = useThemeStore((s) => s.theme)
  const frameRef = useRef(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const pal = PALETTES[theme]
    const w = CANVAS_W
    const h = CANVAS_H
    canvas.width = w
    canvas.height = h

    frameRef.current++
    const frame = frameRef.current

    // ── Sky gradient ──
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y)
    skyGrad.addColorStop(0, pal.skyTop)
    skyGrad.addColorStop(1, pal.skyBottom)
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, w, GROUND_Y)

    // ── Stars ──
    for (const star of STAR_DATA) {
      const twinkle = 0.5 + 0.5 * Math.sin(frame * 0.03 + star.x * 100)
      ctx.beginPath()
      ctx.arc(star.x * w, star.y * h, star.size, 0, Math.PI * 2)
      ctx.fillStyle = pal.stars.replace(/[\d.]+\)$/, `${star.brightness * twinkle})`)
      ctx.fill()
    }

    // ── Ground ──
    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, h)
    groundGrad.addColorStop(0, pal.groundLight)
    groundGrad.addColorStop(1, pal.ground)
    ctx.fillStyle = groundGrad
    ctx.fillRect(0, GROUND_Y, w, h - GROUND_Y)

    // ── Test Stand ──
    const standCenterX = w / 2

    // Left support beam
    ctx.fillStyle = pal.padTop
    ctx.fillRect(standCenterX - STAND_W / 2 - BEAM_W / 2, GROUND_Y - BEAM_H, BEAM_W, BEAM_H)

    // Right support beam
    ctx.fillRect(standCenterX + STAND_W / 2 - BEAM_W / 2, GROUND_Y - BEAM_H, BEAM_W, BEAM_H)

    // Crossbar / rail
    ctx.fillStyle = pal.padStripe
    ctx.fillRect(standCenterX - STAND_W / 2, RAIL_Y - STAND_H / 2, STAND_W, STAND_H)

    // Rail tick marks
    ctx.strokeStyle = pal.padTop
    ctx.lineWidth = 1
    for (let tx = -STAND_W / 2; tx <= STAND_W / 2; tx += 20) {
      ctx.beginPath()
      ctx.moveTo(standCenterX + tx, RAIL_Y - STAND_H / 2)
      ctx.lineTo(standCenterX + tx, RAIL_Y + STAND_H / 2)
      ctx.stroke()
    }

    // Hazard stripes on beams
    ctx.strokeStyle = pal.padStripe
    ctx.lineWidth = 2
    for (let sy = GROUND_Y - BEAM_H; sy < GROUND_Y; sy += 10) {
      // Left beam
      ctx.beginPath()
      ctx.moveTo(standCenterX - STAND_W / 2 - BEAM_W / 2, sy)
      ctx.lineTo(standCenterX - STAND_W / 2 + BEAM_W / 2, sy + 5)
      ctx.stroke()
      // Right beam
      ctx.beginPath()
      ctx.moveTo(standCenterX + STAND_W / 2 - BEAM_W / 2, sy)
      ctx.lineTo(standCenterX + STAND_W / 2 + BEAM_W / 2, sy + 5)
      ctx.stroke()
    }

    // ── Rocket (at ground level, slides horizontally) ──
    const rocketCx = mapX(state.x)
    const rocketBaseY = RAIL_Y - STAND_H / 2 - NOZZLE_H - 4

    ctx.save()
    ctx.translate(rocketCx, rocketBaseY)
    ctx.rotate(state.theta)

    if (!done) {
      drawRocket(ctx, pal)

      // ── Flame effect (only left/right, no bottom) ──
      if (action !== null) {
        const flameDir = action === 1 ? 1 : -1
        const flickerScale = 0.7 + Math.random() * 0.6
        const flameLen = 28 * flickerScale
        const flameW = 10 * flickerScale

        // Outer glow
        ctx.fillStyle = pal.flameOuter
        ctx.globalAlpha = 0.5
        ctx.beginPath()
        ctx.moveTo(-flameW * 0.7, NOZZLE_H)
        ctx.quadraticCurveTo(flameDir * 6, NOZZLE_H + flameLen * 0.5, flameDir * 2, NOZZLE_H + flameLen)
        ctx.quadraticCurveTo(-flameDir * 3, NOZZLE_H + flameLen * 0.6, flameW * 0.7, NOZZLE_H)
        ctx.closePath()
        ctx.fill()

        // Mid flame
        ctx.fillStyle = pal.flameMid
        ctx.globalAlpha = 0.75
        const midLen = flameLen * 0.7
        ctx.beginPath()
        ctx.moveTo(-flameW * 0.45, NOZZLE_H)
        ctx.quadraticCurveTo(flameDir * 3, NOZZLE_H + midLen * 0.5, flameDir * 1, NOZZLE_H + midLen)
        ctx.quadraticCurveTo(-flameDir * 2, NOZZLE_H + midLen * 0.5, flameW * 0.45, NOZZLE_H)
        ctx.closePath()
        ctx.fill()

        // Inner core
        ctx.fillStyle = pal.flameCore
        ctx.globalAlpha = 0.95
        const coreLen = flameLen * 0.4
        ctx.beginPath()
        ctx.moveTo(-flameW * 0.2, NOZZLE_H)
        ctx.quadraticCurveTo(flameDir * 1, NOZZLE_H + coreLen * 0.5, 0, NOZZLE_H + coreLen)
        ctx.quadraticCurveTo(-flameDir * 1, NOZZLE_H + coreLen * 0.5, flameW * 0.2, NOZZLE_H)
        ctx.closePath()
        ctx.fill()

        ctx.globalAlpha = 1
      }
    } else if (balanceResult === 'solved') {
      drawRocket(ctx, pal)

      // Green glow for solved
      const glowPulse = 0.3 + 0.2 * Math.sin(frame * 0.1)
      ctx.shadowColor = '#22c55e'
      ctx.shadowBlur = 35
      ctx.strokeStyle = `rgba(34, 197, 94, ${glowPulse})`
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.roundRect(-ROCKET_W / 2 - 8, -ROCKET_H - NOSE_H - 6, ROCKET_W + 16, ROCKET_H + NOSE_H + NOZZLE_H + 16, 10)
      ctx.stroke()
      ctx.shadowBlur = 0
    } else {
      // ── Fell — topple particles ──
      const numParticles = 12
      for (let i = 0; i < numParticles; i++) {
        const angle = (i / numParticles) * Math.PI * 2 + frame * 0.02
        const dist = 14 + Math.sin(frame * 0.15 + i * 1.7) * 8
        const px = Math.cos(angle) * dist
        const py = Math.sin(angle) * dist - ROCKET_H / 2
        const size = 2 + Math.random() * 4
        ctx.fillStyle = i % 3 === 0 ? pal.flameCore : i % 3 === 1 ? pal.flameMid : '#777'
        ctx.globalAlpha = 0.4 + Math.random() * 0.5
        ctx.beginPath()
        ctx.arc(px, py, size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    ctx.restore()

    // ── Status overlays ──
    if (done && balanceResult === 'fell') {
      ctx.fillStyle = pal.overlay
      ctx.fillRect(0, 0, w, h)
      ctx.font = 'bold 40px system-ui'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#ef4444'
      ctx.fillText('TOPPLED!', w / 2, h * 0.38)
      ctx.font = '16px system-ui'
      ctx.fillStyle = pal.textMuted
      const angle = Math.abs(state.theta * 180 / Math.PI).toFixed(1)
      ctx.fillText(`Tilt: ${angle}\u00B0 | ${stepInEpisode} steps`, w / 2, h * 0.38 + 40)
    } else if (balanceResult === 'solved') {
      ctx.fillStyle = pal.overlay
      ctx.fillRect(0, 0, w, h)
      ctx.font = 'bold 40px system-ui'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#22c55e'
      ctx.fillText('BALANCED!', w / 2, h * 0.38)
      ctx.font = '16px system-ui'
      ctx.fillStyle = pal.textMuted
      ctx.fillText(`500 steps \u2014 ready for real landing!`, w / 2, h * 0.38 + 40)
    }

    // ── State overlay (top-left) ──
    ctx.font = '12px monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillStyle = pal.stars.replace(/[\d.]+\)$/, '0.9)')
    const stateLines = [
      `Ep ${episode}  Step ${stepInEpisode}`,
      `x: ${state.x.toFixed(2)}   v: ${state.xDot.toFixed(2)}`,
      `\u03B8: ${(state.theta * 180 / Math.PI).toFixed(1)}\u00B0   \u03C9: ${state.thetaDot.toFixed(2)}`,
    ]
    const lineH = 16
    for (let i = 0; i < stateLines.length; i++) {
      ctx.fillText(stateLines[i], 10, 10 + i * lineH)
    }
  }, [state, action, done, balanceResult, episode, stepInEpisode, theme])

  useEffect(() => { draw() }, [draw])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(() => draw())
    observer.observe(container)
    return () => observer.disconnect()
  }, [draw])

  return (
    <div ref={containerRef} className="bg-surface-light rounded-xl border border-surface-lighter p-4">
      <canvas
        ref={canvasRef}
        style={{ display: 'block', margin: '0 auto', maxWidth: '100%' }}
      />
    </div>
  )
}
