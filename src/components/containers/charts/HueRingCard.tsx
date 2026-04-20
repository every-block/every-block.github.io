import { useMemo, useState } from "react";
import type { Block, Rgb, Vote } from "../../../data/types";
import { useVotesUpTo } from "../../../state/useVotesUpTo";
import { useSaturationStore } from "../../../state/saturationStore";
import { useNormalizeStore } from "../../../state/normalizeStore";
import { useGroupStore } from "../../../state/groupStore";
import { rgbToCss, rgbToHsv } from "../../../lib/color";
import { HueRingKde, type HueRingMode } from "../../ui/charts/HueRingKde";
import type { HuePoint } from "../../ui/charts/types";
import { Slider } from "../../ui/Slider";
import { NormalizedBadge } from "../NormalizedBadge";
import { GroupedBadge } from "../GroupedBadge";

interface Props {
  allVotes: Vote[];
  blocks: Block[];
  bwDeg?: number;
  n?: number;
}

export function HueRingCard({ allVotes, blocks, bwDeg, n }: Props) {
  const slice = useVotesUpTo(allVotes);
  const minSat = useSaturationStore((s) => s.minSaturation);
  const setMinSaturation = useSaturationStore((s) => s.setMinSaturation);
  const normalize = useNormalizeStore((s) => s.normalize);
  const group = useGroupStore((s) => s.group);
  const [localMode, setLocalMode] = useState<HueRingMode>("items");

  const baseItems = useMemo<HuePoint[]>(() => {
    const items: HuePoint[] = [];
    if (group) {
      type Accum = {
        r: number;
        g: number;
        b: number;
        n: number;
        name: string;
        key: string;
      };
      const groups = new Map<string, Accum>();
      const ungrouped: Block[] = [];
      for (const b of blocks) {
        if (b.groupKey) {
          const a = groups.get(b.groupKey);
          if (a) {
            a.r += b.rgb[0];
            a.g += b.rgb[1];
            a.b += b.rgb[2];
            a.n += 1;
          } else {
            groups.set(b.groupKey, {
              r: b.rgb[0],
              g: b.rgb[1],
              b: b.rgb[2],
              n: 1,
              name: b.groupName ?? b.name,
              key: b.groupKey,
            });
          }
        } else {
          ungrouped.push(b);
        }
      }
      for (const a of groups.values()) {
        const rgb: Rgb = [
          Math.round(a.r / a.n),
          Math.round(a.g / a.n),
          Math.round(a.b / a.n),
        ];
        const hsv = rgbToHsv(rgb);
        if (hsv.s < minSat) continue;
        items.push({
          key: a.key,
          label: a.name,
          hueDeg: hsv.h,
          color: rgbToCss(rgb),
          weight: a.n,
          meta: `${a.name} - ${a.n} variant${a.n === 1 ? "" : "s"} - ${hsv.h.toFixed(0)}°`,
        });
      }
      for (const b of ungrouped) {
        const hsv = rgbToHsv(b.rgb);
        if (hsv.s < minSat) continue;
        items.push({
          key: b.key,
          label: b.name,
          hueDeg: hsv.h,
          color: rgbToCss(b.rgb),
          weight: 1,
          meta: `${b.name} - ${hsv.h.toFixed(0)}°`,
        });
      }
    } else {
      for (const b of blocks) {
        const hsv = rgbToHsv(b.rgb);
        if (hsv.s < minSat) continue;
        items.push({
          key: b.key,
          label: b.name,
          hueDeg: hsv.h,
          color: rgbToCss(b.rgb),
          weight: 1,
          meta: `${b.name} - ${hsv.h.toFixed(0)}°`,
        });
      }
    }
    return items;
  }, [blocks, minSat, group]);

  const items = useMemo<HuePoint[]>(() => {
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
      const hsv = rgbToHsv(v.block.rgb);
      if (hsv.s < minSat) continue;
      const isGroup = group && !!v.block.groupKey;
      const id = isGroup ? (v.block.groupKey as string) : v.block.key;
      const nm = isGroup
        ? (v.block.groupName ?? v.block.name)
        : v.block.name;
      const [r, g, b] = v.block.rgb;
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
    const out: HuePoint[] = [];
    for (const it of byEntity.values()) {
      const rgb: Rgb = [
        Math.round(it.rSum / it.count),
        Math.round(it.gSum / it.count),
        Math.round(it.bSum / it.count),
      ];
      const hsv = rgbToHsv(rgb);
      out.push({
        key: it.key,
        label: it.name,
        hueDeg: hsv.h,
        color: rgbToCss(rgb),
        weight: it.count,
        meta: `${it.name} - ${it.count} vote${it.count === 1 ? "" : "s"} - ${hsv.h.toFixed(0)}°`,
      });
    }
    return out;
  }, [slice.count, minSat, group]);

  const mode: HueRingMode = normalize ? "normalized" : localMode;
  const title = normalize
    ? "Gaussian KDE / hue ring (votes ÷ base)"
    : mode === "base"
      ? "Gaussian KDE / hue ring (base distribution)"
      : "Gaussian KDE / hue ring (vote distribution)";

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
        value={minSat}
        onChange={setMinSaturation}
      />
      <span className="hue-ring-sat-value">{minSat.toFixed(2)}</span>
    </div>
  );

  return (
    <HueRingKde
      items={items}
      baseItems={baseItems}
      mode={mode}
      onModeChange={(m) => setLocalMode(m)}
      title={title}
      itemsLabel="VOTES"
      baseLabel="BASE"
      badge={badge}
      extraControls={satControl}
      bwDeg={bwDeg}
      n={n}
    />
  );
}
