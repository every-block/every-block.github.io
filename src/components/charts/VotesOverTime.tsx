import { useMemo } from "react";
import type { Data, Layout } from "plotly.js-dist-min";
import type { Vote } from "../../data/types";
import { EVENTS, type TimelineEvent } from "../../data/events";
import { useTimeStore } from "../../state/timeStore";
import { useVotesUpTo } from "../../state/useVotesUpTo";
import { PlotlyChart } from "./PlotlyChart";

interface Props {
  allVotes: Vote[];
  sampleCount?: number;
  windowFraction?: number;
}

const LINE_COLOR = "#2563eb";
const FILL_COLOR = "rgba(37, 99, 235, 0.18)";

const MARGIN = { l: 44, r: 12, t: 8, b: 40 } as const;

export function VotesOverTime({
  allVotes,
  sampleCount = 240,
  windowFraction = 1 / 50,
}: Props) {
  const slice = useVotesUpTo(allVotes);
  const startTime = useTimeStore((s) => s.startTime);
  const endTime = useTimeStore((s) => s.endTime);
  const currentTime = useTimeStore((s) => s.currentTime);

  const span = endTime - startTime;
  const windowMs = span * windowFraction;

  const { xs, ys } = useMemo(() => {
    const out = { xs: [] as Date[], ys: [] as number[] };
    if (span <= 0 || sampleCount <= 0) return out;

    const votes = slice.votes;
    const dx = span / sampleCount;
    let left = 0;
    let right = 0;

    const pushSample = (xMs: number) => {
      while (right < votes.length && votes[right].timestamp <= xMs) right++;
      while (left < right && votes[left].timestamp <= xMs - windowMs) left++;
      out.xs.push(new Date(xMs));
      out.ys.push(right - left);
    };

    for (let i = 0; i <= sampleCount; i++) {
      const xi = startTime + i * dx;
      if (xi >= currentTime) break;
      pushSample(xi);
    }

    pushSample(currentTime);
    return out;
  }, [slice.count, span, startTime, currentTime, sampleCount, windowMs]);

  const { data, layout } = useMemo(() => {
    const windowLabel = formatDuration(windowMs);
    const trace: Data = {
      type: "scatter",
      mode: "lines",
      x: xs,
      y: ys,
      line: { color: LINE_COLOR, width: 2, shape: "spline", smoothing: 0.6 },
      fill: "tozeroy",
      fillcolor: FILL_COLOR,
      hovertemplate: `%{x|%b %d %Y · %H:%M}<br><b>%{y}</b> votes in last ${windowLabel}<extra></extra>`,
      showlegend: false,
    };
    const layout: Partial<Layout> = {
      margin: { ...MARGIN },
      xaxis: {
        type: "date",
        range: [new Date(startTime), new Date(endTime)],
        gridcolor: "#eee",
        linecolor: "#ddd",
        tickfont: { size: 10 },
      },
      yaxis: {
        title: { text: `votes / ${windowLabel}`, font: { size: 11 } },
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
      shapes: [
        {
          type: "line",
          xref: "x",
          yref: "paper",
          x0: new Date(currentTime) as unknown as number,
          x1: new Date(currentTime) as unknown as number,
          y0: 0,
          y1: 1,
          line: { color: "#999", width: 1, dash: "dot" },
        },
      ],
    };
    return { data: [trace], layout };
  }, [xs, ys, startTime, endTime, currentTime, windowMs]);

  const visibleEvents: TimelineEvent[] =
    span > 0
      ? EVENTS.filter((e) => e.timestamp >= startTime && e.timestamp <= endTime)
      : [];

  return (
    <div className="chart-card vot-card">
      <div className="chart-card-title">
        votes over time
        <span className="chart-card-subtle">
          {" "}
          · rolling {formatDuration(windowMs)} window
        </span>
      </div>
      <div className="vot-plot-wrap">
        <PlotlyChart
          data={data}
          layout={layout}
          style={{ width: "100%", height: "100%" }}
        />
        {visibleEvents.length > 0 && (
          <div
            className="vot-flag-layer"
            style={
              {
                "--vot-margin-l": `${MARGIN.l}px`,
                "--vot-margin-r": `${MARGIN.r}px`,
                "--vot-margin-t": `${MARGIN.t}px`,
                "--vot-margin-b": `${MARGIN.b}px`,
              } as React.CSSProperties
            }
            aria-hidden={false}
          >
            {visibleEvents.map((ev) => {
              const pct = (ev.timestamp - startTime) / span;
              const align =
                pct > 0.85 ? "right" : pct < 0.15 ? "left" : "center";
              return (
                <div
                  key={`${ev.timestamp}-${ev.label}`}
                  className={`vot-flag vot-flag-align-${align}`}
                  style={{ "--pct": pct } as React.CSSProperties}
                  tabIndex={0}
                  role="img"
                  aria-label={`${ev.label}: ${ev.description}`}
                >
                  <span className="vot-flag-line" />
                  <span className="vot-flag-hit" />
                  <span className="vot-flag-tooltip" role="tooltip">
                    <span className="vot-flag-tooltip-title">{ev.label}</span>
                    <span className="vot-flag-tooltip-time">
                      {fmtTimestamp(ev.timestamp)}
                    </span>
                    <span className="vot-flag-tooltip-desc">
                      {ev.description}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function fmtTimestamp(t: number): string {
  if (!Number.isFinite(t)) return "—";
  return new Date(t).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDuration(ms: number): string {
  if (ms <= 0) return "—";
  const sec = ms / 1000;
  const min = sec / 60;
  const hr = min / 60;
  const day = hr / 24;
  if (day >= 1) return `${day < 10 ? day.toFixed(1) : Math.round(day)}d`;
  if (hr >= 1) return `${hr < 10 ? hr.toFixed(1) : Math.round(hr)}h`;
  if (min >= 1) return `${min < 10 ? min.toFixed(1) : Math.round(min)}m`;
  return `${Math.round(sec)}s`;
}
