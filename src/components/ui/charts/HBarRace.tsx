import type { ReactNode } from "react";
import { useState } from "react";
import { Tabs } from "@/ui/Tabs";
import type { SeriesItem } from "@/types/chart-items";

export type HBarMode = "top" | "bottom";

interface Props {
  items: SeriesItem[];
  title: ReactNode;
  badge?: ReactNode;
  mode?: HBarMode;
  onModeChange?: (mode: HBarMode) => void;
  showModeToggle?: boolean;
  n?: number;
  onNChange?: (n: number) => void;
  nRange?: [number, number];
  showNControl?: boolean;
  formatValue?: (item: SeriesItem) => string;
  rowHeight?: number;
  rowGap?: number;
  transitionMs?: number;
  insideLabelMinPct?: number;
  showRank?: boolean;
  extraControls?: ReactNode;
}

export function HBarRace({
  items,
  title,
  badge,
  mode = "top",
  onModeChange,
  showModeToggle = false,
  n,
  onNChange,
  nRange = [1, 200],
  showNControl = false,
  formatValue,
  rowHeight = 30,
  rowGap = 4,
  transitionMs = 350,
  insideLabelMinPct = 18,
  showRank = false,
  extraControls,
}: Props) {
  const [nInput, setNInput] = useState<string>(n != null ? String(n) : "");

  const commitN = (raw: string) => {
    if (!onNChange || n == null) return;
    const parsed = parseInt(raw, 10);
    if (!Number.isFinite(parsed)) {
      setNInput(String(n));
      return;
    }
    const [minN, maxN] = nRange;
    const clamped = Math.max(minN, Math.min(maxN, parsed));
    onNChange(clamped);
    setNInput(String(clamped));
  };

  const effectiveN = Math.min(n ?? items.length, items.length);
  const maxValue =
    items.reduce((m, e) => (e.value > m ? e.value : m), 0) || 1;
  const totalHeight = effectiveN * (rowHeight + rowGap);

  return (
    <div className="chart-card hbar-card">
      {badge}
      <div className="chart-card-header">
        <div className="chart-card-title">{title}</div>
        {(showModeToggle || showNControl || extraControls) && (
          <div className="hbar-controls">
            {extraControls}
            {showModeToggle && onModeChange && (
              <Tabs<HBarMode>
                size="sm"
                items={[
                  { id: "top", label: "TOP" },
                  { id: "bottom", label: "BOTTOM" },
                ]}
                active={mode}
                onChange={onModeChange}
              />
            )}
            {showNControl && onNChange && n != null && (
              <label
                className="hbar-n-control"
                title={`Number of items (${nRange[0]}–${nRange[1]})`}
              >
                <span className="hbar-n-label">N</span>
                <input
                  type="number"
                  min={nRange[0]}
                  max={nRange[1]}
                  step={1}
                  value={nInput || String(n)}
                  onChange={(e) => setNInput(e.target.value)}
                  onBlur={(e) => commitN(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      (e.target as HTMLInputElement).blur();
                  }}
                />
              </label>
            )}
          </div>
        )}
      </div>
      <div className="hbar-scroll">
        <div className="hbar-track" style={{ height: totalHeight }}>
          {items.map((entry, rank) => {
            const pct = (entry.value / maxValue) * 100;
            const labelInside = pct >= insideLabelMinPct;
            const text = formatValue ? formatValue(entry) : String(entry.value);
            const displayRank =
              entry.globalRank ??
              (mode === "top" ? rank + 1 : effectiveN - rank);
            return (
              <div
                key={entry.key}
                className="hbar-row"
                style={{
                  top: rank * (rowHeight + rowGap),
                  height: rowHeight,
                  transition: `top ${transitionMs}ms cubic-bezier(0.4, 0.0, 0.2, 1)`,
                }}
                title={entry.meta ?? `${entry.label} · ${text}`}
              >
                <div
                  className="hbar-fill"
                  style={{
                    width: `${pct}%`,
                    background: entry.color,
                    color: entry.textColor,
                  }}
                >
                  {labelInside && (
                    <>
                      {showRank && (
                        <span className="hbar-rank">#{displayRank}</span>
                      )}
                      <span className="hbar-label">{entry.label}</span>
                      <span className="hbar-count">{text}</span>
                    </>
                  )}
                </div>
                {!labelInside && (
                  <div className="hbar-overflow-label">
                    {showRank && (
                      <span className="hbar-rank">#{displayRank}</span>
                    )}
                    <span className="hbar-label">{entry.label}</span>
                    <span className="hbar-count">{text}</span>
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
