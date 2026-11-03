import { Bell } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Bell with a live count of reminders that are due or past due. Links to them. */
export function AttentionBell({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  const label =
    count > 0
      ? `${count} reminder${count === 1 ? " needs" : "s need"} attention`
      : "Reminders, nothing due";
  return (
    <Link
      href="/plan?view=reminders&show=attention"
      aria-label={label}
      title={label}
      className={cn(
        "relative grid size-9 place-items-center rounded-xl text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <Bell className="size-[1.15rem]" strokeWidth={1.75} />
      {count > 0 && (
        <span
          aria-hidden
          className="absolute -top-0.5 -right-0.5 grid min-w-[1.1rem] place-items-center rounded-full bg-terracotta px-1 text-[0.65rem] leading-[1.1rem] font-semibold text-primary-foreground tabular-nums shadow-[var(--shadow-sm)]"
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
