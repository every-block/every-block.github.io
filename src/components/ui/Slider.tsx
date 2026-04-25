import type { CSSProperties, ReactNode } from "react";

interface Props {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  ariaLabel?: string;
  id?: string;
  className?: string;
  children?: ReactNode;
  style?: CSSProperties;
}

export function Slider({
  min,
  max,
  step,
  value,
  onChange,
  disabled,
  size = "md",
  ariaLabel,
  id,
  className,
  children,
  style,
}: Props) {
  const wrapClass = [
    "ui-slider",
    `ui-slider--${size}`,
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  const span = max - min;
  const fillPct = span > 0 && Number.isFinite(value) && Number.isFinite(min) && Number.isFinite(max)
    ? ((value - min) / span) * 100
    : 0;
  return (
    <div className={wrapClass} style={style}>
      {children}
      <input
        id={id}
        className="ui-slider-input"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ "--slider-fill-pct": `${fillPct}%` } as CSSProperties}
      />
    </div>
  );
}
