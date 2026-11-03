import { BookOpenText, CalendarClock, Library, Sun, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  /** Flaticon slot name (see lib/icons/flaticon.ts) */
  iconName: string;
  icon: LucideIcon;
}

/** Exactly four primary tabs. Settings lives in the account menu. */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/today", iconName: "today", label: "Today", icon: Sun },
  { href: "/journal", iconName: "journal", label: "Journal", icon: BookOpenText },
  { href: "/plan", iconName: "plan", label: "Plan", icon: CalendarClock },
  { href: "/library", iconName: "library", label: "Library", icon: Library },
] as const;
