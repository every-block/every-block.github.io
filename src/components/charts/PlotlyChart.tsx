import { useEffect, useRef } from "react";
import Plotly, { type Data, type Layout, type Config } from "plotly.js-dist-min";

interface Props {
  data: Data[];
  layout?: Partial<Layout>;
  config?: Partial<Config>;
  className?: string;
  style?: React.CSSProperties;
}

const DEFAULT_CONFIG: Partial<Config> = {
  displaylogo: false,
  responsive: true,
  modeBarButtonsToRemove: [
    "lasso2d",
    "select2d",
    "autoScale2d",
    "toggleSpikelines",
  ],
};

const DEFAULT_LAYOUT: Partial<Layout> = {
  margin: { l: 40, r: 20, t: 40, b: 40 },
  paper_bgcolor: "white",
  plot_bgcolor: "white",
  font: { family: "system-ui, sans-serif", size: 12, color: "#333" },
  hoverlabel: { font: { family: "system-ui, sans-serif" } },
};

export function PlotlyChart({ data, layout, config, className, style }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const merged: Partial<Layout> = { ...DEFAULT_LAYOUT, ...layout };
    const cfg: Partial<Config> = { ...DEFAULT_CONFIG, ...config };
    Plotly.react(el, data, merged, cfg);
    initialized.current = true;
  }, [data, layout, config]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (initialized.current) Plotly.Plots.resize(el);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      if (initialized.current) Plotly.purge(el);
      initialized.current = false;
    };
  }, []);

  return <div ref={ref} className={className} style={style} />;
}
