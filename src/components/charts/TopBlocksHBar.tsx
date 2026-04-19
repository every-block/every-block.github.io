import { useMemo, useState } from "react";
import type { Block, Vote } from "../../data/types";
import { useVotesUpTo } from "../../state/useVotesUpTo";
import { useGroupStore } from "../../state/groupStore";
import { readableTextOn, rgbToCss } from "../../lib/color";
import { GroupedBadge } from "../GroupToggle";

interface Props {
  allVotes: Vote[];
  blocks: Block[];
  defaultN?: number;
}

type Mode = "top" | "bottom";

const MIN_N = 1;
const MAX_N = 200;

const ROW_HEIGHT = 30;
const ROW_GAP = 4;
const TRANSITION_MS = 350;
const INSIDE_LABEL_MIN_PCT = 18;

interface Entry {
  key: string;
  name: string;
  rgbCss: string;
  textColor: string;
  count: number;
  rSum: number;
  gSum: number;
  bSum: number;
}

export function TopBlocksHBar({ allVotes, blocks, defaultN = 20 }: Props) {
  const slice = useVotesUpTo(allVotes);
  const group = useGroupStore((s) => s.group);
  const [mode, setMode] = useState<Mode>("top");
  const [n, setN] = useState<number>(defaultN);
  const [nInput, setNInput] = useState<string>(String(defaultN));

  const commitN = (raw: string) => {
    const parsed = parseInt(raw, 10);
    if (!Number.isFinite(parsed)) {
      setNInput(String(n));
      return;
    }
    const clamped = Math.max(MIN_N, Math.min(MAX_N, parsed));
    setN(clamped);
    setNInput(String(clamped));
  };

  const ranked = useMemo(() => {
    const idOf = (b: Block) => (group && b.groupKey ? b.groupKey : b.key);
    const nameOf = (b: Block) => (group && b.groupName ? b.groupName : b.name);

    const finalize = (e: Entry): Entry => {
      if (e.count === 0) return e;
      const r = Math.round(e.rSum / e.count);
      const g = Math.round(e.gSum / e.count);
      const b = Math.round(e.bSum / e.count);
      const rgb = [r, g, b] as const;
      e.rgbCss = rgbToCss(rgb);
      e.textColor = readableTextOn(rgb);
      return e;
    };

    if (mode === "top") {
      const counts = new Map<string, Entry>();
      for (const v of slice.votes) {
        const id = idOf(v.block);
        const [r, g, b] = v.block.rgb;
        const e = counts.get(id);
        if (e) {
          e.count += 1;
          e.rSum += r;
          e.gSum += g;
          e.bSum += b;
        } else {
          counts.set(id, {
            key: id,
            name: nameOf(v.block),
            rgbCss: rgbToCss(v.block.rgb),
            textColor: readableTextOn(v.block.rgb),
            count: 1,
            rSum: r,
            gSum: g,
            bSum: b,
          });
        }
      }
      return Array.from(counts.values())
        .map(finalize)
        .sort((a, b) => b.count - a.count || (a.name < b.name ? -1 : 1))
        .slice(0, n);
    }

    const counts = new Map<string, Entry>();
    if (group) {
      type Seed = { name: string; r: number; g: number; b: number; count: number };
      const seeds = new Map<string, Seed>();
      for (const bk of blocks) {
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
        const rgb = [r, g, b] as const;
        counts.set(id, {
          key: id,
          name: s.name,
          rgbCss: rgbToCss(rgb),
          textColor: readableTextOn(rgb),
          count: 0,
          rSum: 0,
          gSum: 0,
          bSum: 0,
        });
      }
    } else {
      for (const bk of blocks) {
        counts.set(bk.key, {
          key: bk.key,
          name: bk.name,
          rgbCss: rgbToCss(bk.rgb),
          textColor: readableTextOn(bk.rgb),
          count: 0,
          rSum: 0,
          gSum: 0,
          bSum: 0,
        });
      }
    }
    for (const v of slice.votes) {
      const id = idOf(v.block);
      const [r, g, b] = v.block.rgb;
      const e = counts.get(id);
      if (e) {
        e.count += 1;
        e.rSum += r;
        e.gSum += g;
        e.bSum += b;
      }
    }
    return Array.from(counts.values())
      .map(finalize)
      .sort((a, b) => a.count - b.count || (a.name < b.name ? -1 : 1))
      .slice(0, n);
  }, [slice.count, n, mode, blocks, group]);

  const maxCount = ranked.reduce((m, e) => (e.count > m ? e.count : m), 0) || 1;
  const totalHeight = n * (ROW_HEIGHT + ROW_GAP);

  return (
    <div className="chart-card hbar-card">
      {group && (
        <GroupedBadge description="Variant blocks are merged into canonical groups (e.g. Stone Slab + Stone Brick Stairs into Stone). Each group's bar color is the vote-weighted RGB average across its members." />
      )}
      <div className="chart-card-header">
        <div className="chart-card-title">
          {mode === "top" ? "top" : "bottom"} {n} {group ? "entries" : "blocks"}
        </div>
        <div className="hbar-controls">
          <div className="hbar-mode-toggle" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "top"}
              className={`hbar-mode-button${mode === "top" ? " is-active" : ""}`}
              onClick={() => setMode("top")}
            >
              TOP
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "bottom"}
              className={`hbar-mode-button${mode === "bottom" ? " is-active" : ""}`}
              onClick={() => setMode("bottom")}
            >
              BOTTOM
            </button>
          </div>
          <label className="hbar-n-control" title={`Number of blocks (${MIN_N}–${MAX_N})`}>
            <span className="hbar-n-label">N</span>
            <input
              type="number"
              min={MIN_N}
              max={MAX_N}
              step={1}
              value={nInput}
              onChange={(e) => setNInput(e.target.value)}
              onBlur={(e) => commitN(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
            />
          </label>
        </div>
      </div>
      <div className="hbar-scroll">
        <div className="hbar-track" style={{ height: totalHeight }}>
          {ranked.map((entry, rank) => {
            const pct = (entry.count / maxCount) * 100;
            const labelInside = pct >= INSIDE_LABEL_MIN_PCT;
            return (
              <div
                key={entry.key}
                className="hbar-row"
                style={{
                  top: rank * (ROW_HEIGHT + ROW_GAP),
                  height: ROW_HEIGHT,
                  transition: `top ${TRANSITION_MS}ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
                }}
                title={`${entry.name} · ${entry.count} vote${entry.count === 1 ? "" : "s"}`}
              >
                <div
                  className="hbar-fill"
                  style={{
                    width: `${pct}%`,
                    background: entry.rgbCss,
                    color: entry.textColor,
                  }}
                >
                  {labelInside && (
                    <>
                      <span className="hbar-label">{entry.name}</span>
                      <span className="hbar-count">{entry.count}</span>
                    </>
                  )}
                </div>
                {!labelInside && (
                  <div className="hbar-overflow-label">
                    <span className="hbar-label">{entry.name}</span>
                    <span className="hbar-count">{entry.count}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
