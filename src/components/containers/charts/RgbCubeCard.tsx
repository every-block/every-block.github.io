import { useMemo } from "react";
import type { Block, Vote } from "../../../data/types";
import { useTimeStore } from "../../../state/timeStore";
import { useGroupStore } from "../../../state/groupStore";
import { RgbCube } from "../../ui/charts/RgbCube";
import type { ColorPoint } from "../../ui/charts/types";
import { GroupedBadge } from "../GroupedBadge";

interface Props {
  allVotes: Vote[];
  imageVersion: number;
  groupRepBlockByKey: Map<string, Block | null>;
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

export function RgbCubeCard({
  allVotes,
  imageVersion,
  groupRepBlockByKey,
}: Props) {
  const group = useGroupStore((s) => s.group);
  const currentTime = useTimeStore((s) => s.currentTime);

  const sortedTimes = useMemo(
    () => allVotes.map((v) => v.timestamp),
    [allVotes],
  );

  const items = useMemo<ColorPoint[]>(() => {
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
        }
      }
      const out: ColorPoint[] = [];
      for (const a of m.values()) {
        out.push({
          key: a.key,
          label: a.name,
          rgb: [
            Math.round(a.rSum / a.votes),
            Math.round(a.gSum / a.votes),
            Math.round(a.bSum / a.votes),
          ],
          image: a.imgBlock.image,
          weight: a.votes,
        });
      }
      return out;
    }

    type Simple = {
      key: string;
      name: string;
      rgb: readonly [number, number, number];
      image: HTMLImageElement | null | false;
      votes: number;
    };
    const m = new Map<string, Simple>();
    for (let i = 0; i <= cutoff; i++) {
      const v = allVotes[i];
      const e = m.get(v.block.key);
      if (e) {
        e.votes += 1;
      } else {
        m.set(v.block.key, {
          key: v.block.key,
          name: v.block.name,
          rgb: v.block.rgb,
          image: v.block.image,
          votes: 1,
        });
      }
    }
    const out: ColorPoint[] = [];
    for (const e of m.values()) {
      out.push({
        key: e.key,
        label: e.name,
        rgb: e.rgb,
        image: e.image,
        weight: e.votes,
      });
    }
    return out;
  }, [allVotes, sortedTimes, currentTime, group, groupRepBlockByKey, imageVersion]);

  return (
    <RgbCube
      items={items}
      title="RGB cube"
      formatTooltip={(item) => (
        <>
          <div className="cube-tooltip-name">{item.label}</div>
          <div className="cube-tooltip-meta">
            {item.weight} vote{item.weight === 1 ? "" : "s"} - rgb(
            {item.rgb.join(", ")})
          </div>
        </>
      )}
      badge={
        group ? (
          <GroupedBadge description="Sprites are placed at the vote-weighted average RGB of each canonical group rather than per-block. Group icons use the representative member's image (e.g. Oak Planks for Oak); Flowers/Coral fall back to a colored swatch since they have no single representative." />
        ) : undefined
      }
    />
  );
}
