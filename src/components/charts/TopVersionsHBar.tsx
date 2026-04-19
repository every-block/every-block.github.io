import { useMemo } from "react";
import type { Block, Rgb, Vote } from "../../data/types";
import { useVotesUpTo } from "../../state/useVotesUpTo";
import { useNormalizeStore } from "../../state/normalizeStore";
import { readableTextOn, rgbToCss } from "../../lib/color";
import { cleanVersion } from "../../lib/versionEpoch";
import { NormalizedBadge } from "../NormalizeToggle";

interface Props {
  allVotes: Vote[];
  blocks: Block[];
}

const ROW_HEIGHT = 30;
const ROW_GAP = 4;
const TRANSITION_MS = 350;

interface VersionAccum {
  version: string;
  count: number;
  rSum: number;
  gSum: number;
  bSum: number;
}

export function TopVersionsHBar({ allVotes, blocks }: Props) {
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

  const ranked = useMemo(() => {
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
    return Array.from(accums.values())
      .map((e) => {
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
        return {
          key: e.version,
          name: e.version,
          count: e.count,
          blocksInVersion,
          value,
          rgbCss: rgbToCss(rgb),
          textColor: readableTextOn(rgb),
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [slice.count, normalize, blocksPerVersion]);

  const maxValue = ranked.length ? ranked[0].value : 1;
  const totalHeight = ranked.length * (ROW_HEIGHT + ROW_GAP);

  const formatCount = (entry: (typeof ranked)[number]) => {
    if (!normalize || entry.blocksInVersion === 0) return String(entry.count);
    const ratio = entry.count / entry.blocksInVersion;
    return `${ratio.toFixed(1)} (${entry.count}/${entry.blocksInVersion})`;
  };

  return (
    <div className="chart-card hbar-card">
      <div className="chart-card-title">
        votes by version{normalize ? " (per block)" : ""}
      </div>
      {normalize && (
        <NormalizedBadge
          description="Each bar's length is votes ÷ number of blocks released in that version, surfacing versions whose blocks punched above their weight regardless of how many were added. The bar's color is still the vote-weighted average of its blocks' RGB."
        />
      )}
      <div className="hbar-scroll">
        <div className="hbar-track" style={{ height: totalHeight }}>
          {ranked.map((entry, rank) => (
            <div
              key={entry.key}
              className="hbar-row"
              style={{
                top: rank * (ROW_HEIGHT + ROW_GAP),
                height: ROW_HEIGHT,
                transition: `top ${TRANSITION_MS}ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
              }}
              title={
                normalize
                  ? `${entry.name} · ${entry.count} votes / ${entry.blocksInVersion} blocks`
                  : `${entry.name} · ${entry.count} votes`
              }
            >
              <div
                className="hbar-fill"
                style={{
                  width: `${(entry.value / maxValue) * 100}%`,
                  background: entry.rgbCss,
                  color: entry.textColor,
                }}
              >
                <span className="hbar-label">{entry.name}</span>
                <span className="hbar-count">{formatCount(entry)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
