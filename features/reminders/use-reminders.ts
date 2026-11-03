"use client";

import { orderBy, where } from "firebase/firestore";
import { useMemo } from "react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/auth-provider";
import { useRepoQuery } from "@/hooks/use-repo-query";
import { reminderRepo } from "@/lib/repositories";
import type { Reminder } from "@/types/domain";
import { localTimeZone, snoozeTime, type SnoozeOption } from "./reminder-logic";

export const usePendingReminders = () =>
  useRepoQuery(
    reminderRepo,
    () => [where("status", "==", "pending"), orderBy("scheduledAt", "asc")],
    "pending",
  );

export const useClosedReminders = () =>
  useRepoQuery(
    reminderRepo,
    () => [
      where("status", "in", ["completed", "dismissed"]),
      orderBy("scheduledAt", "desc"),
    ],
    "closed",
  );

export interface ReminderInput {
  title: string;
  note?: string;
  scheduledAt: Date;
  notify: boolean;
  taskId?: string;
  blockId?: string;
}

export function useReminderActions() {
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
      create: (input: ReminderInput) =>
        guard(
          (u) =>
            reminderRepo.create(u, {
              ...input,
              status: "pending",
              notifyPending: input.notify,
              timeZone: localTimeZone(),
            }),
          "Couldn't create the reminder",
        ),
      update: (id: string, input: ReminderInput) =>
        guard(
          (u) =>
            reminderRepo.update(u, id, {
              ...input,
              status: "pending",
              notifyPending: input.notify,
              timeZone: localTimeZone(),
            }),
          "Couldn't save the reminder",
        ),
      complete: (r: Reminder) =>
        guard(
          (u) =>
            reminderRepo.update(u, r.id, { status: "completed", notifyPending: false }),
          "Couldn't complete the reminder",
        ),
      dismiss: (r: Reminder) =>
        guard(
          (u) =>
            reminderRepo.update(u, r.id, { status: "dismissed", notifyPending: false }),
          "Couldn't dismiss the reminder",
        ),
      snooze: (r: Reminder, option: SnoozeOption) =>
        guard(
          (u) =>
            reminderRepo.update(u, r.id, {
              scheduledAt: snoozeTime(option, new Date()),
              status: "pending",
              notifyPending: r.notify,
            }),
          "Couldn't snooze the reminder",
        ),
      remove: (r: Reminder) =>
        guard((u) => reminderRepo.remove(u, r.id), "Couldn't delete the reminder"),
    };
  }, [uid]);
}
