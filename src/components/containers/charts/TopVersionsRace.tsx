import { useMemo } from "react";
import type { Block, Rgb, Vote } from "@/types/domain";
import { useVotesUpTo } from "@/hooks/use-votes-up-to";
import { useNormalizeStore } from "@/stores/normalize-store";
import { readableTextOn, rgbToCss } from "@/utils/color";
import { cleanVersion } from "@/utils/version-epoch";
import { HBarRace } from "@/ui/charts/HBarRace";
import type { SeriesItem } from "@/types/chart-items";
import { NormalizedBadge } from "../NormalizedBadge";

interface Props {
  allVotes: Vote[];
  blocks: Block[];
}

interface VersionAccum {
  version: string;
  count: number;
  rSum: number;
  gSum: number;
  bSum: number;
}

export function TopVersionsRace({ allVotes, blocks }: Props) {
  const slice = useVotesUpTo(allVotes);
  const normalize = useNormalizeStore((s) => s.normalize);

  const blocksPerVersion = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of blocks) {
      const ver = cleanVersion(b.version) || "(unknown)";
      map.set(ver, (map.get(ver) ?? 0) + 1);
    }
    return map;
  }, [blocks]);

  const { items, rawByKey } = useMemo(() => {
    const accums = new Map<string, VersionAccum>();
    for (const v of slice.votes) {
      const ver = cleanVersion(v.block.version) || "(unknown)";
      const [r, g, b] = v.block.rgb;
      const e = accums.get(ver);
      if (e) {
        e.count += 1;
        e.rSum += r;
        e.gSum += g;
        e.bSum += b;
      } else {
        accums.set(ver, {
          version: ver,
          count: 1,
          rSum: r,
          gSum: g,
          bSum: b,
        });
      }
    }

    const raw = new Map<string, { count: number; blocksInVersion: number }>();
    const out: SeriesItem[] = [];
    for (const e of accums.values()) {
      const rgb: Rgb = [
        Math.round(e.rSum / e.count),
        Math.round(e.gSum / e.count),
        Math.round(e.bSum / e.count),
      ];
      const blocksInVersion = blocksPerVersion.get(e.version) ?? 0;
      const value =
        normalize && blocksInVersion > 0
          ? e.count / blocksInVersion
          : e.count;
      raw.set(e.version, { count: e.count, blocksInVersion });
      out.push({
        key: e.version,
        label: e.version,
        value,
        color: rgbToCss(rgb),
        textColor: readableTextOn(rgb),
        meta: normalize
          ? `${e.version} · ${e.count} votes / ${blocksInVersion} blocks`
          : `${e.version} · ${e.count} votes`,
      });
    }
    out.sort((a, b) => b.value - a.value);
    const withRank: SeriesItem[] = out.map((it, i) => ({
      ...it,
      globalRank: i + 1,
    }));
    return { items: withRank, rawByKey: raw };
  }, [slice.count, normalize, blocksPerVersion]);

  const formatValue = (entry: SeriesItem) => {
    const raw = rawByKey.get(entry.key);
    if (!raw) return String(entry.value);
    if (!normalize || raw.blocksInVersion === 0) return String(raw.count);
    const ratio = raw.count / raw.blocksInVersion;
    return `${ratio.toFixed(1)} (${raw.count}/${raw.blocksInVersion})`;
  };

  return (
    <HBarRace
      items={items}
      title={`votes by version${normalize ? " (per block)" : ""}`}
      showRank
      formatValue={formatValue}
      badge={
        normalize ? (
          <NormalizedBadge description="Each bar's length is votes ÷ number of blocks released in that version, surfacing versions whose blocks punched above their weight regardless of how many were added. The bar's color is still the vote-weighted average of its blocks' RGB." />
        ) : undefined
      }
    />
  );
}
