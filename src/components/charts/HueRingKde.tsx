import { useMemo } from "react";
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

const INNER_R = 0.45;
const OUTER_R = 0.9;
const SCATTER_OFFSET = 0.06;
const BASE_DENSITY_FLOOR_FRAC = 0.01;

export function HueRingKde({ allVotes, blocks, bwDeg = 12, n = 720 }: Props) {
  const slice = useVotesUpTo(allVotes);
  const minSat = useTimeStore((s) => s.minSaturation);
  const normalize = useNormalizeStore((s) => s.normalize);
  const group = useGroupStore((s) => s.group);

  const baseDensity = useMemo(() => {
    const bwRad = (bwDeg * Math.PI) / 180;
    const huesRad: number[] = [];
    if (group) {
      type Accum = { r: number; g: number; b: number; n: number };
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
        huesRad.push((hsv.h * Math.PI) / 180);
      }
      for (const b of ungrouped) {
        const hsv = rgbToHsv(b.rgb);
        if (hsv.s < minSat) continue;
        huesRad.push((hsv.h * Math.PI) / 180);
      }
    } else {
      for (const b of blocks) {
        const hsv = rgbToHsv(b.rgb);
        if (hsv.s < minSat) continue;
        huesRad.push((hsv.h * Math.PI) / 180);
      }
    }
    return circularKde(huesRad, bwRad, n).density;
  }, [blocks, minSat, bwDeg, n, group]);

  const { data, layout } = useMemo(() => {
    type Item = {
      key: string;
      name: string;
      rSum: number;
      gSum: number;
      bSum: number;
      count: number;
    };
    const byEntity = new Map<string, Item>();
    for (const v of slice.votes) {
      const hsv = rgbToHsv(v.block.rgb);
      if (hsv.s < minSat) continue;
      const id = group && v.block.groupKey ? v.block.groupKey : v.block.key;
      const nm = group && v.block.groupName ? v.block.groupName : v.block.name;
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
    type ResolvedItem = {
      key: string;
      name: string;
      hueDeg: number;
      hueRad: number;
      rgbCss: string;
      count: number;
    };
    const items: ResolvedItem[] = [];
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
      });
    }

    const bwRad = (bwDeg * Math.PI) / 180;
    const huesRad = items.map((i) => i.hueRad);
    const weights = items.map((i) => i.count);
    const { grid, density: voteDensity } = weightedCircularKde(
      huesRad,
      weights,
      bwRad,
      n,
    );

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

    const dotTheta = items.map((i) => i.hueDeg);
    const dotR = items.map((i) => {
      const idx = searchsorted(grid, i.hueRad);
      return rScaled[idx] + SCATTER_OFFSET;
    });
    const dotColor = items.map((i) => i.rgbCss);
    const dotText = items.map(
      (i) => `${i.name} - ${i.count} vote${i.count === 1 ? "" : "s"} - ${i.hueDeg.toFixed(0)}°`,
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

    const layout: Partial<Layout> = {
      title: {
        text: normalize
          ? "Gaussian KDE / hue ring (vs base distribution)"
          : "Gaussian KDE / hue ring",
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
          text: normalize ? "radius → votes ÷ base" : "radius → density",
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
  }, [slice.count, minSat, bwDeg, n, normalize, baseDensity, group]);

  return (
    <div className="chart-card">
      {normalize && (
        <NormalizedBadge
          description="The vote-density at each hue is divided by the dataset's natural hue density (one weight-1 sample per block, or per group when GROUP is also on). Radii now show how much each hue overperformed its share of the block list, rather than absolute popularity."
        />
      )}
      {group && (
        <GroupedBadge description="Each dot/wedge represents a canonical group rather than an individual block. The group's hue is the vote-weighted RGB average of its members up to the cursor, so it drifts as different variants accumulate votes." />
      )}
      <PlotlyChart data={data} layout={layout} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
