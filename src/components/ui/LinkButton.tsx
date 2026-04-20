import type {
  AnchorHTMLAttributes,
  MouseEventHandler,
  ReactNode,
} from "react";

type AnchorPassthrough = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "className" | "children"
>;

interface Props extends AnchorPassthrough {
  href: string;
  children: ReactNode;
  tone?: "purple" | "neutral" | "red";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  sparkles?: boolean;
}

export function LinkButton({
  href,
  children,
  tone = "purple",
  size = "md",
  target,
  rel,
  className,
  disabled = false,
  sparkles = false,
  onClick,
  ...rest
}: Props) {
  const resolvedRel =
    rel ?? (target === "_blank" ? "noopener noreferrer" : undefined);

  const classes = [
    "ui-link-button",
    `ui-link-button--${tone}`,
    `ui-link-button--${size}`,
    disabled ? "is-disabled" : "",
    sparkles ? "has-sparkles" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    if (disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onClick?.(event);
  };

  return (
    <a
      {...rest}
      href={disabled ? undefined : href}
      target={disabled ? undefined : target}
      rel={disabled ? undefined : resolvedRel}
      className={classes}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : rest.tabIndex}
      onClick={handleClick}
    >
      {children}
      {sparkles && (
        <span className="ui-link-button-sparkles" aria-hidden>
          <span className="ui-link-button-sparkle" />
          <span className="ui-link-button-sparkle" />
          <span className="ui-link-button-sparkle" />
          <span className="ui-link-button-sparkle" />
          <span className="ui-link-button-sparkle" />
          <span className="ui-link-button-sparkle" />
        </span>
      )}
    </a>
  );
}
