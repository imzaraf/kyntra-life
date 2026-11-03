import { describe, expect, it } from "vitest";
import type { Task, TimeBlock } from "@/types/domain";
import {
  blockPhase,
  findGaps,
  findOverlaps,
  nextBlock,
  planMyDay,
  validateBlockTimes,
} from "./planner-logic";

const b = (id: string, startMin: number, endMin: number) => ({ id, startMin, endMin });

describe("validateBlockTimes", () => {
  it("accepts a normal block and one ending at midnight", () => {
    expect(validateBlockTimes(540, 600).ok).toBe(true);
    expect(validateBlockTimes(1380, 1440).ok).toBe(true);
  });
  it("rejects end <= start, and past midnight", () => {
    expect(validateBlockTimes(600, 600).ok).toBe(false);
    expect(validateBlockTimes(600, 540).ok).toBe(false);
    expect(validateBlockTimes(1400, 1500).ok).toBe(false);
  });
});

describe("overlaps", () => {
  const blocks = [b("1", 540, 600), b("2", 600, 660)];
  it("treats touching blocks as non-overlapping", () => {
    expect(findOverlaps(b("n", 660, 720), blocks)).toEqual([]);
  });
  it("detects overlap and ignores the block being edited", () => {
    expect(findOverlaps(b("n", 570, 630), blocks).map((x) => x.id)).toEqual(["1", "2"]);
    expect(findOverlaps(b("1", 545, 590), blocks)).toEqual([]);
  });
});

describe("gaps and phases", () => {
  it("finds free windows", () => {
    const gaps = findGaps(
      [b("1", 9 * 60, 10 * 60), b("2", 12 * 60, 13 * 60)],
      8 * 60,
      14 * 60,
      30,
    );
    expect(gaps).toEqual([
      { startMin: 480, endMin: 540 },
      { startMin: 600, endMin: 720 },
      { startMin: 780, endMin: 840 },
    ]);
  });
  it("classifies block phase and next block", () => {
    const blocks = [b("1", 540, 600), b("2", 700, 760)];
    expect(blockPhase(blocks[0], 500)).toBe("upcoming");
    expect(blockPhase(blocks[0], 560)).toBe("current");
    expect(blockPhase(blocks[0], 600)).toBe("past");
    expect(nextBlock(blocks, 610)?.id).toBe("2");
  });
});

describe("planMyDay", () => {
  const task = (id: string, priority: Task["priority"], estimateMinutes?: number) =>
    ({
      id,
      title: id,
      priority,
      status: "todo",
      estimateMinutes,
      tags: [],
      subtasks: [],
    }) as unknown as Task;
  it("places high priority first into free gaps without overlapping", () => {
    const existing = [
      { id: "x", startMin: 540, endMin: 600, taskId: "other" } as TimeBlock,
    ];
    const plan = planMyDay(
      [task("low", "low", 30), task("high", "high", 60)],
      existing,
      540,
    );
    expect(plan[0].task.id).toBe("high");
    expect(plan[0].startMin).toBe(600);
    expect(plan[1].startMin).toBe(plan[0].endMin);
  });
  it("skips tasks already scheduled", () => {
    const existing = [{ id: "x", startMin: 540, endMin: 600, taskId: "t1" } as TimeBlock];
    expect(planMyDay([task("t1", "high")], existing, 480)).toEqual([]);
  });
});
