import type { Task, TimeBlock } from "@/types/domain";

export const DAY_MINUTES = 24 * 60;

export interface BlockDraft {
  id?: string;
  startMin: number;
  endMin: number;
}

export type BlockValidation = { ok: true } | { ok: false; error: string };

/** A block lives within one local day; it may end at exactly midnight (1440). */
export function validateBlockTimes(startMin: number, endMin: number): BlockValidation {
  if (!Number.isInteger(startMin) || !Number.isInteger(endMin))
    return { ok: false, error: "Enter valid times." };
  if (startMin < 0 || startMin >= DAY_MINUTES)
    return { ok: false, error: "Start time must be within the day." };
  if (endMin <= startMin)
    return { ok: false, error: "End time must be after the start time." };
  if (endMin > DAY_MINUTES)
    return {
      ok: false,
      error: "Blocks can't run past midnight. Split it across two days.",
    };
  return { ok: true };
}

/** Half-open interval overlap: touching blocks (10–11, 11–12) do not overlap. */
export const overlaps = (a: BlockDraft, b: BlockDraft) =>
  a.startMin < b.endMin && b.startMin < a.endMin;

export function findOverlaps<T extends BlockDraft>(draft: BlockDraft, blocks: T[]): T[] {
  return blocks.filter((b) => b.id !== draft.id && overlaps(draft, b));
}

export interface Gap {
  startMin: number;
  endMin: number;
}

/** Free windows inside [dayStart, dayEnd], at least `minLength` long. */
export function findGaps(
  blocks: BlockDraft[],
  dayStart = 6 * 60,
  dayEnd = 22 * 60,
  minLength = 30,
): Gap[] {
  const sorted = [...blocks].sort((a, b) => a.startMin - b.startMin);
  const gaps: Gap[] = [];
  let cursor = dayStart;
  for (const b of sorted) {
    if (b.startMin - cursor >= minLength)
      gaps.push({ startMin: cursor, endMin: Math.min(b.startMin, dayEnd) });
    cursor = Math.max(cursor, b.endMin);
    if (cursor >= dayEnd) break;
  }
  if (dayEnd - cursor >= minLength) gaps.push({ startMin: cursor, endMin: dayEnd });
  return gaps;
}

export type BlockPhase = "past" | "current" | "upcoming";

export function blockPhase(block: BlockDraft, nowMin: number): BlockPhase {
  if (nowMin >= block.endMin) return "past";
  if (nowMin >= block.startMin) return "current";
  return "upcoming";
}

export function nextBlock<T extends BlockDraft>(
  blocks: T[],
  nowMin: number,
): T | undefined {
  return [...blocks]
    .sort((a, b) => a.startMin - b.startMin)
    .find((b) => b.endMin > nowMin);
}

export interface Proposal {
  task: Task;
  startMin: number;
  endMin: number;
}

/**
 * "Plan my day": greedily place today's unscheduled tasks (high priority first)
 * into free gaps using each task's estimate (default 30m), starting no earlier than `fromMin`.
 */
export function planMyDay(
  tasks: Task[],
  blocks: TimeBlock[],
  fromMin: number,
  dayEnd = 22 * 60,
): Proposal[] {
  const scheduled = new Set(blocks.map((b) => b.taskId).filter(Boolean));
  const rank = { high: 0, medium: 1, low: 2 } as const;
  const queue = tasks
    .filter((t) => t.status === "todo" && !scheduled.has(t.id))
    .sort((a, b) => rank[a.priority] - rank[b.priority]);

  const occupied: BlockDraft[] = [...blocks];
  const out: Proposal[] = [];
  for (const task of queue) {
    const length = Math.max(15, task.estimateMinutes ?? 30);
    const gap = findGaps(occupied, Math.ceil(fromMin / 15) * 15, dayEnd, length)[0];
    if (!gap) break;
    const p = { task, startMin: gap.startMin, endMin: gap.startMin + length };
    out.push(p);
    occupied.push(p);
  }
  return out;
}

export const plannedMinutes = (blocks: BlockDraft[]) =>
  blocks.reduce((s, b) => s + (b.endMin - b.startMin), 0);
