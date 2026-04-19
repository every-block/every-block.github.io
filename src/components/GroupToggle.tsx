import { useGroupStore } from "../state/groupStore";

export function GroupToggle() {
  const enabled = useGroupStore((s) => s.group);
  const toggle = useGroupStore((s) => s.toggle);
  return (
    <button
      type="button"
      className={`group-toggle${enabled ? " is-on" : ""}`}
      onClick={() => toggle()}
      aria-pressed={enabled}
      title="Merge variant blocks (e.g. Stone Slab → Stone) into canonical groups for supported charts"
    >
      <span className="group-toggle-dot" aria-hidden />
      <span>GROUP</span>
    </button>
  );
}

interface BadgeProps {
  description: string;
}

export function GroupedBadge({ description }: BadgeProps) {
  return (
    <div className="grouped-badge" role="status" aria-label="grouped">
      <span className="grouped-badge-text">GROUPED</span>
      <div className="grouped-badge-tooltip" role="tooltip">
        {description}
      </div>
    </div>
  );
}
