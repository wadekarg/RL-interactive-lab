// Extended CartPole benchmark — Q-Learning needs more episodes
const GRAVITY=9.8,MASS_CART=1.0,MASS_POLE=0.1,TOTAL_MASS=1.1
const HALF_POLE=0.5,POLE_ML=0.05,FORCE=10.0,DT=0.02
const THETA_MAX=12*Math.PI/180,X_MAX=2.4,MAX_STEPS=500

function rnd(){return(Math.random()-0.5)*0.1}
function resetEnv(){return{x:rnd(),xDot:rnd(),theta:rnd(),thetaDot:rnd()}}
function stepEnv(s,action){
  const{x,xDot,theta,thetaDot}=s
  const force=action===1?FORCE:-FORCE
  const cosT=Math.cos(theta),sinT=Math.sin(theta)
  const temp=(force+POLE_ML*thetaDot*thetaDot*sinT)/TOTAL_MASS
  const thetaAcc=(GRAVITY*sinT-cosT*temp)/(HALF_POLE*(4/3-MASS_POLE*cosT*cosT/TOTAL_MASS))
  const xAcc=temp-POLE_ML*thetaAcc*cosT/TOTAL_MASS
  const ns={x:x+DT*xDot,xDot:xDot+DT*xAcc,theta:theta+DT*thetaDot,thetaDot:thetaDot+DT*thetaAcc}
  return{ns,done:Math.abs(ns.theta)>THETA_MAX||Math.abs(ns.x)>X_MAX}
}
function bin(v,lo,hi,n){return Math.min(n-1,Math.floor(Math.max(0,Math.min(1,(v-lo)/(hi-lo)))*n))}
function disc(s,xB,vB,tB,wB){return`${bin(s.x,-2.4,2.4,xB)},${bin(s.xDot,-3,3,vB)},${bin(s.theta,-THETA_MAX,THETA_MAX,tB)},${bin(s.thetaDot,-3.5,3.5,wB)}`}
function feat(s){const xN=s.x/2.4,vN=s.xDot/3,tN=s.theta/THETA_MAX,wN=s.thetaDot/3.5;return[1,xN,vN,tN,wN,tN*tN,wN*wN]}
function softmax(l){const m=Math.max(...l),e=l.map(x=>Math.exp(x-m)),s=e.reduce((a,b)=>a+b,0);return e.map(x=>x/s)}

function solve(lengths){
  // Rolling 100-ep mean ≥ 475 = well solved (not just lucky)
  for(let i=99;i<lengths.length;i++){
    const avg=lengths.slice(i-99,i+1).reduce((a,b)=>a+b,0)/100
    if(avg>=475)return i+1
  }
  return -1
}
function meanLast(lengths,n=100){
  const l=lengths.slice(-n); return Math.round(l.reduce((a,b)=>a+b,0)/l.length)
}
function first500(lengths){const i=lengths.findIndex(l=>l>=500);return i===-1?'—':i+1}

// ─── Q-Learning ──────────────────────────────────────────────────────────────
function runQL(cfg,totalEps){
  const{alpha,gamma,eps0,decay,epsMin,xB=6,vB=6,tB=12,wB=12}=cfg
  const Q=new Map(),getQ=k=>{if(!Q.has(k))Q.set(k,[0,0]);return Q.get(k)}
  let eps=eps0,epN=0
  const lens=[]
  for(let ep=0;ep<totalEps;ep++){
    let s=resetEnv(),steps=0
    while(steps<MAX_STEPS){
      const k=disc(s,xB,vB,tB,wB)
      const q=getQ(k)
      const action=Math.random()<eps?(Math.random()<0.5?0:1):(q[0]>=q[1]?0:1)
      const{ns,done}=stepEnv(s,action)
      steps++
      const nk=disc(ns,xB,vB,tB,wB),nq=getQ(nk)
      const target=done?1:1+gamma*Math.max(...nq)
      q[action]+=alpha*(target-q[action])
      s=ns
      if(done)break
    }
    lens.push(steps)
    epN++
    eps=Math.max(epsMin,eps0*Math.pow(decay,epN))
  }
  return lens
}

// ─── REINFORCE ────────────────────────────────────────────────────────────────
function runRF(cfg,totalEps){
  const{lr,gamma}=cfg
  const W=[[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]]
  let baseline=0,epN=0
  const lens=[]
  for(let ep=0;ep<totalEps;ep++){
    let s=resetEnv()
    const traj=[]
    let steps=0
    while(steps<MAX_STEPS){
      const phi=feat(s)
      const probs=softmax(W.map(w=>w.reduce((sum,wi,i)=>sum+wi*phi[i],0)))
      const action=Math.random()<probs[0]?0:1
      const{ns,done}=stepEnv(s,action)
      steps++
      traj.push({action,phi})
      s=ns
      if(done)break
    }
    lens.push(steps)
    const T=traj.length
    const G=new Array(T)
    let g=0
    for(let t=T-1;t>=0;t--){g=1+gamma*g;G[t]=g}
    epN++
    baseline+=(G[0]-baseline)/epN
    for(let t=0;t<T;t++){
      const{action:a,phi}=traj[t]
      const adv=G[t]-baseline
      const probs=softmax(W.map(w=>w.reduce((sum,wi,i)=>sum+wi*phi[i],0)))
      for(let j=0;j<2;j++){
        const grad=((j===a?1:0)-probs[j])*adv
        for(let f=0;f<7;f++)W[j][f]+=lr*grad*phi[f]
      }
    }
  }
  return lens
}

function avgRuns(cfg,runFn,totalEps,runs=5){
  let tot=null
  for(let r=0;r<runs;r++){
    const ls=runFn(cfg,totalEps)
    if(!tot)tot=ls.map(()=>0)
    ls.forEach((l,i)=>tot[i]+=l/runs)
  }
  return tot
}

// ─── Q-Learning extended (3000 eps) ──────────────────────────────────────────
console.log('\n══════════════════════════════════════════════════════════════')
console.log('  Q-LEARNING  (3000 episodes, avg 5 seeds)')
console.log('══════════════════════════════════════════════════════════════')

const qlCfgs=[
  {label:'α=0.1  γ=0.99 ε₀=1.0 d=0.995',alpha:0.1,gamma:0.99,eps0:1.0,decay:0.995,epsMin:0.01},
  {label:'α=0.2  γ=0.99 ε₀=1.0 d=0.995',alpha:0.2,gamma:0.99,eps0:1.0,decay:0.995,epsMin:0.01},
  {label:'α=0.3  γ=0.99 ε₀=1.0 d=0.995',alpha:0.3,gamma:0.99,eps0:1.0,decay:0.995,epsMin:0.01},
  {label:'α=0.1  γ=0.99 ε₀=1.0 d=0.998',alpha:0.1,gamma:0.99,eps0:1.0,decay:0.998,epsMin:0.01},
  {label:'α=0.2  γ=0.99 ε₀=1.0 d=0.998',alpha:0.2,gamma:0.99,eps0:1.0,decay:0.998,epsMin:0.01},
  {label:'α=0.1  γ=0.99 bins 4×4×8×8',  alpha:0.1,gamma:0.99,eps0:1.0,decay:0.995,epsMin:0.01,xB:4,vB:4,tB:8,wB:8},
  {label:'α=0.2  γ=0.99 bins 4×4×8×8',  alpha:0.2,gamma:0.99,eps0:1.0,decay:0.995,epsMin:0.01,xB:4,vB:4,tB:8,wB:8},
]

console.log(`\n  ${'Config'.padEnd(38)} | ${'mean(last100)'.padEnd(14)} ${'solved@100avg≥475'.padEnd(20)} ${'first500'}`)
console.log('  '+'─'.repeat(85))
for(const cfg of qlCfgs){
  const lens=avgRuns(cfg,runQL,3000,5)
  const ml=meanLast(lens,100), sv=solve(lens), f5=first500(lens)
  const svStr=sv===-1?'—':String(sv)
  console.log(`  ${cfg.label.padEnd(38)} | ${String(ml).padEnd(14)} ${svStr.padEnd(20)} ${f5}`)
}

// ─── REINFORCE extended (1000 eps) ────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════════════════════')
console.log('  REINFORCE  (1000 episodes, avg 5 seeds)')
console.log('══════════════════════════════════════════════════════════════')

const rfCfgs=[
  {label:'lr=0.001 γ=0.99', lr:0.001,gamma:0.99},
  {label:'lr=0.002 γ=0.99', lr:0.002,gamma:0.99},
  {label:'lr=0.003 γ=0.99', lr:0.003,gamma:0.99},
  {label:'lr=0.005 γ=0.99', lr:0.005,gamma:0.99},
  {label:'lr=0.005 γ=0.97', lr:0.005,gamma:0.97},
  {label:'lr=0.005 γ=0.95', lr:0.005,gamma:0.95},
  {label:'lr=0.008 γ=0.97', lr:0.008,gamma:0.97},
  {label:'lr=0.010 γ=0.97', lr:0.010,gamma:0.97},
  {label:'lr=0.010 γ=0.95', lr:0.010,gamma:0.95},
  {label:'lr=0.015 γ=0.95', lr:0.015,gamma:0.95},
]

console.log(`\n  ${'Config'.padEnd(20)} | ${'mean(last100)'.padEnd(14)} ${'solved@100avg≥475'.padEnd(20)} ${'first500'}`)
console.log('  '+'─'.repeat(65))
for(const cfg of rfCfgs){
  const lens=avgRuns(cfg,runRF,1000,5)
  const ml=meanLast(lens,100), sv=solve(lens), f5=first500(lens)
  const svStr=sv===-1?'—':String(sv)
  console.log(`  ${cfg.label.padEnd(20)} | ${String(ml).padEnd(14)} ${svStr.padEnd(20)} ${f5}`)
}

console.log('\nDone.\n')
