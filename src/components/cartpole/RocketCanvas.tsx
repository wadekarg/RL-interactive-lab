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
  groundLight: string
  padTop: string
  padStripe: string
  rocketBody: string
  rocketBodyDark: string
  rocketNose: string
  rocketNoseTip: string
  rocketFin: string
  rocketFinEdge: string
  rocketNozzle: string
  rocketWindow: string
  rocketWindowRim: string
  rocketLabel: string
  flameCore: string
  flameMid: string
  flameOuter: string
  text: string
  textMuted: string
  overlay: string
}

const PALETTES: Record<Theme, RocketPalette> = {
  dark: {
    skyTop: '#060a1f',
    skyBottom: '#141830',
    stars: 'rgba(255,255,255,0.6)',
    ground: '#8b3a1a',
    groundLight: '#a0522d',
    padTop: '#4a4540',
    padStripe: '#d97706',
    rocketBody: '#d0c8c0',
    rocketBodyDark: '#b0a898',
    rocketNose: '#d03030',
    rocketNoseTip: '#ff4444',
    rocketFin: '#607080',
    rocketFinEdge: '#8090a0',
    rocketNozzle: '#484e58',
    rocketWindow: '#50a0d8',
    rocketWindowRim: '#3878a8',
    rocketLabel: '#5a5550',
    flameCore: '#ffffaa',
    flameMid: '#ffbb22',
    flameOuter: '#ff5500',
    text: '#e8e0d8',
    textMuted: 'rgba(200,190,175,0.6)',
    overlay: 'rgba(6,10,31,0.75)',
  },
  light: {
    skyTop: '#6ab4de',
    skyBottom: '#a8d8f0',
    stars: 'rgba(255,255,255,0.35)',
    ground: '#c2703c',
    groundLight: '#d4875a',
    padTop: '#888078',
    padStripe: '#d97706',
    rocketBody: '#f5f0ea',
    rocketBodyDark: '#ddd5ca',
    rocketNose: '#cc2828',
    rocketNoseTip: '#e83838',
    rocketFin: '#7888a0',
    rocketFinEdge: '#98a8b8',
    rocketNozzle: '#586068',
    rocketWindow: '#3880b8',
    rocketWindowRim: '#2860a0',
    rocketLabel: '#b0a898',
    flameCore: '#ffffaa',
    flameMid: '#ffbb22',
    flameOuter: '#ff4400',
    text: '#2a2018',
    textMuted: 'rgba(60,50,35,0.5)',
    overlay: 'rgba(160,200,230,0.75)',
  },
  warm: {
    skyTop: '#3a2850',
    skyBottom: '#5a3860',
    stars: 'rgba(255,240,200,0.5)',
    ground: '#7a3318',
    groundLight: '#924528',
    padTop: '#5a5048',
    padStripe: '#d97706',
    rocketBody: '#e8e0d8',
    rocketBodyDark: '#c8beb0',
    rocketNose: '#c03030',
    rocketNoseTip: '#e04040',
    rocketFin: '#687080',
    rocketFinEdge: '#8890a0',
    rocketNozzle: '#504858',
    rocketWindow: '#4890c0',
    rocketWindowRim: '#3070a0',
    rocketLabel: '#8a7e70',
    flameCore: '#ffffaa',
    flameMid: '#ffbb22',
    flameOuter: '#ff5500',
    text: '#e8dcd0',
    textMuted: 'rgba(200,180,160,0.6)',
    overlay: 'rgba(58,40,80,0.75)',
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

// ─── Canvas & rocket dimensions ─────────────────────────────────────────────

const CANVAS_W = 640
const CANVAS_H = 420
const GROUND_Y = CANVAS_H * 0.82
const PAD_W = 140
const PAD_H = 10

// Bigger rocket
const ROCKET_H = 90
const ROCKET_W = 28
const NOSE_H = 24
const FIN_H = 26
const FIN_W = 14
const NOZZLE_H = 12
const NOZZLE_W = 18
const WINDOW_R = 6

function mapX(x: number): number {
  return CANVAS_W / 2 + (x / 2.4) * (CANVAS_W * 0.38)
}

// ─── Rocket drawing helper ──────────────────────────────────────────────────

function drawRocket(ctx: CanvasRenderingContext2D, pal: RocketPalette) {
  // Body — gradient for 3D effect
  const bodyGrad = ctx.createLinearGradient(-ROCKET_W / 2, 0, ROCKET_W / 2, 0)
  bodyGrad.addColorStop(0, pal.rocketBodyDark)
  bodyGrad.addColorStop(0.35, pal.rocketBody)
  bodyGrad.addColorStop(0.65, pal.rocketBody)
  bodyGrad.addColorStop(1, pal.rocketBodyDark)
  ctx.fillStyle = bodyGrad
  ctx.beginPath()
  ctx.roundRect(-ROCKET_W / 2, -ROCKET_H, ROCKET_W, ROCKET_H, 3)
  ctx.fill()

  // Body outline
  ctx.strokeStyle = pal.rocketBodyDark
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.roundRect(-ROCKET_W / 2, -ROCKET_H, ROCKET_W, ROCKET_H, 3)
  ctx.stroke()

  // Nose cone — gradient
  const noseGrad = ctx.createLinearGradient(-ROCKET_W / 2, -ROCKET_H, ROCKET_W / 2, -ROCKET_H)
  noseGrad.addColorStop(0, pal.rocketNose)
  noseGrad.addColorStop(0.5, pal.rocketNoseTip)
  noseGrad.addColorStop(1, pal.rocketNose)
  ctx.fillStyle = noseGrad
  ctx.beginPath()
  ctx.moveTo(-ROCKET_W / 2, -ROCKET_H)
  ctx.quadraticCurveTo(-ROCKET_W * 0.3, -ROCKET_H - NOSE_H * 0.7, 0, -ROCKET_H - NOSE_H)
  ctx.quadraticCurveTo(ROCKET_W * 0.3, -ROCKET_H - NOSE_H * 0.7, ROCKET_W / 2, -ROCKET_H)
  ctx.closePath()
  ctx.fill()

  // Decorative band at nose-body junction
  ctx.fillStyle = pal.rocketNose
  ctx.fillRect(-ROCKET_W / 2, -ROCKET_H, ROCKET_W, 4)

  // Window (porthole) — positioned higher to leave room for label
  ctx.fillStyle = pal.rocketWindowRim
  ctx.beginPath()
  ctx.arc(0, -ROCKET_H * 0.78, WINDOW_R + 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = pal.rocketWindow
  ctx.beginPath()
  ctx.arc(0, -ROCKET_H * 0.78, WINDOW_R, 0, Math.PI * 2)
  ctx.fill()
  // Window highlight
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.beginPath()
  ctx.arc(-2, -ROCKET_H * 0.78 - 2, WINDOW_R * 0.35, 0, Math.PI * 2)
  ctx.fill()

  // "DABAK" label — vertical on rocket body
  ctx.save()
  ctx.font = 'bold 9px system-ui'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = pal.rocketLabel
  const label = 'DABAK'
  const labelStartY = -ROCKET_H * 0.58
  const letterSpacing = 9
  for (let i = 0; i < label.length; i++) {
    ctx.fillText(label[i], 0, labelStartY + i * letterSpacing)
  }
  ctx.restore()

  // Left fin
  const finGrad = ctx.createLinearGradient(-ROCKET_W / 2 - FIN_W, 0, -ROCKET_W / 2, 0)
  finGrad.addColorStop(0, pal.rocketFinEdge)
  finGrad.addColorStop(1, pal.rocketFin)
  ctx.fillStyle = finGrad
  ctx.beginPath()
  ctx.moveTo(-ROCKET_W / 2, 2)
  ctx.lineTo(-ROCKET_W / 2 - FIN_W, FIN_H * 0.4)
  ctx.lineTo(-ROCKET_W / 2 - FIN_W * 0.6, -FIN_H * 0.4)
  ctx.lineTo(-ROCKET_W / 2, -FIN_H)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = pal.rocketFinEdge
  ctx.lineWidth = 0.5
  ctx.stroke()

  // Right fin
  const finGradR = ctx.createLinearGradient(ROCKET_W / 2, 0, ROCKET_W / 2 + FIN_W, 0)
  finGradR.addColorStop(0, pal.rocketFin)
  finGradR.addColorStop(1, pal.rocketFinEdge)
  ctx.fillStyle = finGradR
  ctx.beginPath()
  ctx.moveTo(ROCKET_W / 2, 2)
  ctx.lineTo(ROCKET_W / 2 + FIN_W, FIN_H * 0.4)
  ctx.lineTo(ROCKET_W / 2 + FIN_W * 0.6, -FIN_H * 0.4)
  ctx.lineTo(ROCKET_W / 2, -FIN_H)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = pal.rocketFinEdge
  ctx.lineWidth = 0.5
  ctx.stroke()

  // Nozzle
  const nozGrad = ctx.createLinearGradient(0, 0, 0, NOZZLE_H)
  nozGrad.addColorStop(0, pal.rocketNozzle)
  nozGrad.addColorStop(1, '#333')
  ctx.fillStyle = nozGrad
  ctx.beginPath()
  ctx.moveTo(-ROCKET_W * 0.35, 0)
  ctx.lineTo(-NOZZLE_W / 2, NOZZLE_H)
  ctx.lineTo(NOZZLE_W / 2, NOZZLE_H)
  ctx.lineTo(ROCKET_W * 0.35, 0)
  ctx.closePath()
  ctx.fill()
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
    // Hazard stripes
    ctx.strokeStyle = pal.padStripe
    ctx.lineWidth = 2.5
    for (let sx = padX; sx < padX + PAD_W; sx += 14) {
      ctx.beginPath()
      ctx.moveTo(sx, GROUND_Y - PAD_H)
      ctx.lineTo(sx + 7, GROUND_Y)
      ctx.stroke()
    }
    // Pad edge highlights
    ctx.fillStyle = pal.padStripe
    ctx.fillRect(padX, GROUND_Y - PAD_H, PAD_W, 2)
    ctx.fillRect(padX, GROUND_Y - 2, PAD_W, 2)

    // ── Rocket ──
    const rocketCx = mapX(state.x)
    const rocketBaseY = GROUND_Y - PAD_H - NOZZLE_H - 4

    ctx.save()
    ctx.translate(rocketCx, rocketBaseY)
    ctx.rotate(state.theta)

    if (!done) {
      drawRocket(ctx, pal)

      // ── Flame effect ──
      if (action !== null) {
        const flameDir = action === 1 ? 1 : -1
        const flickerScale = 0.7 + Math.random() * 0.6
        const flameLen = 35 * flickerScale
        const flameW = 12 * flickerScale

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
    } else if (survived500) {
      drawRocket(ctx, pal)

      // Green glow
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
    if (done && !survived500) {
      ctx.fillStyle = pal.overlay
      ctx.fillRect(0, 0, w, h)
      ctx.font = 'bold 40px system-ui'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#ef4444'
      ctx.fillText('CRASH', w / 2, h * 0.38)
      ctx.font = '16px system-ui'
      ctx.fillStyle = pal.textMuted
      ctx.fillText(`Survived ${stepInEpisode} steps`, w / 2, h * 0.38 + 40)
    } else if (survived500) {
      ctx.fillStyle = pal.overlay
      ctx.fillRect(0, 0, w, h)
      ctx.font = 'bold 40px system-ui'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#22c55e'
      ctx.fillText('LANDED!', w / 2, h * 0.38)
      ctx.font = '16px system-ui'
      ctx.fillStyle = pal.textMuted
      ctx.fillText('500 steps \u2014 perfect landing! Mars awaits!', w / 2, h * 0.38 + 40)
    }

    // ── State overlay (bottom-left) ──
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
