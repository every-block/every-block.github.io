import { useNormalizeStore } from "../state/normalizeStore";

export function NormalizeToggle() {
  const enabled = useNormalizeStore((s) => s.normalize);
  const toggle = useNormalizeStore((s) => s.toggle);
  return (
    <button
      type="button"
      className={`normalize-toggle${enabled ? " is-on" : ""}`}
      onClick={() => toggle()}
      aria-pressed={enabled}
      title="Normalize supported charts against their baseline distribution"
    >
      <span className="normalize-toggle-dot" aria-hidden />
      <span>NORMALIZE</span>
    </button>
  );
}

interface BadgeProps {
  description: string;
}

export function NormalizedBadge({ description }: BadgeProps) {
  return (
    <div className="normalized-badge" role="status" aria-label="normalized">
      <span className="normalized-badge-text">NORMALIZED</span>
      <div className="normalized-badge-tooltip" role="tooltip">
        {description}
      </div>
    </div>
  );
}
