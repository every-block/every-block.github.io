import { useMemo } from "react";
import type { ReactNode } from "react";
import type { Data, Layout } from "plotly.js-dist-min";
import { PlotlyChart } from "@/ui/charts/PlotlyChart";
import type { SeriesItem } from "@/types/chart-items";

interface Props {
  items: SeriesItem[];
  title: ReactNode;
  yAxisLabel: string;
  badge?: ReactNode;
  hoverTemplate?: string;
  customdata?: Array<Array<number | string>>;
  className?: string;
}

export function CategoricalBars({
  items,
  title,
  yAxisLabel,
  badge,
  hoverTemplate,
  customdata,
  className,
}: Props) {
  const { data, layout } = useMemo(() => {
    const x = items.map((i) => i.label);
    const y = items.map((i) => i.value);
    const colors = items.map((i) => i.color);

    const trace: Data = {
      type: "bar",
      x,
      y,
      marker: {
        color: colors,
        line: { color: "rgba(0, 0, 0, 0.18)", width: 1 },
      },
      customdata,
      hovertemplate:
        hoverTemplate ?? "<b>%{x}</b><br>%{y}<extra></extra>",
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
        title: { text: yAxisLabel, font: { size: 11 } },
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
  }, [items, yAxisLabel, hoverTemplate, customdata]);

  return (
    <div className={`chart-card vhist-card${className ? ` ${className}` : ""}`}>
      <div className="chart-card-title">{title}</div>
      {badge}
      <PlotlyChart
        data={data}
        layout={layout}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
