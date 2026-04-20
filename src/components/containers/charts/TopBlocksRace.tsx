import { useMemo, useState } from "react";
import type { Block, Vote } from "@/types/domain";
import { useVotesUpTo } from "@/hooks/use-votes-up-to";
import { useGroupStore } from "@/stores/group-store";
import { readableTextOn, rgbToCss } from "@/utils/color";
import { HBarRace, type HBarMode } from "@/ui/charts/HBarRace";
import type { SeriesItem } from "@/types/chart-items";
import { Toggle } from "@/ui/Toggle";
import { GroupedBadge } from "../GroupedBadge";

interface Props {
  allVotes: Vote[];
  blocks: Block[];
  defaultN?: number;
}

interface Accum {
  key: string;
  name: string;
  rSum: number;
  gSum: number;
  bSum: number;
  count: number;
}

export function TopBlocksRace({ allVotes, blocks, defaultN = 20 }: Props) {
  const slice = useVotesUpTo(allVotes);
  const group = useGroupStore((s) => s.group);
  const [mode, setMode] = useState<HBarMode>("top");
  const [n, setN] = useState<number>(defaultN);
  const [materialsOnly, setMaterialsOnly] = useState(false);

  const items = useMemo<SeriesItem[]>(() => {
    const groupView = group || materialsOnly;
    const idOf = (b: Block) =>
      groupView && b.groupKey ? b.groupKey : b.key;
    const nameOf = (b: Block) =>
      groupView && b.groupName ? b.groupName : b.name;
    const includes = (b: Block) => !materialsOnly || !!b.groupKey;

    const counts = new Map<string, Accum>();
    if (mode === "bottom") {
      if (groupView) {
        type Seed = { name: string; r: number; g: number; b: number; count: number };
        const seeds = new Map<string, Seed>();
        for (const bk of blocks) {
          if (!includes(bk)) continue;
          const id = idOf(bk);
          const nm = nameOf(bk);
          const [r, g, b] = bk.rgb;
          const s = seeds.get(id);
          if (s) {
            s.r += r;
            s.g += g;
            s.b += b;
            s.count += 1;
          } else {
            seeds.set(id, { name: nm, r, g, b, count: 1 });
          }
        }
        for (const [id, s] of seeds) {
          const r = Math.round(s.r / s.count);
          const g = Math.round(s.g / s.count);
          const b = Math.round(s.b / s.count);
          counts.set(id, {
            key: id,
            name: s.name,
            rSum: r,
            gSum: g,
            bSum: b,
            count: 0,
          });
        }
      } else {
        for (const bk of blocks) {
          if (!includes(bk)) continue;
          counts.set(bk.key, {
            key: bk.key,
            name: bk.name,
            rSum: bk.rgb[0],
            gSum: bk.rgb[1],
            bSum: bk.rgb[2],
            count: 0,
          });
        }
      }
    }

    for (const v of slice.votes) {
      if (!includes(v.block)) continue;
      const id = idOf(v.block);
      const [r, g, b] = v.block.rgb;
      const e = counts.get(id);
      if (e) {
        e.count += 1;
        if (mode === "top") {
          e.rSum += r;
          e.gSum += g;
          e.bSum += b;
        }
      } else if (mode === "top") {
        counts.set(id, {
          key: id,
          name: nameOf(v.block),
          rSum: r,
          gSum: g,
          bSum: b,
          count: 1,
        });
      }
    }

    const out: SeriesItem[] = [];
    for (const e of counts.values()) {
      const denom = mode === "top" ? Math.max(1, e.count) : 1;
      const rgb = [
        Math.round(e.rSum / denom),
        Math.round(e.gSum / denom),
        Math.round(e.bSum / denom),
      ] as const;
      out.push({
        key: e.key,
        label: e.name,
        value: e.count,
        color: rgbToCss(rgb),
        textColor: readableTextOn(rgb),
      });
    }
    out.sort((a, b) =>
      mode === "top"
        ? b.value - a.value || (a.label < b.label ? -1 : 1)
        : a.value - b.value || (a.label < b.label ? -1 : 1),
    );
    return out.slice(0, n);
  }, [slice.count, n, mode, blocks, group, materialsOnly]);

  const noun = materialsOnly ? "materials" : group ? "entries" : "blocks";
  const title = `${mode === "top" ? "top" : "bottom"} ${n} ${noun}`;

  return (
    <HBarRace
      items={items}
      title={title}
      mode={mode}
      onModeChange={setMode}
      showModeToggle
      n={n}
      onNChange={setN}
      showNControl
      formatValue={(e) => String(e.value)}
      extraControls={
        <Toggle
          active={materialsOnly}
          onChange={setMaterialsOnly}
          label="MATERIALS"
          tone="yellow"
          title="Show only the top-level material groups (e.g. Stone, Oak, Cobblestone)"
        />
      }
      badge={
        group ? (
          <GroupedBadge description="Variant blocks are merged into canonical groups (e.g. Stone Slab + Stone Brick Stairs into Stone). Each group's bar color is the vote-weighted RGB average across its members." />
        ) : undefined
      }
    />
  );
}
