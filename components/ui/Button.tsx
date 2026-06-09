import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  fullWidth?: boolean;
}

export default function Button({
  variant = "primary",
  fullWidth = false,
  className,
  children,
  style,
  ...props
}: ButtonProps) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    fontWeight: 700,
    fontSize: 15,
    padding: "14px 24px",
    cursor: "pointer",
    transition: "all 0.15s",
    border: "none",
    fontFamily: "var(--font-en)",
    width: fullWidth ? "100%" : undefined,
    WebkitTapHighlightColor: "transparent",
    touchAction: "manipulation",
    minHeight: 48,
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: "var(--gold)",
      color: "#0d0f1a",
    },
    secondary: {
      background: "transparent",
      color: "var(--text)",
      border: "0.5px solid rgba(255,255,255,0.2)",
    },
    danger: {
      background: "rgba(247,79,106,0.15)",
      color: "var(--red)",
      border: "0.5px solid rgba(247,79,106,0.3)",
    },
  };

  return (
    <button
      style={{ ...base, ...variants[variant], ...style }}
      className={clsx(className)}
      {...props}
    >
      {children}
    </button>
  );
}