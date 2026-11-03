import type { LucideIcon } from "lucide-react";
import { FLATICON_AVAILABLE } from "@/lib/icons/flaticon";
import { cn } from "@/lib/utils";

/**
 * Renders a Flaticon SVG when one has been added for `name`, otherwise the Lucide
 * fallback. Flaticon SVGs are tinted via CSS mask so they follow theme colours.
 */
export function AppIcon({
  name,
  fallback: Fallback,
  className,
  strokeWidth = 1.75,
}: {
  name: string;
  fallback: LucideIcon;
  className?: string;
  strokeWidth?: number;
}) {
  if (!FLATICON_AVAILABLE.has(name))
    return <Fallback className={className} strokeWidth={strokeWidth} aria-hidden />;
  const url = `url(/icons/flaticon/${name}.svg)`;
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 bg-current", className)}
      style={{
        maskImage: url,
        WebkitMaskImage: url,
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
    />
  );
}
