interface Props {
  tone: "green" | "blue";
  label: string;
  description: string;
}

export function Badge({ tone, label, description }: Props) {
  return (
    <div
      className={`ui-badge ui-badge--${tone}`}
      role="status"
      aria-label={label.toLowerCase()}
    >
      <span className="ui-badge-text">{label}</span>
      <div className="ui-badge-tooltip" role="tooltip">
        {description}
      </div>
    </div>
  );
}
