import { useRef, useEffect, useCallback } from 'react'
import type { ClassicCartPoleState, ClassicCartPoleAction, BalanceResult } from '../../environments/classicCartpole'
import { useThemeStore } from '../../store/themeStore'

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

// Track dimensions
const TRACK_H = 8
const SUPPORT_W = 6
const SUPPORT_H = 50
const RAIL_Y = GROUND_Y - SUPPORT_H - TRACK_H / 2

// Track extent matches x ∈ [-2.4, 2.4]
const TRACK_LEFT = CANVAS_W / 2 - CANVAS_W * 0.38
const TRACK_RIGHT = CANVAS_W / 2 + CANVAS_W * 0.38
const TRACK_W = TRACK_RIGHT - TRACK_LEFT

// Cart dimensions
const CART_W = 60
const CART_H = 28
const WHEEL_R = 7

// Pole dimensions
const POLE_LEN = 120
const POLE_TIP_R = 6
const POLE_W = 4

function mapX(x: number): number {
  return CANVAS_W / 2 + (x / 2.4) * (CANVAS_W * 0.38)
}

// ─── Theme-aware color palettes ─────────────────────────────────────────────

interface CartPalette {
  skyTop: string
  skyBottom: string
  groundLight: string
  ground: string
  trackColor: string
  trackStroke: string
  supportColor: string
  supportStripe: string
  cartBody: string
  cartStroke: string
  wheelColor: string
  wheelStroke: string
  poleColor: string
  poleTip: string
  forceLeft: string
  forceRight: string
  overlay: string
  textMuted: string
  hudText: string
}

const CART_PALETTES: Record<string, CartPalette> = {
  dark: {
    skyTop: '#0f172a',
    skyBottom: '#1e293b',
    groundLight: '#334155',
    ground: '#1e293b',
    trackColor: '#eab308',
    trackStroke: '#a16207',
    supportColor: '#64748b',
    supportStripe: '#eab308',
    cartBody: '#94a3b8',
    cartStroke: '#64748b',
    wheelColor: '#475569',
    wheelStroke: '#334155',
    poleColor: '#3b82f6',
    poleTip: '#60a5fa',
    forceLeft: '#ef4444',
    forceRight: '#3b82f6',
    overlay: 'rgba(0,0,0,0.55)',
    textMuted: 'rgba(148,163,184,0.9)',
    hudText: 'rgba(148,163,184,0.9)',
  },
  light: {
    skyTop: '#bfdbfe',
    skyBottom: '#dbeafe',
    groundLight: '#86efac',
    ground: '#4ade80',
    trackColor: '#ca8a04',
    trackStroke: '#92400e',
    supportColor: '#9ca3af',
    supportStripe: '#ca8a04',
    cartBody: '#6b7280',
    cartStroke: '#4b5563',
    wheelColor: '#374151',
    wheelStroke: '#1f2937',
    poleColor: '#2563eb',
    poleTip: '#3b82f6',
    forceLeft: '#dc2626',
    forceRight: '#2563eb',
    overlay: 'rgba(255,255,255,0.55)',
    textMuted: 'rgba(75,85,99,0.9)',
    hudText: 'rgba(75,85,99,0.9)',
  },
  warm: {
    skyTop: '#1c1917',
    skyBottom: '#292524',
    groundLight: '#44403c',
    ground: '#292524',
    trackColor: '#d97706',
    trackStroke: '#92400e',
    supportColor: '#78716c',
    supportStripe: '#d97706',
    cartBody: '#a8a29e',
    cartStroke: '#78716c',
    wheelColor: '#57534e',
    wheelStroke: '#44403c',
    poleColor: '#f59e0b',
    poleTip: '#fbbf24',
    forceLeft: '#ef4444',
    forceRight: '#f59e0b',
    overlay: 'rgba(0,0,0,0.55)',
    textMuted: 'rgba(168,162,158,0.9)',
    hudText: 'rgba(168,162,158,0.9)',
  },
}

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

    const pal = CART_PALETTES[theme] ?? CART_PALETTES.dark
    const w = CANVAS_W
    const h = CANVAS_H
    canvas.width = w
    canvas.height = h

    frameRef.current++
    const frame = frameRef.current

    // ── Sky gradient (light, no stars) ──
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y)
    skyGrad.addColorStop(0, pal.skyTop)
    skyGrad.addColorStop(1, pal.skyBottom)
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, w, GROUND_Y)

    // ── Ground ──
    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, h)
    groundGrad.addColorStop(0, pal.groundLight)
    groundGrad.addColorStop(1, pal.ground)
    ctx.fillStyle = groundGrad
    ctx.fillRect(0, GROUND_Y, w, h - GROUND_Y)

    // ── Track supports ──
    ctx.fillStyle = pal.supportColor
    ctx.fillRect(TRACK_LEFT - SUPPORT_W / 2, GROUND_Y - SUPPORT_H, SUPPORT_W, SUPPORT_H)
    ctx.fillRect(TRACK_RIGHT - SUPPORT_W / 2, GROUND_Y - SUPPORT_H, SUPPORT_W, SUPPORT_H)

    // Hazard stripes on supports
    ctx.strokeStyle = pal.supportStripe
    ctx.lineWidth = 2
    for (let sy = GROUND_Y - SUPPORT_H; sy < GROUND_Y; sy += 10) {
      ctx.beginPath()
      ctx.moveTo(TRACK_LEFT - SUPPORT_W / 2, sy)
      ctx.lineTo(TRACK_LEFT + SUPPORT_W / 2, sy + 5)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(TRACK_RIGHT - SUPPORT_W / 2, sy)
      ctx.lineTo(TRACK_RIGHT + SUPPORT_W / 2, sy + 5)
      ctx.stroke()
    }

    // ── Track / rail ──
    ctx.fillStyle = pal.trackColor
    ctx.fillRect(TRACK_LEFT, RAIL_Y - TRACK_H / 2, TRACK_W, TRACK_H)

    // Rail tick marks
    ctx.strokeStyle = pal.trackStroke
    ctx.lineWidth = 1
    for (let tx = TRACK_LEFT; tx <= TRACK_RIGHT; tx += 20) {
      ctx.beginPath()
      ctx.moveTo(tx, RAIL_Y - TRACK_H / 2)
      ctx.lineTo(tx, RAIL_Y + TRACK_H / 2)
      ctx.stroke()
    }

    // ── Cart position ──
    const cartCx = mapX(state.x)
    const cartBottom = RAIL_Y - TRACK_H / 2
    const cartTop = cartBottom - CART_H
    const cartLeft = cartCx - CART_W / 2

    // Wheel positions
    const wheelY = cartBottom
    const wheelLx = cartCx - CART_W / 3
    const wheelRx = cartCx + CART_W / 3

    // Pole hinge at top center of cart
    const hingeX = cartCx
    const hingeY = cartTop
    const tipX = hingeX + POLE_LEN * Math.sin(state.theta)
    const tipY = hingeY - POLE_LEN * Math.cos(state.theta)

    if (!done || balanceResult === 'solved') {
      // ── Cart body ──
      ctx.fillStyle = pal.cartBody
      ctx.strokeStyle = pal.cartStroke
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(cartLeft, cartTop, CART_W, CART_H, 4)
      ctx.fill()
      ctx.stroke()

      // ── Wheels ──
      ctx.fillStyle = pal.wheelColor
      ctx.strokeStyle = pal.wheelStroke
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(wheelLx, wheelY, WHEEL_R, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(wheelRx, wheelY, WHEEL_R, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // ── Pole ──
      ctx.strokeStyle = pal.poleColor
      ctx.lineWidth = POLE_W
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(hingeX, hingeY)
      ctx.lineTo(tipX, tipY)
      ctx.stroke()

      // Pole tip (ball)
      ctx.fillStyle = pal.poleTip
      ctx.beginPath()
      ctx.arc(tipX, tipY, POLE_TIP_R, 0, Math.PI * 2)
      ctx.fill()

      // Hinge circle
      ctx.fillStyle = pal.cartStroke
      ctx.beginPath()
      ctx.arc(hingeX, hingeY, 4, 0, Math.PI * 2)
      ctx.fill()

      // ── Force arrow (when actively pushing) ──
      if (action !== null && !done) {
        const arrowDir = action === 1 ? 1 : -1
        const arrowY = RAIL_Y + TRACK_H / 2 + 18
        const arrowStartX = cartCx - arrowDir * 5
        const arrowEndX = cartCx + arrowDir * 30
        const arrowColor = action === 1 ? pal.forceRight : pal.forceLeft

        ctx.strokeStyle = arrowColor
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(arrowStartX, arrowY)
        ctx.lineTo(arrowEndX, arrowY)
        ctx.stroke()

        // Arrowhead
        ctx.fillStyle = arrowColor
        ctx.beginPath()
        ctx.moveTo(arrowEndX, arrowY)
        ctx.lineTo(arrowEndX - arrowDir * 8, arrowY - 5)
        ctx.lineTo(arrowEndX - arrowDir * 8, arrowY + 5)
        ctx.closePath()
        ctx.fill()

        // Label
        ctx.font = '10px system-ui'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillStyle = arrowColor
        ctx.fillText(action === 1 ? 'Push \u2192' : '\u2190 Push', cartCx + arrowDir * 12, arrowY + 8)
      }

      // ── Solved glow ──
      if (balanceResult === 'solved') {
        const glowPulse = 0.3 + 0.2 * Math.sin(frame * 0.1)
        ctx.shadowColor = '#22c55e'
        ctx.shadowBlur = 35
        ctx.strokeStyle = `rgba(34, 197, 94, ${glowPulse})`
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.roundRect(cartLeft - 10, cartTop - POLE_LEN - POLE_TIP_R - 10, CART_W + 20, CART_H + POLE_LEN + POLE_TIP_R + 20, 10)
        ctx.stroke()
        ctx.shadowBlur = 0
      }
    } else {
      // ── Fell state — cart + pole at final angle, dimmed with red pole ──
      ctx.globalAlpha = 0.6

      // Cart body (dimmed)
      ctx.fillStyle = pal.cartBody
      ctx.strokeStyle = pal.cartStroke
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(cartLeft, cartTop, CART_W, CART_H, 4)
      ctx.fill()
      ctx.stroke()

      // Wheels (dimmed)
      ctx.fillStyle = pal.wheelColor
      ctx.strokeStyle = pal.wheelStroke
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(wheelLx, wheelY, WHEEL_R, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(wheelRx, wheelY, WHEEL_R, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      ctx.globalAlpha = 1

      // Pole in red (fallen angle)
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = POLE_W
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(hingeX, hingeY)
      ctx.lineTo(tipX, tipY)
      ctx.stroke()

      // Pole tip in red
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.arc(tipX, tipY, POLE_TIP_R, 0, Math.PI * 2)
      ctx.fill()

      // Hinge
      ctx.fillStyle = pal.cartStroke
      ctx.beginPath()
      ctx.arc(hingeX, hingeY, 4, 0, Math.PI * 2)
      ctx.fill()
    }

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
      ctx.fillText(`500 steps \u2014 perfectly balanced!`, w / 2, h * 0.38 + 40)
    }

    // ── State overlay (top-left) ──
    ctx.font = '12px monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillStyle = pal.hudText
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
        style={{ display: 'block', margin: '0 auto', maxWidth: '100%', height: 'auto' }}
      />
    </div>
  )
}
