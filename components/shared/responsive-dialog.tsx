"use client";

import { XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
  useRef,
  useState,
  type ComponentProps,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  Dialog,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const DISMISS_DISTANCE = 110; // px dragged down before the sheet closes
const DISMISS_VELOCITY = 0.6; // px/ms flick

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Visually hide the title (it is still announced to screen readers). */
  hideHeader?: boolean;
  /** `glass` is for floating overlays like Quick Capture; `paper` for forms. */
  surface?: "paper" | "glass";
  size?: "sm" | "md" | "lg";
  /** Remove body padding (for content that lays itself out, e.g. Quick Capture). */
  flush?: boolean;
  className?: string;
  children: ReactNode;
}

const SIZE = { sm: "md:max-w-sm", md: "md:max-w-md", lg: "md:max-w-lg" } as const;

/**
 * One surface for every modal in the app.
 *  • < md: a bottom sheet — slides up, drag handle, swipe down to dismiss, safe-area aware,
 *    sized in dvh so the on-screen keyboard doesn't push it off-screen.
 *  • ≥ md: a centered dialog.
 * Layout switches with CSS (not JS), so there's no hydration mismatch or flash.
 */
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  hideHeader = false,
  surface = "paper",
  size = "md",
  flush = false,
  className,
  children,
}: ResponsiveDialogProps) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ y: number; t: number } | null>(null);

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { y: e.clientY, t: performance.now() };
    setDragging(true);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!start.current) return;
    setDragY(Math.max(0, e.clientY - start.current.y)); // only downward
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const s = start.current;
    start.current = null;
    setDragging(false);
    if (!s) return;
    const dy = e.clientY - s.y;
    const velocity = dy / Math.max(1, performance.now() - s.t);
    if (dy > DISMISS_DISTANCE || velocity > DISMISS_VELOCITY) onOpenChange(false);
    setDragY(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-foreground/25 supports-backdrop-filter:backdrop-blur-sm" />
        <DialogPrimitive.Content
          data-slot="responsive-dialog"
          style={dragY ? { translate: `0 ${dragY}px` } : undefined}
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden text-sm text-popover-foreground outline-none",
            surface === "glass"
              ? "glass"
              : "bg-popover shadow-[var(--shadow-lg)] ring-1 ring-foreground/10",
            // Mobile: bottom sheet
            "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[1.75rem]",
            "data-open:animate-in data-open:duration-300 data-open:ease-[var(--ease-luxe)] data-open:slide-in-from-bottom",
            "data-closed:animate-out data-closed:duration-200 data-closed:slide-out-to-bottom",
            !dragging && dragY === 0 && "transition-[translate] duration-200",
            // Desktop: centered dialog
            "md:inset-x-auto md:top-[10dvh] md:bottom-auto md:left-1/2 md:max-h-[80dvh] md:w-full md:-translate-x-1/2 md:rounded-3xl",
            "md:data-open:slide-in-from-bottom-0 md:data-open:zoom-in-95 md:data-closed:slide-out-to-bottom-0 md:data-closed:zoom-out-95",
            SIZE[size],
            className,
          )}
        >
          {/* Drag handle — mobile only. The whole top strip is draggable. */}
          <div
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            className="flex shrink-0 cursor-grab touch-none justify-center pt-2.5 pb-1 active:cursor-grabbing md:hidden"
            aria-hidden
          >
            <span className="h-1.5 w-10 rounded-full bg-foreground/20" />
          </div>

          <div
            className={cn(
              "flex shrink-0 items-start justify-between gap-4 px-5 pt-2 md:pt-6",
              hideHeader && "sr-only",
            )}
          >
            <div className="min-w-0">
              <DialogTitle className="font-serif text-2xl leading-tight tracking-tight">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="mt-1.5">{description}</DialogDescription>
              )}
            </div>
          </div>
          {hideHeader && description && (
            <DialogDescription className="sr-only">{description}</DialogDescription>
          )}

          <DialogPrimitive.Close
            aria-label="Close"
            className="absolute top-4 right-4 hidden size-8 place-items-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 md:grid"
          >
            <XIcon className="size-4" />
          </DialogPrimitive.Close>

          {/* Scrolls independently so footers can stick and the keyboard never hides the title. */}
          <div
            className={cn(
              "min-h-0 flex-1 overflow-y-auto overscroll-contain",
              !flush && "px-5 pt-4",
            )}
          >
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

/** Sticky action bar for forms inside a ResponsiveDialog. */
export function SheetFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 -mx-5 mt-4 flex flex-col-reverse gap-2 border-t border-border/60 bg-popover/90 px-5 pt-3 pb-[max(0.875rem,env(safe-area-inset-bottom))] backdrop-blur sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}
