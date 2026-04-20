export interface KdeResult {
  grid: Float64Array;
  density: Float64Array;
}

const TAU = Math.PI * 2;

export function circularKde(
  huesRad: number[] | Float64Array,
  bwRad: number,
  n = 720,
): KdeResult {
  const grid = new Float64Array(n);
  for (let i = 0; i < n; i++) grid[i] = (TAU * i) / n;

  const density = new Float64Array(n);
  const N = huesRad.length;
  if (N === 0 || bwRad <= 0) return { grid, density };

  const inv2s2 = 1 / (2 * bwRad * bwRad);
  const norm = 1 / (N * bwRad * Math.sqrt(TAU));

  for (let i = 0; i < N; i++) {
    const h = huesRad[i];
    for (let k = -1; k <= 1; k++) {
      const center = h + k * TAU;
      for (let j = 0; j < n; j++) {
        const d = grid[j] - center;
        density[j] += Math.exp(-d * d * inv2s2);
      }
    }
  }
  for (let j = 0; j < n; j++) density[j] *= norm;
  return { grid, density };
}

export function weightedCircularKde(
  huesRad: number[] | Float64Array,
  weights: number[] | Float64Array,
  bwRad: number,
  n = 720,
): KdeResult {
  const grid = new Float64Array(n);
  for (let i = 0; i < n; i++) grid[i] = (TAU * i) / n;

  const density = new Float64Array(n);
  if (huesRad.length !== weights.length) {
    throw new Error("weightedCircularKde: huesRad and weights length mismatch");
  }
  if (huesRad.length === 0 || bwRad <= 0) return { grid, density };

  let totalW = 0;
  for (let i = 0; i < weights.length; i++) totalW += weights[i];
  if (totalW <= 0) return { grid, density };

  const inv2s2 = 1 / (2 * bwRad * bwRad);
  const norm = 1 / (totalW * bwRad * Math.sqrt(TAU));

  for (let i = 0; i < huesRad.length; i++) {
    const h = huesRad[i];
    const w = weights[i];
    if (w === 0) continue;
    for (let k = -1; k <= 1; k++) {
      const center = h + k * TAU;
      for (let j = 0; j < n; j++) {
        const d = grid[j] - center;
        density[j] += w * Math.exp(-d * d * inv2s2);
      }
    }
  }
  for (let j = 0; j < n; j++) density[j] *= norm;
  return { grid, density };
}

export function searchsorted(grid: Float64Array, theta: number): number {
  let lo = 0;
  let hi = grid.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (grid[mid] < theta) lo = mid + 1;
    else hi = mid;
  }
  if (lo >= grid.length) return grid.length - 1;
  return lo;
}
