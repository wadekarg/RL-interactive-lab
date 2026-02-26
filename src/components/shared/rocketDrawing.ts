import type { Theme } from '../../store/themeStore'

// ─── Theme palettes ─────────────────────────────────────────────────────────

export type RocketPalette = {
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

export const PALETTES: Record<Theme, RocketPalette> = {
  dark: {
    skyTop: '#060a1f',
    skyBottom: '#141830',
    stars: 'rgba(255,255,255,0.6)',
    ground: '#1a2a1a',
    groundLight: '#2a3a28',
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
    ground: '#7a9a60',
    groundLight: '#90b070',
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
    ground: '#2a2820',
    groundLight: '#3a3830',
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

// ─── Rocket dimensions ─────────────────────────────────────────────────────

export const ROCKET_H = 90
export const ROCKET_W = 28
export const NOSE_H = 24
export const FIN_H = 26
export const FIN_W = 14
export const NOZZLE_H = 12
export const NOZZLE_W = 18
export const WINDOW_R = 6

// ─── Rocket drawing helper ──────────────────────────────────────────────────

export function drawRocket(ctx: CanvasRenderingContext2D, pal: RocketPalette) {
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
