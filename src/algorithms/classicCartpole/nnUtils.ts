/**
 * nnUtils.ts — Shared neural network primitives for CartPole deep RL agents.
 *
 * All weight matrices are stored as flat number[] in row-major order:
 *   W[i * inSize + j] = weight connecting input j to output unit i
 */

// ─── Forward pass helpers ────────────────────────────────────────────────────

/**
 * Linear layer: y[i] = sum_j W[i*inSize+j] * x[j] + b[i]
 */
export function linear(
  W: number[],
  b: number[],
  x: number[],
  outSize: number,
  inSize: number,
): number[] {
  const y = new Array<number>(outSize)
  for (let i = 0; i < outSize; i++) {
    let sum = b[i]
    const offset = i * inSize
    for (let j = 0; j < inSize; j++) {
      sum += W[offset + j] * x[j]
    }
    y[i] = sum
  }
  return y
}

/** ReLU activation: max(0, x) */
export function relu(x: number[]): number[] {
  return x.map((v) => (v > 0 ? v : 0))
}

/** Softmax with numerical stability (subtract max) */
export function softmax(logits: number[]): number[] {
  const maxLogit = Math.max(...logits)
  const exps = logits.map((v) => Math.exp(v - maxLogit))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum)
}

// ─── Backward pass helpers ───────────────────────────────────────────────────

/**
 * Backpropagate gradient through a linear layer.
 * Computes W^T @ delta (gradient w.r.t. layer input).
 * W: [outSize * inSize], delta: [outSize], returns: [inSize]
 */
export function linearBackward(
  W: number[],
  delta: number[],
  outSize: number,
  inSize: number,
): number[] {
  const dx = new Array<number>(inSize).fill(0)
  for (let j = 0; j < inSize; j++) {
    let sum = 0
    for (let i = 0; i < outSize; i++) {
      sum += W[i * inSize + j] * delta[i]
    }
    dx[j] = sum
  }
  return dx
}

/**
 * Accumulate weight gradients: dW[i*inSize+j] += delta[i] * x[j]
 * (in-place addition into dW)
 */
export function accumWeightGrad(
  dW: number[],
  delta: number[],
  x: number[],
  outSize: number,
  inSize: number,
): void {
  for (let i = 0; i < outSize; i++) {
    const di = delta[i]
    const offset = i * inSize
    for (let j = 0; j < inSize; j++) {
      dW[offset + j] += di * x[j]
    }
  }
}

/** Accumulate bias gradients: db[i] += delta[i] (in-place) */
export function accumBiasGrad(db: number[], delta: number[]): void {
  for (let i = 0; i < delta.length; i++) {
    db[i] += delta[i]
  }
}

// ─── Initialization ──────────────────────────────────────────────────────────

/** He initialization: N(0, sqrt(2/fanIn)) — good for ReLU layers */
export function heInit(outSize: number, inSize: number): number[] {
  const std = Math.sqrt(2.0 / inSize)
  const W = new Array<number>(outSize * inSize)
  for (let i = 0; i < W.length; i++) {
    // Box-Muller transform for standard normal
    const u1 = Math.random() + 1e-10
    const u2 = Math.random()
    W[i] = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * std
  }
  return W
}

/** Zero initialization (for biases) */
export function zerosInit(size: number): number[] {
  return new Array<number>(size).fill(0)
}

// ─── Adam optimizer ──────────────────────────────────────────────────────────

export interface AdamState {
  m: number[]  // first moment (mean of gradients)
  v: number[]  // second moment (mean of squared gradients)
  t: number    // step counter
}

export function adamInit(size: number): AdamState {
  return {
    m: new Array<number>(size).fill(0),
    v: new Array<number>(size).fill(0),
    t: 0,
  }
}

/**
 * Adam update — modifies params in-place.
 * params -= lr * m_hat / (sqrt(v_hat) + eps)
 */
export function adamUpdate(
  params: number[],
  grads: number[],
  state: AdamState,
  lr: number,
  beta1 = 0.9,
  beta2 = 0.999,
  eps = 1e-8,
): void {
  state.t++
  const bc1 = 1 - Math.pow(beta1, state.t)
  const bc2 = 1 - Math.pow(beta2, state.t)
  for (let i = 0; i < params.length; i++) {
    state.m[i] = beta1 * state.m[i] + (1 - beta1) * grads[i]
    state.v[i] = beta2 * state.v[i] + (1 - beta2) * grads[i] * grads[i]
    const mHat = state.m[i] / bc1
    const vHat = state.v[i] / bc2
    params[i] -= lr * mHat / (Math.sqrt(vHat) + eps)
  }
}

// ─── Sampling ────────────────────────────────────────────────────────────────

/** Sample an index from a categorical distribution */
export function sampleCategorical(probs: number[]): number {
  const r = Math.random()
  let cumsum = 0
  for (let i = 0; i < probs.length; i++) {
    cumsum += probs[i]
    if (r < cumsum) return i
  }
  return probs.length - 1
}
