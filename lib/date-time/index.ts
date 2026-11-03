import {
  addDays,
  addMinutes,
  endOfDay,
  format,
  isBefore,
  isSameDay,
  parse,
  set,
  startOfDay,
  startOfWeek,
} from "date-fns";

/** All "day" keys are local calendar dates in `yyyy-MM-dd`. */
export const DAY_KEY = "yyyy-MM-dd";

export const toDayKey = (d: Date): string => format(d, DAY_KEY);
export const todayKey = (now: Date = new Date()): string => toDayKey(now);
export const fromDayKey = (key: string): Date => parse(key, DAY_KEY, new Date());
export const shiftDayKey = (key: string, days: number): string =>
  toDayKey(addDays(fromDayKey(key), days));
export const isValidDayKey = (key: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(key) && !Number.isNaN(fromDayKey(key).getTime());

export const weekDayKeys = (key: string): string[] => {
  const start = startOfWeek(fromDayKey(key), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => toDayKey(addDays(start, i)));
};

/** Minutes since local midnight for the given clock time. */
export const minutesOfDay = (d: Date): number => d.getHours() * 60 + d.getMinutes();

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return format(set(new Date(), { hours: h, minutes: m, seconds: 0 }), "h:mm a");
}

export function minutesToTimeInput(minutes: number): string {
  const clamped = Math.min(Math.max(minutes, 0), 24 * 60 - 1);
  return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`;
}

export function timeInputToMinutes(value: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Combine a local day key and optional HH:mm into a Date (DST-safe local construction). */
export function combineDayAndTime(dayKey: string, time?: string | null): Date {
  const base = fromDayKey(dayKey);
  const mins = time ? timeInputToMinutes(time) : null;
  return mins === null ? endOfDay(base) : addMinutes(startOfDay(base), mins);
}

export function greetingFor(now: Date): string {
  const h = now.getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export { addDays, addMinutes, endOfDay, format, isBefore, isSameDay, startOfDay };
