"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { where } from "firebase/firestore";
import { useAuth } from "@/features/auth/auth-provider";
import { useRepoQuery } from "@/hooks/use-repo-query";
import { timeBlockRepo } from "@/lib/repositories";
import type { TimeBlock } from "@/types/domain";

const byStart = (a: TimeBlock, b: TimeBlock) => a.startMin - b.startMin;

export function useDayBlocks(dayKey: string) {
  const q = useRepoQuery(
    timeBlockRepo,
    () => [where("date", "==", dayKey)],
    `day:${dayKey}`,
  );
  return useMemo(() => ({ ...q, data: [...q.data].sort(byStart) }), [q]);
}

export function useWeekBlocks(dayKeys: string[]) {
  const key = dayKeys.join(",");
  return useRepoQuery(timeBlockRepo, () => [where("date", "in", dayKeys)], `week:${key}`);
}

export type BlockInput = Pick<
  TimeBlock,
  "title" | "date" | "startMin" | "endMin" | "notes" | "taskId"
>;

export function useBlockActions() {
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
      create: (input: BlockInput) =>
        guard((u) => timeBlockRepo.create(u, input), "Couldn't create the time block"),
      update: (id: string, patch: Partial<BlockInput>) =>
        guard((u) => timeBlockRepo.update(u, id, patch), "Couldn't save the time block"),
      remove: (id: string) =>
        guard((u) => timeBlockRepo.remove(u, id), "Couldn't delete the time block"),
    };
  }, [uid]);
}
