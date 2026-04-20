import { useEffect, useState } from "react";
import type { BuildInfo } from "../../data/loadBuildInfo";

interface Props {
  buildInfo: BuildInfo | null;
}

export function LastRefreshedIndicator({ buildInfo }: Props) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!buildInfo) return;
    const id = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, [buildInfo]);

  if (!buildInfo) return null;

  const relative = formatRelative(buildInfo.fetchedAt, new Date());
  const absolute = formatAbsolute(buildInfo.fetchedAt);

  return (
    <div
      className="last-refreshed"
      role="status"
      aria-label={`Data last refreshed ${relative}`}
    >
      <ClockIcon />
      <div className="last-refreshed-tooltip" role="tooltip">
        <div className="last-refreshed-tooltip-line">
          Data last refreshed <strong>{relative}</strong>
        </div>
        <div className="last-refreshed-tooltip-line last-refreshed-tooltip-meta">
          {absolute}
        </div>
      </div>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width={14}
      height={14}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx={8} cy={8} r={6.25} />
      <path d="M8 4.5 V 8 L 10.5 9.5" />
    </svg>
  );
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function formatRelative(then: Date, now: Date): string {
  const diff = Math.max(0, now.getTime() - then.getTime());
  if (diff < 45 * SECOND) return "just now";
  if (diff < 90 * SECOND) return "1 minute ago";
  if (diff < 45 * MINUTE) {
    const m = Math.round(diff / MINUTE);
    return `${m} minutes ago`;
  }
  if (diff < 90 * MINUTE) return "1 hour ago";
  if (diff < 22 * HOUR) {
    const h = Math.round(diff / HOUR);
    return `${h} hours ago`;
  }
  if (diff < 36 * HOUR) return "1 day ago";
  const d = Math.round(diff / DAY);
  return `${d} days ago`;
}

function formatAbsolute(t: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())} ` +
    `${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())} UTC`
  );
}
