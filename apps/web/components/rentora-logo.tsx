import Image from "next/image";
import type { ComponentProps } from "react";

type RentoraLogoProps = {
  /** `light` is the dark-surface treatment; it still uses the official symbol asset. */
  variant?: "header" | "admin" | "symbol" | "light";
  size?: "nav" | "auth" | "admin" | "footer" | "icon";
  className?: string;
} & Omit<ComponentProps<typeof Image>, "src" | "alt" | "width" | "height" | "className">;

/**
 * A UI lockup intentionally built from the official square symbol and real text.
 * The supplied horizontal PNG has baked-in whitespace, so it is reserved for
 * standalone brand uses rather than being squeezed into navigation chrome.
 */
export function RentoraLogo({ variant = "header", size = "nav", className = "", ...props }: RentoraLogoProps) {
  const symbolOnly = variant === "symbol";
  const onDark = variant === "light" || variant === "admin";

  return (
    <span className={`rentora-logo rentora-logo-${size} ${symbolOnly ? "rentora-logo-symbol" : "rentora-logo-lockup"} ${onDark ? "rentora-logo-on-dark" : ""} ${className}`.trim()}>
      <span className="rentora-logo-mark" aria-hidden="true">
        <Image
          src="/brand/rentora-symbol.png"
          alt=""
          width={1254}
          height={1254}
          priority={size === "nav"}
          sizes="40px"
          {...props}
        />
      </span>
      {!symbolOnly && <span className="rentora-logo-word">Rentora</span>}
    </span>
  );
}
