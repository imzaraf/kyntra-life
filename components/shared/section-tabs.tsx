"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export interface SectionTab<K extends string> {
  key: K;
  label: string;
  count?: number;
}

/** Segmented control whose selection lives in the URL (`?view=`), so it's linkable. */
export function useViewParam<K extends string>(keys: readonly K[], fallback: K) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const raw = params.get("view");
  const view = (keys as readonly string[]).includes(raw ?? "") ? (raw as K) : fallback;
  const setView = (next: K) => {
    const sp = new URLSearchParams(params.toString());
    sp.set("view", next);
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  };
  return [view, setView] as const;
}

export function SectionTabs<K extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: readonly SectionTab<K>[];
  value: K;
  onChange: (k: K) => void;
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="inline-flex max-w-full [scrollbar-width:none] gap-1 overflow-x-auto rounded-2xl bg-muted/70 p-1"
    >
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={cn(
              "shrink-0 rounded-xl px-4 py-2 text-sm transition-all duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              active
                ? "bg-surface-raised font-medium text-foreground shadow-[var(--shadow-sm)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
