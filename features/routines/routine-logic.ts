import { subDays } from "date-fns";
import { fromDayKey, toDayKey } from "@/lib/date-time";
import type { Routine } from "@/types/domain";

/** Whether the routine is expected on this local day. */
export function isScheduledOn(
  routine: Pick<Routine, "frequency" | "days">,
  dayKey: string,
): boolean {
  if (routine.frequency === "daily") return true;
  return routine.days.includes(fromDayKey(dayKey).getDay());
}

export function lastDays(endKey: string, count = 7): string[] {
  const end = fromDayKey(endKey);
  return Array.from({ length: count }, (_, i) => toDayKey(subDays(end, count - 1 - i)));
}

/**
 * Gentle consistency: scheduled days completed out of scheduled days in the window.
 * Rest and skipped days are neutral — they never count against the user.
 */
export function consistency(routine: Routine, endKey: string, count = 7) {
  let scheduled = 0;
  let done = 0;
  for (const k of lastDays(endKey, count)) {
    if (!isScheduledOn(routine, k)) continue;
    const mark = routine.marks[k];
    if (mark === "rest" || mark === "skipped") continue;
    scheduled += 1;
    if (mark === "done") done += 1;
  }
  return { done, scheduled };
}

/** Current run of consecutive completed scheduled days; rest/skip days pause the run instead of breaking it. */
export function currentRun(routine: Routine, endKey: string, lookback = 365): number {
  let run = 0;
  for (let i = 0; i < lookback; i++) {
    const k = toDayKey(subDays(fromDayKey(endKey), i));
    if (!isScheduledOn(routine, k)) continue;
    const mark = routine.marks[k];
    if (mark === "done") run += 1;
    else if (mark === "rest" || mark === "skipped") continue;
    else if (i === 0)
      continue; // today not yet done: don't break
    else break;
  }
  return run;
}
