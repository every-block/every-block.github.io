import { useMemo } from "react";
import type { Block, Rgb, Vote } from "@/types/domain";
import { useVotesUpTo } from "@/hooks/use-votes-up-to";
import { useNormalizeStore } from "@/stores/normalize-store";
import { rgbToCss } from "@/utils/color";
import { cleanVersion, groupVersions } from "@/utils/version-epoch";
import { CategoricalBars } from "@/ui/charts/CategoricalBars";
import type { SeriesItem } from "@/types/chart-items";
import { NormalizedBadge } from "../NormalizedBadge";

interface Props {
  allVotes: Vote[];
  blocks: Block[];
}

const EMPTY_BAR_COLOR = "#e5e5e7";

export function VersionHistogramCard({ allVotes, blocks }: Props) {
  const slice = useVotesUpTo(allVotes);
  const normalize = useNormalizeStore((s) => s.normalize);

  const ordered = useMemo(() => {
    const blocksByVersion = new Map<string, number>();
    for (const b of blocks) {
      const v = cleanVersion(b.version) || "(unknown)";
      blocksByVersion.set(v, (blocksByVersion.get(v) ?? 0) + 1);
    }
    const out: { version: string; blocksInVersion: number }[] = [];
    for (const g of groupVersions(blocks)) {
      for (const v of g.versions) {
        out.push({
          version: v,
          blocksInVersion: blocksByVersion.get(v) ?? 0,
        });
      }
    }
    return out;
  }, [blocks]);

  const stats = useMemo(() => {
    const map = new Map<
      string,
      { count: number; rSum: number; gSum: number; bSum: number }
    >();
    for (const v of slice.votes) {
      const ver = cleanVersion(v.block.version) || "(unknown)";
      const [r, g, b] = v.block.rgb;
      const e = map.get(ver);
      if (e) {
        e.count += 1;
        e.rSum += r;
        e.gSum += g;
        e.bSum += b;
      } else {
        map.set(ver, { count: 1, rSum: r, gSum: g, bSum: b });
      }
    }
    return map;
  }, [slice.count]);

  const { items, customdata } = useMemo(() => {
    const items: SeriesItem[] = [];
    const customdata: Array<Array<number | string>> = [];
    for (const { version, blocksInVersion } of ordered) {
      const s = stats.get(version);
      const count = s ? s.count : 0;
      const avg: Rgb | null = s
        ? [
            Math.round(s.rSum / s.count),
            Math.round(s.gSum / s.count),
            Math.round(s.bSum / s.count),
          ]
        : null;
      const value =
        normalize && blocksInVersion > 0 ? count / blocksInVersion : count;
      items.push({
        key: version,
        label: version,
        value,
        color: avg ? rgbToCss(avg) : EMPTY_BAR_COLOR,
      });
      customdata.push([
        count,
        blocksInVersion,
        blocksInVersion > 0 ? count / blocksInVersion : 0,
      ]);
    }
    return { items, customdata };
  }, [ordered, stats, normalize]);

  const hoverTemplate = normalize
    ? "<b>%{x}</b><br>%{customdata[0]} votes / %{customdata[1]} blocks<br>%{customdata[2]:.2f} per block<extra></extra>"
    : "<b>%{x}</b><br>%{customdata[0]} votes · %{customdata[1]} blocks<extra></extra>";

  return (
    <CategoricalBars
      items={items}
      title={`votes by version (histogram)${normalize ? " — per block" : ""}`}
      yAxisLabel={normalize ? "votes / block" : "votes"}
      hoverTemplate={hoverTemplate}
      customdata={customdata}
      badge={
        normalize ? (
          <NormalizedBadge description="Each bar's height is votes ÷ number of blocks released in that version, surfacing versions whose blocks punched above their weight." />
        ) : undefined
      }
    />
  );
}
