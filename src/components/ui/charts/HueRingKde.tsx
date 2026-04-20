import { useMemo } from "react";
import type { ReactNode } from "react";
import type { Data, Layout } from "plotly.js-dist-min";
import { hsvToCss } from "@/utils/color";
import { searchsorted, weightedCircularKde } from "@/utils/circular-kde";
import { Tabs } from "@/ui/Tabs";
import { PlotlyChart } from "@/ui/charts/PlotlyChart";
import type { HuePoint } from "@/types/chart-items";

export type HueRingMode = "items" | "base" | "normalized";

interface Props {
  items: HuePoint[];
  baseItems?: HuePoint[];
  mode: HueRingMode;
  onModeChange?: (mode: HueRingMode) => void;
  title?: string;
  itemsLabel?: string;
  baseLabel?: string;
  badge?: ReactNode;
  extraControls?: ReactNode;
  bwDeg?: number;
  n?: number;
}

const INNER_R = 0.45;
const OUTER_R = 0.9;
const SCATTER_OFFSET = 0.06;
const BASE_DENSITY_FLOOR_FRAC = 0.01;

function buildKde(items: HuePoint[], bwRad: number, n: number) {
  const huesRad = items.map((i) => (i.hueDeg * Math.PI) / 180);
  const weights = items.map((i) => i.weight);
  return weightedCircularKde(huesRad, weights, bwRad, n);
}

export function HueRingKde({
  items,
  baseItems,
  mode,
  onModeChange,
  title,
  itemsLabel = "ITEMS",
  baseLabel = "BASE",
  badge,
  extraControls,
  bwDeg = 12,
  n = 720,
}: Props) {
  const bwRad = (bwDeg * Math.PI) / 180;

  const itemsKde = useMemo(() => buildKde(items, bwRad, n), [items, bwRad, n]);
  const baseKde = useMemo(
    () => (baseItems ? buildKde(baseItems, bwRad, n) : null),
    [baseItems, bwRad, n],
  );

  const staticParts = useMemo(() => {
    const gridDeg = new Array<number>(n);
    const wedgeColor = new Array<string>(n);
    const wedgeWidthArr = new Array<number>(n).fill(360 / n);
    const dTheta = 360 / n;
    for (let i = 0; i < n; i++) {
      gridDeg[i] = i * dTheta;
      wedgeColor[i] = hsvToCss(gridDeg[i], 0.85, 0.95);
    }
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
    return { gridDeg, wedgeColor, wedgeWidthArr, ringTrace };
  }, [n]);

  const { data, layout } = useMemo(() => {
    const itemsDensity = itemsKde.density;
    const baseDensity = baseKde?.density;
    const grid = itemsKde.grid;

    let plotDensity: Float64Array;
    if (mode === "normalized" && baseDensity && baseDensity.length === itemsDensity.length) {
      let baseMax = 0;
      for (let i = 0; i < baseDensity.length; i++) {
        if (baseDensity[i] > baseMax) baseMax = baseDensity[i];
      }
      const floor = (baseMax || 1) * BASE_DENSITY_FLOOR_FRAC;
      plotDensity = new Float64Array(itemsDensity.length);
      for (let i = 0; i < itemsDensity.length; i++) {
        const denom = Math.max(baseDensity[i], floor);
        plotDensity[i] = itemsDensity[i] / denom;
      }
    } else if (mode === "base" && baseDensity) {
      plotDensity = baseDensity;
    } else {
      plotDensity = itemsDensity;
    }

    let dmin = Infinity;
    let dmax = -Infinity;
    for (let i = 0; i < plotDensity.length; i++) {
      if (plotDensity[i] < dmin) dmin = plotDensity[i];
      if (plotDensity[i] > dmax) dmax = plotDensity[i];
    }
    const span = dmax - dmin || 1;
    const rScaled = new Float64Array(plotDensity.length);
    const wedgeR = new Array<number>(n);
    for (let i = 0; i < plotDensity.length; i++) {
      const r =
        INNER_R + ((plotDensity[i] - dmin) / span) * (OUTER_R - INNER_R);
      rScaled[i] = r;
      wedgeR[i] = r - INNER_R;
    }

    const { gridDeg, wedgeColor, wedgeWidthArr, ringTrace } = staticParts;

    const wedgeTrace = {
      type: "barpolar",
      theta: gridDeg,
      r: wedgeR,
      width: wedgeWidthArr,
      base: INNER_R,
      marker: { color: wedgeColor, line: { width: 0 } },
      hoverinfo: "skip",
      showlegend: false,
    } as unknown as Data;

    const dotSource = mode === "base" && baseItems ? baseItems : items;
    const dotTheta = dotSource.map((i) => i.hueDeg);
    const dotR = dotSource.map((i) => {
      const hueRad = (i.hueDeg * Math.PI) / 180;
      const idx = searchsorted(grid, hueRad);
      return rScaled[idx] + SCATTER_OFFSET;
    });
    const dotColor = dotSource.map((i) => i.color);
    const dotText = dotSource.map(
      (i) =>
        i.meta ??
        `${i.label} - ${i.weight.toFixed(0)} - ${i.hueDeg.toFixed(0)}°`,
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

    const annotationText =
      mode === "normalized"
        ? "radius → items ÷ base"
        : mode === "base"
          ? "radius → base density"
          : "radius → item density";

    const layout: Partial<Layout> = {
      title: { text: title, font: { size: 14 } },
      margin: { l: 20, r: 20, t: 36, b: 20 },
      polar: {
        bgcolor: "white",
        angularaxis: {
          rotation: 90,
          direction: "clockwise",
          visible: false,
        },
        radialaxis: { visible: false, range: [0, OUTER_R + 0.12] },
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

    return { data: [wedgeTrace, ringTrace, dotTrace], layout };
  }, [itemsKde, baseKde, mode, items, baseItems, n, title, staticParts]);

  const canShowBase = !!baseItems;
  const normalizedLocked = mode === "normalized";

  return (
    <div className="chart-card hue-ring-card">
      {badge}
      {onModeChange && canShowBase && (
        <Tabs<HueRingMode>
          size="sm"
          className="hue-ring-source-overlay"
          ariaLabel="density source"
          items={[
            {
              id: "items",
              label: itemsLabel,
              disabled: normalizedLocked,
              title: normalizedLocked
                ? "Normalized mode shows items ÷ base"
                : "Show density of items",
            },
            {
              id: "base",
              label: baseLabel,
              disabled: normalizedLocked,
              title: normalizedLocked
                ? "Normalized mode shows items ÷ base"
                : "Show the natural distribution",
            },
          ]}
          active={mode === "normalized" ? "items" : mode}
          onChange={onModeChange}
        />
      )}
      {extraControls}
      <PlotlyChart data={data} layout={layout} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
