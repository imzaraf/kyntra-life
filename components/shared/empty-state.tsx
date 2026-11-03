import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border/80 px-6 py-12 text-center">
      <span className="mb-4 grid size-12 place-items-center rounded-full bg-sage-soft text-forest">
        <Icon className="size-5" strokeWidth={1.6} />
      </span>
      <h3 className="text-xl">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorNotice({
  error,
  label = "Couldn't load this",
}: {
  error: Error;
  label?: string;
}) {
  const denied = (error as { code?: string }).code === "permission-denied";
  return (
    <div role="alert" className="rounded-2xl bg-terracotta-soft p-4 text-sm">
      <p className="font-medium">{label}</p>
      <p className="mt-1 text-muted-foreground">
        {denied
          ? "Permission denied. Check that you're signed in and that Firestore rules are deployed."
          : "Check your connection and try again."}
      </p>
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2.5" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
      ))}
    </div>
  );
}
