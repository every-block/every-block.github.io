import { useMemo } from "react";
import type { Data, Layout } from "plotly.js-dist-min";
import type { Block, Rgb, Vote } from "../../data/types";
import { useVotesUpTo } from "../../state/useVotesUpTo";
import { useNormalizeStore } from "../../state/normalizeStore";
import { rgbToCss } from "../../lib/color";
import { cleanVersion, groupVersions } from "../../lib/versionEpoch";
import { NormalizedBadge } from "../NormalizeToggle";
import { PlotlyChart } from "./PlotlyChart";

interface Props {
  allVotes: Vote[];
  blocks: Block[];
}

const EMPTY_BAR_COLOR = "#e5e5e7";

export function VersionHistogram({ allVotes, blocks }: Props) {
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
  }, [slice.count]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data, layout } = useMemo(() => {
    const x: string[] = [];
    const y: number[] = [];
    const colors: string[] = [];
    const customdata: Array<[number, number, number]> = []; // [count, blocks, ratio]
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
      x.push(version);
      y.push(value);
      colors.push(avg ? rgbToCss(avg) : EMPTY_BAR_COLOR);
      customdata.push([
        count,
        blocksInVersion,
        blocksInVersion > 0 ? count / blocksInVersion : 0,
      ]);
    }

    const hovertemplate = normalize
      ? "<b>%{x}</b><br>%{customdata[0]} votes / %{customdata[1]} blocks<br>%{customdata[2]:.2f} per block<extra></extra>"
      : "<b>%{x}</b><br>%{customdata[0]} votes · %{customdata[1]} blocks<extra></extra>";

    const trace: Data = {
      type: "bar",
      x,
      y,
      marker: {
        color: colors,
        line: { color: "rgba(0, 0, 0, 0.18)", width: 1 },
      },
      customdata,
      hovertemplate,
      showlegend: false,
    };

    const layout: Partial<Layout> = {
      margin: { l: 44, r: 12, t: 8, b: 80 },
      bargap: 0.12,
      xaxis: {
        type: "category",
        categoryorder: "array",
        categoryarray: x,
        tickangle: -55,
        tickfont: { size: 10 },
        automargin: false,
        showgrid: false,
        ticks: "outside",
        ticklen: 3,
        tickcolor: "#ccc",
        linecolor: "#ddd",
      },
      yaxis: {
        title: { text: normalize ? "votes / block" : "votes", font: { size: 11 } },
        rangemode: "tozero",
        gridcolor: "#eee",
        zerolinecolor: "#ddd",
        tickfont: { size: 10 },
      },
      hoverlabel: {
        bgcolor: "rgba(20,20,20,0.92)",
        bordercolor: "rgba(20,20,20,0.92)",
        font: { color: "white", size: 12 },
      },
    };

    return { data: [trace], layout };
  }, [ordered, stats, normalize]);

  return (
    <div className="chart-card vhist-card">
      <div className="chart-card-title">
        votes by version (histogram){normalize ? " — per block" : ""}
      </div>
      {normalize && (
        <NormalizedBadge
          description="Each bar's height is votes ÷ number of blocks released in that version. Versions are pinned in chronological order so heights are directly comparable across the timeline."
        />
      )}
      <PlotlyChart
        data={data}
        layout={layout}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
