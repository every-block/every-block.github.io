import type { ButtonHTMLAttributes } from "react";

type ToggleProps = {
  active: boolean;
  onChange: (next: boolean) => void;
  label: string;
  tone?: "green" | "blue" | "yellow" | "neutral";
  title?: string;
} & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick" | "onChange" | "type" | "children" | "aria-pressed"
>;

export function Toggle({
  active,
  onChange,
  label,
  tone = "neutral",
  title,
  className: classNameProp,
  ...rest
}: ToggleProps) {
  const className = [
    "ui-toggle",
    `ui-toggle--${tone}`,
    active ? "is-on" : "",
    classNameProp,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      {...rest}
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
