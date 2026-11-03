"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { PenLine, Plus, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { useAuth } from "@/features/auth/auth-provider";
import { QuickCapture } from "@/features/quick-capture/quick-capture";
import { useReminderWatcher } from "@/features/reminders/use-reminder-watcher";
import { useOnline } from "@/hooks/use-online";
import { cn } from "@/lib/utils";
import { AccountMenu } from "./account-menu";
import { AppIcon } from "@/components/shared/app-icon";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { NAV_ITEMS } from "./nav-items";

export function AppShell({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const online = useOnline();
  const [captureOpen, setCaptureOpen] = useState(false);

  useEffect(() => {
    if (status === "signed-out" || status === "misconfigured") router.replace("/sign-in");
  }, [status, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCaptureOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (status !== "signed-in") return <ShellSkeleton />;

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[260px_1fr]">
      <ReminderWatcher />
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-sidebar-border bg-sidebar/80 px-4 py-6 backdrop-blur md:flex">
        <Link href="/today" className="mb-8 px-2" aria-label="Kyntra Life home">
          <Logo />
        </Link>

        <Button
          onClick={() => setCaptureOpen(true)}
          className="mb-6 justify-between"
          size="lg"
        >
          <span className="flex items-center gap-2">
            <PenLine /> Quick capture
          </span>
          <kbd className="rounded-md bg-white/10 px-1.5 py-0.5 font-sans text-[0.68rem]">
            ⌘K
          </kbd>
        </Button>

        <nav aria-label="Primary" className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon, iconName }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] transition-colors duration-200",
                  active
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-[var(--shadow-xs)]"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                <AppIcon
                  name={iconName}
                  fallback={Icon}
                  className={cn("size-[1.15rem]", active && "text-terracotta")}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          <AccountMenu />
        </div>
      </aside>

      <div className="min-w-0 pb-28 md:pb-0">
        {!online && (
          <div
            role="status"
            className="flex items-center justify-center gap-2 bg-terracotta-soft px-4 py-2 text-xs text-foreground"
          >
            <WifiOff className="size-3.5" /> You&apos;re offline. Changes are saved on
            this device and sync when you reconnect.
          </div>
        )}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/85 px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 shadow-[0_1px_0_rgb(255_255_255/0.5),0_6px_16px_-12px_rgb(41_45_42/0.35)] backdrop-blur-xl md:hidden dark:shadow-[0_6px_16px_-12px_rgb(0_0_0/0.7)]">
          <Logo variant="horizontal-tagline" className="h-12" />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <AccountMenu compact />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-5 py-6 md:px-10 md:py-10">
          {children}
        </main>
      </div>

      <nav
        aria-label="Primary"
        className="glass fixed inset-x-3 bottom-3 z-40 flex items-center justify-between rounded-3xl px-2 py-2 md:hidden"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        {NAV_ITEMS.slice(0, 2).map((item) => (
          <MobileTab
            key={item.href}
            item={item}
            active={pathname.startsWith(item.href)}
          />
        ))}
        <button
          type="button"
          onClick={() => setCaptureOpen(true)}
          aria-label="Quick capture"
          className="-mt-7 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-lg)] transition-transform active:scale-95"
        >
          <Plus className="size-6" />
        </button>
        {NAV_ITEMS.slice(2).map((item) => (
          <MobileTab
            key={item.href}
            item={item}
            active={pathname.startsWith(item.href)}
          />
        ))}
      </nav>

      <QuickCapture open={captureOpen} onOpenChange={setCaptureOpen} />
    </div>
  );
}

function ReminderWatcher() {
  useReminderWatcher();
  return null;
}

function MobileTab({
  item,
  active,
}: {
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-16 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[0.68rem] transition-colors",
        active ? "font-medium text-foreground" : "text-muted-foreground",
      )}
    >
      <AppIcon
        name={item.iconName}
        fallback={Icon}
        className={cn("size-5", active && "text-terracotta")}
      />
      {item.label}
    </Link>
  );
}

function ShellSkeleton() {
  return (
    <div
      className="grid min-h-dvh place-items-center"
      aria-busy="true"
      aria-label="Loading Kyntra Life"
    >
      <Logo variant="mark" className="h-14 animate-pulse" />
    </div>
  );
}
