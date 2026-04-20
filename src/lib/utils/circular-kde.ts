export interface KdeResult {
  grid: Float64Array;
  density: Float64Array;
}

const TAU = Math.PI * 2;
const KERNEL_SIGMAS = 4;

function buildGrid(n: number): Float64Array {
  const grid = new Float64Array(n);
  const dGrid = TAU / n;
  for (let i = 0; i < n; i++) grid[i] = dGrid * i;
  return grid;
}

export function circularKde(
  huesRad: number[] | Float64Array,
  bwRad: number,
  n = 720,
): KdeResult {
  const N = huesRad.length;
  const weights = new Float64Array(N);
  for (let i = 0; i < N; i++) weights[i] = 1;
  return weightedCircularKde(huesRad, weights, bwRad, n);
}

export function weightedCircularKde(
  huesRad: number[] | Float64Array,
  weights: number[] | Float64Array,
  bwRad: number,
  n = 720,
): KdeResult {
  if (huesRad.length !== weights.length) {
    throw new Error("weightedCircularKde: huesRad and weights length mismatch");
  }

  const grid = buildGrid(n);
  const density = new Float64Array(n);
  if (huesRad.length === 0 || bwRad <= 0) return { grid, density };

  const dGrid = TAU / n;

  const hist = new Float64Array(n);
  let totalW = 0;
  for (let i = 0; i < weights.length; i++) {
    const w = weights[i];
    if (w === 0) continue;
    let h = huesRad[i] % TAU;
    if (h < 0) h += TAU;
    const j = Math.round(h / dGrid) % n;
    hist[j] += w;
    totalW += w;
  }
  if (totalW <= 0) return { grid, density };

  const inv2s2 = 1 / (2 * bwRad * bwRad);
  const halfCells = Math.min(
    n >> 1,
    Math.max(1, Math.ceil((KERNEL_SIGMAS * bwRad) / dGrid)),
  );
  const kernel = new Float64Array(2 * halfCells + 1);
  for (let dj = -halfCells; dj <= halfCells; dj++) {
    const d = dj * dGrid;
    kernel[dj + halfCells] = Math.exp(-d * d * inv2s2);
  }

  for (let j = 0; j < n; j++) {
    const hj = hist[j];
    if (hj === 0) continue;
    for (let dj = -halfCells; dj <= halfCells; dj++) {
      let k = j + dj;
      if (k < 0) k += n;
      else if (k >= n) k -= n;
      density[k] += hj * kernel[dj + halfCells];
    }
  }

  const norm = 1 / (totalW * bwRad * Math.sqrt(TAU));
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
