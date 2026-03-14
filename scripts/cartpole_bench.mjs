// CartPole hyperparameter benchmark
// Tests Q-Learning and REINFORCE with multiple configs, reports convergence stats

// ─── Physics (exact match to classicCartpole.ts) ──────────────────────────────
const GRAVITY = 9.8, MASS_CART = 1.0, MASS_POLE = 0.1
const TOTAL_MASS = MASS_CART + MASS_POLE
const HALF_POLE = 0.5, POLE_ML = MASS_POLE * HALF_POLE
const FORCE = 10.0, DT = 0.02
const THETA_MAX = 12 * Math.PI / 180, X_MAX = 2.4, MAX_STEPS = 500

function resetEnv() {
  return { x: rnd(), xDot: rnd(), theta: rnd(), thetaDot: rnd() }
}
function rnd() { return (Math.random() - 0.5) * 0.1 }

function stepEnv(s, action) {
  const { x, xDot, theta, thetaDot } = s
  const force = action === 1 ? FORCE : -FORCE
  const cosT = Math.cos(theta), sinT = Math.sin(theta)
  const temp = (force + POLE_ML * thetaDot * thetaDot * sinT) / TOTAL_MASS
  const thetaAcc = (GRAVITY * sinT - cosT * temp) /
    (HALF_POLE * (4/3 - MASS_POLE * cosT * cosT / TOTAL_MASS))
  const xAcc = temp - POLE_ML * thetaAcc * cosT / TOTAL_MASS
  const ns = {
    x: x + DT * xDot,
    xDot: xDot + DT * xAcc,
    theta: theta + DT * thetaDot,
    thetaDot: thetaDot + DT * thetaAcc,
  }
  const done = Math.abs(ns.theta) > THETA_MAX || Math.abs(ns.x) > X_MAX
  return { ns, done }
}

// ─── Discretization ───────────────────────────────────────────────────────────
function bin(v, lo, hi, n) {
  return Math.min(n - 1, Math.floor(Math.max(0, Math.min(1, (v - lo) / (hi - lo))) * n))
}
function disc(s, xB, vB, tB, wB) {
  return `${bin(s.x,-2.4,2.4,xB)},${bin(s.xDot,-3,3,vB)},${bin(s.theta,-THETA_MAX,THETA_MAX,tB)},${bin(s.thetaDot,-3.5,3.5,wB)}`
}

// ─── Q-Learning ───────────────────────────────────────────────────────────────
function runQL(cfg, totalEpisodes = 600) {
  const { alpha, gamma, eps0, decay, epsMin, xB=6, vB=6, tB=12, wB=12 } = cfg
  const Q = new Map()
  const getQ = k => { if (!Q.has(k)) Q.set(k, [0, 0]); return Q.get(k) }
  let eps = eps0, epCount = 0
  const lengths = []

  for (let ep = 0; ep < totalEpisodes; ep++) {
    let s = resetEnv(), steps = 0
    while (steps < MAX_STEPS) {
      const k = disc(s, xB, vB, tB, wB)
      const action = Math.random() < eps ? (Math.random() < 0.5 ? 0 : 1)
        : (getQ(k)[0] >= getQ(k)[1] ? 0 : 1)
      const { ns, done } = stepEnv(s, action)
      steps++
      const nk = disc(ns, xB, vB, tB, wB)
      const q = getQ(k), nq = getQ(nk)
      const target = (done && steps < MAX_STEPS) ? 1 : 1 + gamma * Math.max(...nq)
      q[action] += alpha * (target - q[action])
      s = ns
      if (done) break
    }
    lengths.push(steps)
    epCount++
    eps = Math.max(epsMin, eps0 * Math.pow(decay, epCount))
  }
  return lengths
}

// ─── REINFORCE ────────────────────────────────────────────────────────────────
function feat(s) {
  const xN = s.x / 2.4, vN = s.xDot / 3.0
  const tN = s.theta / THETA_MAX, wN = s.thetaDot / 3.5
  return [1, xN, vN, tN, wN, tN*tN, wN*wN]
}
function softmax(l) {
  const m = Math.max(...l), exps = l.map(x => Math.exp(x - m))
  const s = exps.reduce((a,b)=>a+b,0); return exps.map(e=>e/s)
}

function runReinforce(cfg, totalEpisodes = 600) {
  const { lr, gamma } = cfg
  const W = [[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]]
  let baseline = 0, epCount = 0
  const lengths = []

  for (let ep = 0; ep < totalEpisodes; ep++) {
    let s = resetEnv()
    const traj = []
    let steps = 0
    while (steps < MAX_STEPS) {
      const phi = feat(s)
      const logits = W.map(w => w.reduce((sum,wi,i)=>sum+wi*phi[i],0))
      const probs = softmax(logits)
      const action = Math.random() < probs[0] ? 0 : 1
      const { ns, done } = stepEnv(s, action)
      steps++
      traj.push({ s, action, phi })
      s = ns
      if (done) break
    }
    lengths.push(steps)

    // Compute returns
    const T = traj.length
    const G = new Array(T)
    let g = 0
    for (let t = T-1; t >= 0; t--) { g = 1 + gamma * g; G[t] = g }

    epCount++
    baseline += (G[0] - baseline) / epCount

    for (let t = 0; t < T; t++) {
      const { action: a, phi } = traj[t]
      const adv = G[t] - baseline
      const logits = W.map(w => w.reduce((sum,wi,i)=>sum+wi*phi[i],0))
      const probs = softmax(logits)
      for (let j = 0; j < 2; j++) {
        const grad = ((j===a?1:0) - probs[j]) * adv
        for (let f = 0; f < 7; f++) W[j][f] += lr * grad * phi[f]
      }
    }
  }
  return lengths
}

// ─── Stats helper ─────────────────────────────────────────────────────────────
function stats(lengths, window = 100) {
  const last = lengths.slice(-window)
  const mean = last.reduce((a,b)=>a+b,0)/last.length
  // First episode where rolling mean over last 50 eps >= 195 (standard benchmark)
  let firstSolved = -1
  for (let i = 49; i < lengths.length; i++) {
    const avg = lengths.slice(i-49, i+1).reduce((a,b)=>a+b,0)/50
    if (avg >= 195 && firstSolved === -1) firstSolved = i + 1
  }
  // First single episode to reach 500
  const first500 = lengths.findIndex(l => l >= 500)
  return { meanLast100: Math.round(mean), firstSolved, first500: first500 === -1 ? '—' : first500+1 }
}

// ─── Run grid search ──────────────────────────────────────────────────────────
const RUNS = 3  // average over multiple seeds for reliability
const EPS = 600

function avg(configs, runFn) {
  return configs.map(cfg => {
    let totalLengths = null
    for (let r = 0; r < RUNS; r++) {
      const ls = runFn(cfg, EPS)
      if (!totalLengths) totalLengths = ls.map(()=>0)
      ls.forEach((l,i) => totalLengths[i] += l / RUNS)
    }
    return { cfg, ...stats(totalLengths) }
  })
}

// ─── Q-Learning grid ──────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════')
console.log('  DISCRETIZED Q-LEARNING  (600 episodes, avg 3 seeds)')
console.log('═══════════════════════════════════════════════════════')

const qlConfigs = [
  { alpha:0.05, gamma:0.99, eps0:1.0, decay:0.995, epsMin:0.01 },
  { alpha:0.10, gamma:0.99, eps0:1.0, decay:0.995, epsMin:0.01 },
  { alpha:0.15, gamma:0.99, eps0:1.0, decay:0.995, epsMin:0.01 },
  { alpha:0.20, gamma:0.99, eps0:1.0, decay:0.995, epsMin:0.01 },
  { alpha:0.10, gamma:0.95, eps0:1.0, decay:0.995, epsMin:0.01 },
  { alpha:0.10, gamma:0.99, eps0:1.0, decay:0.990, epsMin:0.01 },
  { alpha:0.10, gamma:0.99, eps0:1.0, decay:0.999, epsMin:0.01 },
  { alpha:0.10, gamma:0.99, eps0:0.5, decay:0.995, epsMin:0.01 },
  { alpha:0.10, gamma:0.99, eps0:1.0, decay:0.995, epsMin:0.05 },
  // Bin count variations
  { alpha:0.10, gamma:0.99, eps0:1.0, decay:0.995, epsMin:0.01, xB:4, vB:4, tB:8, wB:8 },
  { alpha:0.10, gamma:0.99, eps0:1.0, decay:0.995, epsMin:0.01, xB:8, vB:8, tB:16, wB:16 },
]

const qlResults = avg(qlConfigs, runQL)
console.log(`\n  ${'alpha'.padEnd(6)} ${'gamma'.padEnd(6)} ${'ε₀'.padEnd(5)} ${'decay'.padEnd(6)} ${'εMin'.padEnd(6)} ${'bins'.padEnd(14)} | ${'meanLast100'.padEnd(12)} ${'firstSolved'.padEnd(12)} ${'first500'}`)
console.log('  ' + '─'.repeat(90))
qlResults.forEach(({ cfg, meanLast100, firstSolved, first500 }) => {
  const xB = cfg.xB||6, vB = cfg.vB||6, tB = cfg.tB||12, wB = cfg.wB||12
  const bins = `${xB}×${vB}×${tB}×${wB}`
  const fs = firstSolved === -1 ? '—' : String(firstSolved)
  console.log(
    `  ${String(cfg.alpha).padEnd(6)} ${String(cfg.gamma).padEnd(6)} ${String(cfg.eps0).padEnd(5)} ${String(cfg.decay).padEnd(6)} ${String(cfg.epsMin).padEnd(6)} ${bins.padEnd(14)} | ${String(meanLast100).padEnd(12)} ${fs.padEnd(12)} ${first500}`
  )
})

// ─── REINFORCE grid ───────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════')
console.log('  REINFORCE  (600 episodes, avg 3 seeds)')
console.log('═══════════════════════════════════════════════════════')

const rfConfigs = [
  { lr:0.001, gamma:0.99 },
  { lr:0.003, gamma:0.99 },
  { lr:0.005, gamma:0.99 },
  { lr:0.010, gamma:0.99 },
  { lr:0.020, gamma:0.99 },
  { lr:0.050, gamma:0.99 },
  { lr:0.005, gamma:0.95 },
  { lr:0.005, gamma:0.97 },
  { lr:0.010, gamma:0.97 },
  { lr:0.020, gamma:0.97 },
]

const rfResults = avg(rfConfigs, runReinforce)
console.log(`\n  ${'lr'.padEnd(8)} ${'gamma'.padEnd(7)} | ${'meanLast100'.padEnd(12)} ${'firstSolved'.padEnd(12)} ${'first500'}`)
console.log('  ' + '─'.repeat(55))
rfResults.forEach(({ cfg, meanLast100, firstSolved, first500 }) => {
  const fs = firstSolved === -1 ? '—' : String(firstSolved)
  console.log(
    `  ${String(cfg.lr).padEnd(8)} ${String(cfg.gamma).padEnd(7)} | ${String(meanLast100).padEnd(12)} ${fs.padEnd(12)} ${first500}`
  )
})

console.log('\nDone.\n')
