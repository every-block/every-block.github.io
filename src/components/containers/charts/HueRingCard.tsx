import { useDeferredValue, useMemo, useState } from "react";
import type { Block, Rgb, Vote } from "@/types/domain";
import { useVotesUpTo } from "@/hooks/use-votes-up-to";
import { useSaturationStore } from "@/stores/saturation-store";
import { useNormalizeStore } from "@/stores/normalize-store";
import { useGroupStore } from "@/stores/group-store";
import { rgbToCss, rgbToHsv } from "@/utils/color";
import { HueRingKde, type HueRingMode } from "@/ui/charts/HueRingKde";
import type { HuePoint } from "@/types/chart-items";
import { Slider } from "@/ui/Slider";
import { NormalizedBadge } from "../NormalizedBadge";
import { GroupedBadge } from "../GroupedBadge";

interface Props {
  allVotes: Vote[];
  blocks: Block[];
  bwDeg?: number;
  n?: number;
}

interface BlockAnnot {
  key: string;
  name: string;
  rgb: Rgb;
  hsv: { h: number; s: number; v: number };
  color: string;
  groupKey?: string;
  groupName?: string;
}

interface Entity {
  key: string;
  name: string;
  hsv: { h: number; s: number; v: number };
  color: string;
  weight: number;
  metaPrefix: string;
}

function toHuePoint(e: Entity): HuePoint {
  return {
    key: e.key,
    label: e.name,
    hueDeg: e.hsv.h,
    color: e.color,
    weight: e.weight,
    meta: `${e.metaPrefix} - ${e.hsv.h.toFixed(0)}°`,
  };
}

export function HueRingCard({ allVotes, blocks, bwDeg, n }: Props) {
  const slice = useVotesUpTo(allVotes);
  const minSatLive = useSaturationStore((s) => s.minSaturation);
  const minSat = useDeferredValue(minSatLive);
  const setMinSaturation = useSaturationStore((s) => s.setMinSaturation);
  const normalize = useNormalizeStore((s) => s.normalize);
  const group = useGroupStore((s) => s.group);
  const [localMode, setLocalMode] = useState<HueRingMode>("items");

  const blockAnnots = useMemo<BlockAnnot[]>(
    () =>
      blocks.map((b) => ({
        key: b.key,
        name: b.name,
        rgb: b.rgb,
        hsv: rgbToHsv(b.rgb),
        color: rgbToCss(b.rgb),
        groupKey: b.groupKey,
        groupName: b.groupName,
      })),
    [blocks],
  );

  const annotByKey = useMemo(() => {
    const m = new Map<string, BlockAnnot>();
    for (const a of blockAnnots) m.set(a.key, a);
    return m;
  }, [blockAnnots]);

  const baseEntities = useMemo<Entity[]>(() => {
    const entities: Entity[] = [];
    if (group) {
      type Accum = {
        rSum: number;
        gSum: number;
        bSum: number;
        n: number;
        name: string;
        key: string;
      };
      const groups = new Map<string, Accum>();
      const ungrouped: BlockAnnot[] = [];
      for (const a of blockAnnots) {
        if (a.groupKey) {
          const existing = groups.get(a.groupKey);
          if (existing) {
            existing.rSum += a.rgb[0];
            existing.gSum += a.rgb[1];
            existing.bSum += a.rgb[2];
            existing.n += 1;
          } else {
            groups.set(a.groupKey, {
              rSum: a.rgb[0],
              gSum: a.rgb[1],
              bSum: a.rgb[2],
              n: 1,
              name: a.groupName ?? a.name,
              key: a.groupKey,
            });
          }
        } else {
          ungrouped.push(a);
        }
      }
      for (const g of groups.values()) {
        const rgb: Rgb = [
          Math.round(g.rSum / g.n),
          Math.round(g.gSum / g.n),
          Math.round(g.bSum / g.n),
        ];
        entities.push({
          key: g.key,
          name: g.name,
          hsv: rgbToHsv(rgb),
          color: rgbToCss(rgb),
          weight: g.n,
          metaPrefix: `${g.name} - ${g.n} variant${g.n === 1 ? "" : "s"}`,
        });
      }
      for (const a of ungrouped) {
        entities.push({
          key: a.key,
          name: a.name,
          hsv: a.hsv,
          color: a.color,
          weight: 1,
          metaPrefix: a.name,
        });
      }
    } else {
      for (const a of blockAnnots) {
        entities.push({
          key: a.key,
          name: a.name,
          hsv: a.hsv,
          color: a.color,
          weight: 1,
          metaPrefix: a.name,
        });
      }
    }
    return entities;
  }, [blockAnnots, group]);

  const itemEntities = useMemo<Entity[]>(() => {
    type Accum = {
      key: string;
      name: string;
      rSum: number;
      gSum: number;
      bSum: number;
      count: number;
    };
    const byEntity = new Map<string, Accum>();
    for (const v of slice.votes) {
      const annot = annotByKey.get(v.block.key);
      if (!annot) continue;
      const isGroup = group && !!annot.groupKey;
      const id = isGroup ? (annot.groupKey as string) : annot.key;
      const nm = isGroup ? (annot.groupName ?? annot.name) : annot.name;
      const [r, g, b] = annot.rgb;
      const existing = byEntity.get(id);
      if (existing) {
        existing.count += 1;
        existing.rSum += r;
        existing.gSum += g;
        existing.bSum += b;
      } else {
        byEntity.set(id, {
          key: id,
          name: nm,
          rSum: r,
          gSum: g,
          bSum: b,
          count: 1,
        });
      }
    }
    const out: Entity[] = [];
    for (const e of byEntity.values()) {
      const rgb: Rgb = [
        Math.round(e.rSum / e.count),
        Math.round(e.gSum / e.count),
        Math.round(e.bSum / e.count),
      ];
      out.push({
        key: e.key,
        name: e.name,
        hsv: rgbToHsv(rgb),
        color: rgbToCss(rgb),
        weight: e.count,
        metaPrefix: `${e.name} - ${e.count} vote${e.count === 1 ? "" : "s"}`,
      });
    }
    return out;
  }, [slice.count, group, annotByKey]);

  const baseItems = useMemo<HuePoint[]>(
    () => baseEntities.filter((e) => e.hsv.s >= minSat).map(toHuePoint),
    [baseEntities, minSat],
  );

  const items = useMemo<HuePoint[]>(
    () => itemEntities.filter((e) => e.hsv.s >= minSat).map(toHuePoint),
    [itemEntities, minSat],
  );

  const mode: HueRingMode = normalize ? "normalized" : localMode;

  const badge = (
    <>
      {normalize && (
        <NormalizedBadge description="The vote-density at each hue is divided by the dataset's natural hue density (one weight-1 sample per block, or per group when GROUP is also on). Radii now show how much each hue overperformed its share of the block list, rather than absolute popularity." />
      )}
      {group && (
        <GroupedBadge description="Each dot/wedge represents a canonical group rather than an individual block. The group's hue is the vote-weighted RGB average of its members up to the cursor, so it drifts as different variants accumulate votes." />
      )}
    </>
  );

  const satControl = (
    <div
      className="hue-ring-sat-filter"
      title="Hide blocks below this HSV saturation"
    >
      <label className="hue-ring-sat-label" htmlFor="hue-ring-min-sat">
        MIN SAT
      </label>
      <Slider
        id="hue-ring-min-sat"
        className="hue-ring-sat-input"
        size="sm"
        min={0}
        max={1}
        step={0.01}
        value={minSatLive}
        onChange={setMinSaturation}
      />
      <span className="hue-ring-sat-value">{minSatLive.toFixed(2)}</span>
    </div>
  );

  return (
    <HueRingKde
      items={items}
      baseItems={baseItems}
      mode={mode}
      onModeChange={(m) => setLocalMode(m)}
      itemsLabel="VOTES"
      baseLabel="BASE"
      badge={badge}
      extraControls={satControl}
      bwDeg={bwDeg}
      n={n}
    />
  );
}
