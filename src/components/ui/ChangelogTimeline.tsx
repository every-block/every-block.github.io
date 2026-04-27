import type { ChangelogEntry } from "@/data/changelog";
import { renderChangelogLine } from "@/utils/parse-changelog-text";

const dateFmt = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatChangelogDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return dateFmt.format(d);
}

interface Props {
  entries: readonly ChangelogEntry[];
}

export function ChangelogTimeline({ entries }: Props) {
  const sorted = [...entries].sort((a, b) => b.at.localeCompare(a.at));
  if (sorted.length === 0) {
    return <p className="changelog-empty">No entries yet.</p>;
  }
  return (
    <ol className="changelog-timeline">
      {sorted.map((entry) => (
        <li className="changelog-day" key={entry.at}>
          <div className="changelog-day-date" aria-label={`Changes on ${formatChangelogDate(entry.at)}`}>
            <time dateTime={entry.at}>{formatChangelogDate(entry.at)}</time>
          </div>
          <div className="changelog-day-track" aria-hidden>
            <span className="changelog-day-dot" />
          </div>
          <ul
            className={
              entry.items.length > 1
                ? "changelog-day-items changelog-day-items--multi"
                : "changelog-day-items"
            }
          >
            {entry.items.map((line, i) => (
              <li key={i} className="changelog-day-line">
                {renderChangelogLine(line, `${entry.at}-${i}`)}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
