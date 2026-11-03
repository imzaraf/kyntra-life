"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/auth-provider";
import { shiftDayKey, todayKey } from "@/lib/date-time";
import { taskRepo } from "@/lib/repositories";
import type { Task } from "@/types/domain";
import { completionPatch } from "./task-logic";

export type TaskInput = Omit<
  Task,
  "id" | "createdAt" | "updatedAt" | "schemaVersion" | "completedAt"
>;

export function useTaskActions() {
  const { user } = useAuth();
  const uid = user?.uid;

  return useMemo(() => {
    const guard = async (
      fn: (uid: string) => Promise<unknown> | unknown,
      failure: string,
    ) => {
      if (!uid) return;
      try {
        await fn(uid);
      } catch (error) {
        console.error(failure, error);
        toast.error(failure);
      }
    };
    return {
      create: (input: TaskInput) =>
        guard((u) => taskRepo.create(u, input), "Couldn't create the task"),
      update: (id: string, patch: Partial<TaskInput>) =>
        guard((u) => taskRepo.update(u, id, patch), "Couldn't save the task"),
      toggle: (task: Task) =>
        guard(
          (u) => taskRepo.update(u, task.id, completionPatch(task.status !== "done")),
          "Couldn't update the task",
        ),
      postpone: (task: Task, days = 1) =>
        guard(
          (u) =>
            taskRepo.update(u, task.id, {
              dueDate: shiftDayKey(
                task.dueDate && task.dueDate > todayKey() ? task.dueDate : todayKey(),
                days,
              ),
            }),
          "Couldn't postpone the task",
        ),
      archive: (task: Task) =>
        guard(
          (u) => taskRepo.update(u, task.id, { status: "archived" }),
          "Couldn't archive the task",
        ),
      remove: (task: Task) =>
        guard((u) => taskRepo.remove(u, task.id), "Couldn't delete the task"),
    };
  }, [uid]);
}
