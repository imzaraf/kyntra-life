"use client";

import { orderBy } from "firebase/firestore";
import { useMemo } from "react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/auth-provider";
import { useRepoQuery } from "@/hooks/use-repo-query";
import { journalRepo } from "@/lib/repositories";
import type { JournalEntry } from "@/types/domain";

export const useJournalEntries = () =>
  useRepoQuery(journalRepo, () => [orderBy("date", "desc")], "all");

export type JournalDraft = Pick<
  JournalEntry,
  "title" | "date" | "body" | "mood" | "energy" | "focus"
>;

export function useJournalActions() {
  const { user } = useAuth();
  const uid = user?.uid;
  return useMemo(
    () => ({
      newId: () => (uid ? journalRepo.newId(uid) : ""),
      /** First save creates the document (with createdAt); later saves only update. */
      save: async (id: string, draft: JournalDraft, exists: boolean) => {
        if (!uid) return;
        if (exists) await journalRepo.update(uid, id, { ...draft });
        else await journalRepo.createWithId(uid, id, { ...draft });
      },
      remove: async (id: string) => {
        if (!uid) return;
        try {
          await journalRepo.remove(uid, id);
        } catch (error) {
          console.error(error);
          toast.error("Couldn't delete the entry");
        }
      },
    }),
    [uid],
  );
}
