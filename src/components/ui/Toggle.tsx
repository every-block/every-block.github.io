interface Props {
  active: boolean;
  onChange: (next: boolean) => void;
  label: string;
  tone?: "green" | "blue" | "yellow" | "neutral";
  title?: string;
}

export function Toggle({
  active,
  onChange,
  label,
  tone = "neutral",
  title,
}: Props) {
  const className = [
    "ui-toggle",
    `ui-toggle--${tone}`,
    active ? "is-on" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      type="button"
      className={className}
      onClick={() => onChange(!active)}
      aria-pressed={active}
      title={title}
    >
      <span className="ui-toggle-dot" aria-hidden />
      <span>{label}</span>
    </button>
  );
}
