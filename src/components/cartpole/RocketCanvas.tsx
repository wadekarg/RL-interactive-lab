import { useRef, useEffect, useCallback } from 'react'
import type { CartPoleState, CartPoleAction } from '../../environments/cartpole'
import { useThemeStore } from '../../store/themeStore'
import type { Theme } from '../../store/themeStore'

interface RocketCanvasProps {
  state: CartPoleState
  action: CartPoleAction | null
  done: boolean
  survived500: boolean
  episode: number
  stepInEpisode: number
}

// ─── Theme palettes ─────────────────────────────────────────────────────────

type RocketPalette = {
  skyTop: string
  skyBottom: string
  stars: string
  ground: string
  padTop: string
  padStripe: string
  rocketBody: string
  rocketNose: string
  rocketFin: string
  rocketNozzle: string
  rocketWindow: string
  flameCore: string
  flameOuter: string
  text: string
  textMuted: string
  overlay: string
}

const PALETTES: Record<Theme, RocketPalette> = {
  dark: {
    skyTop: '#0a0e27',
    skyBottom: '#1a1e3a',
    stars: 'rgba(255,255,255,0.6)',
    ground: '#2a2520',
    padTop: '#4a4540',
    padStripe: '#d97706',
    rocketBody: '#c8c0b8',
    rocketNose: '#e04040',
    rocketFin: '#707888',
    rocketNozzle: '#505560',
    rocketWindow: '#60a0d0',
    flameCore: '#ffdd44',
    flameOuter: '#ff6622',
    text: '#e8e0d8',
    textMuted: 'rgba(200,190,175,0.6)',
    overlay: 'rgba(10,14,39,0.7)',
  },
  light: {
    skyTop: '#87ceeb',
    skyBottom: '#b0e0f0',
    stars: 'rgba(255,255,255,0.4)',
    ground: '#c9b896',
    padTop: '#888078',
    padStripe: '#d97706',
    rocketBody: '#f0ebe5',
    rocketNose: '#d03030',
    rocketFin: '#8090a0',
    rocketNozzle: '#606870',
    rocketWindow: '#4488bb',
    flameCore: '#ffdd44',
    flameOuter: '#ff5500',
    text: '#2a2018',
    textMuted: 'rgba(60,50,35,0.5)',
    overlay: 'rgba(180,210,230,0.7)',
  },
  warm: {
    skyTop: '#4a3860',
    skyBottom: '#6a4870',
    stars: 'rgba(255,240,200,0.5)',
    ground: '#3a3028',
    padTop: '#5a5048',
    padStripe: '#d97706',
    rocketBody: '#e0d8d0',
    rocketNose: '#cc3838',
    rocketFin: '#7a7888',
    rocketNozzle: '#585060',
    rocketWindow: '#5898c0',
    flameCore: '#ffdd44',
    flameOuter: '#ff6622',
    text: '#e8dcd0',
    textMuted: 'rgba(200,180,160,0.6)',
    overlay: 'rgba(74,56,96,0.7)',
  },
}

// ─── Star field (stable across redraws) ─────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return s / 2147483647
  }
}

const STAR_COUNT = 60
const stars: { x: number; y: number; size: number; brightness: number }[] = (() => {
  const rng = seededRandom(42)
  return Array.from({ length: STAR_COUNT }, () => ({
    x: rng(),
    y: rng() * 0.65,  // only in sky area
    size: 0.5 + rng() * 1.5,
    brightness: 0.3 + rng() * 0.7,
  }))
})()

// ─── Canvas dimensions ──────────────────────────────────────────────────────

const CANVAS_W = 600
const CANVAS_H = 400
const GROUND_Y = CANVAS_H * 0.82
const PAD_W = 120
const PAD_H = 8

// Rocket dimensions
const ROCKET_H = 70
const ROCKET_W = 22
const NOSE_H = 18
const FIN_H = 20
const FIN_W = 12
const NOZZLE_H = 10
const NOZZLE_W = 14
const WINDOW_R = 5

// Map state to canvas
function mapX(x: number): number {
  // x ranges from -2.4 to 2.4, map to canvas
  return CANVAS_W / 2 + (x / 2.4) * (CANVAS_W * 0.38)
}

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export function RocketCanvas({ state, action, done, survived500, episode, stepInEpisode }: RocketCanvasProps) {
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

    // ── Layer 1: Sky gradient ──
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y)
    skyGrad.addColorStop(0, pal.skyTop)
    skyGrad.addColorStop(1, pal.skyBottom)
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, w, GROUND_Y)

    // ── Layer 2: Stars ──
    for (const star of stars) {
      const twinkle = 0.5 + 0.5 * Math.sin(frame * 0.03 + star.x * 100)
      ctx.beginPath()
      ctx.arc(star.x * w, star.y * h, star.size, 0, Math.PI * 2)
      ctx.fillStyle = pal.stars.replace(/[\d.]+\)$/, `${star.brightness * twinkle})`)
      ctx.fill()
    }

    // ── Layer 3: Ground ──
    ctx.fillStyle = pal.ground
    ctx.fillRect(0, GROUND_Y, w, h - GROUND_Y)

    // ── Layer 4: Landing pad ──
    const padX = w / 2 - PAD_W / 2
    ctx.fillStyle = pal.padTop
    ctx.fillRect(padX, GROUND_Y - PAD_H, PAD_W, PAD_H)

    // Hazard stripes
    ctx.strokeStyle = pal.padStripe
    ctx.lineWidth = 2
    for (let sx = padX; sx < padX + PAD_W; sx += 12) {
      ctx.beginPath()
      ctx.moveTo(sx, GROUND_Y - PAD_H)
      ctx.lineTo(sx + 6, GROUND_Y)
      ctx.stroke()
    }

    // ── Layer 5: Rocket ──
    const rocketCx = mapX(state.x)
    const rocketBaseY = GROUND_Y - PAD_H - NOZZLE_H - 2  // Base of rocket body

    ctx.save()
    ctx.translate(rocketCx, rocketBaseY)
    ctx.rotate(state.theta)  // Tilt

    if (!done) {
      // Rocket body (rounded rectangle)
      ctx.fillStyle = pal.rocketBody
      ctx.beginPath()
      ctx.roundRect(-ROCKET_W / 2, -ROCKET_H, ROCKET_W, ROCKET_H, 4)
      ctx.fill()

      // Nose cone (triangle)
      ctx.fillStyle = pal.rocketNose
      ctx.beginPath()
      ctx.moveTo(-ROCKET_W / 2, -ROCKET_H)
      ctx.lineTo(0, -ROCKET_H - NOSE_H)
      ctx.lineTo(ROCKET_W / 2, -ROCKET_H)
      ctx.closePath()
      ctx.fill()

      // Window
      ctx.fillStyle = pal.rocketWindow
      ctx.beginPath()
      ctx.arc(0, -ROCKET_H * 0.65, WINDOW_R, 0, Math.PI * 2)
      ctx.fill()
      // Window highlight
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.beginPath()
      ctx.arc(-1.5, -ROCKET_H * 0.65 - 1.5, WINDOW_R * 0.4, 0, Math.PI * 2)
      ctx.fill()

      // Fins (left and right)
      ctx.fillStyle = pal.rocketFin
      // Left fin
      ctx.beginPath()
      ctx.moveTo(-ROCKET_W / 2, 0)
      ctx.lineTo(-ROCKET_W / 2 - FIN_W, FIN_H * 0.3)
      ctx.lineTo(-ROCKET_W / 2, -FIN_H)
      ctx.closePath()
      ctx.fill()
      // Right fin
      ctx.beginPath()
      ctx.moveTo(ROCKET_W / 2, 0)
      ctx.lineTo(ROCKET_W / 2 + FIN_W, FIN_H * 0.3)
      ctx.lineTo(ROCKET_W / 2, -FIN_H)
      ctx.closePath()
      ctx.fill()

      // Nozzle
      ctx.fillStyle = pal.rocketNozzle
      ctx.beginPath()
      ctx.moveTo(-ROCKET_W * 0.35, 0)
      ctx.lineTo(-NOZZLE_W / 2, NOZZLE_H)
      ctx.lineTo(NOZZLE_W / 2, NOZZLE_H)
      ctx.lineTo(ROCKET_W * 0.35, 0)
      ctx.closePath()
      ctx.fill()

      // ── Layer 6: Flame effect ──
      if (action !== null) {
        const flameDir = action === 1 ? 1 : -1  // Which side the flame leans
        const flickerScale = 0.8 + Math.random() * 0.4
        const flameLength = 25 * flickerScale
        const flameWidth = 10 * flickerScale

        // Outer flame
        ctx.fillStyle = pal.flameOuter
        ctx.globalAlpha = 0.7
        ctx.beginPath()
        ctx.moveTo(-flameWidth * 0.6, NOZZLE_H)
        ctx.quadraticCurveTo(flameDir * 4, NOZZLE_H + flameLength * 0.6, 0, NOZZLE_H + flameLength)
        ctx.quadraticCurveTo(-flameDir * 4, NOZZLE_H + flameLength * 0.6, flameWidth * 0.6, NOZZLE_H)
        ctx.closePath()
        ctx.fill()

        // Inner flame (brighter core)
        ctx.fillStyle = pal.flameCore
        ctx.globalAlpha = 0.9
        const innerLen = flameLength * 0.6
        ctx.beginPath()
        ctx.moveTo(-flameWidth * 0.3, NOZZLE_H)
        ctx.quadraticCurveTo(flameDir * 2, NOZZLE_H + innerLen * 0.5, 0, NOZZLE_H + innerLen)
        ctx.quadraticCurveTo(-flameDir * 2, NOZZLE_H + innerLen * 0.5, flameWidth * 0.3, NOZZLE_H)
        ctx.closePath()
        ctx.fill()

        ctx.globalAlpha = 1
      }
    } else if (survived500) {
      // ── Success glow ──
      // Draw rocket normally first
      ctx.fillStyle = pal.rocketBody
      ctx.beginPath()
      ctx.roundRect(-ROCKET_W / 2, -ROCKET_H, ROCKET_W, ROCKET_H, 4)
      ctx.fill()
      ctx.fillStyle = pal.rocketNose
      ctx.beginPath()
      ctx.moveTo(-ROCKET_W / 2, -ROCKET_H)
      ctx.lineTo(0, -ROCKET_H - NOSE_H)
      ctx.lineTo(ROCKET_W / 2, -ROCKET_H)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = pal.rocketWindow
      ctx.beginPath()
      ctx.arc(0, -ROCKET_H * 0.65, WINDOW_R, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = pal.rocketFin
      ctx.beginPath()
      ctx.moveTo(-ROCKET_W / 2, 0)
      ctx.lineTo(-ROCKET_W / 2 - FIN_W, FIN_H * 0.3)
      ctx.lineTo(-ROCKET_W / 2, -FIN_H)
      ctx.closePath()
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(ROCKET_W / 2, 0)
      ctx.lineTo(ROCKET_W / 2 + FIN_W, FIN_H * 0.3)
      ctx.lineTo(ROCKET_W / 2, -FIN_H)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = pal.rocketNozzle
      ctx.beginPath()
      ctx.moveTo(-ROCKET_W * 0.35, 0)
      ctx.lineTo(-NOZZLE_W / 2, NOZZLE_H)
      ctx.lineTo(NOZZLE_W / 2, NOZZLE_H)
      ctx.lineTo(ROCKET_W * 0.35, 0)
      ctx.closePath()
      ctx.fill()

      // Green glow around rocket
      const glowPulse = 0.3 + 0.2 * Math.sin(frame * 0.1)
      ctx.shadowColor = '#22c55e'
      ctx.shadowBlur = 30
      ctx.strokeStyle = `rgba(34, 197, 94, ${glowPulse})`
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.roundRect(-ROCKET_W / 2 - 6, -ROCKET_H - NOSE_H - 4, ROCKET_W + 12, ROCKET_H + NOSE_H + NOZZLE_H + 12, 8)
      ctx.stroke()
      ctx.shadowBlur = 0
    } else {
      // ── Crash explosion ──
      const numParticles = 12
      for (let i = 0; i < numParticles; i++) {
        const angle = (i / numParticles) * Math.PI * 2 + frame * 0.02
        const dist = 15 + Math.sin(frame * 0.15 + i) * 10
        const px = Math.cos(angle) * dist
        const py = Math.sin(angle) * dist - ROCKET_H / 2
        const size = 3 + Math.random() * 4
        ctx.fillStyle = i % 3 === 0 ? pal.flameCore : i % 3 === 1 ? pal.flameOuter : '#888'
        ctx.globalAlpha = 0.6 + Math.random() * 0.4
        ctx.beginPath()
        ctx.arc(px, py, size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    ctx.restore()

    // ── Layer 7: Status labels ──
    if (done && !survived500) {
      ctx.fillStyle = pal.overlay
      ctx.fillRect(0, 0, w, h)
      ctx.font = 'bold 36px system-ui'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#ef4444'
      ctx.fillText('CRASH', w / 2, h * 0.4)
      ctx.font = '16px system-ui'
      ctx.fillStyle = pal.textMuted
      ctx.fillText(`Survived ${stepInEpisode} steps`, w / 2, h * 0.4 + 36)
    } else if (survived500) {
      ctx.fillStyle = pal.overlay
      ctx.fillRect(0, 0, w, h)
      ctx.font = 'bold 36px system-ui'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#22c55e'
      ctx.fillText('LANDED!', w / 2, h * 0.4)
      ctx.font = '16px system-ui'
      ctx.fillStyle = pal.textMuted
      ctx.fillText('500 steps — perfect balance!', w / 2, h * 0.4 + 36)
    }

    // ── Layer 8: State overlay (bottom-left) ──
    ctx.font = '11px monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    ctx.fillStyle = pal.textMuted

    const stateLines = [
      `Ep ${episode}  Step ${stepInEpisode}`,
      `x: ${state.x.toFixed(2)}   v: ${state.xDot.toFixed(2)}`,
      `\u03B8: ${(state.theta * 180 / Math.PI).toFixed(1)}\u00B0   \u03C9: ${state.thetaDot.toFixed(2)}`,
    ]
    const lineH = 14
    const startY = h - 8
    for (let i = stateLines.length - 1; i >= 0; i--) {
      ctx.fillText(stateLines[i], 8, startY - (stateLines.length - 1 - i) * lineH)
    }

  }, [state, action, done, survived500, episode, stepInEpisode, theme])

  useEffect(() => { draw() }, [draw])

  // Redraw on resize
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
