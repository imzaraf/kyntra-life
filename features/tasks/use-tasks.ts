"use client";

import { orderBy, where } from "firebase/firestore";
import { useRepoQuery } from "@/hooks/use-repo-query";
import { taskRepo } from "@/lib/repositories";

/** Open tasks only: keeps the main query bounded as completed history grows. */
export const useOpenTasks = () =>
  useRepoQuery(taskRepo, () => [where("status", "==", "todo")], "open");

export const useCompletedTasks = () =>
  useRepoQuery(
    taskRepo,
    () => [where("status", "==", "done"), orderBy("completedAt", "desc")],
    "done",
  );
