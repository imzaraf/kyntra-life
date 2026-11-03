import Image from "next/image";
import { cn } from "@/lib/utils";

type Variant = "horizontal" | "horizontal-tagline" | "stacked" | "mark";

const ASSETS: Record<
  Variant,
  { light: string; dark: string; width: number; height: number }
> = {
  horizontal: {
    light: "/brand/logo-horizontal-notagline.svg",
    dark: "/brand/logo-horizontal-notagline-dark.svg",
    width: 706,
    height: 220,
  },
  "horizontal-tagline": {
    light: "/brand/logo-horizontal.svg",
    dark: "/brand/logo-horizontal-dark.svg",
    width: 706,
    height: 220,
  },
  stacked: {
    light: "/brand/logo-primary-transparent.svg",
    dark: "/brand/logo-primary-dark-transparent.svg",
    width: 760,
    height: 640,
  },
  mark: {
    light: "/brand/mark-forest.svg",
    dark: "/brand/mark-ivory.svg",
    width: 250,
    height: 330,
  },
};

/**
 * Kyntra Life logo. Renders both theme variants and lets CSS show the right one,
 * so there is no flash or hydration mismatch when the theme resolves.
 * Size it with a height class, e.g. `className="h-10"`.
 */
export function Logo({
  className,
  variant = "horizontal",
}: {
  className?: string;
  variant?: Variant;
}) {
  const a = ASSETS[variant];
  const img = (src: string, extra: string) => (
    <Image
      src={src}
      alt=""
      width={a.width}
      height={a.height}
      unoptimized
      priority
      className={cn("h-full w-auto", extra)}
    />
  );
  return (
    <span
      role="img"
      aria-label="Kyntra Life"
      className={cn("block h-10 w-fit", className)}
    >
      {img(a.light, "dark:hidden")}
      {img(a.dark, "hidden dark:block")}
    </span>
  );
}
