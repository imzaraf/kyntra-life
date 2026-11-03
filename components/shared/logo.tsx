import { cn } from "@/lib/utils";

export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className="grid size-8 place-items-center rounded-[10px] bg-primary font-serif text-lg text-primary-foreground italic shadow-[inset_0_1px_0_rgb(255_255_255/0.15),var(--shadow-sm)]"
      >
        K
      </span>
      {!compact && <span className="font-serif text-xl tracking-tight">Kyntra Life</span>}
    </div>
  );
}
