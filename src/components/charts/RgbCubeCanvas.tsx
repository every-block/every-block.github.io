import { useEffect, useMemo, useRef, useState } from "react";
import type { Block, Vote } from "../../data/types";
import { useTimeStore } from "../../state/timeStore";
import { useGroupStore } from "../../state/groupStore";
import {
  cameraBasis,
  clampPitch,
  CUBE_CORNERS,
  CUBE_EDGES,
  defaultCamera,
  projectWithBasis,
  type Camera,
  type Vec3,
} from "../../lib/canvas3d";
import { rgbToCss } from "../../lib/color";
import { GroupedBadge } from "../GroupToggle";

interface Props {
  allVotes: Vote[];
  imageVersion: number;
  groupRepBlockByKey: Map<string, Block | null>;
}

interface Entity {
  key: string;
  name: string;
  rgb: readonly [number, number, number];
  image: HTMLImageElement | null | false;
  votes: number;
}

interface Hover {
  entity: Entity;
  x: number;
  y: number;
}

const MIN_SIZE = 14;
const MAX_SIZE = 44;
const ABS_MAX_SIZE = 72;

function spriteSize(votes: number, maxVotes: number, depth: number): number {
  const t = maxVotes > 0 ? Math.sqrt(votes / maxVotes) : 0;
  const baseSize = MIN_SIZE + t * (MAX_SIZE - MIN_SIZE);
  return Math.max(MIN_SIZE * 0.6, Math.min(ABS_MAX_SIZE, baseSize / depth));
}

export function RgbCubeCanvas({
  allVotes,
  imageVersion,
  groupRepBlockByKey,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cameraRef = useRef<Camera>(defaultCamera());
  const sizeRef = useRef({ w: 0, h: 0 });
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const hoverRef = useRef<Hover | null>(null);
  const [hoverState, setHoverState] = useState<Hover | null>(null);

  const group = useGroupStore((s) => s.group);

  const sortedTimes = useMemo(
    () => allVotes.map((v) => v.timestamp),
    [allVotes],
  );
  const currentTime = useTimeStore((s) => s.currentTime);
  const { entities, maxVotes } = useMemo(() => {
    const cutoff = upperBoundIndex(sortedTimes, currentTime);
    if (group) {
      type Accum = {
        key: string;
        name: string;
        rSum: number;
        gSum: number;
        bSum: number;
        votes: number;
        imgBlock: Block;
      };
      const m = new Map<string, Accum>();
      let max = 0;
      for (let i = 0; i <= cutoff; i++) {
        const v = allVotes[i];
        const id = v.block.groupKey ?? v.block.key;
        const nm = v.block.groupName ?? v.block.name;
        const [r, g, b] = v.block.rgb;
        const e = m.get(id);
        if (e) {
          e.rSum += r;
          e.gSum += g;
          e.bSum += b;
          e.votes += 1;
          if (e.votes > max) max = e.votes;
        } else {
          const repBlock = v.block.groupKey
            ? groupRepBlockByKey.get(v.block.groupKey) ?? null
            : null;
          m.set(id, {
            key: id,
            name: nm,
            rSum: r,
            gSum: g,
            bSum: b,
            votes: 1,
            imgBlock: repBlock ?? v.block,
          });
          if (max < 1) max = 1;
        }
      }
      const out: Entity[] = [];
      for (const a of m.values()) {
        out.push({
          key: a.key,
          name: a.name,
          rgb: [
            Math.round(a.rSum / a.votes),
            Math.round(a.gSum / a.votes),
            Math.round(a.bSum / a.votes),
          ],
          image: a.imgBlock.image,
          votes: a.votes,
        });
      }
      return { entities: out, maxVotes: max };
    }

    const m = new Map<string, Entity>();
    let max = 0;
    for (let i = 0; i <= cutoff; i++) {
      const v = allVotes[i];
      const e = m.get(v.block.key);
      if (e) {
        e.votes += 1;
        if (e.votes > max) max = e.votes;
      } else {
        m.set(v.block.key, {
          key: v.block.key,
          name: v.block.name,
          rgb: v.block.rgb,
          image: v.block.image,
          votes: 1,
        });
        if (max < 1) max = 1;
      }
    }
    return { entities: Array.from(m.values()), maxVotes: max };
  }, [allVotes, sortedTimes, currentTime, group, groupRepBlockByKey]);

  const entitiesRef = useRef(entities);
  const maxVotesRef = useRef(maxVotes);
  entitiesRef.current = entities;
  maxVotesRef.current = maxVotes;

  useEffect(() => {
    const wrap = containerRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      sizeRef.current = { w: rect.width, h: rect.height };
      requestRedraw();
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  const rafRef = useRef(0);
  function requestRedraw() {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      draw();
    });
  }

  useEffect(() => {
    requestRedraw();
  }, [entities, imageVersion]);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h } = sizeRef.current;
    if (w === 0 || h === 0) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0, 0, w, h);

    const cam = cameraRef.current;
    const basis = cameraBasis(cam);

    // Cube edges first (under sprites).
    const cornersProj = CUBE_CORNERS.map((c) =>
      projectWithBasis(c, basis, cam, w, h),
    );
    ctx.strokeStyle = "#cccccc";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const [a, b] of CUBE_EDGES) {
      const pa = cornersProj[a];
      const pb = cornersProj[b];
      if (!pa.visible || !pb.visible) continue;
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
    }
    ctx.stroke();

    drawAxisLabels(ctx, cornersProj);

    interface Sprite {
      entity: Entity;
      x: number;
      y: number;
      depth: number;
      size: number;
    }
    const sprites: Sprite[] = [];
    const liveEntities = entitiesRef.current;
    const liveMax = maxVotesRef.current;
    for (const entity of liveEntities) {
      const p: Vec3 = [
        entity.rgb[0] / 255,
        entity.rgb[1] / 255,
        entity.rgb[2] / 255,
      ];
      const proj = projectWithBasis(p, basis, cam, w, h);
      if (!proj.visible) continue;
      sprites.push({
        entity,
        x: proj.x,
        y: proj.y,
        depth: proj.depth,
        size: spriteSize(entity.votes, liveMax, proj.depth),
      });
    }
    sprites.sort((a, b) => b.depth - a.depth);

    for (const s of sprites) {
      const half = s.size / 2;
      const img = s.entity.image;
      if (img && img.complete) {
        ctx.drawImage(img, s.x - half, s.y - half, s.size, s.size);
      } else {
        ctx.fillStyle = rgbToCss(s.entity.rgb);
        ctx.fillRect(s.x - half, s.y - half, s.size, s.size);
        ctx.strokeStyle = "rgba(0,0,0,0.4)";
        ctx.lineWidth = 1;
        ctx.strokeRect(s.x - half + 0.5, s.y - half + 0.5, s.size - 1, s.size - 1);
      }
    }

    // Hover halo.
    const hover = hoverRef.current;
    if (hover) {
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1.5;
      const sprite = sprites.find((s) => s.entity.key === hover.entity.key);
      if (sprite) {
        const half = sprite.size / 2 + 2;
        ctx.strokeRect(sprite.x - half, sprite.y - half, half * 2, half * 2);
      }
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onPointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      dragRef.current = { x: e.clientX, y: e.clientY };
    };
    const onPointerMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (drag) {
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        dragRef.current = { x: e.clientX, y: e.clientY };
        const cam = cameraRef.current;
        cam.yaw += dx * 0.01;
        cam.pitch = clampPitch(cam.pitch - dy * 0.01);
        requestRedraw();
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      updateHover(px, py);
    };
    const onPointerUp = (_: PointerEvent) => {
      dragRef.current = null;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const cam = cameraRef.current;
      const factor = Math.exp(e.deltaY * 0.001);
      cam.distance = Math.max(0.6, Math.min(8, cam.distance * factor));
      requestRedraw();
    };
    const onLeave = () => {
      hoverRef.current = null;
      setHoverState(null);
      requestRedraw();
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, []);

  function updateHover(px: number, py: number) {
    const { w, h } = sizeRef.current;
    if (!w || !h) return;
    const cam = cameraRef.current;
    const basis = cameraBasis(cam);
    let best: Hover | null = null;
    let bestD2 = Infinity;
    const liveEntities = entitiesRef.current;
    const liveMax = maxVotesRef.current;
    for (const entity of liveEntities) {
      const p: Vec3 = [
        entity.rgb[0] / 255,
        entity.rgb[1] / 255,
        entity.rgb[2] / 255,
      ];
      const proj = projectWithBasis(p, basis, cam, w, h);
      if (!proj.visible) continue;
      const half = spriteSize(entity.votes, liveMax, proj.depth) / 2;
      const dx = proj.x - px;
      const dy = proj.y - py;
      if (Math.abs(dx) <= half && Math.abs(dy) <= half) {
        const d2 = dx * dx + dy * dy;
        if (d2 < bestD2) {
          bestD2 = d2;
          best = { entity, x: proj.x, y: proj.y };
        }
      }
    }
    if (
      best?.entity.key !== hoverRef.current?.entity.key ||
      best?.entity.votes !== hoverRef.current?.entity.votes
    ) {
      hoverRef.current = best;
      setHoverState(best);
      requestRedraw();
    } else if (best) {
      hoverRef.current = best;
      setHoverState(best);
    }
  }

  return (
    <div className="chart-card chart-card-cube">
      <div className="chart-card-title">RGB cube</div>
      {group && (
        <GroupedBadge description="Sprites are placed at the vote-weighted average RGB of each canonical group rather than per-block. Group icons use the representative member's image (e.g. Oak Planks for Oak); Flowers/Coral fall back to a colored swatch since they have no single representative." />
      )}
      <div ref={containerRef} className="cube-canvas-wrap">
        <canvas ref={canvasRef} className="cube-canvas" />
        {hoverState && (
          <div
            className="cube-tooltip"
            style={{ left: hoverState.x + 12, top: hoverState.y + 12 }}
          >
            <div className="cube-tooltip-name">{hoverState.entity.name}</div>
            <div className="cube-tooltip-meta">
              {hoverState.entity.votes} vote{hoverState.entity.votes === 1 ? "" : "s"} -
              rgb({hoverState.entity.rgb.join(", ")})
            </div>
          </div>
        )}
      </div>
      <div className="cube-hint">drag to orbit - scroll to zoom</div>
    </div>
  );
}

function drawAxisLabels(
  ctx: CanvasRenderingContext2D,
  corners: ReturnType<typeof projectWithBasis>[],
) {
  const o = corners[0];
  const xc = corners[1];
  const yc = corners[2];
  const zc = corners[4];
  ctx.font = "11px system-ui, sans-serif";
  ctx.fillStyle = "#777";
  if (o.visible) ctx.fillText("(0,0,0)", o.x + 4, o.y + 12);
  if (xc.visible) {
    ctx.fillStyle = "#c33";
    ctx.fillText("R", xc.x + 4, xc.y + 4);
  }
  if (yc.visible) {
    ctx.fillStyle = "#3a3";
    ctx.fillText("G", yc.x + 4, yc.y + 4);
  }
  if (zc.visible) {
    ctx.fillStyle = "#36c";
    ctx.fillText("B", zc.x + 4, zc.y + 4);
  }
}

function upperBoundIndex(times: number[], t: number): number {
  let lo = 0;
  let hi = times.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (times[mid] <= t) lo = mid + 1;
    else hi = mid;
  }
  return lo - 1;
}
