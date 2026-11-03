"use client";

import { where } from "firebase/firestore";
import { useMemo } from "react";
import { useRepoQuery } from "@/hooks/use-repo-query";
import { taskRepo } from "@/lib/repositories";

/** Open tasks only: keeps the main query bounded as completed history grows. */
export const useOpenTasks = () =>
  useRepoQuery(taskRepo, () => [where("status", "==", "todo")], "open");

/** Completed tasks, newest first. Sorted here so no composite index is needed. */
export function useCompletedTasks() {
  const query = useRepoQuery(taskRepo, () => [where("status", "==", "done")], "done");
  return useMemo(() => {
    const time = (d?: Date) => d?.getTime() ?? 0;
    const data = [...query.data].sort(
      (a, b) => time(b.completedAt ?? b.updatedAt) - time(a.completedAt ?? a.updatedAt),
    );
    return { ...query, data };
  }, [query]);
}
