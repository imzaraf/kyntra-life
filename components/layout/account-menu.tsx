"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { LogOut, Moon, Settings, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth/auth-provider";
import { cn } from "@/lib/utils";

export function AccountMenu({ compact = false }: { compact?: boolean }) {
  const { user, signOut } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const name = user?.displayName || user?.email?.split("@")[0] || "You";
  const initial = name.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account and settings"
        className={cn(
          "flex items-center gap-3 rounded-xl p-2 text-left transition-colors outline-none hover:bg-sidebar-accent/60 focus-visible:ring-3 focus-visible:ring-ring/50",
          !compact && "w-full",
        )}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sage-soft font-serif text-base text-forest">
          {initial}
        </span>
        {!compact && (
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {user?.email}
            </span>
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side={compact ? "bottom" : "top"}
        className="glass w-60 rounded-2xl p-1.5"
      >
        <DropdownMenuLabel className="font-normal">
          <span className="block text-sm font-medium">{name}</span>
          <span className="block text-xs text-muted-foreground">{user?.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings /> Settings &amp; backup
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {resolvedTheme === "dark" ? <Sun /> : <Moon />}
          {resolvedTheme === "dark" ? "Light theme" : "Dark theme"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
