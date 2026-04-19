import { useMemo, useState } from "react";
import type { Data, Layout } from "plotly.js-dist-min";
import type { Block, Rgb, Vote } from "../../data/types";
import { useVotesUpTo } from "../../state/useVotesUpTo";
import { useTimeStore } from "../../state/timeStore";
import { useNormalizeStore } from "../../state/normalizeStore";
import { useGroupStore } from "../../state/groupStore";
import { hsvToCss, rgbToCss, rgbToHsv } from "../../lib/color";
import {
  circularKde,
  searchsorted,
  weightedCircularKde,
} from "../../lib/circularKde";
import { PlotlyChart } from "./PlotlyChart";
import { NormalizedBadge } from "../NormalizeToggle";
import { GroupedBadge } from "../GroupToggle";

interface Props {
  allVotes: Vote[];
  blocks: Block[];
  bwDeg?: number;
  n?: number;
}

type SourceMode = "votes" | "base";

interface RingItem {
  key: string;
  name: string;
  hueDeg: number;
  hueRad: number;
  rgbCss: string;
  count: number;
  isGroup: boolean;
}

const INNER_R = 0.45;
const OUTER_R = 0.9;
const SCATTER_OFFSET = 0.06;
const BASE_DENSITY_FLOOR_FRAC = 0.01;

export function HueRingKde({ allVotes, blocks, bwDeg = 12, n = 720 }: Props) {
  const slice = useVotesUpTo(allVotes);
  const minSat = useTimeStore((s) => s.minSaturation);
  const normalize = useNormalizeStore((s) => s.normalize);
  const group = useGroupStore((s) => s.group);
  const [mode, setMode] = useState<SourceMode>("votes");

  const effectiveMode: SourceMode = normalize ? "votes" : mode;

  const baseInfo = useMemo(() => {
    const bwRad = (bwDeg * Math.PI) / 180;
    const items: RingItem[] = [];
    const huesRad: number[] = [];
    if (group) {
      type Accum = { r: number; g: number; b: number; n: number; name: string; key: string };
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
        const hueRad = (hsv.h * Math.PI) / 180;
        huesRad.push(hueRad);
        items.push({
          key: a.key,
          name: a.name,
          hueDeg: hsv.h,
          hueRad,
          rgbCss: rgbToCss(rgb),
          count: a.n,
          isGroup: true,
        });
      }
      for (const b of ungrouped) {
        const hsv = rgbToHsv(b.rgb);
        if (hsv.s < minSat) continue;
        const hueRad = (hsv.h * Math.PI) / 180;
        huesRad.push(hueRad);
        items.push({
          key: b.key,
          name: b.name,
          hueDeg: hsv.h,
          hueRad,
          rgbCss: rgbToCss(b.rgb),
          count: 1,
          isGroup: false,
        });
      }
    } else {
      for (const b of blocks) {
        const hsv = rgbToHsv(b.rgb);
        if (hsv.s < minSat) continue;
        const hueRad = (hsv.h * Math.PI) / 180;
        huesRad.push(hueRad);
        items.push({
          key: b.key,
          name: b.name,
          hueDeg: hsv.h,
          hueRad,
          rgbCss: rgbToCss(b.rgb),
          count: 1,
          isGroup: false,
        });
      }
    }
    const { grid, density } = circularKde(huesRad, bwRad, n);
    return { items, density, grid };
  }, [blocks, minSat, bwDeg, n, group]);

  const voteInfo = useMemo(() => {
    type Accum = {
      key: string;
      name: string;
      rSum: number;
      gSum: number;
      bSum: number;
      count: number;
      isGroup: boolean;
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
          isGroup,
        });
      }
    }
    const items: RingItem[] = [];
    for (const it of byEntity.values()) {
      const rgb: Rgb = [
        Math.round(it.rSum / it.count),
        Math.round(it.gSum / it.count),
        Math.round(it.bSum / it.count),
      ];
      const hsv = rgbToHsv(rgb);
      items.push({
        key: it.key,
        name: it.name,
        hueDeg: hsv.h,
        hueRad: (hsv.h * Math.PI) / 180,
        rgbCss: rgbToCss(rgb),
        count: it.count,
        isGroup: it.isGroup,
      });
    }
    const bwRad = (bwDeg * Math.PI) / 180;
    const huesRad = items.map((i) => i.hueRad);
    const weights = items.map((i) => i.count);
    const { grid, density } = weightedCircularKde(huesRad, weights, bwRad, n);
    return { items, density, grid };
  }, [slice.count, minSat, bwDeg, n, group]);

  const { data, layout } = useMemo(() => {
    const baseDensity = baseInfo.density;
    const voteDensity = voteInfo.density;
    const grid = voteInfo.grid;

    let plotDensity: Float64Array;
    if (normalize && baseDensity.length === voteDensity.length) {
      let baseMax = 0;
      for (let i = 0; i < baseDensity.length; i++) {
        if (baseDensity[i] > baseMax) baseMax = baseDensity[i];
      }
      const floor = (baseMax || 1) * BASE_DENSITY_FLOOR_FRAC;
      plotDensity = new Float64Array(voteDensity.length);
      for (let i = 0; i < voteDensity.length; i++) {
        const denom = Math.max(baseDensity[i], floor);
        plotDensity[i] = voteDensity[i] / denom;
      }
    } else if (effectiveMode === "base") {
      plotDensity = baseDensity;
    } else {
      plotDensity = voteDensity;
    }

    let dmin = Infinity;
    let dmax = -Infinity;
    for (let i = 0; i < plotDensity.length; i++) {
      if (plotDensity[i] < dmin) dmin = plotDensity[i];
      if (plotDensity[i] > dmax) dmax = plotDensity[i];
    }
    const span = dmax - dmin || 1;
    const rScaled = new Float64Array(plotDensity.length);
    for (let i = 0; i < plotDensity.length; i++) {
      rScaled[i] =
        INNER_R + ((plotDensity[i] - dmin) / span) * (OUTER_R - INNER_R);
    }

    const gridDeg = new Array<number>(n);
    const wedgeR = new Array<number>(n);
    const wedgeColor = new Array<string>(n);
    const wedgeWidth = 360 / n;
    for (let i = 0; i < n; i++) {
      gridDeg[i] = (grid[i] * 180) / Math.PI;
      wedgeR[i] = rScaled[i] - INNER_R;
      wedgeColor[i] = hsvToCss(gridDeg[i], 0.85, 0.95);
    }

    const wedgeTrace = {
      type: "barpolar",
      theta: gridDeg,
      r: wedgeR,
      width: new Array(n).fill(wedgeWidth),
      base: INNER_R,
      marker: {
        color: wedgeColor,
        line: { width: 0 },
      },
      hoverinfo: "skip",
      showlegend: false,
    } as unknown as Data;

    const ringTheta = new Array<number>(361);
    const ringR = new Array<number>(361);
    for (let i = 0; i <= 360; i++) {
      ringTheta[i] = i;
      ringR[i] = INNER_R;
    }
    const ringTrace: Data = {
      type: "scatterpolar",
      mode: "lines",
      theta: ringTheta,
      r: ringR,
      line: { color: "#cccccc", width: 1.2 },
      hoverinfo: "skip",
      showlegend: false,
    };

    const dotItems = effectiveMode === "base" ? baseInfo.items : voteInfo.items;
    const dotTheta = dotItems.map((i) => i.hueDeg);
    const dotR = dotItems.map((i) => {
      const idx = searchsorted(grid, i.hueRad);
      return rScaled[idx] + SCATTER_OFFSET;
    });
    const dotColor = dotItems.map((i) => i.rgbCss);
    const dotText =
      effectiveMode === "base"
        ? dotItems.map((i) =>
            i.isGroup
              ? `${i.name} - ${i.count} variant${i.count === 1 ? "" : "s"} - ${i.hueDeg.toFixed(0)}°`
              : `${i.name} - ${i.hueDeg.toFixed(0)}°`,
          )
        : dotItems.map(
            (i) =>
              `${i.name} - ${i.count} vote${i.count === 1 ? "" : "s"} - ${i.hueDeg.toFixed(0)}°`,
          );

    const dotTrace: Data = {
      type: "scatterpolar",
      mode: "markers",
      theta: dotTheta,
      r: dotR,
      marker: {
        color: dotColor,
        size: 8,
        line: { color: "rgba(0,0,0,0.25)", width: 0.5 },
      },
      text: dotText,
      hovertemplate: "%{text}<extra></extra>",
      showlegend: false,
    };

    const data: Data[] = [wedgeTrace, ringTrace, dotTrace];

    const titleText = normalize
      ? "Gaussian KDE / hue ring (votes ÷ base)"
      : effectiveMode === "base"
        ? "Gaussian KDE / hue ring (base distribution)"
        : "Gaussian KDE / hue ring (vote distribution)";

    const annotationText = normalize
      ? "radius → votes ÷ base"
      : effectiveMode === "base"
        ? "radius → base density"
        : "radius → vote density";

    const layout: Partial<Layout> = {
      title: {
        text: titleText,
        font: { size: 14 },
      },
      margin: { l: 20, r: 20, t: 36, b: 20 },
      polar: {
        bgcolor: "white",
        angularaxis: {
          rotation: 90,
          direction: "clockwise",
          visible: false,
        },
        radialaxis: {
          visible: false,
          range: [0, OUTER_R + 0.12],
        },
      },
      showlegend: false,
      annotations: [
        {
          text: annotationText,
          x: 0.5,
          y: 0.5,
          xref: "paper",
          yref: "paper",
          showarrow: false,
          font: { size: 10, color: "#888" },
        },
      ],
    };

    return { data, layout };
  }, [voteInfo, baseInfo, normalize, effectiveMode, n, group]);

  return (
    <div className="chart-card hue-ring-card">
      {normalize && (
        <NormalizedBadge
          description="The vote-density at each hue is divided by the dataset's natural hue density (one weight-1 sample per block, or per group when GROUP is also on). Radii now show how much each hue overperformed its share of the block list, rather than absolute popularity."
        />
      )}
      {group && (
        <GroupedBadge description="Each dot/wedge represents a canonical group rather than an individual block. The group's hue is the vote-weighted RGB average of its members up to the cursor, so it drifts as different variants accumulate votes." />
      )}
      <div className="hue-ring-source-toggle" role="tablist" aria-label="density source">
        <button
          type="button"
          role="tab"
          aria-selected={effectiveMode === "votes"}
          className={`hue-ring-source-button${effectiveMode === "votes" ? " is-active" : ""}`}
          onClick={() => setMode("votes")}
          disabled={normalize}
          title={
            normalize
              ? "Normalized mode shows VOTES ÷ BASE"
              : "Show density of incoming votes"
          }
        >
          VOTES
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={effectiveMode === "base"}
          className={`hue-ring-source-button${effectiveMode === "base" ? " is-active" : ""}`}
          onClick={() => setMode("base")}
          disabled={normalize}
          title={
            normalize
              ? "Normalized mode shows VOTES ÷ BASE"
              : "Show the natural hue distribution of the block list"
          }
        >
          BASE
        </button>
      </div>
      <PlotlyChart data={data} layout={layout} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
