import { SPEED_OPTIONS, useTimeStore, type Speed } from "../state/timeStore";
import { EVENTS, type TimelineEvent } from "../data/events";

interface Props {
  voteCount: number;
  totalVotes: number;
}

function fmtTime(t: number): string {
  if (!Number.isFinite(t) || t === 0) return "—";
  const d = new Date(t);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function TimeScrubber({ voteCount, totalVotes }: Props) {
  const startTime = useTimeStore((s) => s.startTime);
  const endTime = useTimeStore((s) => s.endTime);
  const currentTime = useTimeStore((s) => s.currentTime);
  const isPlaying = useTimeStore((s) => s.isPlaying);
  const speed = useTimeStore((s) => s.speed);
  const setCurrentTime = useTimeStore((s) => s.setCurrentTime);
  const setSpeed = useTimeStore((s) => s.setSpeed);
  const toggle = useTimeStore((s) => s.toggle);
  const restart = useTimeStore((s) => s.restart);
  const pause = useTimeStore((s) => s.pause);

  const total = Math.max(0, endTime - startTime);
  const ready = total > 0;

  const visibleEvents: TimelineEvent[] = ready
    ? EVENTS.filter((e) => e.timestamp >= startTime && e.timestamp <= endTime)
    : [];

  return (
    <div className="scrubber">
      <button
        className="btn"
        onClick={restart}
        title="Restart"
        aria-label="Restart"
      >
        ⏮
      </button>
      <button
        className="btn btn-primary"
        onClick={toggle}
        disabled={!ready}
        title={isPlaying ? "Pause" : "Play"}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? "⏸" : "▶"}
      </button>

      <div className="scrubber-time">
        <div className="scrubber-time-now">{fmtTime(currentTime)}</div>
        <div className="scrubber-time-meta">
          {voteCount} / {totalVotes} votes
        </div>
      </div>

      <div className="scrubber-range-wrap">
        {visibleEvents.length > 0 && (
          <div className="scrubber-flag-layer" aria-hidden={false}>
            {visibleEvents.map((ev) => {
              const pct = (ev.timestamp - startTime) / total;
              return (
                <button
                  key={`${ev.timestamp}-${ev.label}`}
                  type="button"
                  className="scrubber-flag"
                  style={{ "--pct": pct } as React.CSSProperties}
                  onClick={() => {
                    pause();
                    setCurrentTime(ev.timestamp);
                  }}
                  aria-label={`Jump to ${ev.label}: ${ev.description}`}
                >
                  <span className="scrubber-flag-label">{ev.label}</span>
                  <span className="scrubber-flag-line" />
                  <span className="scrubber-flag-tooltip" role="tooltip">
                    <span className="scrubber-flag-tooltip-title">{ev.label}</span>
                    <span className="scrubber-flag-tooltip-time">
                      {fmtTime(ev.timestamp)}
                    </span>
                    <span className="scrubber-flag-tooltip-desc">
                      {ev.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
        <input
          className="scrubber-range"
          type="range"
          min={startTime}
          max={endTime || startTime + 1}
          step={Math.max(1, Math.floor(total / 1000))}
          value={currentTime}
          disabled={!ready}
          onChange={(e) => {
            pause();
            setCurrentTime(+e.target.value);
          }}
        />
      </div>

      <label className="scrubber-speed">
        <span>speed</span>
        <select
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value) as Speed)}
        >
          {SPEED_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}×
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
