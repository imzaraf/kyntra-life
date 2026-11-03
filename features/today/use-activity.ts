"use client";

import { useMemo } from "react";
import { useJournalEntries } from "@/features/journal/use-journal";
import { useCompletedTasks, useOpenTasks } from "@/features/tasks/use-tasks";
import { useRepoQuery } from "@/hooks/use-repo-query";
import { ideaRepo, resourceRepo } from "@/lib/repositories";

export interface ActivityItem {
  id: string;
  label: string;
  title: string;
  at: Date;
  href: string;
}

/** Recent activity derived strictly from stored records — nothing is fabricated. */
export function useRecentActivity(limit = 6) {
  const journal = useJournalEntries();
  const open = useOpenTasks();
  const done = useCompletedTasks();
  const ideas = useRepoQuery(ideaRepo, () => [], "all");
  const resources = useRepoQuery(resourceRepo, () => [], "all");

  const loading =
    journal.loading || open.loading || done.loading || ideas.loading || resources.loading;
  const items = useMemo<ActivityItem[]>(() => {
    const all: ActivityItem[] = [
      ...journal.data.map((e) => ({
        id: `j-${e.id}`,
        label: "Journal",
        title: e.title || "Untitled entry",
        at: e.updatedAt,
        href: `/journal?entry=${e.id}`,
      })),
      ...open.data.map((t) => ({
        id: `t-${t.id}`,
        label: "Task added",
        title: t.title,
        at: t.createdAt,
        href: `/plan?view=tasks&task=${t.id}`,
      })),
      ...done.data.map((t) => ({
        id: `d-${t.id}`,
        label: "Task completed",
        title: t.title,
        at: t.completedAt ?? t.updatedAt,
        href: "/plan?view=tasks",
      })),
      ...ideas.data.map((i) => ({
        id: `i-${i.id}`,
        label: "Idea",
        title: i.title,
        at: i.createdAt,
        href: "/library?view=ideas",
      })),
      ...resources.data.map((r) => ({
        id: `r-${r.id}`,
        label: "Saved",
        title: r.title,
        at: r.createdAt,
        href: "/library?view=vault",
      })),
    ];
    return all.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
  }, [journal.data, open.data, done.data, ideas.data, resources.data, limit]);

  const total =
    journal.data.length +
    open.data.length +
    done.data.length +
    ideas.data.length +
    resources.data.length;
  return { items, loading, isBrandNew: !loading && total === 0 };
}
