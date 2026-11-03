"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/auth-provider";
import type { Repository } from "@/lib/repositories/repository";

type WriteData<T> = Partial<Omit<T, "id" | "createdAt" | "updatedAt" | "schemaVersion">> &
  Record<string, unknown>;

/** Create / update / remove with uniform error toasts (Firestore reverts failed optimistic writes). */
export function useCollectionActions<T extends { id: string }>(
  repo: Repository<T>,
  noun: string,
) {
  const { user } = useAuth();
  const uid = user?.uid;
  return useMemo(() => {
    const guard = async (
      fn: (uid: string) => Promise<unknown> | unknown,
      verb: string,
    ) => {
      if (!uid) return;
      try {
        await fn(uid);
      } catch (error) {
        console.error(`Couldn't ${verb} ${noun}`, error);
        toast.error(`Couldn't ${verb} ${noun}`);
      }
    };
    return {
      create: (data: WriteData<T>) => guard((u) => repo.create(u, data as never), "save"),
      update: (id: string, patch: WriteData<T>) =>
        guard((u) => repo.update(u, id, patch as never), "update"),
      remove: (id: string) => guard((u) => repo.remove(u, id), "delete"),
    };
  }, [uid, repo, noun]);
}
