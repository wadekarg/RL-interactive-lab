import { useRef, useEffect, useCallback } from 'react'
import type { RocketState, RocketAction, LandingResult } from '../../environments/rocketLanding'
import { useThemeStore } from '../../store/themeStore'
import { PALETTES, drawRocket, ROCKET_H, ROCKET_W, NOSE_H, NOZZLE_H } from '../shared/rocketDrawing'

interface RocketCanvasProps {
  state: RocketState
  action: RocketAction | null
  done: boolean
  landingResult: LandingResult
  episode: number
  stepInEpisode: number
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

// ─── Canvas & layout dimensions ─────────────────────────────────────────────

const CANVAS_W = 640
const CANVAS_H = 420
const GROUND_Y = CANVAS_H * 0.82
const PAD_W = 140
const PAD_H = 10

function mapX(x: number): number {
  return CANVAS_W / 2 + (x / 2.4) * (CANVAS_W * 0.38)
}

function mapY(y: number): number {
  const landedY = GROUND_Y - PAD_H - NOZZLE_H - 4
  const skyY = ROCKET_H + NOSE_H + 30
  return landedY + (skyY - landedY) * y
}

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export function RocketCanvas({ state, action, done, landingResult, episode, stepInEpisode }: RocketCanvasProps) {
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

    // ── Landing pad ──
    const padX = w / 2 - PAD_W / 2
    ctx.fillStyle = pal.padTop
    ctx.fillRect(padX, GROUND_Y - PAD_H, PAD_W, PAD_H)
    ctx.strokeStyle = pal.padStripe
    ctx.lineWidth = 2.5
    for (let sx = padX; sx < padX + PAD_W; sx += 14) {
      ctx.beginPath()
      ctx.moveTo(sx, GROUND_Y - PAD_H)
      ctx.lineTo(sx + 7, GROUND_Y)
      ctx.stroke()
    }
    ctx.fillStyle = pal.padStripe
    ctx.fillRect(padX, GROUND_Y - PAD_H, PAD_W, 2)
    ctx.fillRect(padX, GROUND_Y - 2, PAD_W, 2)

    // ── Rocket ──
    const rocketCx = mapX(state.x)
    const rocketBaseY = mapY(Math.max(0, state.y))

    ctx.save()
    ctx.translate(rocketCx, rocketBaseY)
    ctx.rotate(state.theta)

    if (!done) {
      drawRocket(ctx, pal)

      // ── Flame effect ──
      if (action !== null) {
        const flameDir = action === 2 ? 0 : action === 1 ? 1 : -1
        const flickerScale = 0.7 + Math.random() * 0.6
        const flameLen = 35 * flickerScale
        const flameW = 12 * flickerScale

        ctx.fillStyle = pal.flameOuter
        ctx.globalAlpha = 0.5
        ctx.beginPath()
        ctx.moveTo(-flameW * 0.7, NOZZLE_H)
        ctx.quadraticCurveTo(flameDir * 6, NOZZLE_H + flameLen * 0.5, flameDir * 2, NOZZLE_H + flameLen)
        ctx.quadraticCurveTo(-flameDir * 3, NOZZLE_H + flameLen * 0.6, flameW * 0.7, NOZZLE_H)
        ctx.closePath()
        ctx.fill()

        ctx.fillStyle = pal.flameMid
        ctx.globalAlpha = 0.75
        const midLen = flameLen * 0.7
        ctx.beginPath()
        ctx.moveTo(-flameW * 0.45, NOZZLE_H)
        ctx.quadraticCurveTo(flameDir * 3, NOZZLE_H + midLen * 0.5, flameDir * 1, NOZZLE_H + midLen)
        ctx.quadraticCurveTo(-flameDir * 2, NOZZLE_H + midLen * 0.5, flameW * 0.45, NOZZLE_H)
        ctx.closePath()
        ctx.fill()

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
    } else if (landingResult === 'landed') {
      drawRocket(ctx, pal)

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
      // ── Crash explosion ──
      const numParticles = 16
      for (let i = 0; i < numParticles; i++) {
        const angle = (i / numParticles) * Math.PI * 2 + frame * 0.02
        const dist = 18 + Math.sin(frame * 0.15 + i * 1.7) * 12
        const px = Math.cos(angle) * dist
        const py = Math.sin(angle) * dist - ROCKET_H / 2
        const size = 3 + Math.random() * 5
        ctx.fillStyle = i % 4 === 0 ? pal.flameCore : i % 4 === 1 ? pal.flameMid : i % 4 === 2 ? pal.flameOuter : '#777'
        ctx.globalAlpha = 0.5 + Math.random() * 0.5
        ctx.beginPath()
        ctx.arc(px, py, size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    ctx.restore()

    // ── Status overlays ──
    if (done && landingResult === 'crashed') {
      ctx.fillStyle = pal.overlay
      ctx.fillRect(0, 0, w, h)
      ctx.font = 'bold 40px system-ui'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#ef4444'
      ctx.fillText('CRASH', w / 2, h * 0.38)
      ctx.font = '16px system-ui'
      ctx.fillStyle = pal.textMuted
      const impactSpeed = Math.abs(state.yDot).toFixed(2)
      ctx.fillText(`Impact speed: ${impactSpeed} m/s | ${stepInEpisode} steps`, w / 2, h * 0.38 + 40)
    } else if (landingResult === 'landed') {
      ctx.fillStyle = pal.overlay
      ctx.fillRect(0, 0, w, h)
      ctx.font = 'bold 40px system-ui'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#22c55e'
      ctx.fillText('LANDED!', w / 2, h * 0.38)
      ctx.font = '16px system-ui'
      ctx.fillStyle = pal.textMuted
      ctx.fillText(`Soft landing in ${stepInEpisode} steps \u2014 Mars awaits!`, w / 2, h * 0.38 + 40)
    }

    // ── State overlay ──
    ctx.font = '12px monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillStyle = pal.stars.replace(/[\d.]+\)$/, '0.9)')
    const stateLines = [
      `Ep ${episode}  Step ${stepInEpisode}`,
      `x: ${state.x.toFixed(2)}   v: ${state.xDot.toFixed(2)}`,
      `y: ${state.y.toFixed(2)}   vy: ${state.yDot.toFixed(2)}`,
      `\u03B8: ${(state.theta * 180 / Math.PI).toFixed(1)}\u00B0   \u03C9: ${state.thetaDot.toFixed(2)}`,
    ]
    const lineH = 16
    for (let i = 0; i < stateLines.length; i++) {
      ctx.fillText(stateLines[i], 10, 10 + i * lineH)
    }
  }, [state, action, done, landingResult, episode, stepInEpisode, theme])

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
        style={{ display: 'block', margin: '0 auto', maxWidth: '100%', height: 'auto' }}
      />
    </div>
  )
}
