export type Vec3 = readonly [number, number, number];

export interface Camera {
  target: Vec3;
  yaw: number;
  pitch: number;
  distance: number;
  fovY: number;
}

export interface Projected {
  x: number;
  y: number;
  depth: number;
  visible: boolean;
}

const EPS = 1e-3;

export function defaultCamera(): Camera {
  return {
    target: [0.5, 0.5, 0.5],
    yaw: Math.PI / 4,
    pitch: Math.PI / 6,
    distance: 2.4,
    fovY: (50 * Math.PI) / 180,
  };
}

export function cameraPosition(cam: Camera): Vec3 {
  const cp = Math.cos(cam.pitch);
  const sp = Math.sin(cam.pitch);
  const cy = Math.cos(cam.yaw);
  const sy = Math.sin(cam.yaw);
  
  return [
    cam.target[0] - cam.distance * cp * cy,
    cam.target[1] - cam.distance * sp,
    cam.target[2] - cam.distance * cp * sy,
  ];
}

interface Basis {
  origin: Vec3;
  forward: Vec3;
  right: Vec3;
  up: Vec3;
}

// orthonormal camera basis derived from yaw/pitch
export function cameraBasis(cam: Camera): Basis {
  const cp = Math.cos(cam.pitch);
  const sp = Math.sin(cam.pitch);
  const cy = Math.cos(cam.yaw);
  const sy = Math.sin(cam.yaw);
  const forward: Vec3 = [cp * cy, sp, cp * sy];
  
  const wx = 0;
  const wy = 1;
  const wz = 0;
  let rx = forward[1] * wz - forward[2] * wy;
  let ry = forward[2] * wx - forward[0] * wz;
  let rz = forward[0] * wy - forward[1] * wx;
  const rl = Math.hypot(rx, ry, rz) || 1;
  rx /= rl;
  ry /= rl;
  rz /= rl;
  
  const ux = ry * forward[2] - rz * forward[1];
  const uy = rz * forward[0] - rx * forward[2];
  const uz = rx * forward[1] - ry * forward[0];
  return {
    origin: cameraPosition(cam),
    forward,
    right: [rx, ry, rz],
    up: [ux, uy, uz],
  };
}

// pinhole project a world-space point given a precomputed basis
export function projectWithBasis(
  p: Vec3,
  basis: Basis,
  cam: Camera,
  width: number,
  height: number,
): Projected {
  const dx = p[0] - basis.origin[0];
  const dy = p[1] - basis.origin[1];
  const dz = p[2] - basis.origin[2];
  const fz = dx * basis.forward[0] + dy * basis.forward[1] + dz * basis.forward[2];
  const rx = dx * basis.right[0] + dy * basis.right[1] + dz * basis.right[2];
  const uy = dx * basis.up[0] + dy * basis.up[1] + dz * basis.up[2];
  if (fz <= EPS) {
    return { x: 0, y: 0, depth: fz, visible: false };
  }
  const focal = height / (2 * Math.tan(cam.fovY / 2));
  const sx = width / 2 + (rx * focal) / fz;
  const sy = height / 2 - (uy * focal) / fz;
  return { x: sx, y: sy, depth: fz, visible: true };
}

// convenience: build basis once, project many points
export function projectAll(
  points: readonly Vec3[],
  cam: Camera,
  width: number,
  height: number,
): Projected[] {
  const basis = cameraBasis(cam);
  return points.map((p) => projectWithBasis(p, basis, cam, width, height));
}

export function clampPitch(p: number): number {
  const lim = Math.PI / 2 - 0.05;
  return Math.max(-lim, Math.min(lim, p));
}

export const CUBE_CORNERS: Vec3[] = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 1, 0],
  [1, 1, 0],
  [0, 0, 1],
  [1, 0, 1],
  [0, 1, 1],
  [1, 1, 1],
];

// pairs of corner indices forming the 12 edges of the unit cube
export const CUBE_EDGES: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [0, 2], [0, 4],
  [1, 3], [1, 5],
  [2, 3], [2, 6],
  [3, 7],
  [4, 5], [4, 6],
  [5, 7],
  [6, 7],
];
