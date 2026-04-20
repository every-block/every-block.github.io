export interface TabItem<T extends string> {
  id: T;
  label: string;
  disabled?: boolean;
  title?: string;
}

interface Props<T extends string> {
  items: ReadonlyArray<TabItem<T>>;
  active: T;
  onChange: (id: T) => void;
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}

export function Tabs<T extends string>({
  items,
  active,
  onChange,
  size = "md",
  className,
  ariaLabel,
}: Props<T>) {
  const rootClass = [
    "ui-tabs",
    `ui-tabs--${size}`,
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={rootClass} role="tablist" aria-label={ariaLabel}>
      {items.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            title={tab.title}
            className={`ui-tabs-btn${isActive ? " is-active" : ""}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
